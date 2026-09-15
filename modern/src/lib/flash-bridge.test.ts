import { describe, it, expect, afterEach, vi } from "vitest";
import { installFlashBridge } from "./flash-bridge";

describe("flash-bridge", () => {
  afterEach(() => {
    delete window.nikart;
    vi.restoreAllMocks();
  });

  it("exposes popWin and doTracker on window.nikart", () => {
    installFlashBridge();

    expect(window.nikart).toBeDefined();
    expect(typeof window.nikart?.popWin).toBe("function");
    expect(typeof window.nikart?.doTracker).toBe("function");
  });

  it("opens static Flash wrappers on the Ruffle vs AwayFL compare page", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    installFlashBridge();

    window.nikart?.popWin(
      "http://static.nikart.co.uk/websites/claro/index.html",
      "claro",
      960,
      700,
      "yes",
      "yes",
      "yes",
    );

    expect(open).toHaveBeenCalledWith(
      "/swf-compare/pieces/claro/index.html",
      "claro",
    );
  });

  it("leaves non-static URLs unchanged", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    installFlashBridge();

    window.nikart?.popWin(
      "http://onedayinmay.co.uk",
      "oneday",
      1200,
      850,
      "yes",
      "yes",
      "yes",
    );

    expect(open.mock.calls[0]?.[0]).toBe("http://onedayinmay.co.uk");
  });
});
