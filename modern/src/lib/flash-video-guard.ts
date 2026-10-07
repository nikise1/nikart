/**
 * Ruffle plays Flash NetStream FLV via fetch + Web Audio (AudioBufferSourceNode),
 * not HTMLMediaElement. After leaving a video view, the SWF/Ruffle path often
 * keeps the FLV stream open and audio keeps playing. This guard:
 *  - tracks video_flv fetches with AbortControllers
 *  - tracks buffer sources started while a video stream is active
 *  - after a click, if the decoder is still pumping sources with no new FLV
 *    fetch (the Back-button leak), aborts the stream and stops those sources
 */

const VIDEO_URL_RE = /\/video_flv\/|\.flv(?:\?|$)/i;

type GuardState = {
  installs: number;
  videoController: AbortController | null;
  videoActive: boolean;
  sourceStarts: number;
  videoSources: Set<AudioBufferSourceNode>;
  fetchPatched: boolean;
  sourcePatched: boolean;
  originalFetch: typeof fetch | null;
  originalSourceStart: typeof AudioBufferSourceNode.prototype.start | null;
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
      sourceStarts: 0,
      videoSources: new Set(),
      fetchPatched: false,
      sourcePatched: false,
      originalFetch: null,
      originalSourceStart: null,
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
  stopTrackedSources();
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

    // A new FLV (quality change / another video) replaces the previous stream.
    s.videoController?.abort();
    const controller = new AbortController();
    s.videoController = controller;
    s.videoActive = true;
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
        if (!response.ok) {
          if (s.videoController === controller) {
            s.videoActive = false;
          }
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
  if (s.sourcePatched) {
    return;
  }
  // jsdom (unit tests) has no Web Audio; skip source tracking there.
  if (typeof AudioBufferSourceNode === "undefined") {
    return;
  }
  s.originalSourceStart = AudioBufferSourceNode.prototype.start;
  const originalStart = s.originalSourceStart;

  AudioBufferSourceNode.prototype.start = function (
    this: AudioBufferSourceNode,
    ...args: Parameters<AudioBufferSourceNode["start"]>
  ) {
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
  stopFlashVideo();
  delete window.__nikartFlashVideoGuard;
}

/**
 * Install stream/audio guards while the Ruffle player is mounted.
 * Returns a disposer for the player effect cleanup.
 */
export function installFlashVideoGuard(player: EventTarget): () => void {
  const s = state();
  s.installs += 1;
  patchFetch();
  patchBufferSources();

  const onPointerUp = () => {
    if (!s.videoActive) {
      return;
    }
    const startsAtClick = s.sourceStarts;
    const controllerAtClick = s.videoController;
    window.setTimeout(() => {
      if (!s.videoActive || s.videoController !== controllerAtClick) {
        // Stream already ended or a new FLV replaced it (quality / next video).
        return;
      }
      // Back leaves the video view without aborting NetStream; the FLV decoder
      // keeps starting buffer sources. Pause does not. Abort that leak.
      if (s.sourceStarts - startsAtClick >= 2) {
        stopFlashVideo();
      }
    }, 450);
  };

  player.addEventListener("pointerup", onPointerUp, true);

  return () => {
    player.removeEventListener("pointerup", onPointerUp, true);
    s.installs = Math.max(0, s.installs - 1);
    if (s.installs === 0) {
      unpatchAll();
    }
  };
}
