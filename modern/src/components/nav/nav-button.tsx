"use client";

import { useRef } from "react";
import { useUIStore } from "@/store/ui-store";
import { gsap, useGSAP } from "@/lib/gsap";

const BTN_OUT_X = -30;
const BTN_HEIGHT = 60;

// Must match nav-canvas.tsx / nav-items.tsx timing
const TIME_NAV_GROW_IN = 0.5;
const TIME_NAV_OUT = 0.5;
const TIME_NAV_STAGGER_OUT = 0.075;

export function NavButton({ numItems }: { readonly numItems: number }) {
  const toggleNav = useUIStore((s) => s.toggleNav);
  const navOpen = useUIStore((s) => s.navOpen);
  const btnRef = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      const btn = btnRef.current;
      if (!btn) return;

      if (navOpen) {
        // Button hides simultaneously with canvas opening (legacy: setUpCanvas)
        gsap.to(btn, { left: BTN_OUT_X, top: -BTN_HEIGHT, duration: TIME_NAV_GROW_IN, ease: "power2.in" });
      } else {
        // Button reappears after items finish animating out (legacy: doneAniOut → closeCanvas)
        const closeDelay = TIME_NAV_OUT + (numItems - 1) * TIME_NAV_STAGGER_OUT;
        gsap.to(btn, { left: 0, top: 0, duration: TIME_NAV_GROW_IN, delay: closeDelay, ease: "power2.out" });
      }
    },
    { dependencies: [navOpen, numItems] },
  );

  return (
    <button
      ref={btnRef}
      onClick={toggleNav}
      data-component="NavButton"
      className="absolute z-10 h-[60px] w-[90px] cursor-pointer border-none bg-[url('/content/img/curl-sprite.png')] bg-no-repeat indent-[-2000px] hover:bg-[position:0_0]"
      style={{ left: BTN_OUT_X, top: -BTN_HEIGHT, backgroundPosition: "0 -60px" }}
      aria-label="Toggle navigation"
    >
      Menu
    </button>
  );
}
