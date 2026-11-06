import { describe, expect, it, vi } from "vitest";
import { enterVideoFullscreen } from "./enter-video-fullscreen";

function fakeDocument(fullscreenElement: Element | null, fullscreenEnabled: boolean): Document {
  return { fullscreenElement, fullscreenEnabled } as unknown as Document;
}

describe("enterVideoFullscreen", () => {
  it("requests the standard fullscreen element", () => {
    const video = document.createElement("video");
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.assign(video, { requestFullscreen });

    enterVideoFullscreen(video, fakeDocument(null, true));

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("ignores a rejected fullscreen request", async () => {
    const video = document.createElement("video");
    const requestFullscreen = vi.fn().mockRejectedValue(new Error("no gesture"));
    Object.assign(video, { requestFullscreen });

    enterVideoFullscreen(video, fakeDocument(null, true));
    await Promise.resolve();

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("does nothing when the video is already the fullscreen element", () => {
    const video = document.createElement("video");
    const requestFullscreen = vi.fn();
    Object.assign(video, { requestFullscreen });

    enterVideoFullscreen(video, fakeDocument(video, true));

    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("opens the iPhone system player when the standard API is unavailable", () => {
    const video = document.createElement("video");
    const webkitEnterFullscreen = vi.fn();
    const requestFullscreen = vi.fn();
    Object.assign(video, { webkitEnterFullscreen, requestFullscreen });

    enterVideoFullscreen(video, fakeDocument(null, false));

    expect(webkitEnterFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("does nothing when the iPhone system player is already open", () => {
    const video = document.createElement("video");
    const webkitEnterFullscreen = vi.fn();
    Object.assign(video, { webkitDisplayingFullscreen: true, webkitEnterFullscreen });

    enterVideoFullscreen(video, fakeDocument(null, false));

    expect(webkitEnterFullscreen).not.toHaveBeenCalled();
  });

  it("swallows a system-player refusal", () => {
    const video = document.createElement("video");
    Object.assign(video, {
      webkitEnterFullscreen() {
        throw new Error("no gesture");
      },
    });

    expect(() => enterVideoFullscreen(video, fakeDocument(null, false))).not.toThrow();
  });
});
