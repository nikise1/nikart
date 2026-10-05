import { describe, expect, it, vi } from "vitest";
import { isNavButtonBusy, NAV_POS, tweenNavButtonExit } from "./nav-animations";
import { NAV_TIMING } from "./nav-timing";

const gsapFromTo = vi.hoisted(() => vi.fn());
const gsapIsTweening = vi.hoisted(() => vi.fn(() => false));

vi.mock("@/lib/gsap", () => ({
  gsap: {
    fromTo: gsapFromTo,
    isTweening: gsapIsTweening,
  },
}));

describe("tweenNavButtonExit", () => {
  it("reverses the enter tween (off-screen rest + power1.in)", () => {
    const button = document.createElement("button");
    const onComplete = vi.fn();

    expect(tweenNavButtonExit(button, onComplete)).toBe(true);
    expect(button.style.pointerEvents).toBe("none");
    expect(gsapFromTo).toHaveBeenCalledWith(
      button,
      { left: 0, top: 0 },
      expect.objectContaining({
        left: NAV_POS.btnOutX,
        top: -NAV_POS.btnHeight,
        duration: NAV_TIMING.growIn,
        ease: "power1.in",
      }),
    );

    const vars = gsapFromTo.mock.calls[0]?.[2] as { onComplete?: () => void };
    vars.onComplete?.();
    expect(button.style.display).toBe("none");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not start a second exit while the reverse tween is running", () => {
    gsapFromTo.mockClear();
    gsapIsTweening.mockReturnValue(true);
    const button = document.createElement("button");

    expect(isNavButtonBusy(button)).toBe(true);
    expect(tweenNavButtonExit(button)).toBe(false);
    expect(gsapFromTo).not.toHaveBeenCalled();
  });

  it("allows another exit after the previous tween has finished", () => {
    gsapFromTo.mockClear();
    gsapIsTweening.mockReturnValue(false);
    const button = document.createElement("button");

    expect(tweenNavButtonExit(button)).toBe(true);
    expect(gsapFromTo).toHaveBeenCalledTimes(1);
  });
});
