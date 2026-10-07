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

  it("opens the flash view at /fl from a nested article", () => {
    const flashItem: ContentItem = {
      id: "fl",
      type: "web",
      title: { en: "Flash View", es: "Vista en Flash" },
      desc: { en: "The Flash view of this site.", es: "Vista en Flash." },
      imgs: 1,
      url: "_self/../fl",
      launch: {
        en: "Change to the Flash view",
        es: "Cambia a la versión en Flash",
      },
    };

    render(<ArticleView item={flashItem} locale="en" />);

    const link = screen.getByRole("link", { name: "Change to the Flash view" });
    expect(link).toHaveAttribute("href", "/fl");
    expect(link).toHaveAttribute("target", "_self");
  });

  it("opens the other language at /html5/{locale}", () => {
    const languageItem: ContentItem = {
      id: "language",
      type: "web",
      title: { en: "Español", es: "English" },
      url: { en: "_self/es", es: "_self/en" },
      launch: {
        en: "Cambia idioma a Español",
        es: "Change Language to English",
      },
    };

    render(<ArticleView item={languageItem} locale="en" />);

    expect(screen.getByRole("link", { name: "Cambia idioma a Español" })).toHaveAttribute(
      "href",
      "/html5/es",
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
