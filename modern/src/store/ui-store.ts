import { create } from "zustand";

interface UIState {
  navOpen: boolean;
  toggleNav: () => void;
  openNav: () => void;
  closeNav: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  navOpen: false,
  toggleNav: () => set((state) => ({ navOpen: !state.navOpen })),
  openNav: () => set({ navOpen: true }),
  closeNav: () => set({ navOpen: false }),
}));
