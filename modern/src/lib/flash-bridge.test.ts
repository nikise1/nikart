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

  it("opens static Flash wrappers in the AwayFL popup page", () => {
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
      "/fl/away?src=http%3A%2F%2Fstatic.nikart.co.uk%2Fwebsites%2Fclaro%2Findex.html&w=960&h=700&title=claro",
      "claro",
      expect.stringContaining("width=960"),
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
