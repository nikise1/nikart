"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { gsap } from "@/lib/gsap";
import { imgSlideUrl } from "@/lib/assets";

interface SlideshowProps {
  itemId: string;
  imgCount: number;
  alt: string;
  className?: string;
}

type HoverZone = "left" | "middle" | "right";

const SLIDE_DURATION = 1.25;
const CROSSFADE_DURATION = 0.4;
const SWIPE_THRESHOLD_PX = 48;

export function Slideshow({ itemId, imgCount, alt, className }: SlideshowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSlideRef = useRef(0);
  const pointerStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const didSwipeRef = useRef(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoverZone, setHoverZone] = useState<HoverZone | null>(null);
  const paused = hoverZone === "middle";

  const goToSlide = useCallback(
    (index: number) => {
      if (!containerRef.current || imgCount <= 1) return;
      const next = ((index % imgCount) + imgCount) % imgCount;
      if (next === currentSlideRef.current) return;

      const slides = containerRef.current.querySelectorAll<HTMLImageElement>(".slide-img");
      const currentEl = slides[currentSlideRef.current];
      const nextEl = slides[next];
      if (!currentEl || !nextEl) return;

      gsap.to(currentEl, { autoAlpha: 0, duration: CROSSFADE_DURATION });
      gsap.to(nextEl, { autoAlpha: 1, duration: CROSSFADE_DURATION });
      currentSlideRef.current = next;
      setCurrentSlide(next);
    },
    [imgCount],
  );

  useEffect(() => {
    if (imgCount <= 1 || paused) return;
    const tween = gsap.delayedCall(SLIDE_DURATION + CROSSFADE_DURATION, () => {
      goToSlide(currentSlideRef.current + 1);
    });
    return () => {
      tween.kill();
    };
  }, [currentSlide, imgCount, paused, goToSlide]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    didSwipeRef.current = false;
    if (imgCount <= 1) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || start.id !== event.pointerId || imgCount <= 1) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;

    didSwipeRef.current = true;
    goToSlide(currentSlideRef.current + (dx < 0 ? 1 : -1));
    window.setTimeout(() => {
      didSwipeRef.current = false;
    }, 0);
  }

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!didSwipeRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    didSwipeRef.current = false;
  }

  if (imgCount <= 0) return null;

  return (
    <div data-component="Slideshow" className="flex w-full flex-col items-center">
      <div
        ref={containerRef}
        data-paused={paused ? "true" : "false"}
        data-hover-zone={hoverZone ?? "none"}
        role="region"
        aria-roledescription="carousel"
        aria-label={paused ? "Slideshow paused" : "Slideshow"}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStartRef.current = null;
        }}
        onClickCapture={onClickCapture}
        onMouseLeave={() => setHoverZone(null)}
        className={`relative overflow-hidden rounded select-none touch-pan-y ${className ?? ""}`}
      >
        {Array.from({ length: imgCount }, (_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={imgSlideUrl(itemId, i + 1)}
            alt={`${alt} ${i + 1}`}
            draggable={false}
            className="slide-img absolute inset-0 h-full w-full object-contain"
            style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
          />
        ))}

        {imgCount > 1 && (
          <>
            <button
              type="button"
              onMouseEnter={() => setHoverZone("left")}
              onClick={() => goToSlide(currentSlideRef.current - 1)}
              className="absolute inset-y-0 left-0 z-20 w-1/3 cursor-pointer"
              aria-label="Previous image"
            >
              <span
                className={`flex h-full w-full items-center justify-start bg-gradient-to-r from-black/65 via-black/20 to-transparent pl-2.5 text-4xl leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] transition-opacity duration-200 ${
                  hoverZone === "left" ? "opacity-100" : "opacity-0"
                }`}
              >
                ‹
              </span>
            </button>

            <div
              data-testid="slideshow-pause-zone"
              onMouseEnter={() => setHoverZone("middle")}
              className="absolute inset-y-0 left-1/3 z-20 w-1/3"
            >
              <div
                data-testid="slideshow-pause"
                aria-hidden="true"
                className={`pointer-events-none flex h-full items-center justify-center transition-opacity duration-300 ${
                  paused ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-2.5 shadow-sm backdrop-blur-[2px]">
                  <span className="h-4 w-[3px] rounded-sm bg-white/80" />
                  <span className="h-4 w-[3px] rounded-sm bg-white/80" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onMouseEnter={() => setHoverZone("right")}
              onClick={() => goToSlide(currentSlideRef.current + 1)}
              className="absolute inset-y-0 right-0 z-20 w-1/3 cursor-pointer"
              aria-label="Next image"
            >
              <span
                className={`flex h-full w-full items-center justify-end bg-gradient-to-l from-black/65 via-black/20 to-transparent pr-2.5 text-4xl leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] transition-opacity duration-200 ${
                  hoverZone === "right" ? "opacity-100" : "opacity-0"
                }`}
              >
                ›
              </span>
            </button>
          </>
        )}
      </div>

      {imgCount > 1 && (
        <button
          type="button"
          onClick={() => goToSlide(currentSlideRef.current + 1)}
          className="mt-2 cursor-pointer text-sm text-[#4F3E2D] hover:underline"
          aria-label="Advance slideshow"
        >
          {currentSlide + 1} / {imgCount}
        </button>
      )}
    </div>
  );
}
