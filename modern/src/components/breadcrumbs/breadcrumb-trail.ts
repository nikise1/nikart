export interface BreadcrumbItem {
  id: string;
  title: string;
  path: string;
}

export type BreadcrumbPhase = "entering" | "present" | "exiting";

export interface VisualBreadcrumb extends BreadcrumbItem {
  phase: BreadcrumbPhase;
}

export function diffBreadcrumbs(
  prev: readonly BreadcrumbItem[],
  next: readonly BreadcrumbItem[],
): {
  kept: BreadcrumbItem[];
  removed: BreadcrumbItem[];
  added: BreadcrumbItem[];
} {
  let prefix = 0;
  while (
    prefix < prev.length &&
    prefix < next.length &&
    prev[prefix]?.id === next[prefix]?.id
  ) {
    prefix += 1;
  }

  return {
    kept: next.slice(0, prefix),
    removed: prev.slice(prefix),
    added: next.slice(prefix),
  };
}

export function breadcrumbTrailKey(crumbs: readonly BreadcrumbItem[]): string {
  return crumbs.map((crumb) => `${crumb.id}:${crumb.title}`).join("/");
}

export interface TrailSnapshot {
  live: BreadcrumbItem[];
  visual: VisualBreadcrumb[];
  pendingAdded: BreadcrumbItem[];
}

export function nextTrailSnapshot(
  prevLive: readonly BreadcrumbItem[],
  next: readonly BreadcrumbItem[],
): TrailSnapshot {
  const { kept, removed, added } = diffBreadcrumbs(prevLive, next);

  if (removed.length > 0 && added.length > 0) {
    return {
      live: [...next],
      pendingAdded: added,
      visual: [
        ...kept.map((crumb) => ({ ...crumb, phase: "present" as const })),
        ...removed.map((crumb) => ({ ...crumb, phase: "exiting" as const })),
      ],
    };
  }

  return {
    live: [...next],
    pendingAdded: [],
    visual: [
      ...kept.map((crumb) => ({ ...crumb, phase: "present" as const })),
      ...removed.map((crumb) => ({ ...crumb, phase: "exiting" as const })),
      ...added.map((crumb) => ({ ...crumb, phase: "entering" as const })),
    ],
  };
}
