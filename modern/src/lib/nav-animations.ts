import { gsap } from "@/lib/gsap";

/** Kill all active nav tweens within the given scope element. */
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
