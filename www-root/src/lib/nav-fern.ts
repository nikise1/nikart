/**
 * The closed curl and the open stem are the same ribbon.
 * Closed, it matches the original corner button: a short tail from the
 * corner into one round head, with the rest of the ribbon wound inside
 * that head, with a gap between the outer wall and the inner turn. The
 * gap is a hair at the top of the head and wider along the bottom.
 * Opening pays arc length out along the real stem and leaves the
 * remainder as that coil, joined on the same tangent.
 * At rest the open stem is the legacy bezier, including its tip hook.
 */

interface Pt {
  x: number;
  y: number;
}

interface Edge {
  total: number;
  at: (distance: number) => Pt;
}

interface StemSample {
  s: number;
  x: number;
  y: number;
  heading: number;
  lt: number;
  ln: number;
  rt: number;
  rn: number;
}

interface SpiralSample {
  s: number;
  x: number;
  y: number;
  heading: number;
}

const STEM_X = 110;
const STEM_Y = 258;
const STEM_TOP = 20;
const HOOK = 3.5;

/**
 * Closed crozier, matched to the original 90×60 button.
 * Curvature stays near the stem's through the tail, rises into one
 * round head, holds that turn, then tightens. The radius falls slower
 * than the ribbon is wide, so each turn overlaps the last and the tip
 * winds inside itself, closing the eye. Negative winds it into the corner.
 */
const CROZIER_K0 = 0.003;
const CROZIER_BEND = 0.1;
const CROZIER_LOOP = 0.24;
const CROZIER_K = 0.055;
const CROZIER_HOLD = 0.7;
/** How much radius (px) each inner turn gives up. Kept under the ribbon width. */
const CROZIER_DROP = 7;
const WIND = -1;
/** No extra twist: the crozier already sits in the corner. */
const SEAT = 0;
/** Length over which a resting twist would ease in. */
const SEAT_BLEND = 42;

const STEM_STEPS = 480;
const SPIRAL_STEPS = 700;
const RIBBON_SAMPLES = 220;

const BURGER_FADE = 0.3;
const BAR_W = 24;
const BAR_H = 4;
const BAR_GAP = 3;

const STEM_COLOR = "#4F3E2D";
const BURGER_REST = "#94B864";
const BURGER_HOVER = "#A8682B";

