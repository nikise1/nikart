"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ThumbnailItem } from "./thumbnail-item";
import type { MenuItem, Locale } from "@/lib/data/schema";

interface ThumbnailGridProps {
  menu: MenuItem;
  locale: Locale;
  basePath: string;
}

export function ThumbnailGrid({ menu, locale, basePath }: ThumbnailGridProps) {
  const ref = useRef<HTMLUListElement>(null);
  const items = menu.menu;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { x: 300 },
        { x: 0, duration: 0.6, delay: 0.2, ease: "power2.out", overwrite: true },
      );
    },
    { scope: ref, dependencies: [basePath] },
  );

  return (
    <ul ref={ref} data-component="ThumbnailGrid" className="my-10 ml-auto mr-4 flex flex-col gap-10 p-0">
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
