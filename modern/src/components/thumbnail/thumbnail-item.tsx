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
      gsap.set(ref.current, { scale: 0.4, opacity: 0 });
      gsap.to(ref.current, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        delay: index * 0.08,
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
    <li ref={ref} className="group">
      <Link href={href} className="flex flex-col items-center gap-2" transitionTypes={["nav-forward"]}>
        <div className="relative h-[90px] w-[120px] overflow-hidden rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl(item.id)}
            alt={title}
            width={120}
            height={90}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <span className="text-center text-sm text-[#4F3E2D] transition-colors duration-300 group-hover:text-[#94B864]">
          {title}
        </span>
      </Link>
    </li>
  );
}
