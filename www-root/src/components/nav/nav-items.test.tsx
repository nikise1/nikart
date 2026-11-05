import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MenuItem } from "@/lib/data/schema";
import { NavItems } from "./nav-items";

const featured: MenuItem = {
  id: "featured",
  type: "men",
  title: { en: "Featured Projects", es: "Proyectos Destacados" },
  menu: [],
};

const websites: MenuItem = {
  id: "websites",
  type: "men",
  title: { en: "Websites", es: "Sitios Web" },
  menu: [],
};

describe("NavItems", () => {
  it("draws the featured label larger than the other items", () => {
    render(<NavItems items={[featured, websites]} locale="en" />);

    const featuredButton = screen.getByRole("button", { name: "Featured Projects" });
    const websitesButton = screen.getByRole("button", { name: "Websites" });

    expect(featuredButton).toHaveClass("text-[20px]", "leading-[1.15]");
    expect(featuredButton).not.toHaveClass("text-sm");
    expect(websitesButton).toHaveClass("text-sm");
    expect(websitesButton).not.toHaveClass("text-[20px]");
  });
});
