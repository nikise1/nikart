"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { NAV_TIMING, itemsCloseDuration } from "@/lib/nav-timing";
import { killNavTweens, navFernTween } from "@/lib/nav-animations";
import { drawNavFern } from "@/lib/nav-fern";
import { useNavStore } from "@/store/nav-store";
import type { NavPhase } from "@/store/nav-types";
import type { DataNode } from "@/lib/data/schema";

const CURVE_MOD_X = 148;
const EXTRA_WIDTH = 20;

interface UseNavAnimatorOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  phase: NavPhase;
  numItems: number;
  items: DataNode[];
  /** Whether the back button should be clickable once the curl has furled. */
  revealButton: boolean;
}

function fernDuration(portion: number): number {
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return 0;
  return NAV_TIMING.fern * Math.max(0, Math.min(1, portion));
}

function setCurlButton(button: HTMLButtonElement, visible: boolean): void {
  gsap.set(button, { left: 0, top: 0 });
  if (visible) {
    button.dataset.busy = "0";
    button.style.display = "block";
    button.style.pointerEvents = "auto";
    return;
  }
  button.style.display = "none";
  button.style.pointerEvents = "none";
}

/**
 * Central nav animation orchestrator — mirrors legacy nav-view.js doAni().
 * The fern is one canvas ribbon the whole time: a spiral at rest, the stem when open.
 */
export function useNavAnimator({
  containerRef,
  phase,
  numItems,
  items,
  revealButton,
}: UseNavAnimatorOptions): void {
  const widthCache = useRef<Map<string, number>>(new Map());
  const fernProgress = useRef(0);

  useGSAP(
    () => {
      const scope = containerRef.current;
      if (!scope) return;

      killNavTweens(scope);

      const canvas = scope.querySelector<HTMLCanvasElement>('[data-component="NavCanvas"]');
      const button = scope.querySelector<HTMLButtonElement>('[data-component="NavButton"]');
      const itemsContainer = scope.querySelector<HTMLUListElement>('[data-component="NavItems"]');
      const itemEls = scope.querySelectorAll<HTMLLIElement>(".nav-item");

      if (!canvas || !button || !itemsContainer) return;

      const { onItemsOutComplete, onCanvasCloseComplete, onOpenComplete } = useNavStore.getState();
      const hovered = (): boolean => button.matches(":hover");

      gsap.set(canvas, { left: 0, top: 0 });

      if (phase === "opening") {
        gsap.set(itemsContainer, { display: "block" });
        setCurlButton(button, false);

        const from = fernProgress.current;
        const duration = fernDuration(1 - from);
        const stem = navFernTween(canvas, from);
        gsap.fromTo(
          stem,
          { progress: from },
          {
            progress: 1,
            duration,
            ease: "none",
            onUpdate: () => {
              fernProgress.current = stem.progress;
              drawNavFern(canvas, stem.progress, { hovered: hovered() });
            },
            onComplete: () => {
              fernProgress.current = 1;
              drawNavFern(canvas, 1);
            },
          },
        );

        itemEls.forEach((el, i) => {
          const itemId = items[i]?.id ?? String(i);
          const delay = duration + i * NAV_TIMING.staggerIn;

          gsap.set(el, { autoAlpha: 0, width: 0 });

          gsap.delayedCall(delay, () => {
            if (useNavStore.getState().navPhase !== "opening") return;

            if (!widthCache.current.has(itemId)) {
              gsap.set(el, { width: "auto", autoAlpha: 0 });
              const measured = el.offsetWidth + EXTRA_WIDTH;
              widthCache.current.set(itemId, measured);
              gsap.set(el, { width: 0, autoAlpha: 0 });
            }

            const fraction = (i + 1) / numItems;
            const marginLeft = (Math.sqrt(fraction * 2) / 2) * CURVE_MOD_X;
            const targetWidth = widthCache.current.get(itemId) ?? 0;

            gsap.set(el, { marginLeft });
            gsap.fromTo(
              el,
              { width: 0, autoAlpha: 1 },
              { width: targetWidth, autoAlpha: 1, duration: NAV_TIMING.itemIn },
            );
          });
        });

        const lastDelay = duration + (numItems - 1) * NAV_TIMING.staggerIn;
        gsap.delayedCall(lastDelay + NAV_TIMING.itemIn, () => {
          if (useNavStore.getState().navPhase === "opening") {
            onOpenComplete();
          }
        });
      } else if (phase === "closing-items") {
        // Stem stays fully drawn while the labels collapse. It coils on the next phase.
        const totalOut = itemsCloseDuration(numItems);
        gsap.delayedCall(totalOut, () => {
          if (useNavStore.getState().navPhase === "closing-items") {
            gsap.set(itemsContainer, { display: "none" });
            onItemsOutComplete();
          }
        });

        itemEls.forEach((el, i) => {
          const delay = (numItems - 1 - i) * NAV_TIMING.staggerOut;
          gsap.delayedCall(delay, () => {
            if (useNavStore.getState().navPhase !== "closing-items") return;
            gsap.to(el, { width: 0, duration: NAV_TIMING.itemOut });
          });
        });
      } else if (phase === "closing-canvas") {
        const from = fernProgress.current;
        const finish = (): void => {
          fernProgress.current = 0;
          drawNavFern(canvas, 0, { hovered: hovered() });
          setCurlButton(button, revealButton);
          onCanvasCloseComplete();
        };

        if (from < 0.001) {
          finish();
          return;
        }

        setCurlButton(button, false);
        const stem = navFernTween(canvas, from);
        gsap.to(stem, {
          progress: 0,
          duration: fernDuration(from),
          ease: "none",
          onUpdate: () => {
            fernProgress.current = stem.progress;
            drawNavFern(canvas, stem.progress, { hovered: hovered() });
          },
          onComplete: finish,
        });
      } else if (phase === "closed") {
        fernProgress.current = 0;
        gsap.set(itemsContainer, { display: "none" });
        drawNavFern(canvas, 0, { hovered: hovered() });
        setCurlButton(button, revealButton);
      } else if (phase === "open") {
        fernProgress.current = 1;
        drawNavFern(canvas, 1);
        gsap.set(itemsContainer, { display: "block" });
        setCurlButton(button, false);
      }
    },
    { scope: containerRef, dependencies: [phase, numItems, items, revealButton] },
  );
}
