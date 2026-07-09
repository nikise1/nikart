"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";
import gsap from "gsap";
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
      gsap.from(ref.current, {
        x: 300,
        duration: 0.6,
        delay: 0.2,
        ease: "power2.out",
      });
    },
    { scope: ref },
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
