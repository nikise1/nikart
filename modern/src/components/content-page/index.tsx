"use client";

import { getContentItems } from "@/lib/data/content";
import { isMenuItem, type DataNode, type Locale } from "@/lib/data/schema";
import { ThumbnailGrid } from "@/components/thumbnail/thumbnail-grid";
import { ArticleView } from "@/components/article/article-view";
import { VideoView } from "@/components/video/video-view";
import { MenuLanding } from "@/components/menu-landing/menu-landing";

interface ContentPageProps {
  node: DataNode;
  path: string[];
  locale: Locale;
}

export function ContentPage({ node, path, locale }: ContentPageProps) {
  const basePath = path.join("/");

  if (isMenuItem(node)) {
    const hasContentItems = getContentItems(node).length > 0;

    if (hasContentItems) {
      return (
        <main className="flex flex-1 flex-col">
          <ThumbnailGrid menu={node} locale={locale} basePath={basePath} />
        </main>
      );
    }

    return (
      <main className="flex-1">
        <MenuLanding menu={node} locale={locale} basePath={basePath} />
      </main>
    );
  }

  if (node.type === "vid") {
    return (
      <main className="flex-1">
        <VideoView item={node} locale={locale} />
      </main>
    );
  }

  return (
    <main className="flex-1">
      <ArticleView item={node} locale={locale} />
    </main>
  );
}