export interface NavFernDrawOptions {
  hovered?: boolean;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

function sampleEdge(pointAt: (t: number) => Pt): Edge {
  const raw: Pt[] = [];
  for (let index = 0; index <= STEM_STEPS; index += 1) raw.push(pointAt(index / STEM_STEPS));
  const lengths = [0];
  for (let index = 1; index < raw.length; index += 1) {
    const prev = raw[index - 1];
    const current = raw[index];
    if (!prev || !current) break;
    lengths.push((lengths[index - 1] ?? 0) + Math.hypot(current.x - prev.x, current.y - prev.y));
  }
  const total = lengths[lengths.length - 1] ?? 0;
  return {
    total,
    at(distance: number): Pt {
      const d = Math.max(0, Math.min(total, distance));
      let index = 1;
      while (index < lengths.length - 1 && (lengths[index] ?? 0) < d) index += 1;
      const start = lengths[index - 1] ?? 0;
      const end = lengths[index] ?? start;
      const span = end - start || 1;
      const t = Math.min(1, Math.max(0, (d - start) / span));
      const a = raw[index - 1];
      const b = raw[index];
      if (!a || !b) return { x: 0, y: 0 };
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    },
  };
}

function buildStem(): { samples: StemSample[]; length: number } {
  const left0 = { x: 0, y: 0 };
  const left1 = { x: 60, y: 83 };
  const left2 = { x: 82, y: 167 };
  const left3 = { x: STEM_X - HOOK, y: STEM_Y - HOOK };
  const right0 = { x: STEM_TOP, y: 0 };
  const right1 = { x: 70, y: 83 };
  const right2 = { x: 92, y: 167 };
  const right3 = { x: STEM_X + HOOK, y: STEM_Y - HOOK };
  const leftEdge = sampleEdge((t) => cubic(left0, left1, left2, left3, t));
  const rightEdge = sampleEdge((t) => cubic(right0, right1, right2, right3, t));

  const count = 360;
  const mids: { x: number; y: number; left: Pt; right: Pt }[] = [];
  for (let index = 0; index <= count; index += 1) {
    const fraction = index / count;
    const left = leftEdge.at(leftEdge.total * fraction);
    const right = rightEdge.at(rightEdge.total * fraction);
    mids.push({
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2,
      left,
      right,
    });
  }

  const centerLengths = [0];
  for (let index = 1; index < mids.length; index += 1) {
    const prev = mids[index - 1];
    const current = mids[index];
    if (!prev || !current) break;
    centerLengths.push(
      (centerLengths[index - 1] ?? 0) + Math.hypot(current.x - prev.x, current.y - prev.y),
    );
  }
  const length = centerLengths[centerLengths.length - 1] ?? 0;

  const samples: StemSample[] = [];
  let heading = 0;
  for (let index = 0; index <= count; index += 1) {
    const current = mids[index];
    const prev = mids[Math.max(0, index - 1)];
    const next = mids[Math.min(count, index + 1)];
    if (!current || !prev || !next) continue;
    let angle = Math.atan2(next.y - prev.y, next.x - prev.x);
    if (index > 0) {
      while (angle - heading > Math.PI) angle -= Math.PI * 2;
      while (angle - heading < -Math.PI) angle += Math.PI * 2;
    }
    heading = angle;
    const tx = Math.cos(heading);
    const ty = Math.sin(heading);
    const nx = -ty;
    const ny = tx;
    const offset = (point: Pt): { t: number; n: number } => ({
      t: (point.x - current.x) * tx + (point.y - current.y) * ty,
      n: (point.x - current.x) * nx + (point.y - current.y) * ny,
    });
    const left = offset(current.left);
    const right = offset(current.right);
    samples.push({
      s: centerLengths[index] ?? 0,
      x: current.x,
      y: current.y,
      heading,
      lt: left.t,
      ln: left.n,
      rt: right.t,
      rn: right.n,
    });
  }
  return { samples, length };
}

function buildSpiral(stem: StemSample[], length: number): SpiralSample[] {
  const raw: SpiralSample[] = [];
  const ds = length / SPIRAL_STEPS;
  let x = 0;
  let y = 0;
  let heading = 0;
  for (let index = 0; index <= SPIRAL_STEPS; index += 1) {
    raw.push({ x, y, heading, s: index * ds });
    if (index === SPIRAL_STEPS) break;
    const along = index / SPIRAL_STEPS;
    heading += WIND * crozierCurvature(along, length) * ds;
    x += Math.cos(heading) * ds;
    y += Math.sin(heading) * ds;
  }

  const origin = raw[0];
  const stemOrigin = stem[0];
  if (!origin || !stemOrigin) return raw;
  const originX = origin.x;
  const originY = origin.y;
  const rot = stemOrigin.heading - origin.heading;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  for (const sample of raw) {
    const dx = sample.x - originX;
    const dy = sample.y - originY;
    sample.x = stemOrigin.x + dx * cos - dy * sin;
    sample.y = stemOrigin.y + dx * sin + dy * cos;
    sample.heading += rot;
  }
  return raw;
}

function lerpPair<T extends { s: number; x: number; y: number; heading: number }>(
  samples: readonly T[],
  distance: number,
): { a: T; b: T; t: number } {
  const first = samples[0];
  if (!first) {
    const empty = { s: 0, x: 0, y: 0, heading: 0 } as T;
    return { a: empty, b: empty, t: 0 };
  }
  let low = 0;
  let high = samples.length - 1;
  while (low < high - 1) {
    const mid = (low + high) >> 1;
    const sample = samples[mid];
    if (sample && sample.s < distance) low = mid;
    else high = mid;
  }
  const a = samples[low] ?? first;
  const b = samples[high] ?? a;
  const span = b.s - a.s || 1;
  return { a, b, t: clamp01((distance - a.s) / span) };
}

function stemAt(distance: number): StemSample {
  const { a, b, t } = lerpPair(STEM.samples, distance);
  return {
    s: distance,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    heading: a.heading + (b.heading - a.heading) * t,
    lt: a.lt + (b.lt - a.lt) * t,
    ln: a.ln + (b.ln - a.ln) * t,
    rt: a.rt + (b.rt - a.rt) * t,
    rn: a.rn + (b.rn - a.rn) * t,
  };
}

/** Curvature of the closed crozier at this fraction of the ribbon. */
function crozierCurvature(along: number, length: number): number {
  if (along < CROZIER_BEND) return CROZIER_K0;
  if (along < CROZIER_LOOP) {
    const t = (along - CROZIER_BEND) / (CROZIER_LOOP - CROZIER_BEND);
    return CROZIER_K0 + (CROZIER_K - CROZIER_K0) * smoothstep(t);
  }
  const t = (along - CROZIER_LOOP) / (1 - CROZIER_LOOP);
  const turn = (2 * Math.PI) / CROZIER_K / length;
  if (t < turn * CROZIER_HOLD) return CROZIER_K;
  const holdEnd = CROZIER_LOOP + (1 - CROZIER_LOOP) * turn * CROZIER_HOLD;
  const traveled = Math.max(0, along - holdEnd) * length;
  const perRadian = CROZIER_DROP / (2 * Math.PI);
  const denom = 1 - 2 * perRadian * CROZIER_K * CROZIER_K * traveled;
  // Floor keeps the tip radius inside the ribbon, so the eye stays shut.
  return CROZIER_K / Math.sqrt(Math.max(denom, 0.02));
}

function spiralAt(distance: number): SpiralSample {
  const { a, b, t } = lerpPair(SPIRAL, distance);
  return {
    s: distance,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    heading: a.heading + (b.heading - a.heading) * t,
  };
}

const STEM = buildStem();
const SPIRAL = buildSpiral(STEM.samples, STEM.length);

function seatAngle(progress: number): number {
  const remain = 1 - clamp01(progress);
  return SEAT * remain * remain;
}

interface CurvePoint {
  s: number;
  x: number;
  y: number;
  heading: number;
}

/** Spiral curvature at arc length, from the stored headings. */
function spiralCurvature(distance: number): number {
  const before = spiralAt(Math.max(0, distance - 1));
  const after = spiralAt(Math.min(STEM.length, distance + 1));
  let turn = after.heading - before.heading;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  return turn / Math.max(0.001, after.s - before.s);
}

/**
 * One centerline for this progress. Up to the peel point it is the stem.
 * Past that, it follows the spiral. The resting twist is added at a
 * steady rate over SEAT_BLEND, so the tangent never jumps and the
 * thick edge does not bow past the curl and spring back.
 */
function centerline(progress: number): CurvePoint[] {
  const length = STEM.length;
  const u = clamp01(progress) * length;
  const seat = seatAngle(progress);
  const blend = Math.min(SEAT_BLEND, Math.max(1, length - u));
  const ds = 2;
  const points: CurvePoint[] = [];
  const root = stemAt(0);
  let x = root.x;
  let y = root.y;
  let heading = root.heading;
  let s = 0;
  points.push({ s, x, y, heading });
  while (s < length - 1e-6) {
    const next = Math.min(length, s + ds);
    if (next <= u + 1e-6) {
      const stem = stemAt(next);
      x = stem.x;
      y = stem.y;
      heading = stem.heading;
    } else {
      let from = s;
      if (s < u) {
        const stemU = stemAt(u);
        x = stemU.x;
        y = stemU.y;
        heading = stemU.heading;
        from = u;
      }
      const advance = next - from;
      const sample = Math.min(length, from + advance / 2);
      const alongBlend = (sample - u) / blend;
      const seatCurvature = alongBlend > 0 && alongBlend < 1 ? seat / blend : 0;
      const curvature = spiralCurvature(sample) + seatCurvature;
      const midHeading = heading + (curvature * advance) / 2;
      x += Math.cos(midHeading) * advance;
      y += Math.sin(midHeading) * advance;
      heading += curvature * advance;
    }
    s = next;
    points.push({ s, x, y, heading });
  }
  return points;
}

let cachedProgress = Number.NaN;
let cachedLine: CurvePoint[] = [];

function lineFor(progress: number): CurvePoint[] {
  if (progress !== cachedProgress) {
    cachedProgress = progress;
    cachedLine = centerline(progress);
  }
  return cachedLine;
}

interface Placed {
  x: number;
  y: number;
  heading: number;
  stem: StemSample;
}

function place(progress: number, distance: number): Placed {
  const along = Math.min(Math.max(0, distance), STEM.length);
  const stem = stemAt(along);
  const line = lineFor(progress);
  const { a, b, t } = lerpPair(line, along);
  let turn = b.heading - a.heading;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    heading: a.heading + turn * t,
    stem,
  };
}

