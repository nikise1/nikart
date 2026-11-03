import { describe, it, expect, afterEach, vi } from "vitest";
import { installFlashBridge } from "./flash-bridge";
import { WEB_TAB_NAME } from "./web-tab";

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
      "../static/games/whiplash/index.html",
      "whiplash",
      550,
      400,
      "yes",
      "yes",
      "yes",
    );

    expect(open).toHaveBeenCalledWith("/swf-compare/whiplash/fill.html", WEB_TAB_NAME);
    expect(open.mock.calls[0]).toHaveLength(2);
  });

  it("opens static Flash wrappers on the fill page", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    installFlashBridge();

    window.nikart?.popWin(
      "http://static.nikart.co.uk/games/whiplash/index.html",
      "whiplash",
      550,
      400,
      "yes",
      "yes",
      "yes",
    );

    expect(open).toHaveBeenCalledWith("/swf-compare/whiplash/fill.html", WEB_TAB_NAME);
  });

  it("opens _self flash and html5 links at the site root", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    installFlashBridge();

    window.nikart?.popWin("../fl", "fl", 750, 500, "yes", "yes", "yes");
    window.nikart?.popWin("../html5", "html5", 1200, 850, "yes", "yes", "yes");
    window.nikart?.popWin("es", "language", 1200, 850, "yes", "yes", "yes");

    expect(open.mock.calls.map((call) => [call[0], call[1], call.length])).toEqual([
      ["/fl", WEB_TAB_NAME, 2],
      ["/html5", WEB_TAB_NAME, 2],
      ["/fl/es", WEB_TAB_NAME, 2],
    ]);
  });

  it("leaves non-static URLs unchanged", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    installFlashBridge();

    window.nikart?.popWin("http://onedayinmay.co.uk", "oneday", 1200, 850, "yes", "yes", "yes");

    expect(open).toHaveBeenCalledWith("http://onedayinmay.co.uk", WEB_TAB_NAME);
    expect(open.mock.calls[0]).toHaveLength(2);
  });
});
