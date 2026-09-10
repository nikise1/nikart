"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { NAV_TIMING } from "@/lib/nav-timing";

/** Drop in from above the viewport so notches enter at the page top. */
export const BREADCRUMB_NOTCH_FROM_Y = -48;

/** Matches the pre-animation rest (`top: -0.3em` on the breadcrumb bar). */
export const BREADCRUMB_NOTCH_TO_Y = "-0.3em";

/** Slightly slower than nav `itemIn` (1.2s) so the clip-reveal is easier to read. */
export const BREADCRUMB_TEXT_IN = 1.5;

export const BREADCRUMB_MASK_CLIP_HIDDEN = "inset(0 100% 0 0)";
export const BREADCRUMB_MASK_CLIP_SHOWN = "inset(0 0% 0 0)";

interface UseBreadcrumbAnimatorOptions {
  containerRef: RefObject<HTMLElement | null>;
  crumbKey: string;
  enabled: boolean;
}

/**
 * Staggered notch drop from the page top, then left-to-right clip-path reveal
 * (same visual as main nav text masks, without shrinking width so siblings stay put).
 */
export function useBreadcrumbAnimator({
  containerRef,
  crumbKey,
  enabled,
}: UseBreadcrumbAnimatorOptions): void {
  useGSAP(
    () => {
      const scope = containerRef.current;
      if (!scope || !enabled) return;

      const notches = scope.querySelectorAll<HTMLElement>(".breadcrumb-notch");
      const masks = scope.querySelectorAll<HTMLElement>(".breadcrumb-text-mask");

      notches.forEach((el, i) => {
        gsap.killTweensOf(el);
        gsap.fromTo(
          el,
          { y: BREADCRUMB_NOTCH_FROM_Y },
          {
            y: BREADCRUMB_NOTCH_TO_Y,
            duration: NAV_TIMING.growIn,
            delay: i * NAV_TIMING.staggerIn,
            ease: "power2.out",
          },
        );
      });

      masks.forEach((el, i) => {
        gsap.killTweensOf(el);
        gsap.fromTo(
          el,
          { clipPath: BREADCRUMB_MASK_CLIP_HIDDEN },
          {
            clipPath: BREADCRUMB_MASK_CLIP_SHOWN,
            duration: BREADCRUMB_TEXT_IN,
            delay: NAV_TIMING.growIn + i * NAV_TIMING.staggerIn,
          },
        );
      });
    },
    { scope: containerRef, dependencies: [crumbKey, enabled] },
  );
}
