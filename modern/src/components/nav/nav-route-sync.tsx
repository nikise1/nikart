"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/navigation";
import { useNavStore } from "@/store/nav-store";

/** Syncs nav open/close state with the current route (legacy app-model.onRouterUpdated). */
export function NavRouteSync() {
  const pathname = usePathname();
  const router = useRouter();
  const syncToRoute = useNavStore((s) => s.syncToRoute);
  const navPhase = useNavStore((s) => s.navPhase);
  const pendingRoute = useNavStore((s) => s.pendingRoute);
  const clearPendingRoute = useNavStore((s) => s.clearPendingRoute);

  const segments = pathname.split("/").filter(Boolean);
  const isHome = segments.length <= 1;

  // Route-driven nav state (skip during startup close-then-open).
  useEffect(() => {
    const { startupPendingOpen } = useNavStore.getState();
    if (startupPendingOpen) return;
    syncToRoute(isHome);
  }, [isHome, syncToRoute]);

  // Navigate after close animation completes (nav item click).
  useEffect(() => {
    if (navPhase === "closed" && pendingRoute) {
      const route = pendingRoute;
      clearPendingRoute();
      router.push(route, { transitionTypes: ["nav-forward"] });
    }
  }, [navPhase, pendingRoute, clearPendingRoute, router]);

  return null;
}
