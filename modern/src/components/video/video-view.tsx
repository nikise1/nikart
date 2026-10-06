"use client";

import { videoH264Url, videoWebmUrl, imgUrl } from "@/lib/assets";
import { localize } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";
import { ContentTransition } from "@/components/content-transition/content-transition";

interface VideoViewProps {
  item: ContentItem;
  locale: Locale;
}

export function VideoView({ item, locale }: VideoViewProps) {
  const title = localize(item.title, locale);

  return (
    <article data-component="VideoView" className="flex flex-1 flex-col items-center p-4">
      <ContentTransition index={0}>
        <h1 data-content-slot={0} className="text-center text-2xl font-semibold text-[#4F3E2D]">
          {title}
        </h1>
      </ContentTransition>

      <ContentTransition index={1}>
        <div data-content-slot={1} className="mt-4 w-full max-w-[480px]">
          <video
            controls
            poster={imgUrl(item.id)}
            className="w-full rounded"
            preload="metadata"
          >
            <source src={videoH264Url(item.id)} type="video/mp4" />
            <source src={videoWebmUrl(item.id)} type="video/webm" />
          </video>
        </div>
      </ContentTransition>
    </article>
  );
}
