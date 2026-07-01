"use client";

import { localize } from "@/lib/data/content";
import { isMenuItem, type DataNode, type Locale } from "@/lib/data/schema";

interface ContentPageProps {
  node: DataNode;
  path: string[];
  locale: Locale;
}

export function ContentPage({ node, locale }: ContentPageProps) {
  const title = localize(node.title, locale);

  if (isMenuItem(node)) {
    return (
      <main className="flex-1 p-4">
        <h1 className="text-2xl font-semibold text-[#4F3E2D]">{title}</h1>
        <p className="mt-2 text-sm text-[#94B864]">Menu: {node.menu.length} items</p>
      </main>
    );
  }

  const desc = localize(node.desc, locale);

  return (
    <main className="flex-1 p-4">
      <h1 className="text-2xl font-semibold text-[#4F3E2D]">{title}</h1>
      {desc && <p className="mt-2 text-[#4F3E2D]">{desc}</p>}
    </main>
  );
}
