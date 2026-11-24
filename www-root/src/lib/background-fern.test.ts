import { describe, expect, it } from "vitest";
import { BACKGROUND_FERN_COLOR, backgroundFern } from "./background-fern";

describe("backgroundFern", () => {
  it("uses the nav stem brown", () => {
    expect(BACKGROUND_FERN_COLOR).toBe("#4F3E2D");
  });

  it("keeps the coil above the cropped stalk and to the right", () => {
    const [x = 0, y = 0, width = 0, height = 0] = backgroundFern.viewBox.split(" ").map(Number);
    expect(x).toBeLessThan(20);
    expect(y).toBeLessThan(backgroundFern.coilTop + 1);
    expect(width).toBeGreaterThan(180);
    expect(height).toBeGreaterThan(280);
    expect(backgroundFern.coilTop).toBeLessThan(220);
    expect(backgroundFern.coilRight).toBeGreaterThan(200);
    expect(y + height).toBe(528);
  });

  it("draws a closed ribbon plus the pinnae", () => {
    const subpaths = backgroundFern.path.split("M ").filter(Boolean);
    expect(subpaths.length).toBe(1 + 7 * 2 + 3);
    expect(backgroundFern.path.endsWith("Z")).toBe(true);
  });
});
