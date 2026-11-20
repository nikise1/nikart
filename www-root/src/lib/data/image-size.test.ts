import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { imageSize, slideshowMax, smallestSlide } from "./image-size";

const imgDir = join(__dirname, "../../../../content/img");

describe("imageSize", () => {
  it("reads a JPEG slide and ignores the menu icon when measuring a group", () => {
    const slide = imageSize(readFileSync(join(imgDir, "ibs_5.jpg")));
    const icon = imageSize(readFileSync(join(imgDir, "ibs.jpg")));
    expect(slide).toEqual({ width: 482, height: 362 });
    expect(icon).toEqual({ width: 180, height: 135 });
    expect(slideshowMax(imgDir, "ibs", 8)).toEqual({ width: 482, height: 362 });
  });

  it("keeps the earlier slide when two slides have the same number of pixels", () => {
    expect(
      smallestSlide([
        { width: 20, height: 10 },
        { width: 10, height: 20 },
        { width: 8, height: 8 },
      ]),
    ).toEqual({ width: 8, height: 8 });
    expect(
      smallestSlide([
        { width: 10, height: 20 },
        { width: 20, height: 10 },
      ]),
    ).toEqual({ width: 10, height: 20 });
  });
});
