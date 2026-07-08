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
    <nav aria-label="Breadcrumb" data-component="Breadcrumbs" className="fixed top-[-0.3em] left-[6em] z-50 flex flex-nowrap text-sm">
      {crumbs.map((crumb) => (
        <span key={crumb.id} className="mr-[0.3em] flex">
          <span
            className="inline-block h-[12px] w-[15px] shrink-0 rotate-[75deg] bg-[url('/content/img/stump.png')] bg-no-repeat"
          />
          <Link
            href={`/${crumb.path}`}
            className="inline-block pt-[0.3em] text-[#1C6B00] transition-colors hover:text-[#A8682B]"
            transitionTypes={["nav-back"]}
          >
            {crumb.title}
          </Link>
        </span>
      ))}
    </nav>
  );
}
