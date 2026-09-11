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

export function Breadcrumbs({ locale }: BreadcrumbsProps) {
  const pathname = usePathname();
  const navPhase = useNavStore((s) => s.navPhase);
  const navVisible = navPhase === "opening" || navPhase === "open";
  const containerRef = useRef<HTMLElement>(null);

  const segments = pathname.split("/").filter(Boolean);
  const contentPath = segments.slice(1);
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
      className="fixed top-[-0.3em] left-[6em] z-50 flex flex-nowrap text-sm"
    >
      {visualCrumbs.map((crumb) => {
        const start = crumbStartStyles(crumb.phase);
        return (
          <span
            key={crumb.id}
            data-breadcrumb-phase={crumb.phase}
            className={`breadcrumb-container mr-[0.3em] flex${crumb.phase === "exiting" ? " pointer-events-none" : ""}`}
            aria-hidden={crumb.phase === "exiting"}
          >
            <span
              className="breadcrumb-notch inline-block shrink-0"
              style={{ transform: `translateY(${start.notchY})` }}
            >
              <span
                aria-hidden="true"
                className="breadcrumb-connector inline-block h-[12px] w-[15px] rotate-[75deg] bg-[url('/content/img/stump.png')] bg-no-repeat"
              />
            </span>
            <span
              className="breadcrumb-text-mask inline-block overflow-hidden whitespace-nowrap"
              style={{ clipPath: start.clipPath }}
            >
              <Link
                href={`/${crumb.path}`}
                className="breadcrumb-link inline-block pt-[0.3em] text-[#1C6B00] transition-colors hover:text-[#A8682B]"
                transitionTypes={["nav-back"]}
              >
                {crumb.title}
              </Link>
            </span>
          </span>
        );
      })}
    </nav>
  );
}
