"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@/lib/gsap";
import gsap from "gsap";
import { imgSlideUrl, processUrl } from "@/lib/assets";
import { localize, localizeUrl } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";

interface ArticleViewProps {
  item: ContentItem;
  locale: Locale;
}

const SLIDE_DURATION = 1.25;
const CROSSFADE_DURATION = 0.4;

export function ArticleView({ item, locale }: ArticleViewProps) {
  const ref = useRef<HTMLElement>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<gsap.core.Tween | null>(null);
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

  function crossfadeTo(nextIndex: number) {
    if (!slideshowRef.current || imgCount <= 1) return;
    const slides = slideshowRef.current.querySelectorAll<HTMLImageElement>(".slide-img");
    const currentEl = slides[currentSlide];
    const nextEl = slides[nextIndex];
    if (!currentEl || !nextEl) return;

    gsap.to(currentEl, { autoAlpha: 0, duration: CROSSFADE_DURATION });
    gsap.to(nextEl, { autoAlpha: 1, duration: CROSSFADE_DURATION });
    setCurrentSlide(nextIndex);
  }

  // Auto-advance slideshow
  useEffect(() => {
    if (imgCount <= 1) return;
    timerRef.current = gsap.delayedCall(SLIDE_DURATION + CROSSFADE_DURATION, () => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % imgCount;
        if (!slideshowRef.current) return prev;
        const slides = slideshowRef.current.querySelectorAll<HTMLImageElement>(".slide-img");
        const currentEl = slides[prev];
        const nextEl = slides[next];
        if (!currentEl || !nextEl) return prev;
        gsap.to(currentEl, { autoAlpha: 0, duration: CROSSFADE_DURATION });
        gsap.to(nextEl, { autoAlpha: 1, duration: CROSSFADE_DURATION });
        return next;
      });
    });
    return () => {
      timerRef.current?.kill();
    };
  }, [currentSlide, imgCount]);

  function goToSlide(index: number) {
    timerRef.current?.kill();
    crossfadeTo(index);
  }

  return (
    <article ref={ref} className="flex flex-1 flex-col items-center p-4">
      <h1 className="text-center text-2xl font-semibold text-[#4F3E2D]">{title}</h1>

      {imgCount > 0 && (
        <div
          ref={slideshowRef}
          className="relative mt-4 h-[240px] w-full max-w-[320px] overflow-hidden rounded sm:h-[300px] sm:max-w-[480px]"
        >
          {Array.from({ length: imgCount }, (_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={imgSlideUrl(item.id, i + 1)}
              alt={`${title} ${i + 1}`}
              className="slide-img absolute inset-0 h-full w-full object-contain"
              style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
            />
          ))}
          {imgCount > 1 && (
            <>
              <button
                onClick={() => goToSlide((currentSlide - 1 + imgCount) % imgCount)}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white hover:bg-black/60"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={() => goToSlide((currentSlide + 1) % imgCount)}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white hover:bg-black/60"
                aria-label="Next image"
              >
                ›
              </button>
              <span className="absolute bottom-2 right-2 z-10 rounded bg-black/40 px-2 py-0.5 text-xs text-white">
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
