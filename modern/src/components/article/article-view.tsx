"use client";

import { ViewTransition } from "react";
import { compareHrefForItem, compareHrefForSource } from "@/lib/swf-compare";
import { processUrl } from "@/lib/assets";
import { localize, localizeUrl } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";
import { Slideshow } from "@/components/slideshow/slideshow";
import { ContentTransition } from "@/components/content-transition/content-transition";

interface ArticleViewProps {
  item: ContentItem;
  locale: Locale;
}

export function ArticleView({ item, locale }: ArticleViewProps) {
  const title = localize(item.title, locale);
  const desc = localize(item.desc, locale);
  const launchText = localize(item.launch, locale);
  const rawUrl = localizeUrl(item.url, locale);

  const imgCount = item.imgs ?? 0;

  const processed = rawUrl ? processUrl(rawUrl) : undefined;
  const compareHref =
    compareHrefForItem(item.id) ??
    (processed ? compareHrefForSource(processed.href) : null);
  const link = processed
    ? compareHref
      ? { href: compareHref, isSelf: false }
      : processed
    : undefined;

  let slot = 0;
  const titleSlot = slot++;
  const slideshowSlot = imgCount > 0 ? slot++ : null;
  const descSlot = desc ? slot++ : null;
  const linkSlot = link && launchText ? slot++ : null;

  return (
    <ViewTransition enter="none" exit="none" update="none" share="none" default="none">
      <article data-component="ArticleView" className="flex flex-1 flex-col items-center p-4">
      <ContentTransition index={titleSlot}>
        <h1 className="w-[calc(100%-3.5rem)] self-end text-center text-2xl font-semibold text-[#4F3E2D] sm:w-auto sm:self-center">{title}</h1>
      </ContentTransition>

      {slideshowSlot !== null && (
        <ContentTransition index={slideshowSlot}>
          <Slideshow
            itemId={item.id}
            imgCount={imgCount}
            alt={title}
            className="mt-4 h-[240px] w-full max-w-[320px] sm:h-[300px] sm:max-w-[480px]"
          />
        </ContentTransition>
      )}

      {descSlot !== null && desc && (
        <ContentTransition index={descSlot}>
          <p className="mt-4 max-w-prose text-center text-[#4F3E2D]">{desc}</p>
        </ContentTransition>
      )}

      {linkSlot !== null && link && launchText && (
        <ContentTransition index={linkSlot}>
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
        </ContentTransition>
      )}
      </article>
    </ViewTransition>
  );
}
