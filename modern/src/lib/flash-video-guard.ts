/**
 * Ruffle plays Flash NetStream FLV via fetch + Web Audio (AudioBufferSourceNode),
 * not HTMLMediaElement. After leaving a video view, Ruffle often keeps decoding
 * already-buffered FLV into new buffer sources (the /static proxy buffers the
 * whole file, so aborting fetch after load does nothing).
 *
 * This guard:
 *  - patches fetch / AudioBufferSourceNode early (before Ruffle caches them)
 *  - tracks video_flv activity
 *  - on leave (NetStream status / Back click leak), suppresses new video
 *    buffer sources and stops the ones already started
 */

const VIDEO_URL_RE = /\/video_flv\/|\.flv(?:\?|$)/i;
const LEAVE_LOG_RE = /NetStream\.(?:close|Play\.Stop)|AVM1 NetStream\.close/i;

type GuardState = {
  installs: number;
  videoController: AbortController | null;
  videoActive: boolean;
  suppressVideoAudio: boolean;
  sourceStarts: number;
  videoSources: Set<AudioBufferSourceNode>;
  suppressTimer: number | null;
  fetchPatched: boolean;
  sourcePatched: boolean;
  consolePatched: boolean;
  originalFetch: typeof fetch | null;
  originalSourceStart: typeof AudioBufferSourceNode.prototype.start | null;
  originalConsole: Partial<Record<"log" | "info" | "debug" | "warn", typeof console.log>>;
};

declare global {
  interface Window {
    __nikartFlashVideoGuard?: GuardState;
  }
}

function state(): GuardState {
  if (!window.__nikartFlashVideoGuard) {
    window.__nikartFlashVideoGuard = {
      installs: 0,
      videoController: null,
      videoActive: false,
      suppressVideoAudio: false,
      sourceStarts: 0,
      videoSources: new Set(),
      suppressTimer: null,
      fetchPatched: false,
      sourcePatched: false,
      consolePatched: false,
      originalFetch: null,
      originalSourceStart: null,
      originalConsole: {},
    };
  }
  return window.__nikartFlashVideoGuard;
}

function isVideoUrl(url: string): boolean {
  return VIDEO_URL_RE.test(url);
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function stopTrackedSources(): void {
  const s = state();
  for (const source of s.videoSources) {
    try {
      source.stop();
    } catch {
      // already stopped
    }
  }
  s.videoSources.clear();
}

export function stopFlashVideo(): void {
  const s = state();
  s.videoController?.abort();
  s.videoController = null;
  s.videoActive = false;
  s.suppressVideoAudio = true;
  stopTrackedSources();
  if (s.suppressTimer !== null) {
    window.clearInterval(s.suppressTimer);
  }
  // Keep killing decoder output briefly — buffered FLV can spawn more nodes.
  s.suppressTimer = window.setInterval(() => {
    stopTrackedSources();
  }, 50);
  window.setTimeout(() => {
    if (s.suppressTimer !== null) {
      window.clearInterval(s.suppressTimer);
      s.suppressTimer = null;
    }
  }, 2000);
}

function clearSuppressForNewVideo(): void {
  const s = state();
  s.suppressVideoAudio = false;
  if (s.suppressTimer !== null) {
    window.clearInterval(s.suppressTimer);
    s.suppressTimer = null;
  }
}

function patchFetch(): void {
  const s = state();
  if (s.fetchPatched) {
    return;
  }
  s.originalFetch = window.fetch.bind(window);
  const originalFetch = s.originalFetch;

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    if (!isVideoUrl(url)) {
      return originalFetch(input, init);
    }

    s.videoController?.abort();
    const controller = new AbortController();
    s.videoController = controller;
    s.videoActive = true;
    clearSuppressForNewVideo();
    stopTrackedSources();

    const parentSignal = init?.signal;
    if (parentSignal) {
      if (parentSignal.aborted) {
        controller.abort();
      } else {
        parentSignal.addEventListener("abort", () => controller.abort(), {
          once: true,
        });
      }
    }

    return originalFetch(input, { ...init, signal: controller.signal }).then(
      (response) => {
        if (!response.ok && s.videoController === controller) {
          s.videoActive = false;
        }
        return response;
      },
      (error: unknown) => {
        if (s.videoController === controller) {
          s.videoActive = false;
          s.videoController = null;
        }
        throw error;
      },
    );
  };

  s.fetchPatched = true;
}

