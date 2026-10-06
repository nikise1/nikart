"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { imgUrl } from "@/lib/assets";
import { localize } from "@/lib/data/content";
import type { DataNode, Locale } from "@/lib/data/schema";

interface ThumbnailItemProps {
  readonly item: DataNode;
  readonly locale: Locale;
  readonly href: string;
  readonly index: number;
}

export function ThumbnailItem({ item, locale, href, index }: ThumbnailItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const isInViewRef = useRef(false);
  const title = localize(item.title, locale);

  const resetAni = () => {
    if (!imgRef.current) return;
    gsap.killTweensOf(imgRef.current);
    gsap.set(imgRef.current, { scale: 0.4, opacity: 0.05 });
  };

  const playAni = () => {
    if (!imgRef.current) return;
    gsap.to(imgRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.333,
      delay: Math.min(index * 0.02, 0.12),
      ease: "quad.in",
      overwrite: true,
    });
  };

  useGSAP(
    () => {
      const itemEl = ref.current;
      resetAni();

      if (!itemEl) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;

          if (entry.isIntersecting) {
            if (isInViewRef.current) return;
            isInViewRef.current = true;
            playAni();
            return;
          }

          // Skip reset when a hidden ancestor (e.g. nav open) clips the item — avoids replay on unhide.
          if (itemEl.offsetParent === null) return;

          isInViewRef.current = false;
          resetAni();
        },
        { threshold: 0.01 },
      );

      observer.observe(itemEl);

      return () => {
        observer.disconnect();
        isInViewRef.current = false;
      };
    },
    { scope: ref, dependencies: [item.id] },
  );

  return (
    <li ref={ref} data-component="ThumbnailItem" className="group relative h-[100px] list-none">
      <Link href={href} className="flex h-full items-center" transitionTypes={["nav-forward"]}>
        <span className="w-[150px] pr-2.5 pt-8 text-right text-sm text-[#4F3E2D] transition-colors duration-300 group-hover:text-[#94B864]">
          {title}
        </span>
        <div ref={imgRef} className="relative h-[90px] w-[120px] overflow-hidden rounded border border-[rgba(28,107,0,0.5)] transition-all duration-300 group-hover:border-[#A8682B] group-hover:shadow-[0_0_3px_#A8682B]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl(item.id)}
            alt={title}
            width={120}
            height={90}
            className="h-full w-full object-cover"
          />
        </div>
      </Link>
    </li>
  );
}
