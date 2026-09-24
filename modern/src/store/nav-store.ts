import { create } from "zustand";
import type { NavPhase } from "./nav-types";

export type { NavPhase } from "./nav-types";

interface NavState {
  navOpen: boolean;
  navPhase: NavPhase;
  navReady: boolean;
  pendingRoute: string | null;
  /** Startup on main: close (button reveal) then open. */
  startupPendingOpen: boolean;
  /** Route to main while nav is open/closing: open after close completes. */
  pendingOpenAfterClose: boolean;

  setNavReady: () => void;
  runStartupSequence: () => void;
  runButtonReveal: () => void;
  requestNavOpen: () => void;
  requestNavClose: (pendingRoute?: string) => void;
  onItemsOutComplete: () => void;
  onCanvasCloseComplete: () => void;
  onOpenComplete: () => void;
  openHomeMenu: () => void;
  syncToRoute: (isHome: boolean) => void;
  clearPendingRoute: () => void;
  selectNavItem: (route: string) => void;
}

export const useNavStore = create<NavState>((set, get) => ({
  navOpen: false,
  navPhase: "closed",
  navReady: false,
  pendingRoute: null,
  startupPendingOpen: false,
  pendingOpenAfterClose: false,

  setNavReady: () => set({ navReady: true }),

  runStartupSequence: () => {
    // Legacy startup on main: ventNavClose then ventNavOpen (items hidden → closeCanvas → open).
    set({
      navOpen: false,
      navPhase: "closing-canvas",
      startupPendingOpen: true,
      pendingRoute: null,
      pendingOpenAfterClose: false,
    });
  },

  runButtonReveal: () => {
    set({
      navOpen: false,
      navPhase: "closing-canvas",
      startupPendingOpen: false,
      pendingRoute: null,
      pendingOpenAfterClose: false,
    });
  },

  requestNavOpen: () => {
    const { navPhase } = get();
    if (navPhase === "open" || navPhase === "opening") return;
    set({
      navOpen: true,
      navPhase: "opening",
      pendingRoute: null,
      startupPendingOpen: false,
      pendingOpenAfterClose: false,
    });
  },

  requestNavClose: (pendingRoute?: string) => {
    const { navPhase } = get();
    if (navPhase === "closed" || navPhase === "closing-items" || navPhase === "closing-canvas") {
      if (pendingRoute) set({ pendingRoute });
      return;
    }

    set({
      navOpen: false,
      navPhase: "closing-items",
      pendingRoute: pendingRoute ?? get().pendingRoute,
      startupPendingOpen: false,
    });
  },

  onItemsOutComplete: () => {
    const { navPhase } = get();
    if (navPhase !== "closing-items") return;
    set({ navPhase: "closing-canvas" });
  },

  onCanvasCloseComplete: () => {
    const { navPhase, startupPendingOpen, pendingOpenAfterClose } = get();
    if (navPhase !== "closing-canvas") return;

    if (startupPendingOpen || pendingOpenAfterClose) {
      set({
        navPhase: "closed",
        startupPendingOpen: false,
        pendingOpenAfterClose: false,
      });
      get().requestNavOpen();
      return;
    }

    set({ navPhase: "closed" });
  },

  onOpenComplete: () => {
    const { navPhase } = get();
    if (navPhase !== "opening") return;
    set({ navPhase: "open" });
  },

  openHomeMenu: () => {
    const { navPhase } = get();

    if (navPhase === "opening" || navPhase === "open") {
      set({ pendingOpenAfterClose: true });
      get().requestNavClose();
      return;
    }

    if (navPhase === "closed") {
      set({ pendingOpenAfterClose: true, navPhase: "closing-canvas", navOpen: false });
      return;
    }

    set({ pendingOpenAfterClose: true });
  },

  syncToRoute: (isHome: boolean) => {
    if (isHome) {
      get().openHomeMenu();
    } else {
      // Cancel a pending home open when navigating away (e.g. browser back during startup).
      set({ pendingOpenAfterClose: false, startupPendingOpen: false });
      get().requestNavClose();
    }
  },

  clearPendingRoute: () => set({ pendingRoute: null }),

  selectNavItem: (route: string) => {
    get().requestNavClose(route);
  },
}));

/** @deprecated Use useNavStore — kept for existing imports during migration. */
export const useUIStore = useNavStore;
