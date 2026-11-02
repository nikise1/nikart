"use client";

import { ViewTransition } from "react";
import { videoH264Url, videoWebmUrl, imgUrl } from "@/lib/assets";
import { localize } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";
import { ContentDescription } from "@/components/content-description/content-description";
import { ContentTitle } from "@/components/content-title/content-title";
import { ContentTransition } from "@/components/content-transition/content-transition";

interface VideoViewProps {
  item: ContentItem;
  locale: Locale;
}

export function VideoView({ item, locale }: VideoViewProps) {
  const title = localize(item.title, locale);
  const desc = localize(item.desc, locale);

  let slot = 0;
  const titleSlot = slot++;
  const playerSlot = slot++;
  const descSlot = desc ? slot++ : null;

  return (
    <ViewTransition enter="none" exit="none" update="none" share="none" default="none">
      <article data-component="VideoView" className="flex flex-1 flex-col items-center p-4">
        <ContentTransition index={titleSlot}>
          <ContentTitle text={title} />
        </ContentTransition>

        <ContentTransition index={playerSlot}>
          <div className="mt-4 w-full max-w-[480px]">
            <video controls poster={imgUrl(item.id)} className="w-full rounded" preload="metadata">
              <source src={videoH264Url(item.id)} type="video/mp4" />
              <source src={videoWebmUrl(item.id)} type="video/webm" />
            </video>
          </div>
        </ContentTransition>

        {descSlot !== null && desc && (
          <ContentTransition index={descSlot}>
            <ContentDescription text={desc} />
          </ContentTransition>
        )}
      </article>
    </ViewTransition>
  );
}