/** Closed tail, as a fraction of the stem width. The head stays full width. */
const CLOSED_TAIL = 0.48;

/** Piecewise smooth value. Keys are [along, amount], along increasing. */
function ramp(along: number, keys: readonly (readonly [number, number])[]): number {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last || along <= first[0]) return first ? first[1] : 0;
  for (let index = 1; index < keys.length; index += 1) {
    const prev = keys[index - 1];
    const next = keys[index];
    if (!prev || !next || along > next[0]) continue;
    const t = smoothstep((along - prev[0]) / (next[0] - prev[0]));
    return prev[1] + (next[1] - prev[1]) * t;
  }
  return last[1];
}

/**
 * While a section is still coiled, the tail is thinner and bows out to
 * the original curve. The outer wall's inner edge eases back, and the
 * inner turn eases inward, so a gap opens between them. The gap is smallest
 * at the top of the head. A section returns to the stem once it unrolls.
 */
function closedShape(
  along: number,
  progress: number,
): { scale: number; bow: number; trim: number; pull: number; anchor: number } {
  const peeled = progress <= 0 ? 1 : (along - progress) / 0.06;
  const coil = peeled <= 0 ? 0 : peeled >= 1 ? 1 : smoothstep(peeled);
  const tail = 1 - smoothstep((along - 0.04) / 0.18);
  const width = CLOSED_TAIL + (1 - CLOSED_TAIL) * (1 - tail);
  return {
    scale: 1 - coil * (1 - width),
    bow:
      coil *
      ramp(along, [
        [0.02, 0],
        [0.14, 7],
        [0.3, 0],
      ]),
    trim:
      coil *
      ramp(along, [
        [0.18, 0],
        [0.26, 9],
        [0.36, 5],
        [0.44, 3],
        [0.54, 0],
      ]),
    pull:
      coil *
      ramp(along, [
        [0.5, 0],
        [0.6, 6],
        [0.7, 3.5],
        [0.8, 0],
      ]),
    anchor: tail * coil,
  };
}

