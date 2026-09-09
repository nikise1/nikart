"use client";

import { Slideshow, type SlideshowAdvanceVariant } from "./slideshow";

const VARIANTS: { id: SlideshowAdvanceVariant; title: string; blurb: string }[] = [
  {
    id: "petiole",
    title: "Petiole tab",
    blurb: "A short S-curve stalk grows from the bottom centre into a leaf-bud that holds the count.",
  },
  {
    id: "notch",
    title: "Bottom-edge notch",
    blurb: "The bottom edge dips into a pointed leaf tip, as if the frame itself sprouted.",
  },
  {
    id: "tendril",
    title: "Corner tendril",
    blurb: "A vine curls out of the bottom-right corner and ends in a small loop around the count.",
  },
];

export function SlideshowAdvanceCompare() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 text-[#4F3E2D]">
      <h1 className="text-center text-2xl font-semibold">Slideshow advance</h1>
      <p className="mt-2 max-w-prose text-center text-sm">
        Three ways to grow the <span className="whitespace-nowrap">n / total</span> control out of the
        rectangle. Click each count to advance. Pick one and say which to keep.
      </p>

      <div className="mt-10 flex w-full max-w-[520px] flex-col items-center gap-16">
        {VARIANTS.map((variant) => (
          <section key={variant.id} className="flex w-full flex-col items-center">
            <h2 className="text-lg font-semibold">{variant.title}</h2>
            <p className="mb-4 max-w-prose text-center text-sm">{variant.blurb}</p>
            <Slideshow
              itemId="onedayinmay"
              imgCount={4}
              alt="One Day in May"
              advanceVariant={variant.id}
              className="h-[240px] w-full sm:h-[300px]"
            />
          </section>
        ))}
      </div>
    </main>
  );
}
