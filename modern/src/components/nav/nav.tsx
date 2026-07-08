"use client";

import { useRef } from "react";
import { useUIStore } from "@/store/ui-store";
import { getTopMenu } from "@/lib/data/content";
import { NavCanvas } from "./nav-canvas";
import { NavItems } from "./nav-items";
import { NavButton } from "./nav-button";
import type { Locale } from "@/lib/data/schema";

interface NavProps {
  locale: Locale;
}

export function Nav({ locale }: NavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navOpen = useUIStore((s) => s.navOpen);
  const items = getTopMenu();

  return (
    <div ref={containerRef} className="fixed top-0 left-0 z-50">
      <NavCanvas open={navOpen} containerRef={containerRef} numItems={items.length} />
      <NavButton />
      <NavItems items={items} locale={locale} open={navOpen} />
    </div>
  );
}
