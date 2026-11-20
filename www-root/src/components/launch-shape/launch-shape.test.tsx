import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WEB_TAB_NAME } from "@/lib/web-tab";
import { LaunchShape } from "./launch-shape";

describe("LaunchShape", () => {
  it("draws a willow leaf around the launch label", () => {
    render(
      <LaunchShape
        variant="leaf"
        href="http://onedayinmay.co.uk"
        text="Launch Website"
        self={false}
      />,
    );

    const link = screen.getByRole("link", { name: "Launch Website, Willow leaf" });
    expect(link).toHaveAttribute("data-variant", "leaf");
    expect(link).toHaveAttribute("href", "http://onedayinmay.co.uk");
    expect(link).toHaveAttribute("target", WEB_TAB_NAME);
    expect(link).not.toHaveAttribute("rel");
    expect(screen.getByText("Willow leaf")).toBeInTheDocument();
  });

  it("draws a seed around the launch label and stays on this tab when asked", () => {
    render(<LaunchShape variant="seed" href="/fl" text="Change to the Flash view" self />);

    const link = screen.getByRole("link", { name: "Change to the Flash view, Seed" });
    expect(link).toHaveAttribute("data-variant", "seed");
    expect(link).toHaveAttribute("href", "/fl");
    expect(link).toHaveAttribute("target", "_self");
    expect(screen.getByText("Seed")).toBeInTheDocument();
  });
});
