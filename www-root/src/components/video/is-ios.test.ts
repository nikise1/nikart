import { describe, expect, it } from "vitest";
import { isIos } from "./is-ios";

const desktop = {
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
  platform: "MacIntel",
  maxTouchPoints: 0,
};

describe("isIos", () => {
  it("matches an iPhone", () => {
    expect(
      isIos({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it("matches an iPad and an iPod", () => {
    expect(isIos({ userAgent: "iPad", platform: "iPad", maxTouchPoints: 5 })).toBe(true);
    expect(isIos({ userAgent: "iPod touch", platform: "iPod", maxTouchPoints: 5 })).toBe(true);
  });

  it("matches iPadOS Safari in desktop mode", () => {
    expect(isIos({ ...desktop, maxTouchPoints: 5 })).toBe(true);
  });

  it("does not match a desktop Mac or Android", () => {
    expect(isIos(desktop)).toBe(false);
    expect(
      isIos({
        userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      }),
    ).toBe(false);
  });
});
