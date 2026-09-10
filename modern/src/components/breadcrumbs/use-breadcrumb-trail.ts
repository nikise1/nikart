"use client";

import { useLayoutEffect } from "react";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import { type BreadcrumbItem, breadcrumbTrailKey } from "./breadcrumb-trail";

/**
 * Syncs the URL trail into the persisted breadcrumb store so view-transition
 * remounts still diff against the previous crumbs.
 */
export function useBreadcrumbTrail(urlCrumbs: BreadcrumbItem[], enabled: boolean): void {
  const applyTrail = useBreadcrumbStore((s) => s.applyTrail);
  const urlKey = breadcrumbTrailKey(urlCrumbs);

  useLayoutEffect(() => {
    applyTrail(urlCrumbs, enabled);
  }, [applyTrail, enabled, urlKey, urlCrumbs]);
}
