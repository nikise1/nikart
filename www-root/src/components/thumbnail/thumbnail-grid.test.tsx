import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MenuItem } from "@/lib/data/schema";
import { ThumbnailGrid } from "./thumbnail-grid";

vi.mock("@/lib/gsap", () => ({
  gsap: {
    killTweensOf: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
  },
  useGSAP: () => {},
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const menu: MenuItem = {
  id: "config",
  type: "men",
  title: { en: "Config", es: "Config" },
  menu: [
    {
      id: "language",
      type: "web",
      title: { en: "Español", es: "English" },
    },
    {
      id: "html5",
      type: "web",
      title: { en: "HTML5 View", es: "Vista en HTML5" },
    },
    {
      id: "fl",
      type: "web",
      title: { en: "Flash View", es: "Vista en Flash" },
    },
  ],
};

describe("ThumbnailGrid", () => {
  it("hides the html5 view and keeps the flash view", () => {
    render(<ThumbnailGrid menu={menu} locale="en" basePath="config" />);

    expect(screen.queryByRole("link", { name: /HTML5 View/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Flash View/ })).toHaveAttribute(
      "href",
      "/en/config/fl",
    );
    expect(screen.getByRole("link", { name: /Español/ })).toHaveAttribute(
      "href",
      "/en/config/language",
    );
  });
});
