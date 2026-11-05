import { gsap } from "@/lib/gsap";

const CANVAS_WIDTH = 130;
const CANVAS_HEIGHT = 260;

export const NAV_POS = {
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
} as const;

interface NavFernTween {
  progress: number;
}

interface NavCanvasElement extends HTMLCanvasElement {
  fern?: NavFernTween;
}

/** Stable tween target so a phase change can kill the fern without reverting the path. */
export function navFernTween(canvas: HTMLCanvasElement, progress: number): NavFernTween {
  const node = canvas as NavCanvasElement;
  if (!node.fern) node.fern = { progress };
  else node.fern.progress = progress;
  return node.fern;
}

/** Kill all active nav tweens within the given scope element (legacy doAni preamble). */
export function killNavTweens(scope: Element | null | undefined): void {
  if (!scope) return;

  const canvas = scope.querySelector<NavCanvasElement>('[data-component="NavCanvas"]');
  const button = scope.querySelector('[data-component="NavButton"]');
  const items = scope.querySelector('[data-component="NavItems"]');
  const itemEls = scope.querySelectorAll(".nav-item");

  if (canvas?.fern) gsap.killTweensOf(canvas.fern);
  if (canvas) gsap.killTweensOf(canvas);
  if (button) gsap.killTweensOf(button);
  if (items) gsap.killTweensOf(items);
  if (itemEls.length) gsap.killTweensOf(itemEls);
}
