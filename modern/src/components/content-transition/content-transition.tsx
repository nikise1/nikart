"use client";

import { ViewTransition, type ReactNode } from "react";

/** Keep in sync with the content-in / content-out rules in globals.css. */
export const CONTENT_TRANSITION_MS = 240;
export const CONTENT_STAGGER_MS = 40;
export const CONTENT_ENTER_LEAD_MS = 60;
export const CONTENT_TRANSITION_SLOTS = 4;

interface ContentTransitionProps {
  index: number;
  children: ReactNode;
}

export function ContentTransition({ index, children }: ContentTransitionProps) {
  return (
    <ViewTransition
      enter={`content-in-${index}`}
      exit={`content-out-${index}`}
      update="none"
      share="none"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
