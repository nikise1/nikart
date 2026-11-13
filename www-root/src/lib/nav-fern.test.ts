import { describe, expect, it } from "vitest";
import { burgerLineAlpha, navFernLoop, navFernSpine } from "./nav-fern";

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

function chord(progress: number, from: number, to: number): number {
  const spine = navFernSpine(progress);
  const a = spine[Math.round((spine.length - 1) * from)];
  const b = spine[Math.round((spine.length - 1) * to)];
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe("navFernLoop", () => {
  it("starts as a corner spiral and ends as the long stem", () => {
    const closed = bounds(0);
    const open = bounds(1);

    expect(closed.maxX).toBeGreaterThan(45);
    expect(closed.maxX).toBeLessThan(80);
    expect(closed.maxY).toBeGreaterThan(40);
    expect(closed.maxY).toBeLessThan(72);
    expect(closed.minX).toBeGreaterThan(-12);
    expect(closed.minY).toBeGreaterThan(-12);

    expect(open.maxY).toBeGreaterThan(250);
    expect(open.maxX).toBeGreaterThan(100);
    expect(open.maxX).toBeLessThan(130);
  });

  it("unwraps downward and stays inside the canvas", () => {
    const ys = [0, 0.25, 0.5, 0.75, 1].map((progress) => bounds(progress).maxY);
    for (let index = 1; index < ys.length; index += 1) {
      expect(ys[index]).toBeGreaterThan((ys[index - 1] ?? 0) + 20);
    }
    for (const progress of [0.2, 0.45, 0.7, 1]) {
      const box = bounds(progress);
      expect(box.minX).toBeGreaterThanOrEqual(-1);
      expect(box.minY).toBeGreaterThanOrEqual(-1);
      expect(box.maxX).toBeLessThan(130);
      expect(box.maxY).toBeLessThan(262);
    }
  });

  it("lays unwrapped length on the open stem and keeps the coil rigid", () => {
    const open = navFernSpine(1);
    const mid = navFernSpine(0.55);
    const coiled = navFernSpine(0);
    const laid = Math.round((open.length - 1) * 0.4);

    expect(mid[0]?.x).toBeCloseTo(10, 0);
    expect(mid[0]?.y).toBeCloseTo(0, 0);
    expect(coiled[0]?.x).toBeCloseTo(10, 0);
    expect(mid[laid]?.x).toBeCloseTo(open[laid]?.x ?? 0, 0);
    expect(mid[laid]?.y).toBeCloseTo(open[laid]?.y ?? 0, 0);

    const closedChord = chord(0, 0.45, 1);
    const midChord = chord(0.4, 0.45, 1);
    expect(midChord).toBeCloseTo(closedChord, 0);
    expect(closedChord).toBeGreaterThan(8);
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
