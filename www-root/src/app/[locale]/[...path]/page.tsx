import { findByPath } from "@/lib/data/content";
import { slideshowMaxFrom } from "@/lib/data/image-size";
import { isContentItem } from "@/lib/data/schema";
import { posterDirs, videoPosterUrl } from "@/lib/video-poster";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content-page";

interface PathPageProps {
  params: Promise<{ locale: string; path: string[] }>;
}

export default async function PathPage({ params }: PathPageProps) {
  const { locale, path } = await params;
  const { node } = findByPath(path);

  if (!node) {
    notFound();
  }

  const poster = node.type === "vid" ? videoPosterUrl(node.id) : null;
  const slideCount = isContentItem(node) && node.type !== "vid" ? node.imgs : undefined;
  const max = slideCount ? slideshowMaxFrom(posterDirs(), node.id, slideCount) : null;
  if (slideCount && !max) {
    throw new Error(`Cannot measure slides for ${node.id}`);
  }

  return (
    <ContentPage
      node={node}
      path={path}
      locale={locale as "en" | "es"}
      poster={poster}
      {...(max ? { maxW: max.width, maxH: max.height } : {})}
    />
  );
}
