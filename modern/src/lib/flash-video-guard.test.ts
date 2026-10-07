import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ensureFlashVideoPatches,
  installFlashVideoGuard,
  stopFlashVideo,
} from "./flash-video-guard";

describe("flash-video-guard", () => {
  afterEach(() => {
    stopFlashVideo();
    delete window.__nikartFlashVideoGuard;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("aborts a tracked FLV fetch when stopFlashVideo is called", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    delete window.__nikartFlashVideoGuard;
    ensureFlashVideoPatches();

    const pending = fetch("/static/video_flv/close_500.flv");
    const expectAbort = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    stopFlashVideo();
    await expectAbort;
  });

  it("suppresses buffer sources after stopFlashVideo", () => {
    class FakeSource extends EventTarget {
      stopped = false;
      start() {
        /* replaced by patch */
      }
      stop() {
        this.stopped = true;
      }
    }
    vi.stubGlobal("AudioBufferSourceNode", FakeSource);
    delete window.__nikartFlashVideoGuard;
    ensureFlashVideoPatches();

    // Mark video active via a stubbed fetch, then suppress.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))),
    );
    delete window.__nikartFlashVideoGuard;
    ensureFlashVideoPatches();
    void fetch("/static/video_flv/spark_500.flv");

    stopFlashVideo();

    const source = new FakeSource();
    source.start();
    expect(source.stopped).toBe(true);
  });

  it("stops a leaked stream after a click that keeps pumping buffer sources", async () => {
    vi.useFakeTimers();

    class FakeSource extends EventTarget {
      start() {
        /* patched */
      }
      stop() {
        /* no-op */
      }
    }
    vi.stubGlobal("AudioBufferSourceNode", FakeSource);

    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    delete window.__nikartFlashVideoGuard;

    const target = document.createElement("div");
    const dispose = installFlashVideoGuard(target);

    const pending = fetch("/static/video_flv/spark_500.flv");
    const expectAbort = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });

    target.dispatchEvent(new Event("pointerup", { bubbles: true }));
    new FakeSource().start();
    new FakeSource().start();

    await vi.advanceTimersByTimeAsync(400);
    await expectAbort;
    dispose();
    vi.useRealTimers();
  });
});
