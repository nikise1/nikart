"use client";

import { useRef } from "react";
import { useUIStore } from "@/store/ui-store";
import { gsap, useGSAP } from "@/lib/gsap";

const BTN_OUT_X = -30;
const BTN_HEIGHT = 60;

export function NavButton() {
  const toggleNav = useUIStore((s) => s.toggleNav);
  const navOpen = useUIStore((s) => s.navOpen);
  const btnRef = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      const btn = btnRef.current;
      if (!btn) return;

      if (navOpen) {
        gsap.to(btn, { left: BTN_OUT_X, top: -BTN_HEIGHT, duration: 0.5, ease: "power2.in" });
      } else {
        gsap.to(btn, { left: 0, top: 0, duration: 0.5, ease: "power2.out" });
      }
    },
    { dependencies: [navOpen] },
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
