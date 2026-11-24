import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WEB_TAB_NAME } from "@/lib/web-tab";
import { LaunchShape } from "./launch-shape";

describe("LaunchShape", () => {
  it("draws the white willow around the launch label", () => {
    render(<LaunchShape href="http://onedayinmay.co.uk" text="Launch Website" self={false} />);

    const link = screen.getByRole("link", { name: "Launch Website" });
    expect(link).toHaveAttribute("data-component", "LaunchShape");
    expect(link).toHaveAttribute("href", "http://onedayinmay.co.uk");
    expect(link).toHaveAttribute("target", WEB_TAB_NAME);
    expect(link).not.toHaveAttribute("rel");
    const style = link.getAttribute("style") ?? "";
    expect(style).toContain('url("/launch/white-willow.png")');
    expect(style).toContain("rgba(14, 32, 8, 0.95) 0px 0px 4px");
    expect(style).toContain("border-width: 0px 98px 0px 80px");
    expect(screen.queryByText("Willow leaf")).toBeNull();
    expect(screen.queryByText("Seed")).toBeNull();
  });

  it("stays on this tab when asked", () => {
    render(<LaunchShape href="/fl" text="Change to the Flash view" self />);

    const link = screen.getByRole("link", { name: "Change to the Flash view" });
    expect(link).toHaveAttribute("href", "/fl");
    expect(link).toHaveAttribute("target", "_self");
  });
});
