"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { NAV_TIMING } from "@/lib/nav-timing";

/** Drop in from above the viewport so notches enter at the page top. */
export const BREADCRUMB_NOTCH_FROM_Y = -48;

interface UseBreadcrumbAnimatorOptions {
  containerRef: RefObject<HTMLElement | null>;
  crumbKey: string;
  enabled: boolean;
}

function measureMaskWidth(el: HTMLElement): number {
  const child = el.firstElementChild;
  const childWidth = child instanceof HTMLElement ? child.scrollWidth : 0;
  return Math.max(el.scrollWidth, childWidth);
}

/**
 * Staggered notch drop from the page top, then horizontal width-mask reveal
 * matching main nav item text (`overflow: hidden` + width 0 → measured).
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
            y: 0,
            duration: NAV_TIMING.growIn,
            delay: i * NAV_TIMING.staggerIn,
            ease: "power2.out",
          },
        );
      });

      masks.forEach((el, i) => {
        gsap.killTweensOf(el);
        const targetWidth = measureMaskWidth(el);
        gsap.fromTo(
          el,
          { width: 0 },
          {
            width: targetWidth,
            duration: NAV_TIMING.itemIn,
            delay: NAV_TIMING.growIn + i * NAV_TIMING.staggerIn,
          },
        );
      });
    },
    { scope: containerRef, dependencies: [crumbKey, enabled] },
  );
}
