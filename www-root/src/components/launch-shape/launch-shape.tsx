import type { ReactNode } from "react";
import { WEB_TAB_NAME } from "@/lib/web-tab";

interface LaunchShapeProps {
  readonly variant: "leaf" | "seed";
  readonly href: string;
  readonly text: string;
  readonly self: boolean;
}

const captions = {
  leaf: "Willow leaf",
  seed: "Seed",
} as const;

const fillClass =
  "fill-[#E7E4C2] transition-colors group-hover:fill-[#4F3E2D] group-focus-visible:fill-[#4F3E2D] motion-reduce:transition-none";
const lineClass =
  "fill-none stroke-[#4F3E2D] [stroke-width:1.5] [stroke-linecap:round] [stroke-linejoin:round] [vector-effect:non-scaling-stroke]";
const veinClass =
  "fill-none stroke-[#8C7356] [stroke-width:1] [stroke-linecap:round] [vector-effect:non-scaling-stroke] transition-colors group-hover:stroke-[#C4B48A] group-focus-visible:stroke-[#C4B48A] motion-reduce:transition-none";
const scarClass =
  "fill-[#C4B48A] transition-colors group-hover:fill-[#6B5340] group-focus-visible:fill-[#6B5340] motion-reduce:transition-none";
const bodyClass =
  "relative z-[1] -mx-0.5 flex min-w-[4.25rem] items-center justify-center border-y-[1.5px] border-[#4F3E2D] bg-[#E7E4C2] px-1 py-2 text-center text-[15px] leading-tight transition-colors group-hover:bg-[#4F3E2D] group-focus-visible:bg-[#4F3E2D] motion-reduce:transition-none";

export function LaunchShape({ variant, href, text, self }: LaunchShapeProps) {
  const caption = captions[variant];

  return (
    <span className="flex max-w-full flex-col items-center gap-1.5">
      <a
        href={href}
        target={self ? "_self" : WEB_TAB_NAME}
        aria-label={`${text}, ${caption}`}
        data-component="LaunchShape"
        data-variant={variant}
        className="group inline-flex max-w-full items-stretch text-[#4F3E2D] no-underline hover:text-[#E7E4C2] focus-visible:text-[#E7E4C2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4F3E2D]"
      >
        {variant === "leaf" ? <LeafCaps /> : <SeedCaps />}
        <span className={bodyClass}>{text}</span>
        {variant === "leaf" ? <LeafTip /> : <SeedTip />}
      </a>
      <span className="text-xs text-[#4F3E2D]">{caption}</span>
    </span>
  );
}

interface CapProps {
  readonly widthClass: string;
  readonly children: ReactNode;
}

function Cap({ widthClass, children }: CapProps) {
  return <span className={`relative shrink-0 self-stretch ${widthClass}`}>{children}</span>;
}

interface ShapeSvgProps {
  readonly viewBox: string;
  readonly children: ReactNode;
}

function ShapeSvg({ viewBox, children }: ShapeSvgProps) {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      {children}
    </svg>
  );
}

function LeafCaps() {
  return (
    <Cap widthClass="w-11">
      <ShapeSvg viewBox="0 0 48 64">
        <path className={fillClass} d="M48 0 C32 6 20 18 15 32 C20 46 32 58 48 64 Z" />
        <path className={lineClass} d="M48 2 C32 6 20 18 15 32 C20 46 32 58 48 62" />
        <path className={lineClass} d="M1 33.5 C7 31 12 32 16 32" />
        <path className={veinClass} d="M18 32 H46" />
      </ShapeSvg>
    </Cap>
  );
}

function LeafTip() {
  return (
    <Cap widthClass="w-9">
      <ShapeSvg viewBox="0 0 40 64">
        <path className={fillClass} d="M0 0 C16 8 30 20 38 32 C30 44 16 56 0 64 Z" />
        <path className={lineClass} d="M0 2 C16 8 30 20 38 32 C30 44 16 56 0 62" />
        <path className={veinClass} d="M2 32 H26" />
      </ShapeSvg>
    </Cap>
  );
}

function SeedCaps() {
  return (
    <Cap widthClass="w-8">
      <ShapeSvg viewBox="0 0 36 64">
        <path className={fillClass} d="M36 0 C16 2 5 15 5 32 C5 49 16 62 36 64 Z" />
        <path className={lineClass} d="M36 2 C16 2 5 15 5 32 C5 49 16 62 36 62" />
        <ellipse className={scarClass} cx="11" cy="32" rx="2.4" ry="5.5" />
      </ShapeSvg>
    </Cap>
  );
}

function SeedTip() {
  return (
    <Cap widthClass="w-[30px]">
      <ShapeSvg viewBox="0 0 34 64">
        <path className={fillClass} d="M0 0 C16 4 28 16 33 32 C28 48 16 60 0 64 Z" />
        <path className={lineClass} d="M0 2 C16 4 28 16 33 32 C28 48 16 60 0 62" />
      </ShapeSvg>
    </Cap>
  );
}
