import { describe, it, expect, afterEach } from "vitest";
import { installFlashBridge } from "./flash-bridge";

describe("flash-bridge", () => {
  afterEach(() => {
    delete window.nikart;
  });

  it("exposes popWin and doTracker on window.nikart", () => {
    installFlashBridge();

    expect(window.nikart).toBeDefined();
    expect(typeof window.nikart?.popWin).toBe("function");
    expect(typeof window.nikart?.doTracker).toBe("function");
  });
});