function ribbon(progress: number): { left: Pt[]; right: Pt[] } {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let index = 0; index <= RIBBON_SAMPLES; index += 1) {
    const placed = place(progress, (STEM.length * index) / RIBBON_SAMPLES);
    const tx = Math.cos(placed.heading);
    const ty = Math.sin(placed.heading);
    const nx = -ty;
    const ny = tx;
    const { stem } = placed;
    const fit = closedShape(index / RIBBON_SAMPLES, progress);
    const cx = placed.x + nx * (fit.bow - fit.pull);
    const cy = placed.y + ny * (fit.bow - fit.pull);
    const ox = cx + tx * stem.lt + nx * stem.ln;
    const oy = cy + ty * stem.lt + ny * stem.ln;
    const ix = cx + tx * stem.rt + nx * stem.rn;
    const iy = cy + ty * stem.rt + ny * stem.rn;
    const mx = ox + (ix - ox) * (1 - fit.anchor) * 0.5;
    const my = oy + (iy - oy) * (1 - fit.anchor) * 0.5;
    left.push({
      x: mx + (ox - mx) * fit.scale,
      y: my + (oy - my) * fit.scale,
    });
    right.push({
      x: mx + (ix - mx) * fit.scale + nx * fit.trim,
      y: my + (iy - my) * fit.scale + ny * fit.trim,
    });
  }
  return { left, right };
}

/** Centerline of the unwrapping stem. Index 0 stays on the stem root. */
export function navFernSpine(progress: number): Pt[] {
  const spine: Pt[] = [];
  for (let index = 0; index <= RIBBON_SAMPLES; index += 1) {
    const placed = place(progress, (STEM.length * index) / RIBBON_SAMPLES);
    spine.push({ x: placed.x, y: placed.y });
  }
  return spine;
}

/**
 * The open stem ends in a quadratic hook past the flat tip.
 * Same curve, in the tip's own frame, so the free end stays rounded while it moves.
 */
