import { useRef } from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NAV_TIMING } from "@/lib/nav-timing";
import {
  NAV_BUTTON_HIDE_EASE,
  NAV_BUTTON_HIDDEN,
  NAV_BUTTON_SHOW_EASE,
  NAV_BUTTON_SHOWN,
  NAV_POS,
} from "@/lib/nav-animations";
import { useNavStore } from "@/store/nav-store";
import type { NavPhase } from "@/store/nav-types";
import { useNavAnimator } from "./use-nav-animator";

const gsapTo = vi.hoisted(() => vi.fn());
const gsapFromTo = vi.hoisted(() => vi.fn());
const gsapSet = vi.hoisted(() => vi.fn());
const gsapDelayedCall = vi.hoisted(() => vi.fn());
const gsapKill = vi.hoisted(() => vi.fn());

vi.mock("@/lib/gsap", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    gsap: {
      to: gsapTo,
      fromTo: gsapFromTo,
      set: gsapSet,
      delayedCall: gsapDelayedCall,
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

function Harness({ phase, revealButton }: { phase: NavPhase; revealButton: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useNavAnimator({
    containerRef,
    phase,
    numItems: 0,
    items: [],
    revealButton,
  });
  return (
    <div ref={containerRef}>
      <canvas data-component="NavCanvas" />
      <button data-component="NavButton" type="button">
        Menu
      </button>
      <ul data-component="NavItems" />
    </div>
  );
}

describe("useNavAnimator", () => {
  beforeEach(() => {
    gsapTo.mockReset();
    gsapFromTo.mockReset();
    gsapSet.mockReset();
    gsapDelayedCall.mockReset();
    gsapKill.mockReset();
    useNavStore.setState({
      navOpen: false,
      navPhase: "closed",
      navReady: true,
      pendingRoute: null,
      startupPendingOpen: false,
      pendingOpenAfterClose: false,
      buttonParked: true,
    });
  });

  it("reverses the back-button enter tween and does not start the canvas yet", () => {
    render(<Harness phase="hiding-button" revealButton={false} />);

    expect(gsapTo).toHaveBeenCalledTimes(1);
    const [target, vars] = gsapTo.mock.calls[0] as [HTMLElement, Record<string, unknown>];
    expect(target.getAttribute("data-component")).toBe("NavButton");
    expect(vars).toEqual(
      expect.objectContaining({
        ...NAV_BUTTON_HIDDEN,
        duration: NAV_TIMING.growIn,
        ease: NAV_BUTTON_HIDE_EASE,
      }),
    );
    expect(gsapFromTo).not.toHaveBeenCalled();
  });

  it("animates NavCanvas in only after the hiding-button phase", () => {
    render(<Harness phase="opening" revealButton={false} />);

    const canvasTweens = gsapFromTo.mock.calls.filter(
      ([target]) => (target as HTMLElement).getAttribute?.("data-component") === "NavCanvas",
    );
    expect(canvasTweens).toHaveLength(1);
    expect(canvasTweens[0]?.[1]).toEqual({
      left: NAV_POS.canvasOutX,
      top: NAV_POS.canvasOutY,
    });
    expect(canvasTweens[0]?.[2]).toEqual(
      expect.objectContaining({
        left: 0,
        top: 0,
        duration: NAV_TIMING.growIn,
      }),
    );
    expect(canvasTweens[0]?.[2]).not.toEqual(expect.objectContaining({ delay: expect.anything() }));

    const buttonTweens = gsapTo.mock.calls.filter(
      ([target]) => (target as HTMLElement).getAttribute?.("data-component") === "NavButton",
    );
    expect(buttonTweens).toHaveLength(0);
  });

  it("enters the back button from the hidden rest with the show ease", () => {
    render(<Harness phase="closing-canvas" revealButton />);

    const buttonTweens = gsapFromTo.mock.calls.filter(
      ([target]) => (target as HTMLElement).getAttribute?.("data-component") === "NavButton",
    );
    expect(buttonTweens).toHaveLength(1);
    expect(buttonTweens[0]?.[1]).toEqual(NAV_BUTTON_HIDDEN);
    expect(buttonTweens[0]?.[2]).toEqual(
      expect.objectContaining({
        ...NAV_BUTTON_SHOWN,
        duration: NAV_TIMING.growIn,
        ease: NAV_BUTTON_SHOW_EASE,
      }),
    );
  });

  it("opens the menu after the reverse-exit onComplete", () => {
    render(<Harness phase="hiding-button" revealButton={false} />);
    const vars = gsapTo.mock.calls[0]?.[1] as { onComplete?: () => void };

    act(() => {
      useNavStore.setState({ navPhase: "hiding-button" });
      vars.onComplete?.();
    });

    expect(useNavStore.getState().navPhase).toBe("opening");
    expect(useNavStore.getState().buttonParked).toBe(false);
  });
});
