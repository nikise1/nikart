import { describe, expect, it, vi } from "vitest";
import { leaveVideoFullscreen } from "./leave-video-fullscreen";

function fakeDocument(fullscreenElement: Element | null, exitFullscreen = vi.fn()) {
  return { fullscreenElement, exitFullscreen } as unknown as Document;
}

describe("leaveVideoFullscreen", () => {
  it("exits the standard fullscreen element", () => {
    const video = document.createElement("video");
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);

    leaveVideoFullscreen(video, fakeDocument(video, exitFullscreen));

    expect(exitFullscreen).toHaveBeenCalledOnce();
  });

  it("leaves the iPhone system player when the standard element is absent", () => {
    const video = document.createElement("video");
    const webkitExitFullscreen = vi.fn();
    Object.assign(video, { webkitDisplayingFullscreen: true, webkitExitFullscreen });
    const exitFullscreen = vi.fn();

    leaveVideoFullscreen(video, fakeDocument(null, exitFullscreen));

    expect(webkitExitFullscreen).toHaveBeenCalledOnce();
    expect(exitFullscreen).not.toHaveBeenCalled();
  });

  it("does nothing when the video is inline", () => {
    const exitFullscreen = vi.fn();

    leaveVideoFullscreen(document.createElement("video"), fakeDocument(null, exitFullscreen));

    expect(exitFullscreen).not.toHaveBeenCalled();
  });
});
