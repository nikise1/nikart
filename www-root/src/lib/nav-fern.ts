/**
 * Closed fiddlehead, traced from the lower frame of `content/img/curl-sprite.png`.
 * Starts at the top-left base and walks the outer edge before the inner hook,
 * so arc-length lines up with the open stem (left edge, tip, right edge).
 */
const CLOSED_CURL: readonly number[] = [
  0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 7, 8, 7, 9, 8, 10, 9, 11, 9, 12, 10, 13, 11, 14,
  11, 15, 12, 16, 12, 17, 13, 18, 13, 19, 14, 20, 14, 21, 15, 22, 16, 23, 16, 24, 17, 25, 17, 26,
  18, 27, 18, 28, 19, 29, 19, 30, 20, 31, 20, 32, 21, 33, 22, 34, 22, 35, 23, 36, 24, 37, 24, 38,
  25, 39, 26, 40, 27, 41, 28, 42, 29, 43, 30, 44, 31, 44, 32, 45, 33, 46, 34, 46, 35, 46, 36, 47,
  37, 47, 38, 47, 39, 48, 40, 48, 41, 48, 42, 48, 43, 48, 44, 48, 45, 49, 46, 49, 47, 48, 48, 48,
  49, 48, 50, 48, 51, 48, 52, 48, 53, 48, 54, 48, 55, 47, 56, 47, 57, 47, 58, 46, 59, 46, 60, 46,
  61, 45, 62, 45, 63, 44, 64, 44, 65, 43, 66, 42, 67, 42, 68, 41, 69, 40, 70, 39, 71, 38, 72, 37,
  72, 36, 73, 35, 74, 34, 74, 33, 75, 32, 75, 31, 75, 30, 76, 29, 76, 28, 76, 27, 76, 26, 77, 25,
  77, 24, 77, 23, 77, 22, 76, 21, 76, 20, 76, 19, 76, 18, 75, 17, 75, 16, 75, 15, 74, 14, 74, 13,
  73, 12, 72, 11, 71, 10, 71, 9, 70, 8, 69, 8, 68, 7, 67, 6, 66, 5, 65, 5, 64, 4, 63, 4, 62, 4, 61,
  3, 60, 3, 59, 2, 58, 2, 57, 2, 56, 2, 55, 2, 54, 1, 53, 1, 52, 1, 51, 1, 50, 1, 49, 1, 48, 1, 47,
  2, 46, 2, 45, 2, 44, 2, 43, 3, 42, 3, 41, 3, 40, 4, 39, 4, 38, 5, 37, 5, 36, 6, 35, 7, 34, 8, 33,
  9, 32, 10, 31, 11, 31, 12, 30, 13, 30, 14, 29, 15, 29, 16, 29, 17, 28, 18, 28, 19, 28, 20, 28, 21,
  28, 22, 28, 23, 29, 24, 29, 25, 29, 26, 30, 27, 30, 28, 31, 29, 31, 30, 30, 31, 29, 30, 28, 29,
  28, 28, 27, 27, 27, 26, 26, 25, 26, 24, 25, 23, 24, 22, 24, 21, 23, 20, 23, 19, 22, 18, 22, 17,
  21, 16, 21, 15, 20, 14, 20, 13, 19, 12, 18, 11, 18, 10, 17, 9, 17, 8, 16, 7, 15, 6, 15, 5, 14, 4,
  13, 3, 13, 2, 12, 1, 11, 0, 10, 0, 9, 0, 8, 0, 7, 0, 6, 0, 5, 0, 4, 0, 3, 0, 2, 0, 1, 0,
];

interface Pt {
  x: number;
  y: number;
}

/** Legacy open stem. Right edge, hook, then left edge back to the origin. */
const STEM_X = 110;
const STEM_Y = 258;
const STEM_TOP = 20;
const HOOK = 3.5;

const SAMPLES = 180;
/** Far end of the loop waits, so the coil stays rolled while the base pays out. */
const TIP_DELAY = 0.45;
const BURGER_FADE = 0.3;

const BURGER_BARS = [
  { x: 35, y: 12, w: 24, h: 4 },
  { x: 35, y: 19, w: 24, h: 4 },
  { x: 35, y: 26, w: 24, h: 4 },
] as const;

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

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
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

