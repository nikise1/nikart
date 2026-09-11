"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { NAV_TIMING } from "@/lib/nav-timing";
import type { VisualBreadcrumb } from "./breadcrumb-trail";

/** Drop in from above the viewport so notches enter at the page top. */
export const BREADCRUMB_NOTCH_FROM_Y = -48;

/** Matches the pre-animation rest (`top: -0.3em` on the breadcrumb bar). */
export const BREADCRUMB_NOTCH_TO_Y = "-0.3em";

/** Half of the previous 1.5s clip-reveal. */
export const BREADCRUMB_TEXT_IN = 0.75;

export const BREADCRUMB_MASK_CLIP_HIDDEN = "inset(0 100% 0 0)";
export const BREADCRUMB_MASK_CLIP_SHOWN = "inset(0 0% 0 0)";

interface UseBreadcrumbAnimatorOptions {
  containerRef: RefObject<HTMLElement | null>;
  visualCrumbs: VisualBreadcrumb[];
  enabled: boolean;
  onExitsComplete: () => void;
  onEntersComplete: () => void;
}

function trailSignature(crumbs: readonly VisualBreadcrumb[]): string {
  return crumbs.map((crumb) => `${crumb.id}:${crumb.phase}`).join("/");
}

/**
 * New crumbs: notch drop, then clip-path reveal.
 * Removed crumbs: clip-path mask out, then notch moves up.
 * Unchanged crumbs stay put.
 */
export function useBreadcrumbAnimator({
  containerRef,
  visualCrumbs,
  enabled,
  onExitsComplete,
  onEntersComplete,
}: UseBreadcrumbAnimatorOptions): void {
  const signature = trailSignature(visualCrumbs);

  useGSAP(
    () => {
      const scope = containerRef.current;
      if (!scope || !enabled) return;

      const items = [...scope.querySelectorAll<HTMLElement>(".breadcrumb-container")];
      const present = items.filter((el) => el.dataset.breadcrumbPhase === "present");
      const entering = items.filter((el) => el.dataset.breadcrumbPhase === "entering");
      const exiting = items.filter((el) => el.dataset.breadcrumbPhase === "exiting");

      present.forEach((el) => {
        const notch = el.querySelector<HTMLElement>(".breadcrumb-notch");
        const mask = el.querySelector<HTMLElement>(".breadcrumb-text-mask");
        if (!notch || !mask) return;
        gsap.killTweensOf(notch);
        gsap.killTweensOf(mask);
        gsap.set(notch, { y: BREADCRUMB_NOTCH_TO_Y });
        gsap.set(mask, { clipPath: BREADCRUMB_MASK_CLIP_SHOWN });
      });

      entering.forEach((el, i) => {
        const notch = el.querySelector<HTMLElement>(".breadcrumb-notch");
        const mask = el.querySelector<HTMLElement>(".breadcrumb-text-mask");
        if (!notch || !mask) return;
        gsap.killTweensOf(notch);
        gsap.killTweensOf(mask);
        gsap.fromTo(
          notch,
          { y: BREADCRUMB_NOTCH_FROM_Y },
          {
            y: BREADCRUMB_NOTCH_TO_Y,
            duration: NAV_TIMING.growIn,
            delay: i * NAV_TIMING.staggerIn,
            ease: "power2.out",
          },
        );
        gsap.fromTo(
          mask,
          { clipPath: BREADCRUMB_MASK_CLIP_HIDDEN },
          {
            clipPath: BREADCRUMB_MASK_CLIP_SHOWN,
            duration: BREADCRUMB_TEXT_IN,
            delay: NAV_TIMING.growIn + i * NAV_TIMING.staggerIn,
            ...(i === entering.length - 1 ? { onComplete: onEntersComplete } : {}),
          },
        );
      });

      exiting.forEach((el, i) => {
        const notch = el.querySelector<HTMLElement>(".breadcrumb-notch");
        const mask = el.querySelector<HTMLElement>(".breadcrumb-text-mask");
        if (!notch || !mask) return;
        const staggerDelay = (exiting.length - 1 - i) * NAV_TIMING.staggerIn;
        gsap.killTweensOf(notch);
        gsap.killTweensOf(mask);
        gsap.fromTo(
          mask,
          { clipPath: BREADCRUMB_MASK_CLIP_SHOWN },
          {
            clipPath: BREADCRUMB_MASK_CLIP_HIDDEN,
            duration: BREADCRUMB_TEXT_IN,
            delay: staggerDelay,
          },
        );
        gsap.fromTo(
          notch,
          { y: BREADCRUMB_NOTCH_TO_Y },
          {
            y: BREADCRUMB_NOTCH_FROM_Y,
            duration: NAV_TIMING.growIn,
            delay: BREADCRUMB_TEXT_IN + staggerDelay,
            ease: "power2.in",
            ...(i === 0 ? { onComplete: onExitsComplete } : {}),
          },
        );
      });
    },
    { scope: containerRef, dependencies: [signature, enabled, onExitsComplete, onEntersComplete] },
  );
}
