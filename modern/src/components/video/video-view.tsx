"use client";

import { useRef } from "react";
import { useGSAP } from "@/lib/gsap";
import gsap from "gsap";
import { videoH264Url, videoWebmUrl, imgUrl } from "@/lib/assets";
import { localize } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";

interface VideoViewProps {
  item: ContentItem;
  locale: Locale;
}

export function VideoView({ item, locale }: VideoViewProps) {
  const ref = useRef<HTMLElement>(null);
  const title = localize(item.title, locale);

  useGSAP(
    () => {
      gsap.from(ref.current, {
        autoAlpha: 0,
        duration: 0.4,
      });
    },
    { scope: ref },
  );

  return (
    <article ref={ref} className="flex flex-1 flex-col items-center p-4">
      <h1 className="text-center text-2xl font-semibold text-[#4F3E2D]">{title}</h1>

      <div className="mt-4 w-full max-w-[480px]">
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
    </article>
  );
}
