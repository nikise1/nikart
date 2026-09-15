"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
  parseFlashEmbed,
  toProxiedStaticUrl,
  type FlashEmbed,
} from "@/lib/awayfl-static";

const AWAYFL_SRC = "/awayfl/awayfl-player.umd.js";
const BUILTINS_BASE = "/awayfl/builtins";

export interface AwayFlPlayerProps {
  source: string;
  width?: number | undefined;
  height?: number | undefined;
}

export function AwayFlPlayer({ source, width, height }: AwayFlPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.awayflplayer),
  );
  const [status, setStatus] = useState("Loading AwayFL…");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (window.awayflplayer) {
        setReady(true);
        window.clearInterval(intervalId);
      }
    }, 50);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setLoadError("AwayFL player failed to load.");
    }, 20_000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.awayflplayer) {
      return;
    }

    const container = containerRef.current;
    let cancelled = false;
    let player: { dispose?: () => void } | undefined;

    async function start(): Promise<void> {
      const proxied = toProxiedStaticUrl(source) ?? source;
      setStatus("Resolving SWF…");
      const embed = await resolveEmbed(proxied);
      if (cancelled) {
        return;
      }

      setStatus(`Fetching ${embed.swfUrl}…`);
      const response = await fetch(embed.swfUrl);
      if (!response.ok) {
        throw new Error(`SWF request failed (${response.status})`);
      }
      const buffer = await response.arrayBuffer();
      if (cancelled || !window.awayflplayer) {
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.id = "awayfl_stage";
      container.replaceChildren(canvas);
      window.awayflplayer.StageManager.htmlCanvas = canvas;
      window.awayflplayer.PlayerGlobal.builtinsBaseUrl = BUILTINS_BASE;

      const stageWidth = width ?? parsePx(embed.width) ?? container.clientWidth;
      const stageHeight =
        height ?? parsePx(embed.height) ?? container.clientHeight;

      setStatus("Starting AwayFL…");
      const instance = new window.awayflplayer.AVMPlayer({
        files: [],
        x: 0,
        y: 0,
        w: stageWidth || "100%",
        h: stageHeight || "100%",
        stageScaleMode: "showAll",
      });
      player = instance;
      const swfHref = new URL(embed.swfUrl, window.location.origin).href;
      instance.addEventListener("loaderComplete", () => {
        if (!cancelled) {
          setStatus("");
        }
      });
      instance.playSWF(buffer, swfHref);
    }

    start().catch((error: unknown) => {
      if (!cancelled) {
        const message =
          error instanceof Error ? error.message : "AwayFL failed to start.";
        setLoadError(message);
      }
    });

    return () => {
      cancelled = true;
      try {
        player?.dispose?.();
      } catch {
        // AwayFL dispose is best-effort for this mock.
      }
      if (window.awayflplayer) {
        window.awayflplayer.StageManager.htmlCanvas = null;
      }
      container.replaceChildren();
    };
  }, [ready, source, width, height]);

  const phase = loadError ? "error" : status ? "loading" : "ready";

  return (
    <>
      <Script
        src={AWAYFL_SRC}
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
        onError={() => setLoadError("AwayFL script failed to load.")}
      />
      <div
        ref={containerRef}
        id="awayfl_container"
        data-component="AwayFlPlayer"
        data-awayfl-status={phase}
        className="awayfl-stage"
      />
      {status && !loadError ? <p className="fl-fallback">{status}</p> : null}
      {loadError ? <p className="fl-fallback">{loadError}</p> : null}
    </>
  );
}

async function resolveEmbed(proxied: string): Promise<FlashEmbed> {
  const path = proxied.split("?")[0] ?? proxied;
  if (path.toLowerCase().endsWith(".swf")) {
    return {
      swfUrl: proxied,
      width: "100%",
      height: "100%",
      parameters: {},
    };
  }

  const pageUrl = new URL(proxied, window.location.origin).href;
  const response = await fetch(proxied);
  if (!response.ok) {
    throw new Error(`Could not fetch wrapper HTML (${response.status})`);
  }
  const html = await response.text();
  const embed = parseFlashEmbed(html, pageUrl);
  if (!embed) {
    throw new Error("No SWF embed found in that page.");
  }
  return embed;
}

function parsePx(value: string): number | undefined {
  if (value.endsWith("%")) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
