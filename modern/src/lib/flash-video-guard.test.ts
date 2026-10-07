import { afterEach, describe, expect, it, vi } from "vitest";
import {
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
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const target = document.createElement("div");
    const dispose = installFlashVideoGuard(target);

    const pending = fetch("/static/video_flv/close_500.flv");
    expect(fetchMock).toHaveBeenCalledOnce();

    stopFlashVideo();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    dispose();
  });

  it("aborts after a click when the decoder keeps starting buffer sources", async () => {
    vi.useFakeTimers();

    class FakeSource extends EventTarget {
      start() {
        /* patched below via prototype once AudioBufferSourceNode exists */
      }
      stop() {
        /* no-op */
      }
    }

    vi.stubGlobal("AudioBufferSourceNode", FakeSource);

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    // Re-install after stubbing Web Audio so the prototype patch applies.
    delete window.__nikartFlashVideoGuard;
    const target = document.createElement("div");
    const dispose = installFlashVideoGuard(target);

    const pending = fetch("/static/video_flv/spark_500.flv");
    const expectAbort = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });

    target.dispatchEvent(new Event("pointerup", { bubbles: true }));
    // Simulate Ruffle still pumping audio after Back.
    new FakeSource().start();
    new FakeSource().start();
    new FakeSource().start();

    await vi.advanceTimersByTimeAsync(450);
    await expectAbort;
    dispose();
    vi.useRealTimers();
  });
});
