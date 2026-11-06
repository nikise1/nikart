import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentItem } from "@/lib/data/schema";
import * as ios from "./is-ios";
import { VIDEO_LOAD_RETRY_MS, VIDEO_RECOVERY_DELAYS_MS } from "./prime-video-load";
import { VideoView } from "./video-view";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    ViewTransition: ({ children }: { children?: ReactNode }) => children,
  };
});

const videoItem: ContentItem = {
  id: "spark",
  type: "vid",
  title: { en: "Spark", es: "Chispa" },
};

function rect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    width,
    height,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

function mockStageBox(stage: DOMRect, caption?: DOMRect): void {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.dataset["component"] === "VideoStage") return stage;
    if (caption && this.dataset["component"] === "VideoCaption") return caption;
    return rect(0, 0);
  });
}

function loadFrame(video: HTMLVideoElement, width: number, height: number): void {
  Object.defineProperty(video, "videoWidth", { configurable: true, value: width });
  Object.defineProperty(video, "videoHeight", { configurable: true, value: height });
  act(() => {
    video.dispatchEvent(new Event("loadedmetadata"));
  });
}

function trackFullscreen(video: HTMLVideoElement, requestFullscreen = vi.fn()) {
  let element: Element | null = null;
  let ended = false;
  const previousEnabled = Object.getOwnPropertyDescriptor(document, "fullscreenEnabled");
  const previousElement = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
  const previousEnded = Object.getOwnPropertyDescriptor(video, "ended");
  Object.defineProperty(video, "requestFullscreen", {
    configurable: true,
    value: requestFullscreen,
  });
  Object.defineProperty(video, "ended", { configurable: true, get: () => ended });
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: () => true });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => element });

  return {
    enter(): void {
      element = video;
      act(() => {
        document.dispatchEvent(new Event("fullscreenchange"));
      });
    },
    exit(options?: { ended?: boolean }): void {
      ended = options?.ended ?? false;
      element = null;
      act(() => {
        document.dispatchEvent(new Event("fullscreenchange"));
      });
    },
    restore(): void {
      if (previousEnabled) Object.defineProperty(document, "fullscreenEnabled", previousEnabled);
      else Reflect.deleteProperty(document, "fullscreenEnabled");
      if (previousElement) Object.defineProperty(document, "fullscreenElement", previousElement);
      else Reflect.deleteProperty(document, "fullscreenElement");
      if (previousEnded) Object.defineProperty(video, "ended", previousEnded);
      else Reflect.deleteProperty(video, "ended");
    },
  };
}

