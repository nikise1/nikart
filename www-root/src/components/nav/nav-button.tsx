"use client";

import type { MouseEvent } from "react";
import { NAV_FERN_HIT, paintNavFernHover } from "@/lib/nav-fern";

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

/** Hit target for the closed spiral. The spiral itself is drawn on the nav canvas. */
export function NavButton({ onNavigateHome }: NavButtonProps) {
  return (
    <button
      onClick={onNavigateHome}
      onMouseEnter={(event) => paintHover(event, true)}
      onMouseLeave={(event) => paintHover(event, false)}
      data-component="NavButton"
      className="absolute top-0 left-0 z-10 cursor-pointer border-none bg-transparent indent-[-2000px]"
      style={{ display: "none", width: NAV_FERN_HIT.width, height: NAV_FERN_HIT.height }}
      aria-label="Back to main menu"
    >
      Menu
    </button>
  );
}