function patchBufferSources(): void {
  const s = state();
  if (s.sourcePatched || typeof AudioBufferSourceNode === "undefined") {
    return;
  }
  s.originalSourceStart = AudioBufferSourceNode.prototype.start;
  const originalStart = s.originalSourceStart;

  AudioBufferSourceNode.prototype.start = function (
    this: AudioBufferSourceNode,
    ...args: Parameters<AudioBufferSourceNode["start"]>
  ) {
    if (s.suppressVideoAudio) {
      // Let the node start then kill it so the decoder cannot keep audible output.
      const result = originalStart.apply(this, args);
      try {
        this.stop();
      } catch {
        // ignore
      }
      return result;
    }
    if (s.videoActive) {
      s.sourceStarts += 1;
      s.videoSources.add(this);
      this.addEventListener(
        "ended",
        () => {
          s.videoSources.delete(this);
        },
        { once: true },
      );
    }
    return originalStart.apply(this, args);
  };

  s.sourcePatched = true;
}

function patchConsole(): void {
  const s = state();
  if (s.consolePatched) {
    return;
  }
  for (const method of ["log", "info", "debug", "warn"] as const) {
    const original = console[method].bind(console);
    s.originalConsole[method] = original;
    console[method] = (...args: unknown[]) => {
      if (LEAVE_LOG_RE.test(args.map(String).join(" "))) {
        stopFlashVideo();
      }
      return original(...args);
    };
  }
  s.consolePatched = true;
}

/** Patch networking/audio before Ruffle.js loads and caches natives. */
export function ensureFlashVideoPatches(): void {
  if (typeof window === "undefined") {
    return;
  }
  patchFetch();
  patchBufferSources();
  patchConsole();
}

function unpatchAll(): void {
  const s = state();
  if (s.installs > 0) {
    return;
  }
  if (s.fetchPatched && s.originalFetch) {
    window.fetch = s.originalFetch;
    s.fetchPatched = false;
    s.originalFetch = null;
  }
  if (s.sourcePatched && s.originalSourceStart) {
    AudioBufferSourceNode.prototype.start = s.originalSourceStart;
    s.sourcePatched = false;
    s.originalSourceStart = null;
  }
  if (s.consolePatched) {
    for (const method of ["log", "info", "debug", "warn"] as const) {
      const original = s.originalConsole[method];
      if (original) {
        console[method] = original;
      }
    }
    s.consolePatched = false;
    s.originalConsole = {};
  }
  stopFlashVideo();
  s.suppressVideoAudio = false;
  if (s.suppressTimer !== null) {
    window.clearInterval(s.suppressTimer);
    s.suppressTimer = null;
  }
  delete window.__nikartFlashVideoGuard;
}

/**
 * Listen for leave gestures on the Ruffle player while it is mounted.
 * Patches themselves are process-wide via ensureFlashVideoPatches().
 */
export function installFlashVideoGuard(player: EventTarget): () => void {
  ensureFlashVideoPatches();
  const s = state();
  s.installs += 1;

  const onPointerUp = () => {
    if (!s.videoActive || s.suppressVideoAudio) {
      return;
    }
    const startsAtClick = s.sourceStarts;
    const controllerAtClick = s.videoController;
    window.setTimeout(() => {
      if (s.suppressVideoAudio || s.videoController !== controllerAtClick) {
        return;
      }
      // Back leaves the video view but keeps the FLV decoder pumping sources.
      if (s.sourceStarts - startsAtClick >= 1) {
        stopFlashVideo();
      }
    }, 400);
  };

  // Capture on the player and document — Ruffle shadow targets can retarget events.
  player.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("pointerup", onPointerUp, true);

  return () => {
    player.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    s.installs = Math.max(0, s.installs - 1);
    if (s.installs === 0) {
      unpatchAll();
    }
  };
}
