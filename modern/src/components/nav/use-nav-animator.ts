"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { NAV_TIMING, itemsCloseDuration } from "@/lib/nav-timing";
import { drawNavBezier, killNavTweens, NAV_POS } from "@/lib/nav-animations";
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
  /** Whether the back button should animate in during closing-canvas. */
  revealButton: boolean;
}

/**
 * Central nav animation orchestrator — mirrors legacy nav-view.js doAni().
 * All GSAP for canvas, button, and items runs here so phases stay in sync.
 */
export function useNavAnimator({
  containerRef,
  phase,
  numItems,
  items,
  revealButton,
}: UseNavAnimatorOptions): void {
  const widthCache = useRef<Map<string, number>>(new Map());

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

      if (phase === "opening") {
        // Legacy doAni open: show items, setUpCanvas, aniIn per item.
        gsap.set(itemsContainer, { display: "block" });

        drawNavBezier(canvas);
        gsap.fromTo(
          canvas,
          { left: NAV_POS.canvasOutX, top: NAV_POS.canvasOutY },
          { left: 0, top: 0, duration: NAV_TIMING.growIn },
        );
        gsap.to(button, {
          left: NAV_POS.btnOutX,
          top: -NAV_POS.btnHeight,
          duration: NAV_TIMING.growIn,
        });

        itemEls.forEach((el, i) => {
          const itemId = items[i]?.id ?? String(i);
          const delay = NAV_TIMING.growIn + i * NAV_TIMING.staggerIn;

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

        const lastDelay = NAV_TIMING.growIn + (numItems - 1) * NAV_TIMING.staggerIn;
        gsap.delayedCall(lastDelay + NAV_TIMING.itemIn, () => {
          if (useNavStore.getState().navPhase === "opening") {
            onOpenComplete();
          }
        });
      } else if (phase === "closing-items") {
        // Legacy doAni close: aniOut stagger, then doneAniOut.
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
        // Legacy doneAniOut → closeCanvas.
        gsap.to(canvas, {
          left: NAV_POS.canvasOutX,
          top: NAV_POS.canvasOutY,
          duration: NAV_TIMING.growOut,
          onComplete: () => {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, NAV_POS.canvasWidth, NAV_POS.canvasHeight);
          },
        });

        if (revealButton) {
          button.style.display = "block";
          gsap.fromTo(
            button,
            { left: NAV_POS.btnOutX, top: -NAV_POS.btnHeight },
            {
              left: 0,
              top: 0,
              duration: NAV_TIMING.growIn,
              onComplete: () => {
                useNavStore.getState().onCanvasCloseComplete();
              },
            },
          );
        } else {
          gsap.set(button, { left: NAV_POS.btnOutX, top: -NAV_POS.btnHeight });
          gsap.delayedCall(NAV_TIMING.growOut, () => {
            if (useNavStore.getState().navPhase === "closing-canvas") {
              onCanvasCloseComplete();
            }
          });
        }
      } else if (phase === "closed") {
        gsap.set(itemsContainer, { display: "none" });
        gsap.set(canvas, { left: NAV_POS.canvasOutX, top: NAV_POS.canvasOutY });
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, NAV_POS.canvasWidth, NAV_POS.canvasHeight);

        if (revealButton) {
          button.style.display = "block";
          gsap.set(button, { left: 0, top: 0 });
        } else {
          button.style.display = "none";
          gsap.set(button, { left: NAV_POS.btnOutX, top: -NAV_POS.btnHeight });
        }
      }
    },
    { scope: containerRef, dependencies: [phase, numItems, items, revealButton] },
  );
}
