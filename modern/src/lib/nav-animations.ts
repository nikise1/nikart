import { gsap } from "@/lib/gsap";

const CANVAS_WIDTH = 130;
const CANVAS_HEIGHT = 260;

export const NAV_POS = {
  canvasOutX: -120,
  canvasOutY: -CANVAS_HEIGHT,
  btnOutX: -30,
  btnHeight: 60,
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
} as const;

/** Kill all active nav tweens within the given scope element (legacy doAni preamble). */
export function killNavTweens(scope: Element | null | undefined): void {
  if (!scope) return;

  const canvas = scope.querySelector('[data-component="NavCanvas"]');
  const button = scope.querySelector('[data-component="NavButton"]');
  const items = scope.querySelector('[data-component="NavItems"]');
  const itemEls = scope.querySelectorAll(".nav-item");

  if (canvas) gsap.killTweensOf(canvas);
  if (button) gsap.killTweensOf(button);
  if (items) gsap.killTweensOf(items);
  if (itemEls.length) gsap.killTweensOf(itemEls);
}

export function drawNavBezier(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, NAV_POS.canvasWidth, NAV_POS.canvasHeight);

  const dBX = 110;
  const dBY = 258;
  const thickT = 20;
  const thickB = 7;
  const halfB = thickB / 2;

  ctx.beginPath();
  ctx.moveTo(thickT, 0);
  ctx.bezierCurveTo(70, 83, 92, 167, dBX + halfB, dBY - halfB);
  ctx.quadraticCurveTo(dBX, dBY + halfB, dBX - halfB, dBY - halfB);
  ctx.bezierCurveTo(82, 167, 60, 83, 0, 0);
  ctx.closePath();

  ctx.fillStyle = "#4F3E2D";
  ctx.strokeStyle = "#4F3E2D";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();
}
