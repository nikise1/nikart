"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";
import gsap from "gsap";
import { getContentItems } from "@/lib/data/content";
import { ThumbnailItem } from "./thumbnail-item";
import type { MenuItem, Locale } from "@/lib/data/schema";

interface ThumbnailGridProps {
  menu: MenuItem;
  locale: Locale;
  basePath: string;
}

export function ThumbnailGrid({ menu, locale, basePath }: ThumbnailGridProps) {
  const ref = useRef<HTMLUListElement>(null);
  const items = getContentItems(menu);

  useGSAP(
    () => {
      gsap.from(ref.current, {
        x: 300,
        duration: 0.4,
        ease: "power2.out",
      });
    },
    { scope: ref },
  );

  return (
    <ul ref={ref} className="grid grid-cols-2 gap-6 p-4 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item, index) => (
        <ThumbnailItem
          key={item.id}
          item={item}
          locale={locale}
          href={`/${locale}/${basePath}/${item.id}`}
          index={index}
        />
      ))}
    </ul>
  );
}