function tipHook(left: Pt, right: Pt, heading: number): Pt[] {
  const width = Math.hypot(right.x - left.x, right.y - left.y);
  if (width < 0.5) return [];
  const tx = Math.cos(heading);
  const ty = Math.sin(heading);
  const cx = (left.x + right.x) / 2 + tx * width;
  const cy = (left.y + right.y) / 2 + ty * width;
  const steps = 8;
  const points: Pt[] = [];
  for (let index = 1; index < steps; index += 1) {
    const t = index / steps;
    const u = 1 - t;
    points.push({
      x: u * u * left.x + 2 * u * t * cx + t * t * right.x,
      y: u * u * left.y + 2 * u * t * cy + t * t * right.y,
    });
  }
  return points;
}

/** Ribbon outline. Progress 0 is the coiled stem; 1 is the open stem, including its tip hook. */
export function navFernLoop(progress: number): Pt[] {
  const { left, right } = ribbon(progress);
  const leftEnd = left[left.length - 1];
  const rightEnd = right[right.length - 1];
  const tip = place(progress, STEM.length);
  right.reverse();
  if (!leftEnd || !rightEnd) return [...left, ...right];
  return [...left, ...tipHook(leftEnd, rightEnd, tip.heading), ...right];
}

function boundsOf(progress: number): { maxX: number; maxY: number } {
  let maxX = 0;
  let maxY = 0;
  for (const point of navFernLoop(progress)) {
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }
  return { maxX, maxY };
}

const CLOSED_BOUNDS = boundsOf(0);
const EYE = navFernSpine(0).at(-1) ?? { x: 40, y: 32 };

/** Clickable area of the closed spiral, from the top-left of the nav. */
export const NAV_FERN_HIT = {
  width: Math.ceil(CLOSED_BOUNDS.maxX + 4),
  height: Math.ceil(CLOSED_BOUNDS.maxY + 6),
} as const;

const BURGER_BARS = [0, 1, 2].map((index) => {
  const total = BAR_H * 3 + BAR_GAP * 2;
  return {
    x: EYE.x - BAR_W / 2,
    y: EYE.y - total / 2 + index * (BAR_H + BAR_GAP),
    w: BAR_W,
    h: BAR_H,
  };
});

/** Burger bars fade in place while the outer turn leaves the corner. */
export function burgerLineAlpha(progress: number): number {
  return 1 - smoothstep(progress / BURGER_FADE);
}

function drawExactStem(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(STEM_TOP, 0);
  ctx.bezierCurveTo(70, 83, 92, 167, STEM_X + HOOK, STEM_Y - HOOK);
  ctx.quadraticCurveTo(STEM_X, STEM_Y + HOOK, STEM_X - HOOK, STEM_Y - HOOK);
  ctx.bezierCurveTo(82, 167, 60, 83, 0, 0);
  ctx.closePath();
  ctx.fillStyle = STEM_COLOR;
  ctx.strokeStyle = STEM_COLOR;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();
}

function drawLoop(ctx: CanvasRenderingContext2D, loop: readonly Pt[]): void {
  const first = loop[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let index = 1; index < loop.length; index += 1) {
    const point = loop[index];
    if (point) ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.fillStyle = STEM_COLOR;
  ctx.strokeStyle = STEM_COLOR;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();
}

function drawBurger(ctx: CanvasRenderingContext2D, alpha: number, hovered: boolean): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = hovered ? BURGER_HOVER : BURGER_REST;
  for (const bar of BURGER_BARS) ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  ctx.restore();
}

/** Redraw the ribbon. Progress 0 is the spiral; 1 is the legacy stem. */
export function drawNavFern(
  canvas: HTMLCanvasElement,
  progress: number,
  options?: NavFernDrawOptions,
): void {
  const p = clamp01(progress);
  canvas.dataset.fernProgress = String(p);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (p >= 1) {
    drawExactStem(ctx);
    return;
  }

  drawLoop(ctx, navFernLoop(p));
  const alpha = burgerLineAlpha(p);
  if (alpha > 0) drawBurger(ctx, alpha, options?.hovered ?? false);
}

/** Resting spiral only. Ignores hover once the ribbon has started to unwrap. */
export function paintNavFernHover(canvas: HTMLCanvasElement, hovered: boolean): void {
  const progress = Number(canvas.dataset.fernProgress ?? "0");
  if (!Number.isFinite(progress) || progress > 0.02) return;
  drawNavFern(canvas, 0, { hovered });
}
