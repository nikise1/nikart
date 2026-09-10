"use client";

import { useCallback, useState } from "react";
import {
  type BreadcrumbItem,
  type VisualBreadcrumb,
  breadcrumbTrailKey,
  diffBreadcrumbs,
} from "./breadcrumb-trail";

interface TrailState {
  enabled: boolean;
  live: BreadcrumbItem[];
  visual: VisualBreadcrumb[];
  pendingAdded: BreadcrumbItem[];
}

const EMPTY_TRAIL: TrailState = {
  enabled: false,
  live: [],
  visual: [],
  pendingAdded: [],
};

interface UseBreadcrumbTrailResult {
  visualCrumbs: VisualBreadcrumb[];
  onExitsComplete: () => void;
  onEntersComplete: () => void;
}

function applyUrlCrumbs(prevLive: BreadcrumbItem[], next: BreadcrumbItem[]): TrailState {
  const { kept, removed, added } = diffBreadcrumbs(prevLive, next);

  if (removed.length > 0 && added.length > 0) {
    return {
      enabled: true,
      live: next,
      pendingAdded: added,
      visual: [
        ...kept.map((crumb) => ({ ...crumb, phase: "present" as const })),
        ...removed.map((crumb) => ({ ...crumb, phase: "exiting" as const })),
      ],
    };
  }

  return {
    enabled: true,
    live: next,
    pendingAdded: [],
    visual: [
      ...kept.map((crumb) => ({ ...crumb, phase: "present" as const })),
      ...removed.map((crumb) => ({ ...crumb, phase: "exiting" as const })),
      ...added.map((crumb) => ({ ...crumb, phase: "entering" as const })),
    ],
  };
}

/**
 * Keeps exiting crumbs mounted until their reverse animation finishes, and
 * marks only newly appended crumbs as entering.
 */
export function useBreadcrumbTrail(
  urlCrumbs: BreadcrumbItem[],
  enabled: boolean,
): UseBreadcrumbTrailResult {
  const urlKey = breadcrumbTrailKey(urlCrumbs);
  const [state, setState] = useState<TrailState>(EMPTY_TRAIL);

  if (!enabled && state.enabled) {
    setState(EMPTY_TRAIL);
  } else if (enabled && (!state.enabled || breadcrumbTrailKey(state.live) !== urlKey)) {
    setState(applyUrlCrumbs(state.live, urlCrumbs));
  }

  const onExitsComplete = useCallback(() => {
    setState((current) => ({
      ...current,
      pendingAdded: [],
      visual: [
        ...current.visual
          .filter((crumb) => crumb.phase !== "exiting")
          .map((crumb) => ({ ...crumb, phase: "present" as const })),
        ...current.pendingAdded.map((crumb) => ({ ...crumb, phase: "entering" as const })),
      ],
    }));
  }, []);

  const onEntersComplete = useCallback(() => {
    setState((current) => ({
      ...current,
      visual: current.visual.map((crumb) =>
        crumb.phase === "entering" ? { ...crumb, phase: "present" as const } : crumb,
      ),
    }));
  }, []);

  return { visualCrumbs: state.visual, onExitsComplete, onEntersComplete };
}
