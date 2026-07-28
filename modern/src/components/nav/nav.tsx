"use client";

import { useRef, useEffect } from "react";
import { usePathname, useRouter } from "@/navigation";
import { useNavStore } from "@/store/nav-store";
import { getTopMenu } from "@/lib/data/content";
import { NavCanvas } from "./nav-canvas";
import { NavItems } from "./nav-items";
import { NavButton } from "./nav-button";
import { NavRouteSync } from "./nav-route-sync";
import type { Locale } from "@/lib/data/schema";

interface NavProps {
  locale: Locale;
}

export function Nav({ locale }: NavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const navPhase = useNavStore((s) => s.navPhase);
  const setNavReady = useNavStore((s) => s.setNavReady);
  const runStartupSequence = useNavStore((s) => s.runStartupSequence);
  const runButtonReveal = useNavStore((s) => s.runButtonReveal);
  const items = getTopMenu();

  const segments = pathname.split("/").filter(Boolean);
  const isHome = segments.length <= 1;

  const initialized = useRef(false);

  // Legacy initialize; on home run startup close-then-open once, on deep links stay closed.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setNavReady();
    if (isHome) {
      runStartupSequence();
    } else {
      runButtonReveal();
    }
  }, [setNavReady, runStartupSequence, runButtonReveal, isHome]);

  function handleToggleNavigateHome(): void {
    router.push("/", { transitionTypes: ["nav-back"] });
  }

  return (
    <div ref={containerRef} data-component="Nav" className="fixed top-0 left-0 z-50">
      <NavRouteSync />
      <NavCanvas phase={navPhase} containerRef={containerRef} numItems={items.length} />
      <NavButton numItems={items.length} onOpenNavigate={handleToggleNavigateHome} />
      <NavItems items={items} locale={locale} phase={navPhase} numItems={items.length} />
    </div>
  );
}
