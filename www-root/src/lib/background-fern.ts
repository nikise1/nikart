/**
 * A second fern for the page background: the fiddlehead from the corner
 * photo, drawn as the same flat ribbon as the nav stem (`#4F3E2D`).
 * The stalk runs off the bottom of the view box so it meets the corner
 * the way the nav stem meets the top edge.
 */

interface Pt {
  x: number;
  y: number;
}

const STALK_P0 = { x: 18, y: 560 };
const STALK_P1 = { x: 36, y: 420 };
const STALK_P2 = { x: 78, y: 300 };
const STALK_P3 = { x: 168, y: 188 };
const STALK_STEPS = 120;

/** Spiral continues clockwise from the stalk tip and tightens. */
const SPIRAL_RADIUS = 52;
const SPIRAL_TURNS = 3.4;
const SPIRAL_DECAY = 0.16;
const SPIRAL_STEP = 0.04;

/** Where the view box cuts the stalk, so the base leaves the corner. */
const CROP_BOTTOM = 528;

export const BACKGROUND_FERN_COLOR = "#4F3E2D";

interface Sample {
  x: number;
  y: number;
  heading: number;
  along: number;
}

function cubic(t: number): Pt {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * STALK_P0.x + b * STALK_P1.x + c * STALK_P2.x + d * STALK_P3.x,
    y: a * STALK_P0.y + b * STALK_P1.y + c * STALK_P2.y + d * STALK_P3.y,
  };
}

function cubicHeading(t: number): number {
  const mt = 1 - t;
  const dx =
    3 * mt * mt * (STALK_P1.x - STALK_P0.x) +
    6 * mt * t * (STALK_P2.x - STALK_P1.x) +
    3 * t * t * (STALK_P3.x - STALK_P2.x);
  const dy =
    3 * mt * mt * (STALK_P1.y - STALK_P0.y) +
    6 * mt * t * (STALK_P2.y - STALK_P1.y) +
    3 * t * t * (STALK_P3.y - STALK_P2.y);
  return Math.atan2(dy, dx);
}

function halfWidth(along: number): number {
  return 14 * (1 - along) ** 1.2 + 2.2;
}

function buildSamples(): Sample[] {
  const samples: Sample[] = [];
  for (let index = 0; index <= STALK_STEPS; index += 1) {
    const t = index / STALK_STEPS;
    const point = cubic(t);
    samples.push({
      x: point.x,
      y: point.y,
      heading: cubicHeading(t),
      along: t * 0.58,
    });
  }

  const tip = samples[samples.length - 1];
  if (!tip) return samples;
  let x = tip.x;
  let y = tip.y;
  let heading = tip.heading;
  let radius = SPIRAL_RADIUS;
  let theta = 0;
  const limit = Math.PI * SPIRAL_TURNS;
  const spiral: Sample[] = [];
  while (theta < limit && radius > 4) {
    spiral.push({ x, y, heading, along: 0 });
    heading += SPIRAL_STEP;
    const step = radius * SPIRAL_STEP;
    x += Math.cos(heading) * step;
    y += Math.sin(heading) * step;
    radius *= Math.exp(-SPIRAL_DECAY * SPIRAL_STEP);
    theta += SPIRAL_STEP;
  }
  const last = spiral.length - 1;
  for (let index = 0; index < spiral.length; index += 1) {
    const sample = spiral[index];
    if (!sample) continue;
    sample.along = 0.58 + 0.42 * (last === 0 ? 1 : index / last);
    samples.push(sample);
  }
  return samples;
}

function ribbon(samples: readonly Sample[]): Pt[] {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (const sample of samples) {
    const width = halfWidth(sample.along);
    const nx = -Math.sin(sample.heading);
    const ny = Math.cos(sample.heading);
    left.push({ x: sample.x + nx * width, y: sample.y + ny * width });
    right.push({ x: sample.x - nx * width, y: sample.y - ny * width });
  }
  const tip = samples[samples.length - 1];
  if (!tip) return left;
  const width = halfWidth(tip.along);
  const tx = Math.cos(tip.heading);
  const ty = Math.sin(tip.heading);
  const nx = -Math.sin(tip.heading);
  const ny = Math.cos(tip.heading);
  const cap: Pt[] = [];
  for (let index = 1; index < 10; index += 1) {
    const angle = (Math.PI * index) / 10;
    cap.push({
      x: tip.x + tx * width * Math.sin(angle) + nx * width * Math.cos(angle),
      y: tip.y + ty * width * Math.sin(angle) + ny * width * Math.cos(angle),
    });
  }
  right.reverse();
  return [...left, ...cap, ...right];
}

