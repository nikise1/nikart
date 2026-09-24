"use client";

import { NAV_POS } from "@/lib/nav-animations";

interface NavButtonProps {
  readonly onNavigateHome: () => void;
}

/** Always mounted — visibility/position driven by useNavAnimator (legacy closeCanvas). */
export function NavButton({ onNavigateHome }: NavButtonProps) {
  return (
    <button
      onClick={onNavigateHome}
      data-component="NavButton"
      className="absolute z-10 h-[60px] w-[90px] cursor-pointer border-none bg-[url('/content/img/curl-sprite.png')] bg-no-repeat indent-[-2000px] hover:bg-[position:0_0]"
      style={{
        left: NAV_POS.btnOutX,
        top: -NAV_POS.btnHeight,
        backgroundPosition: "0 -60px",
        display: "none",
      }}
      aria-label="Back to main menu"
    >
      Menu
    </button>
  );
}
