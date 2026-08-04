"use client";

import { useNavStore } from "@/store/nav-store";
import { localize } from "@/lib/data/content";
import type { DataNode, Locale } from "@/lib/data/schema";

interface NavItemsProps {
  items: DataNode[];
  locale: Locale;
}

export function NavItems({ items, locale }: NavItemsProps) {
  const selectNavItem = useNavStore((s) => s.selectNavItem);

  function handleClick(id: string) {
    selectNavItem(`/${id}`);
  }

  return (
    <ul data-component="NavItems" className="relative top-[30px] left-0 hidden w-[20em] list-none p-0">
      {items.map((item) => {
        const title = localize(item.title, locale);
        return (
          <li key={item.id} className="nav-item flex h-8 items-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/content/img/stump.png"
              alt=""
              width={20}
              height={16}
              className="inline-block"
            />
            <button
              onClick={() => handleClick(item.id)}
              className="block w-full cursor-pointer whitespace-nowrap border-none bg-transparent px-2 py-1 text-left text-sm text-[#1C6B00] transition-all duration-300 hover:text-[#4F3E2D] hover:[text-shadow:0_0_2px_#cc813a]"
            >
              {title}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
