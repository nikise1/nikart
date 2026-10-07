import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentItem } from "@/lib/data/schema";
import { ArticleView } from "./article-view";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    ViewTransition: ({ children }: { children?: ReactNode }) => children,
  };
});

vi.mock("@/lib/gsap", () => ({
  gsap: {
    to: vi.fn(),
    delayedCall: vi.fn(() => ({ kill: vi.fn() })),
    killTweensOf: vi.fn(),
  },
}));

const slideshowItem: ContentItem = {
  id: "onedayinmay",
  type: "web",
  title: "One Day in May",
  desc: { en: "A microsite.", es: "Un micrositio." },
  imgs: 4,
  url: "http://onedayinmay.co.uk",
  launch: { en: "Launch Website", es: "Abra el Sitio" },
};

describe("ArticleView", () => {
  it("staggers title, slideshow, description, and launch as separate slots", () => {
    render(<ArticleView item={slideshowItem} locale="en" />);

    expect(screen.getByRole("heading", { name: "One Day in May" }).parentElement).toHaveAttribute(
      "data-content-slot",
      "0",
    );
    expect(screen.getByText("A microsite.").parentElement).toHaveAttribute(
      "data-content-slot",
      "2",
    );
    expect(
      screen.getByRole("link", { name: "Launch Website" }).parentElement?.parentElement,
    ).toHaveAttribute("data-content-slot", "3");
    expect(document.querySelector("[data-component='Slideshow']")?.parentElement).toHaveAttribute(
      "data-content-slot",
      "1",
    );
  });

  it("does not reserve empty slots when the article has no images or link", () => {
    const textOnly: ContentItem = {
      id: "note",
      type: "tex",
      title: "Note",
      desc: "Just words.",
    };

    render(<ArticleView item={textOnly} locale="en" />);

    expect(screen.getByRole("heading", { name: "Note" }).parentElement).toHaveAttribute(
      "data-content-slot",
      "0",
    );
    expect(screen.getByText("Just words.").parentElement).toHaveAttribute("data-content-slot", "1");
    expect(document.querySelector("[data-content-slot='2']")).toBeNull();
  });
});
