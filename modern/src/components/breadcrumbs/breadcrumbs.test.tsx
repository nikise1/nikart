import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NAV_TIMING } from "@/lib/nav-timing";
import { resetBreadcrumbStore, useBreadcrumbStore } from "@/store/breadcrumb-store";
import {
  BREADCRUMB_MASK_CLIP_HIDDEN,
  BREADCRUMB_MASK_CLIP_SHOWN,
  BREADCRUMB_NOTCH_FROM_Y,
  BREADCRUMB_NOTCH_TO_Y,
  BREADCRUMB_TEXT_IN,
} from "./use-breadcrumb-animator";
import { Breadcrumbs } from "./breadcrumbs";

const gsapFromTo = vi.hoisted(() => vi.fn());
const gsapSet = vi.hoisted(() => vi.fn());
const gsapKill = vi.hoisted(() => vi.fn());
let pathname = "/en/art/install/spark";
let navPhase = "closed";

vi.mock("@/lib/gsap", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    gsap: {
      fromTo: gsapFromTo,
      set: gsapSet,
      killTweensOf: gsapKill,
    },
    useGSAP: (callback: () => void, config?: { dependencies?: unknown[] }) => {
      /* eslint-disable react-hooks/exhaustive-deps -- test mock of useGSAP */
      React.useLayoutEffect(() => {
        callback();
      }, config?.dependencies);
      /* eslint-enable react-hooks/exhaustive-deps */
    },
  };
});

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

async function flushAnimation() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function renderBreadcrumbs() {
  const view = render(<Breadcrumbs locale="en" />);
  await flushAnimation();
  return view;
}

