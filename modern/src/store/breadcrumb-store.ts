import { create } from "zustand";
import {
  type BreadcrumbItem,
  type VisualBreadcrumb,
  breadcrumbTrailKey,
  nextTrailSnapshot,
} from "@/components/breadcrumbs/breadcrumb-trail";

interface BreadcrumbTrailState {
  live: BreadcrumbItem[];
  visual: VisualBreadcrumb[];
  pendingAdded: BreadcrumbItem[];
  applyTrail: (next: BreadcrumbItem[], enabled: boolean) => void;
  onExitsComplete: () => void;
  onEntersComplete: () => void;
}

const EMPTY_LIVE: BreadcrumbItem[] = [];
const EMPTY_VISUAL: VisualBreadcrumb[] = [];
const EMPTY_PENDING: BreadcrumbItem[] = [];

const EMPTY_TRAIL = {
  live: EMPTY_LIVE,
  visual: EMPTY_VISUAL,
  pendingAdded: EMPTY_PENDING,
};

export const useBreadcrumbStore = create<BreadcrumbTrailState>((set, get) => ({
  ...EMPTY_TRAIL,

  applyTrail: (next, enabled) => {
    if (!enabled) {
      const { live, visual, pendingAdded } = get();
      if (live.length === 0 && visual.length === 0 && pendingAdded.length === 0) return;
      set(EMPTY_TRAIL);
      return;
    }

    if (breadcrumbTrailKey(get().live) === breadcrumbTrailKey(next)) return;
    set(nextTrailSnapshot(get().live, next));
  },

  onExitsComplete: () => {
    const { visual, pendingAdded } = get();
    set({
      pendingAdded: EMPTY_PENDING,
      visual: [
        ...visual
          .filter((crumb) => crumb.phase !== "exiting")
          .map((crumb) => ({ ...crumb, phase: "present" as const })),
        ...pendingAdded.map((crumb) => ({ ...crumb, phase: "entering" as const })),
      ],
    });
  },

  onEntersComplete: () => {
    set({
      visual: get().visual.map((crumb) =>
        crumb.phase === "entering" ? { ...crumb, phase: "present" as const } : crumb,
      ),
    });
  },
}));

export function resetBreadcrumbStore(): void {
  useBreadcrumbStore.setState(EMPTY_TRAIL);
}
