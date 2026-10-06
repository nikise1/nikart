import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

describe("VideoView", () => {
  it("staggers the title ahead of the player", () => {
    render(<VideoView item={videoItem} locale="en" />);

    expect(screen.getByRole("heading", { name: "Spark" })).toHaveAttribute("data-content-slot", "0");
    expect(document.querySelector("video")?.parentElement).toHaveAttribute("data-content-slot", "1");
  });
});
