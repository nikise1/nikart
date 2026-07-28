"use client";

import { useRef, useState } from "react";
import { useNavStore } from "@/store/nav-store";
import { gsap, useGSAP } from "@/lib/gsap";
import { NAV_TIMING } from "@/lib/nav-timing";

const BTN_OUT_X = -30;
const BTN_HEIGHT = 60;

interface NavButtonProps {
  readonly numItems: number;
  readonly onOpenNavigate: () => void;
}

export function NavButton({ numItems, onOpenNavigate }: NavButtonProps) {
  const toggleNav = useNavStore((s) => s.toggleNav);
  const navPhase = useNavStore((s) => s.navPhase);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useGSAP(
    () => {
      const btn = btnRef.current;
      if (!btn) return;

      if (navPhase === "opening" || navPhase === "open") {
        // Button hides simultaneously with canvas opening (legacy: setUpCanvas)
        gsap.to(btn, {
          left: BTN_OUT_X,
          top: -BTN_HEIGHT,
          duration: NAV_TIMING.growIn,
          ease: "power2.in",
        });
      } else if (navPhase === "closing-canvas") {
        // Button reappears after items finish animating out (legacy: closeCanvas)
        setVisible(true);
        gsap.to(btn, {
          left: 0,
          top: 0,
          duration: NAV_TIMING.growIn,
          ease: "power2.out",
          onComplete: () => {
            useNavStore.getState().onCanvasCloseComplete();
          },
        });
      } else if (navPhase === "closing-items") {
        // Button stays hidden while items animate out
        gsap.set(btn, { left: BTN_OUT_X, top: -BTN_HEIGHT });
      } else if (navPhase === "closed") {
        // Keep last animated position; visibility is set only during closing-canvas
        gsap.set(btn, { left: 0, top: 0 });
      }
    },
    { dependencies: [navPhase, numItems] },
  );

  function handleClick() {
    const opening = toggleNav();
    if (opening) {
      onOpenNavigate();
    }
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      data-component="NavButton"
      className="absolute z-10 h-[60px] w-[90px] cursor-pointer border-none bg-[url('/content/img/curl-sprite.png')] bg-no-repeat indent-[-2000px] hover:bg-[position:0_0]"
      style={{
        left: BTN_OUT_X,
        top: -BTN_HEIGHT,
        backgroundPosition: "0 -60px",
        display: visible ? "block" : "none",
      }}
      aria-label="Toggle navigation"
    >
      Menu
    </button>
  );
}
