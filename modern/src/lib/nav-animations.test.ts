import { describe, expect, it, vi } from "vitest";
import { NAV_POS, tweenNavButtonExit } from "./nav-animations";
import { NAV_TIMING } from "./nav-timing";

const gsapFromTo = vi.hoisted(() => vi.fn());
const gsapKill = vi.hoisted(() => vi.fn());

vi.mock("@/lib/gsap", () => ({
  gsap: {
    fromTo: gsapFromTo,
    killTweensOf: gsapKill,
  },
}));

describe("tweenNavButtonExit", () => {
  it("reverses the enter tween (off-screen rest + power1.in)", () => {
    const button = document.createElement("button");
    const onComplete = vi.fn();

    tweenNavButtonExit(button, onComplete);

    expect(gsapKill).toHaveBeenCalledWith(button);
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
});
