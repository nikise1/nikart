import { BACKGROUND_FERN_COLOR, backgroundFern } from "@/lib/background-fern";

/** Fiddlehead in the nav's brown, sitting on the photo at the bottom left. */
export function BackgroundFern() {
  return (
    <svg
      data-component="BackgroundFern"
      aria-hidden="true"
      viewBox={backgroundFern.viewBox}
      className="pointer-events-none fixed bottom-0 left-0 -z-10 h-[min(50vh,460px)] w-auto"
    >
      <path d={backgroundFern.path} fill={BACKGROUND_FERN_COLOR} />
    </svg>
  );
}
