/**
 * The closed curl and the open stem are the same ribbon.
 * Closed, the ribbon is a logarithmic spiral in the corner.
 * Opening pays arc length out along the real stem and leaves the
 * remainder as a rigid piece of that spiral, rotated so it stays
 * attached. That is an unwrap: tail distances do not change with progress.
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

/** Turns of the closed spiral. Tuned so the coils stay separated and inside the corner. */
const SPIRAL_TURNS = 2.05;
const SPIRAL_K = 0.16;
/** Extra rotation while fully coiled, so the spiral sits in the page instead of across the corner. */
const SEAT = (54 * Math.PI) / 180;

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

function spiralLength(inner: number, thetaMax: number): number {
  let length = 0;
  const steps = 2400;
  const dTheta = thetaMax / steps;
  for (let index = 0; index < steps; index += 1) {
    const theta = (index + 0.5) * dTheta;
    const radius = inner * Math.exp(SPIRAL_K * theta);
    length += radius * Math.hypot(1, SPIRAL_K) * dTheta;
  }
  return length;
}

function buildSpiral(stem: StemSample[], length: number): SpiralSample[] {
  const thetaMax = SPIRAL_TURNS * Math.PI * 2;
  let low = 0.2;
  let high = 30;
  for (let index = 0; index < 28; index += 1) {
    const mid = (low + high) / 2;
    if (spiralLength(mid, thetaMax) < length) low = mid;
    else high = mid;
  }
  const inner = (low + high) / 2;
  const raw: SpiralSample[] = [];
  for (let index = 0; index <= SPIRAL_STEPS; index += 1) {
    const theta = thetaMax * (1 - index / SPIRAL_STEPS);
    const radius = inner * Math.exp(SPIRAL_K * theta);
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    const tx = -(SPIRAL_K * Math.cos(theta) - Math.sin(theta));
    const ty = -(SPIRAL_K * Math.sin(theta) + Math.cos(theta));
    raw.push({ x, y, heading: Math.atan2(ty, tx), s: 0 });
  }
  const first = raw[0];
  if (!first) return raw;
  let prevHeading = first.heading;
  first.s = 0;
  for (let index = 1; index < raw.length; index += 1) {
    const prev = raw[index - 1];
    const current = raw[index];
    if (!prev || !current) break;
    let heading = current.heading;
    while (heading - prevHeading > Math.PI) heading -= Math.PI * 2;
    while (heading - prevHeading < -Math.PI) heading += Math.PI * 2;
    current.heading = heading;
    prevHeading = heading;
    current.s = prev.s + Math.hypot(current.x - prev.x, current.y - prev.y);
  }
  const last = raw[raw.length - 1];
  const scale = last && last.s > 0 ? length / last.s : 1;
  for (const sample of raw) {
    sample.x *= scale;
    sample.y *= scale;
    sample.s *= scale;
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

interface Placed {
  x: number;
  y: number;
  heading: number;
  stem: StemSample;
}

function place(progress: number, distance: number): Placed {
  const p = clamp01(progress);
  const u = p * STEM.length;
  const along = Math.min(distance, STEM.length);
  const stem = stemAt(along);
  if (distance <= u) {
    return { x: stem.x, y: stem.y, heading: stem.heading, stem };
  }
  const stemU = stemAt(u);
  const spiralU = spiralAt(u);
  const spiral = spiralAt(along);
  const turn = stemU.heading - spiralU.heading + seatAngle(p);
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const dx = spiral.x - spiralU.x;
  const dy = spiral.y - spiralU.y;
  return {
    x: stemU.x + dx * cos - dy * sin,
    y: stemU.y + dx * sin + dy * cos,
    heading: spiral.heading + turn,
    stem,
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
    left.push({
      x: placed.x + tx * stem.lt + nx * stem.ln,
      y: placed.y + ty * stem.lt + ny * stem.ln,
    });
    right.push({
      x: placed.x + tx * stem.rt + nx * stem.rn,
      y: placed.y + ty * stem.rt + ny * stem.rn,
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

/** Ribbon outline. Progress 0 is the coiled stem; 1 is the open stem without the tip hook. */
export function navFernLoop(progress: number): Pt[] {
  const { left, right } = ribbon(progress);
  right.reverse();
  return [...left, ...right];
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
