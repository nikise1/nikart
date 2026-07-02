"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@/lib/gsap";
import gsap from "gsap";
import { imgSlideUrl, processUrl } from "@/lib/assets";
import { localize, localizeUrl } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";

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
  const [currentSlide, setCurrentSlide] = useState(0);

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

  function nextSlide() {
    setCurrentSlide((prev) => (prev + 1) % imgCount);
  }

  function prevSlide() {
    setCurrentSlide((prev) => (prev - 1 + imgCount) % imgCount);
  }

  return (
    <article ref={ref} className="flex flex-1 flex-col items-center p-4">
      <h1 className="text-center text-2xl font-semibold text-[#4F3E2D]">{title}</h1>

      {imgCount > 0 && (
        <div className="relative mt-4 flex h-[240px] w-full max-w-[320px] items-center justify-center overflow-hidden rounded sm:h-[300px] sm:max-w-[480px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={currentSlide}
            src={imgSlideUrl(item.id, currentSlide + 1)}
            alt={`${title} ${currentSlide + 1}`}
            className="h-full w-full object-contain"
          />
          {imgCount > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white hover:bg-black/60"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white hover:bg-black/60"
                aria-label="Next image"
              >
                ›
              </button>
              <span className="absolute bottom-2 right-2 rounded bg-black/40 px-2 py-0.5 text-xs text-white">
                {currentSlide + 1} / {imgCount}
              </span>
            </>
          )}
        </div>
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
