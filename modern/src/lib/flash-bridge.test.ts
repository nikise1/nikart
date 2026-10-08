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

  it("opens dev ../static wrappers on the fill page", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    installFlashBridge();

    window.nikart?.popWin(
      "../static/websites/claro/index.html",
      "claro",
      960,
      700,
      "yes",
      "yes",
      "yes",
    );

    expect(open).toHaveBeenCalledWith("/swf-compare/claro/fill.html", "claro");
  });

  it("opens static Flash wrappers on the fill page", () => {
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

    expect(open).toHaveBeenCalledWith("/swf-compare/claro/fill.html", "claro");
  });

  it("opens _self flash and html5 links at the site root", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    installFlashBridge();

    window.nikart?.popWin("../fl", "fl", 750, 500, "yes", "yes", "yes");
    window.nikart?.popWin("../html5", "html5", 1200, 850, "yes", "yes", "yes");
    window.nikart?.popWin("es", "language", 1200, 850, "yes", "yes", "yes");

    expect(open.mock.calls.map((call) => call[0])).toEqual(["/fl", "/html5", "/fl/es"]);
  });

  it("leaves non-static URLs unchanged", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    installFlashBridge();

    window.nikart?.popWin("http://onedayinmay.co.uk", "oneday", 1200, 850, "yes", "yes", "yes");

    expect(open.mock.calls[0]?.[0]).toBe("http://onedayinmay.co.uk");
  });
});
