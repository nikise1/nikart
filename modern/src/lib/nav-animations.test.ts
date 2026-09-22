import { describe, expect, it, vi } from "vitest";
import { isNavButtonOnScreen, NAV_POS } from "./nav-animations";

vi.mock("@/lib/gsap", () => ({
  gsap: {
    getProperty: (el: HTMLElement, prop: string) => {
      const value = el.style[prop as keyof CSSStyleDeclaration];
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : value;
      }
      return value;
    },
    killTweensOf: vi.fn(),
  },
}));

function makeButton(style: Partial<CSSStyleDeclaration>): HTMLButtonElement {
  const button = document.createElement("button");
  Object.assign(button.style, style);
  return button;
}

describe("isNavButtonOnScreen", () => {
  it("is false when the button is display:none", () => {
    const button = makeButton({
      display: "none",
      top: "0px",
      left: "0px",
    });
    expect(isNavButtonOnScreen(button)).toBe(false);
  });

  it("is true when the button is parked at the home-curl rest position", () => {
    const button = makeButton({
      display: "block",
      top: "0px",
      left: "0px",
    });
    expect(isNavButtonOnScreen(button)).toBe(true);
  });

  it("is false when the button is parked fully off the top", () => {
    const button = makeButton({
      display: "block",
      top: `${-NAV_POS.btnHeight}px`,
      left: `${NAV_POS.btnOutX}px`,
    });
    expect(isNavButtonOnScreen(button)).toBe(false);
  });
});