describe("Breadcrumbs", () => {
  beforeEach(() => {
    pathname = "/en/art/install/spark";
    navPhase = "closed";
    resetBreadcrumbStore();
    gsapFromTo.mockClear();
    gsapSet.mockClear();
    gsapKill.mockClear();
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

  it("drops notches from the page top, then clip-reveals only on first mount", async () => {
    const { container } = await renderBreadcrumbs();

    const notches = container.querySelectorAll(".breadcrumb-notch");
    const masks = container.querySelectorAll(".breadcrumb-text-mask");
    expect(notches).toHaveLength(3);
    expect(masks).toHaveLength(3);

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
        y: BREADCRUMB_NOTCH_TO_Y,
        duration: NAV_TIMING.growIn,
        delay: i * NAV_TIMING.staggerIn,
      });
    });

    maskTweens.forEach(([target, fromVars, toVars], i) => {
      expect(target).toBe(masks[i]);
      expect(fromVars).toEqual({ clipPath: BREADCRUMB_MASK_CLIP_HIDDEN });
      expect(toVars).toMatchObject({
        clipPath: BREADCRUMB_MASK_CLIP_SHOWN,
        duration: BREADCRUMB_TEXT_IN,
        delay: NAV_TIMING.growIn + i * NAV_TIMING.staggerIn,
      });
    });
  });

  it("masks out then lifts only removed crumbs when the trail shortens", async () => {
    const { container, rerender } = await renderBreadcrumbs();
    gsapFromTo.mockClear();
    gsapSet.mockClear();

    pathname = "/en/art/install";
    rerender(<Breadcrumbs locale="en" />);
    await flushAnimation();

    const spark = [...container.querySelectorAll(".breadcrumb-container")].find(
      (el) => el.querySelector(".breadcrumb-link")?.textContent === "Spark",
    );
    expect(spark).toHaveAttribute("data-breadcrumb-phase", "exiting");

    const sparkNotch = spark?.querySelector(".breadcrumb-notch");
    const sparkMask = spark?.querySelector(".breadcrumb-text-mask");

    const notchTweens = gsapFromTo.mock.calls.filter(([target]) =>
      (target as HTMLElement).classList.contains("breadcrumb-notch"),
    );
    const maskTweens = gsapFromTo.mock.calls.filter(([target]) =>
      (target as HTMLElement).classList.contains("breadcrumb-text-mask"),
    );

    expect(notchTweens).toHaveLength(1);
    expect(maskTweens).toHaveLength(1);
    expect(maskTweens[0]?.[0]).toBe(sparkMask);
    expect(maskTweens[0]?.[1]).toEqual({ clipPath: BREADCRUMB_MASK_CLIP_SHOWN });
    expect(maskTweens[0]?.[2]).toMatchObject({
      clipPath: BREADCRUMB_MASK_CLIP_HIDDEN,
      duration: BREADCRUMB_TEXT_IN,
      delay: 0,
    });
    expect(notchTweens[0]?.[0]).toBe(sparkNotch);
    expect(notchTweens[0]?.[1]).toEqual({ y: BREADCRUMB_NOTCH_TO_Y });
    expect(notchTweens[0]?.[2]).toMatchObject({
      y: BREADCRUMB_NOTCH_FROM_Y,
      duration: NAV_TIMING.growIn,
      delay: BREADCRUMB_TEXT_IN,
    });
  });

  it("animates only the newly appended crumb when drilling down", async () => {
    pathname = "/en/art/install";
    const { container, rerender } = await renderBreadcrumbs();
    gsapFromTo.mockClear();

    pathname = "/en/art/install/spark";
    rerender(<Breadcrumbs locale="en" />);
    await flushAnimation();

    const spark = [...container.querySelectorAll(".breadcrumb-container")].find(
      (el) => el.querySelector(".breadcrumb-link")?.textContent === "Spark",
    );
    expect(spark).toHaveAttribute("data-breadcrumb-phase", "entering");

    const sparkNotch = spark?.querySelector(".breadcrumb-notch");
    const sparkMask = spark?.querySelector(".breadcrumb-text-mask");

    const notchTweens = gsapFromTo.mock.calls.filter(([target]) =>
      (target as HTMLElement).classList.contains("breadcrumb-notch"),
    );
    const maskTweens = gsapFromTo.mock.calls.filter(([target]) =>
      (target as HTMLElement).classList.contains("breadcrumb-text-mask"),
    );

    expect(notchTweens).toHaveLength(1);
    expect(maskTweens).toHaveLength(1);
    expect(notchTweens[0]?.[0]).toBe(sparkNotch);
    expect(maskTweens[0]?.[0]).toBe(sparkMask);
    expect(maskTweens[0]?.[2]).toMatchObject({ duration: BREADCRUMB_TEXT_IN });
  });

  it("does not replay the whole trail after a remount of the same path", async () => {
    const { unmount } = await renderBreadcrumbs();
    act(() => {
      useBreadcrumbStore.getState().onEntersComplete();
    });
    unmount();
    gsapFromTo.mockClear();
    gsapSet.mockClear();

    const { container } = await renderBreadcrumbs();
    const phases = [...container.querySelectorAll(".breadcrumb-container")].map(
      (el) => el.getAttribute("data-breadcrumb-phase"),
    );
    expect(phases).toEqual(["present", "present", "present"]);
    expect(gsapFromTo).not.toHaveBeenCalled();
    expect(gsapSet).toHaveBeenCalled();
  });

  it("exits only the dropped crumb after a remount onto a shorter path", async () => {
    const { unmount } = await renderBreadcrumbs();
    act(() => {
      useBreadcrumbStore.getState().onEntersComplete();
    });
    unmount();
    gsapFromTo.mockClear();

    pathname = "/en/art/install";
    const { container } = await renderBreadcrumbs();

    const spark = [...container.querySelectorAll(".breadcrumb-container")].find(
      (el) => el.querySelector(".breadcrumb-link")?.textContent === "Spark",
    );
    expect(spark).toHaveAttribute("data-breadcrumb-phase", "exiting");

    const notchTweens = gsapFromTo.mock.calls.filter(([target]) =>
      (target as HTMLElement).classList.contains("breadcrumb-notch"),
    );
    const maskTweens = gsapFromTo.mock.calls.filter(([target]) =>
      (target as HTMLElement).classList.contains("breadcrumb-text-mask"),
    );
    expect(notchTweens).toHaveLength(1);
    expect(maskTweens).toHaveLength(1);
    expect(maskTweens[0]?.[2]).toMatchObject({
      clipPath: BREADCRUMB_MASK_CLIP_HIDDEN,
      duration: BREADCRUMB_TEXT_IN,
    });
    expect(notchTweens[0]?.[2]).toMatchObject({
      y: BREADCRUMB_NOTCH_FROM_Y,
      delay: BREADCRUMB_TEXT_IN,
    });
  });
});
