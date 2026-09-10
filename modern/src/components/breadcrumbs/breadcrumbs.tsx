"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { getBreadcrumbs } from "@/lib/data/content";
import { Link } from "@/navigation";
import type { Locale } from "@/lib/data/schema";
import { useNavStore } from "@/store/nav-store";
import {
  BREADCRUMB_MASK_CLIP_HIDDEN,
  BREADCRUMB_NOTCH_FROM_Y,
  useBreadcrumbAnimator,
} from "./use-breadcrumb-animator";

interface BreadcrumbsProps {
  locale: Locale;
}

export function Breadcrumbs({ locale }: BreadcrumbsProps) {
  const pathname = usePathname();
  const navPhase = useNavStore((s) => s.navPhase);
  const navVisible = navPhase === "opening" || navPhase === "open";
  const containerRef = useRef<HTMLElement>(null);

  // Extract path segments after /locale/
  const segments = pathname.split("/").filter(Boolean);
  // Remove locale segment
  const contentPath = segments.slice(1);
  const crumbs = contentPath.length === 0 ? [] : getBreadcrumbs(contentPath, locale);
  const visible = crumbs.length > 0 && !navVisible;
  const crumbKey = crumbs.map((crumb) => `${crumb.id}:${crumb.title}`).join("/");

  useBreadcrumbAnimator({
    containerRef,
    crumbKey,
    enabled: visible,
  });

  if (!visible) return null;

  return (
    <nav
      ref={containerRef}
      aria-label="Breadcrumb"
      data-component="Breadcrumbs"
      className="fixed top-[-0.3em] left-[6em] z-50 flex flex-nowrap text-sm"
    >
      {crumbs.map((crumb) => (
        <span key={crumb.id} className="breadcrumb-container mr-[0.3em] flex">
          <span
            className="breadcrumb-notch inline-block shrink-0"
            style={{ transform: `translateY(${BREADCRUMB_NOTCH_FROM_Y}px)` }}
          >
            <span
              aria-hidden="true"
              className="breadcrumb-connector inline-block h-[12px] w-[15px] rotate-[75deg] bg-[url('/content/img/stump.png')] bg-no-repeat"
            />
          </span>
          <span
            className="breadcrumb-text-mask inline-block overflow-hidden whitespace-nowrap"
            style={{ clipPath: BREADCRUMB_MASK_CLIP_HIDDEN }}
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
      ))}
    </nav>
  );
}
