import { create } from "zustand";

export type NavPhase = "closed" | "closing-items" | "closing-canvas" | "opening" | "open";

interface NavState {
  /** Target open/closed state (legacy openBool). */
  navOpen: boolean;
  /** Current animation phase in the nav sequence. */
  navPhase: NavPhase;
  /** Legacy initDone — nav is mounted and can respond to interactions. */
  navReady: boolean;
  /** Route to navigate to after the close animation finishes. */
  pendingRoute: string | null;
  /** Startup: reveal button before opening menu (legacy close-then-open on main). */
  startupPendingOpen: boolean;

  setNavReady: () => void;
  runStartupSequence: () => void;
  runButtonReveal: () => void;
  requestNavOpen: () => void;
  requestNavClose: (pendingRoute?: string) => void;
  onItemsOutComplete: () => void;
  onCanvasCloseComplete: () => void;
  onOpenComplete: () => void;
  toggleNav: () => boolean;
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

  setNavReady: () => set({ navReady: true }),

  runStartupSequence: () => {
    // Legacy startup on main: ventNavClose (button reveal) then ventNavOpen.
    // Items are already hidden, so skip straight to the canvas/button close phase.
    set({
      navOpen: false,
      navPhase: "closing-canvas",
      startupPendingOpen: true,
      pendingRoute: null,
    });
  },

  runButtonReveal: () => {
    // Deep-link entry: reveal button via closeCanvas without opening the menu.
    set({
      navOpen: false,
      navPhase: "closing-canvas",
      startupPendingOpen: false,
      pendingRoute: null,
    });
  },

  requestNavOpen: () => {
    const { navPhase } = get();
    if (navPhase === "open" || navPhase === "opening") return;

    set({ navOpen: true, navPhase: "opening", pendingRoute: null, startupPendingOpen: false });
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
    const { navPhase, startupPendingOpen } = get();
    if (navPhase !== "closing-canvas") return;

    if (startupPendingOpen) {
      set({ navPhase: "closed", startupPendingOpen: false });
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

  toggleNav: () => {
    const { navReady, navOpen, navPhase } = get();
    if (!navReady) return false;

    const isVisuallyOpen = navOpen || navPhase === "opening" || navPhase === "open";

    if (isVisuallyOpen) {
      get().requestNavClose();
      return false;
    }

    get().requestNavOpen();
    return true;
  },

  syncToRoute: (isHome: boolean) => {
    if (isHome) {
      get().requestNavOpen();
    } else {
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
