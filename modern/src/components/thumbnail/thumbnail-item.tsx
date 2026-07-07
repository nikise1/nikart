"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@/lib/gsap";
import gsap from "gsap";
import { imgUrl } from "@/lib/assets";
import { localize } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";

interface ThumbnailItemProps {
  item: ContentItem;
  locale: Locale;
  href: string;
  index: number;
}

export function ThumbnailItem({ item, locale, href, index }: ThumbnailItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  const title = localize(item.title, locale);

  useGSAP(
    () => {
      gsap.set(ref.current, { scale: 0.4, opacity: 0.05 });
      gsap.to(ref.current, {
        scale: 1,
        opacity: 1,
        duration: 0.333,
        delay: 0.3 + index * 0.1,
        ease: "quad.in",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: ref },
  );

  return (
    <li ref={ref} className="group relative h-[100px] list-none">
      <Link href={href} className="flex h-full items-center" transitionTypes={["nav-forward"]}>
        <span className="w-[150px] pr-2.5 pt-8 text-right text-sm text-[#4F3E2D] transition-colors duration-300 group-hover:text-[#94B864]">
          {title}
        </span>
        <div className="relative h-[90px] w-[120px] overflow-hidden rounded border border-[rgba(28,107,0,0.5)] transition-all duration-300 group-hover:border-[#A8682B] group-hover:shadow-[0_0_3px_#A8682B]">
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
