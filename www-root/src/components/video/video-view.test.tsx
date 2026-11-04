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

    expect(screen.getByRole("heading", { name: "Spark" })).toHaveAttribute(
      "data-component",
      "ContentTitle",
    );
    expect(screen.getByRole("heading", { name: "Spark" }).parentElement).toHaveAttribute(
      "data-content-slot",
      "0",
    );
    expect(document.querySelector("video")?.parentElement).toHaveClass(
      "max-w-[480px]",
      "md:max-w-[640px]",
    );
    expect(document.querySelector("video")).toHaveClass("object-contain");
    expect(document.querySelector("video")?.parentElement?.parentElement).toHaveAttribute(
      "data-content-slot",
      "1",
    );
    expect(document.querySelector("[data-component='ContentDescription']")).toBeNull();
    expect(document.querySelector("[data-content-slot='2']")).toBeNull();
  });

  it("places a description after the player when the item has one", () => {
    const described: ContentItem = {
      ...videoItem,
      desc: { en: "A short film.", es: "Un cortometraje." },
    };

    render(<VideoView item={described} locale="es" />);

    expect(screen.getByRole("heading", { name: "Chispa" }).parentElement).toHaveAttribute(
      "data-content-slot",
      "0",
    );
    expect(document.querySelector("video")?.parentElement?.parentElement).toHaveAttribute(
      "data-content-slot",
      "1",
    );
    const description = screen.getByText("Un cortometraje.");
    expect(description).toHaveAttribute("data-component", "ContentDescription");
    expect(description.parentElement).toHaveAttribute("data-content-slot", "2");
  });
});