function quadratic(a: Pt, control: Pt, b: Pt, steps: number): Pt[] {
  const points: Pt[] = [];
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    const u = 1 - t;
    points.push({
      x: u * u * a.x + 2 * u * t * control.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * control.y + t * t * b.y,
    });
  }
  return points;
}

/** One pinna. `side` 1 sits on the inside of the curl; -1 is the outer side. */
function pinna(sample: Sample, side: number, length: number): Pt[] {
  const tx = Math.cos(sample.heading);
  const ty = Math.sin(sample.heading);
  const nx = -Math.sin(sample.heading) * side;
  const ny = Math.cos(sample.heading) * side;
  const width = length * 0.46;
  const base: Pt = { x: sample.x - tx * width * 0.25, y: sample.y - ty * width * 0.25 };
  const root: Pt = { x: sample.x + tx * width * 0.7, y: sample.y + ty * width * 0.7 };
  const tip: Pt = {
    x: sample.x + nx * length + tx * length * 0.22,
    y: sample.y + ny * length + ty * length * 0.22,
  };
  const left: Pt = {
    x: sample.x + nx * length * 0.55 - tx * width * 0.55,
    y: sample.y + ny * length * 0.55 - ty * width * 0.55,
  };
  const right: Pt = {
    x: sample.x + nx * length * 0.5 + tx * width * 0.85,
    y: sample.y + ny * length * 0.5 + ty * width * 0.85,
  };
  return [...quadratic(base, left, tip, 6), ...quadratic(tip, right, root, 6)];
}

function buildPinnae(stalk: readonly Sample[], spiral: readonly Sample[]): Pt[][] {
  const pinnae: Pt[][] = [];
  const count = 7;
  for (let index = 0; index < count; index += 1) {
    const t = 0.4 + 0.52 * (index / (count - 1));
    const at = Math.min(STALK_STEPS, Math.round(t * STALK_STEPS));
    const outer = stalk[at];
    const inner = stalk[Math.min(STALK_STEPS, at + 6)];
    if (!outer || !inner) continue;
    const fade = (1 - (t - 0.4) / 0.62) ** 0.7;
    pinnae.push(pinna(outer, -1, 36 * fade + 10));
    pinnae.push(pinna(inner, 1, 24 * fade + 7));
  }
  for (const [index, fraction] of [0.08, 0.16, 0.24].entries()) {
    const sample = spiral[Math.round(fraction * (spiral.length - 1))];
    if (!sample) continue;
    pinnae.push(pinna(sample, index % 2 === 0 ? -1 : 1, 14 - index * 3));
  }
  return pinnae;
}

function pathOf(points: readonly Pt[]): string {
  const first = points[0];
  if (!first) return "";
  const commands = [`M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`];
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (point) commands.push(`L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`);
  }
  commands.push("Z");
  return commands.join(" ");
}

export interface BackgroundFernDrawing {
  viewBox: string;
  path: string;
  /** Top of the coil, in view-box units. The stalk base is below the crop. */
  coilTop: number;
  coilRight: number;
}

function draw(): BackgroundFernDrawing {
  const samples = buildSamples();
  const stalkCount = STALK_STEPS + 1;
  const stalk = samples.slice(0, stalkCount);
  const spiral = samples.slice(stalkCount);
  const loops = [ribbon(samples), ...buildPinnae(stalk, spiral)];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  for (const loop of loops) {
    for (const point of loop) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
    }
  }
  const x = Math.floor(minX - 8);
  const y = Math.floor(minY - 12);
  const width = Math.ceil(maxX + 18 - x);
  const height = CROP_BOTTOM - y;
  return {
    viewBox: `${x} ${y} ${width} ${height}`,
    path: loops.map(pathOf).join(" "),
    coilTop: minY,
    coilRight: maxX,
  };
}

export const backgroundFern: BackgroundFernDrawing = draw();
