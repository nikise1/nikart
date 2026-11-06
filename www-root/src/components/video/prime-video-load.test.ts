import { describe, expect, it } from "vitest";
import { VIDEO_LOAD_RETRY_MS, videoNeedsLoad } from "./prime-video-load";

function media(
  partial: Partial<HTMLMediaElement> & { error?: MediaError | null },
): HTMLMediaElement {
  return {
    readyState: HTMLMediaElement.HAVE_NOTHING,
    networkState: HTMLMediaElement.NETWORK_EMPTY,
    error: null,
    ...partial,
  } as HTMLMediaElement;
}

describe("videoNeedsLoad", () => {
  it("starts a client-rendered video that has not selected a file", () => {
    expect(videoNeedsLoad(media({ networkState: HTMLMediaElement.NETWORK_EMPTY }))).toBe(true);
    expect(videoNeedsLoad(media({ networkState: HTMLMediaElement.NETWORK_NO_SOURCE }))).toBe(true);
  });

  it("leaves a fetch that is already running", () => {
    expect(videoNeedsLoad(media({ networkState: HTMLMediaElement.NETWORK_LOADING }))).toBe(false);
  });

  it("retries when the element has an error and still no metadata", () => {
    expect(
      videoNeedsLoad(
        media({
          networkState: HTMLMediaElement.NETWORK_IDLE,
          error: {} as MediaError,
        }),
      ),
    ).toBe(true);
  });

  it("does nothing once the frame is known", () => {
    expect(
      videoNeedsLoad(
        media({
          readyState: HTMLMediaElement.HAVE_METADATA,
          networkState: HTMLMediaElement.NETWORK_EMPTY,
          error: {} as MediaError,
        }),
      ),
    ).toBe(false);
  });
});

describe("VIDEO_LOAD_RETRY_MS", () => {
  it("waits until the content entrance can finish", () => {
    expect(VIDEO_LOAD_RETRY_MS).toBe(420);
  });
});
