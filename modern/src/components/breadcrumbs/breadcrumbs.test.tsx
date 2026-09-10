import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NAV_TIMING } from "@/lib/nav-timing";
import { BREADCRUMB_NOTCH_FROM_Y } from "./use-breadcrumb-animator";
import { Breadcrumbs } from "./breadcrumbs";

const gsapFromTo = vi.hoisted(() => vi.fn());
const gsapKill = vi.hoisted(() => vi.fn());
let pathname = "/en/art/install/spark";
let navPhase = "closed";

vi.mock("@/lib/gsap", () => ({
  gsap: {
    fromTo: gsapFromTo,
    killTweensOf: gsapKill,
  },
  useGSAP: (callback: () => void) => {
    queueMicrotask(callback);
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

vi.mock("@/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/store/nav-store", () => ({
  useNavStore: (selector: (state: { navPhase: string }) => unknown) =>
    selector({ navPhase }),
}));

async function renderBreadcrumbs() {
  const view = render(<Breadcrumbs locale="en" />);
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

describe("Breadcrumbs", () => {
  beforeEach(() => {
    pathname = "/en/art/install/spark";
    navPhase = "closed";
    gsapFromTo.mockClear();
    gsapKill.mockClear();
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return 80;
      },
    });
  });

  it("renders nothing on the home path", async () => {
    pathname = "/en";
    await renderBreadcrumbs();
    expect(screen.queryByLabelText("Breadcrumb")).not.toBeInTheDocument();
    expect(gsapFromTo).not.toHaveBeenCalled();
  });

  it("hides while the nav is open", async () => {
    navPhase = "open";
    await renderBreadcrumbs();
    expect(screen.queryByLabelText("Breadcrumb")).not.toBeInTheDocument();
  });

  it("renders localized crumb links for the current path", async () => {
    await renderBreadcrumbs();
    expect(screen.getByRole("link", { name: "Art" })).toHaveAttribute("href", "/art");
    expect(screen.getByRole("link", { name: "Installations" })).toHaveAttribute(
      "href",
      "/art/install",
    );
    expect(screen.getByRole("link", { name: "Spark" })).toHaveAttribute(
      "href",
      "/art/install/spark",
    );
  });

  it("drops notches from the page top, then mask-reveals text like nav links", async () => {
    const { container } = await renderBreadcrumbs();

    const notches = container.querySelectorAll(".breadcrumb-notch");
    const masks = container.querySelectorAll(".breadcrumb-text-mask");
    expect(notches).toHaveLength(3);
    expect(masks).toHaveLength(3);

    for (const mask of masks) {
      expect(mask).toHaveClass("overflow-hidden");
    }

    const notchTweens = gsapFromTo.mock.calls.filter(([target]) =>
      (target as HTMLElement).classList.contains("breadcrumb-notch"),
    );
    const maskTweens = gsapFromTo.mock.calls.filter(([target]) =>
      (target as HTMLElement).classList.contains("breadcrumb-text-mask"),
    );

    expect(notchTweens).toHaveLength(3);
    expect(maskTweens).toHaveLength(3);

    notchTweens.forEach(([target, fromVars, toVars], i) => {
      expect(target).toBe(notches[i]);
      expect(fromVars).toEqual({ y: BREADCRUMB_NOTCH_FROM_Y });
      expect(toVars).toMatchObject({
        y: 0,
        duration: NAV_TIMING.growIn,
        delay: i * NAV_TIMING.staggerIn,
      });
    });

    maskTweens.forEach(([target, fromVars, toVars], i) => {
      expect(target).toBe(masks[i]);
      expect(fromVars).toEqual({ width: 0 });
      expect(toVars).toMatchObject({
        width: 80,
        duration: NAV_TIMING.itemIn,
        delay: NAV_TIMING.growIn + i * NAV_TIMING.staggerIn,
      });
    });
  });
});
