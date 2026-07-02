"use client";

import Link from "next/link";
import { localize, getSubMenus, getContentItems } from "@/lib/data/content";
import type { MenuItem, Locale } from "@/lib/data/schema";

interface MenuLandingProps {
  menu: MenuItem;
  locale: Locale;
  basePath: string;
}

export function MenuLanding({ menu, locale, basePath }: MenuLandingProps) {
  const title = localize(menu.title, locale);
  const subMenus = getSubMenus(menu);
  const contentItems = getContentItems(menu);

  return (
    <section className="flex flex-1 flex-col p-4">
      <h1 className="text-2xl font-semibold text-[#4F3E2D]">{title}</h1>

      {subMenus.length > 0 && (
        <nav className="mt-4">
          <ul className="flex flex-wrap gap-3">
            {subMenus.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/${locale}/${basePath}/${sub.id}`}
                  className="inline-block rounded bg-[#4F3E2D] px-4 py-2 text-sm text-white transition-colors hover:bg-[#94B864]"
                  transitionTypes={["nav-forward"]}
                >
                  {localize(sub.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {contentItems.length > 0 && (
        <p className="mt-3 text-sm text-[#94B864]">
          {contentItems.length} {contentItems.length === 1 ? "item" : "items"}
        </p>
      )}
    </section>
  );
}
