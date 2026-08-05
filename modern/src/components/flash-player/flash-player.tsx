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
    player.style.width = `${SWF_WIDTH}px`;
    player.style.height = `${SWF_HEIGHT}px`;
    container.replaceChildren(player);

    const base = new URL(swfUrl, window.location.href).href.replace(
      /[^/]+$/,
      "",
    );

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
    });

    return () => {
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
        style={{ width: SWF_WIDTH, height: SWF_HEIGHT }}
      />
      {loadError ? <p className="fl-fallback">{loadError}</p> : null}
    </>
  );
}
