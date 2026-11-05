"use client";

import type { MouseEvent } from "react";
import { paintNavFernHover } from "@/lib/nav-fern";

interface NavButtonProps {
  readonly onNavigateHome: () => void;
}

function paintHover(event: MouseEvent<HTMLButtonElement>, hovered: boolean): void {
  const canvas = event.currentTarget.parentElement?.querySelector<HTMLCanvasElement>(
    '[data-component="NavCanvas"]',
  );
  if (!canvas) return;
  paintNavFernHover(canvas, hovered);
}

/** Hit target for the closed curl. The curl itself is drawn on the nav canvas. */
export function NavButton({ onNavigateHome }: NavButtonProps) {
  return (
    <button
      onClick={onNavigateHome}
      onMouseEnter={(event) => paintHover(event, true)}
      onMouseLeave={(event) => paintHover(event, false)}
      data-component="NavButton"
      className="absolute top-0 left-0 z-10 h-[60px] w-[90px] cursor-pointer border-none bg-transparent indent-[-2000px]"
      style={{ display: "none" }}
      aria-label="Back to main menu"
    >
      Menu
    </button>
  );
}
