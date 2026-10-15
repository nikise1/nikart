"use client";

import type { CSSProperties, ReactNode } from "react";

/** Keep in sync with the content-piece rules in globals.css. */
export const CONTENT_TRANSITION_MS = 240;
export const CONTENT_STAGGER_MS = 40;
export const CONTENT_ENTER_LEAD_MS = 60;
export const CONTENT_TRANSITION_SLOTS = 4;

interface ContentTransitionProps {
  index: number;
  children: ReactNode;
}

export function ContentTransition({ index, children }: ContentTransitionProps) {
  const style: CSSProperties = {
    viewTransitionName: `content-slot-${index}`,
    viewTransitionClass: `content-piece-${index}`,
  };

  return (
    <div data-content-slot={index} className="flex w-full flex-col items-center" style={style}>
      {children}
    </div>
  );
}
