import { describe, expect, it, vi } from "vitest";
import {
  NAV_BUTTON_HIDE_EASE,
  NAV_BUTTON_HIDDEN,
  NAV_BUTTON_SHOW_EASE,
  NAV_BUTTON_SHOWN,
  NAV_POS,
} from "./nav-animations";

vi.mock("@/lib/gsap", () => ({
  gsap: {
    killTweensOf: vi.fn(),
  },
}));

describe("nav button enter/exit", () => {
  it("hides to the same off-screen rest the enter starts from", () => {
    expect(NAV_BUTTON_HIDDEN).toEqual({
      left: NAV_POS.btnOutX,
      top: -NAV_POS.btnHeight,
    });
    expect(NAV_BUTTON_SHOWN).toEqual({ left: 0, top: 0 });
  });

  it("uses the time-reverse ease of the enter tween", () => {
    expect(NAV_BUTTON_SHOW_EASE).toBe("power1.out");
    expect(NAV_BUTTON_HIDE_EASE).toBe("power1.in");
  });
});
