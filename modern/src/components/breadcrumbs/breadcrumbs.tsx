"use client";

import { usePathname } from "next/navigation";
import { getBreadcrumbs } from "@/lib/data/content";
import { Link } from "@/navigation";
import type { Locale } from "@/lib/data/schema";
import { useUIStore } from "@/store/ui-store";

interface BreadcrumbsProps {
  locale: Locale;
}

export function Breadcrumbs({ locale }: BreadcrumbsProps) {
  const pathname = usePathname();
  const navOpen = useUIStore((s) => s.navOpen);

  // Extract path segments after /locale/
  const segments = pathname.split("/").filter(Boolean);
  // Remove locale segment
  const contentPath = segments.slice(1);

  if (contentPath.length === 0) return null;

  const crumbs = getBreadcrumbs(contentPath, locale);

  if (crumbs.length === 0) return null;

  if (navOpen) return null;

  return (
    <nav aria-label="Breadcrumb" className="ml-auto flex items-center gap-1 px-4 py-2 text-sm">
      {crumbs.map((crumb, index) => (
        <span key={crumb.id} className="flex items-center gap-1">
          {index > 0 && <span className="text-[#94B864]">›</span>}
          <Link
            href={`/${crumb.path}`}
            className="text-[#1C6B00] transition-colors hover:text-[#A8682B]"
            transitionTypes={["nav-back"]}
          >
            {crumb.title}
          </Link>
        </span>
      ))}
    </nav>
  );
}
