import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ContentItem } from "@/lib/data/schema";
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

describe("VideoView", () => {
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

    loadFrame(video, 640, 480);

    expect(video).toHaveAttribute("width", "640");
    expect(video).toHaveAttribute("height", "480");
    expect(video).toHaveClass("object-contain");
    expect(video.style.width).toBe("640px");
    expect(video.style.height).toBe("480px");
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
});