function quad(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function soften(pts: readonly Pt[]): Pt[] {
  return pts.map((pt, index) => {
    const prev = pts[index - 1];
    const next = pts[index + 1];
    if (!prev || !next) return pt;
    return { x: (prev.x + pt.x * 2 + next.x) / 4, y: (prev.y + pt.y * 2 + next.y) / 4 };
  });
}

function resample(pts: readonly Pt[], count: number): Pt[] {
  const lengths = [0];
  for (let index = 1; index < pts.length; index++) {
    const prev = pts[index - 1];
    const current = pts[index];
    if (!prev || !current) break;
    lengths.push((lengths[index - 1] ?? 0) + dist(prev, current));
  }
  const total = lengths[lengths.length - 1] ?? 0;
  const out: Pt[] = [];
  for (let index = 0; index < count; index++) {
    const distance = total * (index / (count - 1));
    let cursor = 1;
    while (cursor < lengths.length - 1 && (lengths[cursor] ?? 0) < distance) cursor += 1;
    const start = lengths[cursor - 1] ?? 0;
    const end = lengths[cursor] ?? start;
    const span = end - start || 1;
    const t = Math.min(1, Math.max(0, (distance - start) / span));
    const a = pts[cursor - 1];
    const b = pts[cursor];
    if (!a || !b) continue;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

function closedCurl(): Pt[] {
  const pts: Pt[] = [];
  for (let index = 0; index < CLOSED_CURL.length; index += 2) {
    const x = CLOSED_CURL[index];
    const y = CLOSED_CURL[index + 1];
    if (x === undefined || y === undefined) continue;
    pts.push({ x, y });
  }
  let softened = pts;
  for (let pass = 0; pass < 2; pass += 1) softened = soften(softened);
  return resample(softened, SAMPLES);
}

function openStem(): Pt[] {
  const left0 = { x: 0, y: 0 };
  const left1 = { x: 60, y: 83 };
  const left2 = { x: 82, y: 167 };
  const left3 = { x: STEM_X - HOOK, y: STEM_Y - HOOK };
  const right0 = { x: STEM_TOP, y: 0 };
  const right1 = { x: 70, y: 83 };
  const right2 = { x: 92, y: 167 };
  const right3 = { x: STEM_X + HOOK, y: STEM_Y - HOOK };
  const tip = { x: STEM_X, y: STEM_Y + HOOK };
  const pts: Pt[] = [];
  const steps = 80;
  for (let index = 0; index <= steps; index += 1) {
    pts.push(cubic(left0, left1, left2, left3, index / steps));
  }
  for (let index = 1; index <= 16; index += 1) {
    pts.push(quad(left3, tip, right3, index / 16));
  }
  for (let index = 1; index <= steps; index += 1) {
    pts.push(cubic(right3, right2, right1, right0, index / steps));
  }
  pts.push(left0);
  return resample(pts, SAMPLES);
}

const CLOSED_LOOP = closedCurl();
const OPEN_LOOP = openStem();

/** One outline, closed curl at 0 and open stem at 1. The base leads; the tip unrolls last. */
export function navFernLoop(progress: number): Pt[] {
  const p = clamp01(progress);
  const count = CLOSED_LOOP.length;
  const mid = (count - 1) / 2;
  const span = 1 - TIP_DELAY;
  const loop: Pt[] = [];
  for (let index = 0; index < count; index += 1) {
    const along = Math.min(index, count - 1 - index) / mid;
    const t = smoothstep((p - TIP_DELAY * along) / span);
    const closed = CLOSED_LOOP[index];
    const open = OPEN_LOOP[index];
    if (!closed || !open) continue;
    loop.push({
      x: closed.x + (open.x - closed.x) * t,
      y: closed.y + (open.y - closed.y) * t,
    });
  }
  return loop;
}

/** Burger bars fade in place. They are gone before the coil leaves the corner. */
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
    const pt = loop[index];
    if (pt) ctx.lineTo(pt.x, pt.y);
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

/** Redraw the single fern path. Progress 0 is the curl; 1 is the legacy stem. */
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

/** Resting curl only. Ignores hover once the frond has started to move. */
export function paintNavFernHover(canvas: HTMLCanvasElement, hovered: boolean): void {
  const progress = Number(canvas.dataset.fernProgress ?? "0");
  if (!Number.isFinite(progress) || progress > 0.02) return;
  drawNavFern(canvas, 0, { hovered });
}
