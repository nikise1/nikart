"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { installFlashBridge } from "@/lib/flash-bridge";
import type { FlashVars } from "@/lib/flash-config";

const RUFFLE_SRC = "/ruffle/ruffle.js";
const SWF_WIDTH = 750;
const SWF_HEIGHT = 500;

export interface FlashPlayerProps {
  swfUrl: string;
  parameters: FlashVars;
}

function stopMediaTree(root: ParentNode | null | undefined): void {
  if (!root) {
    return;
  }

  const media = new Set<HTMLMediaElement>();
  if (root instanceof HTMLMediaElement) {
    media.add(root);
  }
  if ("querySelectorAll" in root) {
    for (const el of root.querySelectorAll("video, audio")) {
      media.add(el as HTMLMediaElement);
    }
  }

  const elements =
    root instanceof Element
      ? [root, ...Array.from(root.querySelectorAll("*"))]
      : Array.from(
          "querySelectorAll" in root ? root.querySelectorAll("*") : [],
        );

  for (const el of elements) {
    if (el.shadowRoot) {
      stopMediaTree(el.shadowRoot);
    }
  }

  for (const node of media) {
    node.pause();
    node.removeAttribute("src");
    node.load();
  }
}

export function FlashPlayer({ swfUrl, parameters }: FlashPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ruffleReady, setRuffleReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.RufflePlayer),
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    installFlashBridge();
  }, []);

  useEffect(() => {
    if (ruffleReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (window.RufflePlayer) {
        setRuffleReady(true);
        window.clearInterval(intervalId);
      }
    }, 50);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setLoadError("Ruffle player failed to load.");
    }, 15_000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [ruffleReady]);

  useEffect(() => {
    if (!ruffleReady || !containerRef.current || !window.RufflePlayer) {
      return;
    }

    const container = containerRef.current;
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    player.style.width = "100%";
    player.style.height = "100%";
    container.replaceChildren(player);

    const base = new URL(swfUrl, window.location.href).href.replace(
      /[^/]+$/,
      "",
    );

    // Same as compare fill pages: start without the unmute click gate.
    player.load({
      url: swfUrl,
      base,
      parameters: { ...parameters },
      backgroundColor: "#000000",
      allowScriptAccess: true,
      allowNetworking: "all",
      playerVersion: 8,
      publicPath: "/ruffle/",
      compatibilityRules: true,
      warnOnUnsupportedContent: true,
      logLevel: "warn",
      autoplay: "on",
      unmuteOverlay: "hidden",
      // Container is already clipped to 750×500; stretch into that box.
      scale: "exactFit",
      width: SWF_WIDTH,
      height: SWF_HEIGHT,
    });

    // Ruffle may leave HTML media running after the SWF closes a NetStream
    // (leaving a Flash video page). Pause anything it detaches.
    const mediaObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLMediaElement || node instanceof Element) {
            stopMediaTree(node);
          }
        }
      }
    });
    mediaObserver.observe(player, { childList: true, subtree: true });
    if (player.shadowRoot) {
      mediaObserver.observe(player.shadowRoot, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      mediaObserver.disconnect();
      player.pause?.();
      stopMediaTree(player);
      stopMediaTree(player.shadowRoot);
      container.replaceChildren();
    };
  }, [ruffleReady, swfUrl, parameters]);

  return (
    <>
      <Script
        src={RUFFLE_SRC}
        strategy="afterInteractive"
        onLoad={() => setRuffleReady(true)}
        onError={() => setLoadError("Ruffle script failed to load.")}
      />
      <div
        ref={containerRef}
        id="swf_container"
        data-component="FlashPlayer"
      />
      {loadError ? <p>{loadError}</p> : null}
    </>
  );
}
