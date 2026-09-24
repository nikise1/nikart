import { describe, expect, it } from "vitest";
import { originStaticUrl } from "./static-origin";

describe("originStaticUrl", () => {
  it("builds an origin URL for a movie path", () => {
    expect(originStaticUrl(["games", "weeds", "weeds.swf"])).toBe(
      "http://static.nikart.co.uk/games/weeds/weeds.swf",
    );
  });

  it("rejects empty or parent-directory segments", () => {
    expect(originStaticUrl([])).toBeNull();
    expect(originStaticUrl(["games", "..", "weeds.swf"])).toBeNull();
    expect(originStaticUrl(["games", "", "weeds.swf"])).toBeNull();
  });
});
