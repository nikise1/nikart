import { afterEach, describe, expect, it, vi } from "vitest";
import { WEB_TAB_NAME, openWebTab } from "./web-tab";

describe("openWebTab", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses one named tab and leaves the opener in place", () => {
    const tab = { opener: window, focus: vi.fn() };
    const open = vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);

    expect(openWebTab("http://onedayinmay.co.uk")).toBe(tab);
    expect(open).toHaveBeenCalledWith("http://onedayinmay.co.uk", WEB_TAB_NAME);
    expect(open.mock.calls[0]).toHaveLength(2);
    expect(tab.opener).toBe(window);
    expect(tab.focus).toHaveBeenCalledOnce();
  });

  it("returns null when the browser blocks the open", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    expect(openWebTab("http://onedayinmay.co.uk")).toBeNull();
  });
});
