"use client";

import { useRef } from "react";
import { useNavStore } from "@/store/nav-store";
import { gsap, useGSAP } from "@/lib/gsap";
import { NAV_TIMING, itemsCloseDuration } from "@/lib/nav-timing";
import { localize } from "@/lib/data/content";
import type { DataNode, Locale } from "@/lib/data/schema";
import type { NavPhase } from "@/store/nav-store";

interface NavItemsProps {
  items: DataNode[];
  locale: Locale;
  phase: NavPhase;
  numItems: number;
}

const CURVE_MOD_X = 148;
const EXTRA_WIDTH = 20;

export function NavItems({ items, locale, phase, numItems }: NavItemsProps) {
  const containerRef = useRef<HTMLUListElement>(null);
  const selectNavItem = useNavStore((s) => s.selectNavItem);
  const onOpenComplete = useNavStore((s) => s.onOpenComplete);
  const onItemsOutComplete = useNavStore((s) => s.onItemsOutComplete);
  const widthCache = useRef<Map<string, number>>(new Map());

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const itemEls = container.querySelectorAll<HTMLLIElement>(".nav-item");

      if (phase === "opening") {
        gsap.set(container, { display: "block" });
        itemEls.forEach((el, i) => {
          const fraction = (i + 1) / numItems;
          const marginLeft = (Math.sqrt(fraction * 2) / 2) * CURVE_MOD_X;
          const itemId = items[i]?.id ?? String(i);

          gsap.set(el, { marginLeft, width: 0, autoAlpha: 0 });

          const delay = NAV_TIMING.growIn + i * NAV_TIMING.staggerIn;
          gsap.delayedCall(delay, () => {
            if (useNavStore.getState().navPhase !== "opening") return;

            if (!widthCache.current.has(itemId)) {
              gsap.set(el, { width: "auto", autoAlpha: 0 });
              const measured = el.offsetWidth + EXTRA_WIDTH;
              widthCache.current.set(itemId, measured);
              gsap.set(el, { width: 0, autoAlpha: 0 });
            }

            const targetWidth = widthCache.current.get(itemId) ?? 0;
            gsap.fromTo(
              el,
              { width: 0, autoAlpha: 0 },
              {
                width: targetWidth,
                autoAlpha: 1,
                duration: NAV_TIMING.itemIn,
                ease: "power2.out",
              },
            );
          });
        });

        const lastItemDelay = NAV_TIMING.growIn + (numItems - 1) * NAV_TIMING.staggerIn;
        const totalOpen = lastItemDelay + NAV_TIMING.itemIn;
        gsap.delayedCall(totalOpen, () => {
          if (useNavStore.getState().navPhase === "opening") {
            onOpenComplete();
          }
        });
      } else if (phase === "closing-items") {
        itemEls.forEach((el, i) => {
          const delay = (numItems - 1 - i) * NAV_TIMING.staggerOut;
          gsap.to(el, {
            width: 0,
            duration: NAV_TIMING.itemOut,
            delay,
            ease: "power2.in",
          });
        });

        gsap.delayedCall(itemsCloseDuration(numItems), () => {
          if (useNavStore.getState().navPhase === "closing-items") {
            gsap.set(container, { display: "none" });
            onItemsOutComplete();
          }
        });
      } else if (phase === "closed") {
        gsap.set(container, { display: "none" });
      }
    },
    { scope: containerRef, dependencies: [phase, numItems, items, onOpenComplete, onItemsOutComplete] },
  );

  function handleClick(id: string) {
    selectNavItem(`/${id}`);
  }

  return (
    <ul ref={containerRef} data-component="NavItems" className="relative top-[30px] left-0 hidden w-[20em] list-none p-0">
      {items.map((item) => {
        const title = localize(item.title, locale);
        return (
          <li key={item.id} className="nav-item flex h-8 items-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/content/img/stump.png"
              alt=""
              width={20}
              height={16}
              className="inline-block"
            />
            <button
              onClick={() => handleClick(item.id)}
              className="block w-full cursor-pointer whitespace-nowrap border-none bg-transparent px-2 py-1 text-left text-sm text-[#1C6B00] transition-all duration-300 hover:text-[#4F3E2D] hover:[text-shadow:0_0_2px_#cc813a]"
            >
              {title}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
