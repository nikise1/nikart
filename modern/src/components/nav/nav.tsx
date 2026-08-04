"use client";

import { useRef, useEffect } from "react";
import { usePathname, useRouter } from "@/navigation";
import { useNavStore } from "@/store/nav-store";
import { getTopMenu } from "@/lib/data/content";
import { NavCanvas } from "./nav-canvas";
import { NavItems } from "./nav-items";
import { NavButton } from "./nav-button";
import { NavRouteSync } from "./nav-route-sync";
import { useNavAnimator } from "./use-nav-animator";
import { isHomePath } from "@/lib/nav-route";
import type { Locale } from "@/lib/data/schema";

interface NavProps {
  locale: Locale;
}

export function Nav({ locale }: NavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const navPhase = useNavStore((s) => s.navPhase);
  const pendingRoute = useNavStore((s) => s.pendingRoute);
  const setNavReady = useNavStore((s) => s.setNavReady);
  const runStartupSequence = useNavStore((s) => s.runStartupSequence);
  const runButtonReveal = useNavStore((s) => s.runButtonReveal);
  const items = getTopMenu();

  const isHome = isHomePath(pathname);
  const leavingHome = isHome && pendingRoute !== null;
  const revealButton = !isHome || leavingHome;

  const initialized = useRef(false);

  useNavAnimator({
    containerRef,
    phase: navPhase,
    numItems: items.length,
    items,
    revealButton,
  });

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

  function handleNavigateHome(): void {
    router.push("/", { transitionTypes: ["nav-back"] });
  }

  return (
    <div ref={containerRef} data-component="Nav" className="fixed top-0 left-0 z-50">
      <NavRouteSync />
      <NavCanvas />
      <NavButton onNavigateHome={handleNavigateHome} />
      <NavItems items={items} locale={locale} />
    </div>
  );
}
