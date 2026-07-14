"use client";

import { useRef } from "react";
import { useRouter } from "@/navigation";
import { useUIStore } from "@/store/ui-store";
import { gsap, useGSAP } from "@/lib/gsap";
import { localize } from "@/lib/data/content";
import type { DataNode, Locale } from "@/lib/data/schema";

interface NavItemsProps {
  items: DataNode[];
  locale: Locale;
  open: boolean;
}

const TIMING = {
  staggerIn: 0.1,
  growIn: 0.5,
  itemIn: 1.2,
  staggerOut: 0.075,
  itemOut: 0.5,
};

const CURVE_MOD_X = 148;

export function NavItems({ items, locale, open }: NavItemsProps) {
  const containerRef = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const closeNav = useUIStore((s) => s.closeNav);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const itemEls = container.querySelectorAll<HTMLLIElement>(".nav-item");

      if (open) {
        gsap.set(container, { display: "block" });
        itemEls.forEach((el, i) => {
          const fraction = (i + 1) / items.length;
          const marginLeft = (Math.sqrt(fraction * 2) / 2) * CURVE_MOD_X;
          gsap.set(el, { marginLeft, width: 0, autoAlpha: 0 });
          gsap.fromTo(
            el,
            { width: 0, autoAlpha: 0 },
            {
              width: "auto",
              autoAlpha: 1,
              duration: TIMING.itemIn,
              delay: TIMING.growIn + i * TIMING.staggerIn,
              ease: "power2.out",
            },
          );
        });
      } else {
        itemEls.forEach((el, i) => {
          const delay = (items.length - 1 - i) * TIMING.staggerOut;
          gsap.to(el, {
            width: 0,
            autoAlpha: 0,
            duration: TIMING.itemOut,
            delay,
            ease: "power2.in",
          });
        });
        const totalOut = TIMING.itemOut + (items.length - 1) * TIMING.staggerOut;
        gsap.delayedCall(totalOut, () => {
          gsap.set(container, { display: "none" });
        });
      }
    },
    { scope: containerRef, dependencies: [open] },
  );

  function handleClick(id: string) {
    closeNav();
    router.push(`/${id}`);
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
