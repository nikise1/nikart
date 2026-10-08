"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { getBreadcrumbs } from "@/lib/data/content";
import { Link } from "@/navigation";
import type { Locale } from "@/lib/data/schema";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import { useNavStore } from "@/store/nav-store";
import type { VisualBreadcrumb } from "./breadcrumb-trail";
import {
  BREADCRUMB_MASK_CLIP_HIDDEN,
  BREADCRUMB_MASK_CLIP_SHOWN,
  BREADCRUMB_NOTCH_FROM_Y,
  BREADCRUMB_NOTCH_TO_Y,
  useBreadcrumbAnimator,
} from "./use-breadcrumb-animator";
import { useBreadcrumbTrail } from "./use-breadcrumb-trail";

interface BreadcrumbsProps {
  locale: Locale;
}

function crumbStartStyles(phase: VisualBreadcrumb["phase"]): {
  notchY: string;
  clipPath: string;
} {
  if (phase === "entering") {
    return {
      notchY: `${BREADCRUMB_NOTCH_FROM_Y}px`,
      clipPath: BREADCRUMB_MASK_CLIP_HIDDEN,
    };
  }
  return {
    notchY: BREADCRUMB_NOTCH_TO_Y,
    clipPath: BREADCRUMB_MASK_CLIP_SHOWN,
  };
}

/**
 * Below `sm`, the bar is the strip to the right of the nav inset.
 * Ancestors cap at 8rem. Exiting crumbs give that width back before the
 * current title does, so a long leaf stays readable while it leaves.
 * At `sm` and up the trail is unconstrained.
 */
function crumbLayoutClass(phase: VisualBreadcrumb["phase"], isCurrent: boolean): string {
  if (isCurrent) return "max-sm:min-w-0 max-sm:shrink";
  if (phase === "exiting") {
    return "max-sm:min-w-0 max-sm:max-w-[calc(8rem+15px)] max-sm:shrink-[100]";
  }
  return "max-sm:min-w-0 max-sm:max-w-[calc(8rem+15px)] max-sm:shrink-0";
}

function labelClass(isCurrent: boolean): string {
  const cap = isCurrent ? "max-sm:shrink" : "max-sm:max-w-[8rem]";
  const hover = isCurrent ? "" : " transition-colors group-hover:text-[#A8682B]";
  return (
    [
      "breadcrumb-text-mask breadcrumb-link inline-block overflow-hidden whitespace-nowrap",
      "pt-[0.3em] text-[#1C6B00] max-sm:min-w-0 max-sm:truncate",
      cap,
    ].join(" ") + hover
  );
}

export function Breadcrumbs({ locale }: BreadcrumbsProps) {
  const pathname = usePathname();
  const navPhase = useNavStore((s) => s.navPhase);
  const navVisible = navPhase === "opening" || navPhase === "open";
  const containerRef = useRef<HTMLElement>(null);

  const segments = pathname.split("/").filter(Boolean);
  const contentPath = segments.slice(1);
  const currentContentPath = contentPath.join("/");
  const urlCrumbs = contentPath.length === 0 ? [] : getBreadcrumbs(contentPath, locale);

  useBreadcrumbTrail(urlCrumbs, !navVisible);
  const visualCrumbs = useBreadcrumbStore((s) => s.visual);
  const onExitsComplete = useBreadcrumbStore((s) => s.onExitsComplete);
  const onEntersComplete = useBreadcrumbStore((s) => s.onEntersComplete);

  useBreadcrumbAnimator({
    containerRef,
    visualCrumbs,
    enabled: !navVisible && visualCrumbs.length > 0,
    onExitsComplete,
    onEntersComplete,
  });

  if (navVisible || visualCrumbs.length === 0) return null;

  return (
    <nav
      ref={containerRef}
      aria-label="Breadcrumb"
      data-component="Breadcrumbs"
      className="fixed top-[-0.3em] left-[6em] z-50 flex flex-nowrap text-sm max-sm:right-2"
    >
      {visualCrumbs.map((crumb) => {
        const start = crumbStartStyles(crumb.phase);
        const isCurrent = crumb.phase !== "exiting" && crumb.path === currentContentPath;
        const body = (
          <>
            <span
              className="breadcrumb-notch inline-block shrink-0"
              style={{ transform: `translateY(${start.notchY})` }}
            >
              <span
                aria-hidden="true"
                className="breadcrumb-connector inline-block h-[12px] w-[15px] rotate-[75deg] bg-[url('/content/img/stump.png')] bg-no-repeat"
              />
            </span>
            <span className={labelClass(isCurrent)} style={{ clipPath: start.clipPath }}>
              {crumb.title}
            </span>
          </>
        );

        const layoutClass = `breadcrumb-container mr-[0.3em] flex ${crumbLayoutClass(crumb.phase, isCurrent)}`;

        if (isCurrent) {
          return (
            <span
              key={crumb.id}
              data-breadcrumb-phase={crumb.phase}
              className={layoutClass}
              aria-current="page"
            >
              {body}
            </span>
          );
        }

        return (
          <Link
            key={crumb.id}
            href={`/${crumb.path}`}
            data-breadcrumb-phase={crumb.phase}
            className={`group ${layoutClass}`}
            transitionTypes={["nav-back"]}
          >
            {body}
          </Link>
        );
      })}
    </nav>
  );
}