describe("VideoView", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("staggers the title ahead of the player", () => {
    render(<VideoView item={videoItem} locale="en" />);

    expect(screen.getByRole("heading", { name: "Spark" })).toHaveAttribute(
      "data-component",
      "ContentTitle",
    );
    expect(screen.getByRole("heading", { name: "Spark" }).parentElement).toHaveAttribute(
      "data-content-slot",
      "0",
    );
    expect(document.querySelector("video")?.parentElement).toHaveAttribute(
      "data-content-slot",
      "1",
    );
    expect(document.querySelector("[data-component='VideoStage']")).toHaveClass(
      "items-center",
      "justify-center",
    );
    expect(document.querySelector("[data-component='ContentDescription']")).toBeNull();
    expect(document.querySelector("[data-content-slot='2']")).toBeNull();
  });

  it("starts the file when the browser has not selected a source", () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    render(<VideoView item={videoItem} locale="en" />);
    expect(load).toHaveBeenCalledOnce();
  });

  it("tries the file once more when the first load errors", () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    let mediaError: MediaError | null = null;
    const previousState = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "networkState",
    );
    const previousError = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "error");
    Object.defineProperty(HTMLMediaElement.prototype, "networkState", {
      configurable: true,
      get: () => HTMLMediaElement.NETWORK_LOADING,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "error", {
      configurable: true,
      get: () => mediaError,
    });

    try {
      render(<VideoView item={videoItem} locale="en" />);
      expect(load).not.toHaveBeenCalled();

      const video = document.querySelector("video");
      if (!video) throw new Error("missing video");
      mediaError = { code: 2 } as MediaError;
      act(() => {
        video.dispatchEvent(new Event("error"));
      });
      expect(load).toHaveBeenCalledOnce();

      act(() => {
        video.dispatchEvent(new Event("error"));
      });
      expect(load).toHaveBeenCalledOnce();
    } finally {
      if (previousState)
        Object.defineProperty(HTMLMediaElement.prototype, "networkState", previousState);
      else Reflect.deleteProperty(HTMLMediaElement.prototype, "networkState");
      if (previousError) Object.defineProperty(HTMLMediaElement.prototype, "error", previousError);
      else Reflect.deleteProperty(HTMLMediaElement.prototype, "error");
    }
  });

  it("tries the files once more when every source fails", () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    render(<VideoView item={videoItem} locale="en" />);
    expect(load).toHaveBeenCalledOnce();

    const sources = document.querySelectorAll("video source");
    expect(sources).toHaveLength(2);
    act(() => {
      sources[0]?.dispatchEvent(new Event("error"));
    });
    expect(load).toHaveBeenCalledOnce();

    act(() => {
      sources[1]?.dispatchEvent(new Event("error"));
    });
    expect(load).toHaveBeenCalledTimes(2);

    act(() => {
      sources[1]?.dispatchEvent(new Event("error"));
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("loads again when the network comes back after the retry fails", () => {
    vi.useFakeTimers();
    const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    try {
      render(<VideoView item={videoItem} locale="en" />);
      const last = document.querySelector("video source:last-of-type");
      if (!last) throw new Error("missing source");
      const failAll = (): void => {
        act(() => {
          last.dispatchEvent(new Event("error"));
        });
      };
      act(() => {
        vi.advanceTimersByTime(VIDEO_LOAD_RETRY_MS);
      });
      expect(load).toHaveBeenCalledTimes(2);

      failAll();
      expect(load).toHaveBeenCalledTimes(3);
      failAll();
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(load).toHaveBeenCalledTimes(3);

      onLine.mockReturnValue(true);
      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      expect(load).toHaveBeenCalledTimes(4);

      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      expect(load).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops loading again after a few failures while online", () => {
    vi.useFakeTimers();
    const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);

    try {
      render(<VideoView item={videoItem} locale="en" />);
      const last = document.querySelector("video source:last-of-type");
      if (!last) throw new Error("missing source");
      const failAll = (): void => {
        act(() => {
          last.dispatchEvent(new Event("error"));
        });
      };
      act(() => {
        vi.advanceTimersByTime(VIDEO_LOAD_RETRY_MS);
      });
      failAll();
      expect(load).toHaveBeenCalledTimes(3);

      for (const [index, delay] of VIDEO_RECOVERY_DELAYS_MS.entries()) {
        failAll();
        act(() => {
          vi.advanceTimersByTime(delay - 1);
        });
        expect(load).toHaveBeenCalledTimes(3 + index);
        act(() => {
          vi.advanceTimersByTime(1);
        });
        expect(load).toHaveBeenCalledTimes(4 + index);
      }

      const total = 3 + VIDEO_RECOVERY_DELAYS_MS.length;
      failAll();
      act(() => {
        vi.advanceTimersByTime(60_000);
        window.dispatchEvent(new Event("online"));
      });
      expect(load).toHaveBeenCalledTimes(total);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tries again after the entrance if the file still has not started", () => {
    vi.useFakeTimers();
    const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);

    try {
      render(<VideoView item={videoItem} locale="en" />);
      expect(load).toHaveBeenCalledOnce();
      act(() => {
        vi.advanceTimersByTime(VIDEO_LOAD_RETRY_MS);
      });
      expect(load).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reads a frame that is already available when the player mounts", () => {
    const widthDesc = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, "videoWidth");
    const heightDesc = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, "videoHeight");
    mockStageBox(rect(1400, 900));
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      get: () => 1280,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      get: () => 720,
    });

    try {
      render(<VideoView item={videoItem} locale="en" />);

      const video = document.querySelector("video");
      expect(video).not.toBeNull();
      if (!video) return;
      expect(video).toHaveAttribute("width", "1280");
      expect(video).toHaveAttribute("height", "720");
      expect(video.style.width).toBe("1280px");
      expect(video.style.height).toBe("720px");
    } finally {
      if (widthDesc) Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", widthDesc);
      if (heightDesc) Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", heightDesc);
    }
  });

  it("sizes the unplayed video to the source frame when the stage has room", () => {
    mockStageBox(rect(1400, 900));
    render(<VideoView item={videoItem} locale="en" />);

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    if (!video) return;
    expect(video).not.toHaveAttribute("width");
    expect(video).not.toHaveAttribute("poster");

    loadFrame(video, 640, 480);

    expect(video).toHaveAttribute("width", "640");
    expect(video).toHaveAttribute("height", "480");
    expect(video).toHaveClass("bg-black", "object-contain");
    expect(video.style.width).toBe("640px");
    expect(video.style.height).toBe("480px");
  });

  it("places the player from the poster size before the video file is known", () => {
    mockStageBox(rect(1400, 900));
    const OriginalImage = globalThis.Image;
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 0;
        naturalHeight = 0;
        onload: ((event: Event) => void) | null = null;
        set src(_value: string) {
          this.naturalWidth = 1280;
          this.naturalHeight = 720;
          this.onload?.(new Event("load"));
        }
      },
    );

    try {
      render(<VideoView item={videoItem} locale="en" poster="/content/img/spark_poster.jpg" />);

      const video = document.querySelector("video");
      if (!video) throw new Error("missing video");
      expect(video).toHaveAttribute("poster", "/content/img/spark_poster.jpg");
      expect(video).toHaveAttribute("width", "1280");
      expect(video).toHaveAttribute("height", "720");
      expect(video.style.width).toBe("1280px");
      expect(video.style.height).toBe("720px");

      loadFrame(video, 1920, 1080);
      expect(video.style.width).toBe("1400px");
      expect(video.style.height).toBe("788px");
    } finally {
      vi.stubGlobal("Image", OriginalImage);
    }
  });

  it("shrinks a wider source so the player stays inside the stage", () => {
    mockStageBox(rect(640, 900));
    render(<VideoView item={videoItem} locale="en" />);

    const video = document.querySelector("video");
    if (!video) throw new Error("missing video");
    loadFrame(video, 1280, 720);

    expect(video).toHaveAttribute("width", "1280");
    expect(video).toHaveAttribute("height", "720");
    expect(video.style.width).toBe("640px");
    expect(video.style.height).toBe("360px");
  });

  it("places a description after the player and reserves its height", () => {
    mockStageBox(rect(400, 500), rect(200, 100));
    const described: ContentItem = {
      ...videoItem,
      desc: { en: "A short film.", es: "Un cortometraje." },
    };

    render(<VideoView item={described} locale="es" />);

    expect(screen.getByRole("heading", { name: "Chispa" }).parentElement).toHaveAttribute(
      "data-content-slot",
      "0",
    );
    const video = document.querySelector("video");
    expect(video?.parentElement).toHaveAttribute("data-content-slot", "1");
    const description = screen.getByText("Un cortometraje.");
    expect(description).toHaveAttribute("data-component", "ContentDescription");
    expect(description.parentElement).toHaveAttribute("data-content-slot", "2");
    expect(description.closest("[data-component='VideoStage']")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Chispa" }).closest("[data-component='VideoStage']"),
    ).toBeNull();

    if (!video) throw new Error("missing video");
    loadFrame(video, 640, 480);

    expect(video.style.width).toBe("400px");
    expect(video.style.height).toBe("300px");
  });

  it("enters fullscreen when playback starts", () => {
    mockStageBox(rect(1400, 900));
    render(<VideoView item={videoItem} locale="en" />);

    const video = document.querySelector("video");
    if (!video) throw new Error("missing video");
    loadFrame(video, 640, 480);

    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const previousEnabled = Object.getOwnPropertyDescriptor(document, "fullscreenEnabled");
    const previousElement = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
    Object.defineProperty(video, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: () => true });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => null });

    try {
      act(() => {
        video.dispatchEvent(new Event("play"));
      });
    } finally {
      if (previousEnabled) Object.defineProperty(document, "fullscreenEnabled", previousEnabled);
      else Reflect.deleteProperty(document, "fullscreenEnabled");
      if (previousElement) Object.defineProperty(document, "fullscreenElement", previousElement);
      else Reflect.deleteProperty(document, "fullscreenElement");
    }

    expect(video).toHaveAttribute("playsinline");
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("does not enter fullscreen on iOS", () => {
    mockStageBox(rect(1400, 900));
    vi.spyOn(ios, "isIos").mockReturnValue(true);
    render(<VideoView item={videoItem} locale="en" />);

    const video = document.querySelector("video");
    if (!video) throw new Error("missing video");
    loadFrame(video, 640, 480);

    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const webkitEnterFullscreen = vi.fn();
    Object.assign(video, { requestFullscreen, webkitEnterFullscreen });
    const previousEnabled = Object.getOwnPropertyDescriptor(document, "fullscreenEnabled");
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: () => true });

    try {
      act(() => {
        video.dispatchEvent(new Event("play"));
      });
    } finally {
      if (previousEnabled) Object.defineProperty(document, "fullscreenEnabled", previousEnabled);
      else Reflect.deleteProperty(document, "fullscreenEnabled");
    }

    expect(requestFullscreen).not.toHaveBeenCalled();
    expect(webkitEnterFullscreen).not.toHaveBeenCalled();
  });

  it("stays inline when play follows a deliberate fullscreen exit", () => {
    mockStageBox(rect(1400, 900));
    render(<VideoView item={videoItem} locale="en" />);

    const video = document.querySelector("video");
    if (!video) throw new Error("missing video");
    loadFrame(video, 640, 480);

    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const session = trackFullscreen(video, requestFullscreen);

    try {
      session.enter();
      session.exit();
      act(() => {
        video.dispatchEvent(new Event("play"));
      });
    } finally {
      session.restore();
    }

    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("enters fullscreen on play after the clip itself ends", () => {
    mockStageBox(rect(1400, 900));
    render(<VideoView item={videoItem} locale="en" />);

    const video = document.querySelector("video");
    if (!video) throw new Error("missing video");
    loadFrame(video, 640, 480);

    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const session = trackFullscreen(video, requestFullscreen);

    try {
      session.enter();
      session.exit({ ended: true });
      act(() => {
        video.dispatchEvent(new Event("play"));
      });
    } finally {
      session.restore();
    }

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("fullscreens again after the viewer leaves that video", () => {
    mockStageBox(rect(1400, 900));
    const { rerender } = render(<VideoView item={videoItem} locale="en" />);

    const first = document.querySelector("video");
    if (!first) throw new Error("missing video");
    loadFrame(first, 640, 480);

    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const session = trackFullscreen(first, requestFullscreen);

    try {
      session.enter();
      session.exit();

      const other: ContentItem = {
        id: "collapse",
        type: "vid",
        title: { en: "Collapse", es: "Colapso" },
      };
      rerender(<VideoView item={other} locale="en" />);
      rerender(<VideoView item={videoItem} locale="en" />);

      const video = document.querySelector("video");
      if (!video) throw new Error("missing video");
      Object.defineProperty(video, "requestFullscreen", {
        configurable: true,
        value: requestFullscreen,
      });
      loadFrame(video, 640, 480);
      act(() => {
        video.dispatchEvent(new Event("play"));
      });
    } finally {
      session.restore();
    }

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("stays inline after the iPhone player is closed early", () => {
    mockStageBox(rect(1400, 900));
    render(<VideoView item={videoItem} locale="en" />);

    const video = document.querySelector("video");
    if (!video) throw new Error("missing video");
    const webkitEnterFullscreen = vi.fn();
    const previousEnabled = Object.getOwnPropertyDescriptor(document, "fullscreenEnabled");
    Object.assign(video, { webkitDisplayingFullscreen: false, webkitEnterFullscreen });
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: () => false });

    try {
      act(() => {
        Object.assign(video, { webkitDisplayingFullscreen: true });
        video.dispatchEvent(new Event("webkitbeginfullscreen"));
      });
      act(() => {
        Object.assign(video, { webkitDisplayingFullscreen: false });
        video.dispatchEvent(new Event("webkitendfullscreen"));
      });
      act(() => {
        video.dispatchEvent(new Event("play"));
      });
    } finally {
      if (previousEnabled) Object.defineProperty(document, "fullscreenEnabled", previousEnabled);
      else Reflect.deleteProperty(document, "fullscreenEnabled");
    }

    expect(webkitEnterFullscreen).not.toHaveBeenCalled();
  });

  it("leaves fullscreen when playback ends", () => {
    mockStageBox(rect(1400, 900));
    render(<VideoView item={videoItem} locale="en" />);

    const video = document.querySelector("video");
    if (!video) throw new Error("missing video");
    loadFrame(video, 640, 480);

    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    const previousElement = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
    const previousExit = Object.getOwnPropertyDescriptor(document, "exitFullscreen");
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => video });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitFullscreen,
    });

    try {
      act(() => {
        video.dispatchEvent(new Event("ended"));
      });
    } finally {
      if (previousElement) Object.defineProperty(document, "fullscreenElement", previousElement);
      else Reflect.deleteProperty(document, "fullscreenElement");
      if (previousExit) Object.defineProperty(document, "exitFullscreen", previousExit);
      else Reflect.deleteProperty(document, "exitFullscreen");
    }

    expect(exitFullscreen).toHaveBeenCalledOnce();
  });
});
