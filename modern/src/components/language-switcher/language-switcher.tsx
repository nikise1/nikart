"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/navigation";
import type { Locale } from "@/lib/data/schema";

interface LanguageSwitcherProps {
  locale: Locale;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();

  // Get the path after the locale prefix
  const segments = pathname.split("/").filter(Boolean);
  const contentPath = "/" + segments.slice(1).join("/");

  const otherLocale: Locale = locale === "en" ? "es" : "en";
  const label = locale === "en" ? "Español" : "English";

  return (
    <Link
      href={contentPath || "/"}
      locale={otherLocale}
      data-component="LanguageSwitcher"
      className="fixed bottom-4 left-4 z-50 text-sm text-[#1C6B00] transition-colors hover:text-[#A8682B]"
    >
      {label}
    </Link>
  );
}
