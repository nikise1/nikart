import { describe, expect, it } from "vitest";
import { burgerLineAlpha, navFernLoop } from "./nav-fern";

function bounds(progress: number): { maxX: number; maxY: number; minX: number; minY: number } {
  const loop = navFernLoop(progress);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pt of loop) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }
  return { minX, minY, maxX, maxY };
}

describe("navFernLoop", () => {
  it("starts as the corner curl and ends as the long stem", () => {
    const closed = bounds(0);
    const open = bounds(1);

    expect(closed.minX).toBeGreaterThanOrEqual(-1);
    expect(closed.minY).toBeGreaterThanOrEqual(-1);
    expect(closed.maxX).toBeLessThan(90);
    expect(closed.maxY).toBeLessThan(60);

    expect(open.maxY).toBeGreaterThan(250);
    expect(open.maxX).toBeGreaterThan(100);
    expect(open.maxX).toBeLessThan(130);
  });

  it("grows downward while the tip stays coiled", () => {
    const early = bounds(0.2).maxY;
    const mid = bounds(0.55).maxY;
    const open = bounds(1).maxY;

    expect(early).toBeLessThan(90);
    expect(mid).toBeGreaterThan(early + 40);
    expect(open).toBeGreaterThan(mid);
  });

  it("keeps the base attached to the top-left corner", () => {
    for (const progress of [0, 0.35, 0.7, 1]) {
      const root = navFernLoop(progress)[0];
      expect(root?.x).toBeCloseTo(0, 0);
      expect(root?.y).toBeCloseTo(0, 0);
    }
  });
});

describe("burgerLineAlpha", () => {
  it("fades the bars out before the coil leaves", () => {
    expect(burgerLineAlpha(0)).toBe(1);
    expect(burgerLineAlpha(0.15)).toBeGreaterThan(0);
    expect(burgerLineAlpha(0.15)).toBeLessThan(1);
    expect(burgerLineAlpha(0.3)).toBe(0);
    expect(burgerLineAlpha(1)).toBe(0);
  });
});
