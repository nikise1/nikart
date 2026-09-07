"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { processUrl } from "@/lib/assets";
import { localize, localizeUrl } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";
import { Slideshow } from "@/components/slideshow/slideshow";

interface ArticleViewProps {
  item: ContentItem;
  locale: Locale;
}

export function ArticleView({ item, locale }: ArticleViewProps) {
  const ref = useRef<HTMLElement>(null);
  const title = localize(item.title, locale);
  const desc = localize(item.desc, locale);
  const launchText = localize(item.launch, locale);
  const rawUrl = localizeUrl(item.url, locale);

  const imgCount = item.imgs ?? 0;

  const link = rawUrl ? processUrl(rawUrl) : undefined;

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
    <article ref={ref} data-component="ArticleView" className="flex flex-1 flex-col items-center p-4">
      <h1 className="text-center text-2xl font-semibold text-[#4F3E2D]">{title}</h1>

      {imgCount > 0 && (
        <Slideshow
          itemId={item.id}
          imgCount={imgCount}
          alt={title}
          className="mt-4 h-[240px] w-full max-w-[320px] sm:h-[300px] sm:max-w-[480px]"
        />
      )}

      {desc && <p className="mt-4 max-w-prose text-center text-[#4F3E2D]">{desc}</p>}

      {link && launchText && (
        <p className="mt-4">
          <a
            href={link.href}
            target={link.isSelf ? "_self" : "_blank"}
            rel={link.isSelf ? undefined : "noopener noreferrer"}
            className="rounded bg-[#94B864] px-4 py-2 text-white transition-colors hover:bg-[#7DA04E]"
          >
            {launchText}
          </a>
        </p>
      )}
    </article>
  );
}
