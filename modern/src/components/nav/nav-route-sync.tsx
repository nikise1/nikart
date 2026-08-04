"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "@/navigation";
import { useNavStore } from "@/store/nav-store";
import { isHomePath, isNavBackNavigation } from "@/lib/nav-route";

/** Syncs nav open/close state with the current route (legacy app-model.onRouterUpdated). */
export function NavRouteSync() {
  const pathname = usePathname();
  const router = useRouter();
  const syncToRoute = useNavStore((s) => s.syncToRoute);
  const navReady = useNavStore((s) => s.navReady);
  const navPhase = useNavStore((s) => s.navPhase);
  const pendingRoute = useNavStore((s) => s.pendingRoute);
  const clearPendingRoute = useNavStore((s) => s.clearPendingRoute);
  const pushedRouteRef = useRef<string | null>(null);

  const isHome = isHomePath(pathname);

  // Route-driven nav state (after init; skip during startup close-then-open).
  useEffect(() => {
    if (!navReady) return;
    const { startupPendingOpen } = useNavStore.getState();
    if (startupPendingOpen) return;
    syncToRoute(isHome);
  }, [pathname, isHome, syncToRoute, navReady]);

  // Navigate after close animation completes (nav item click).
  useEffect(() => {
    if (navPhase === "closed" && pendingRoute && pushedRouteRef.current !== pendingRoute) {
      pushedRouteRef.current = pendingRoute;
      const transitionTypes = isNavBackNavigation(pathname, pendingRoute) ? ["nav-back"] : ["nav-forward"];
      router.push(pendingRoute, { transitionTypes });
    }
  }, [navPhase, pendingRoute, pathname, router]);

  // Clear pending route once we've left main — keeps back button visible during the transition.
  useEffect(() => {
    if (pendingRoute && !isHome) {
      clearPendingRoute();
      pushedRouteRef.current = null;
    }
  }, [isHome, pendingRoute, clearPendingRoute]);

  return null;
}
