import { WEB_TAB_NAME } from "@/lib/web-tab";

// White willow, upper side. The photograph is Dmitry Makeev's Salix alba herbarium
// scan (CC BY-SA 4.0), cut out so the stem and tip stay fixed and the middle stretches.
// https://commons.wikimedia.org/wiki/File:2020_year._Herbarium._Salix_alba._img-003.jpg

interface LaunchShapeProps {
  readonly href: string;
  readonly text: string;
  readonly self: boolean;
}

const leafStyle = {
  borderWidth: "0 86px 0 68px",
  borderStyle: "solid",
  borderColor: "transparent",
  borderImageSource: "url(/launch/white-willow.png)",
  borderImageSlice: "0 121 0 100 fill",
  borderImageWidth: "0 86px 0 68px",
  borderImageRepeat: "stretch",
  color: "#e7e4c2",
  textShadow: "0 0 4px rgba(14, 32, 8, 0.95), 0 0 4px rgba(14, 32, 8, 0.95)",
} as const;

export function LaunchShape({ href, text, self }: LaunchShapeProps) {
  return (
    <a
      href={href}
      target={self ? "_self" : WEB_TAB_NAME}
      data-component="LaunchShape"
      style={leafStyle}
      className="inline-flex h-[62px] min-w-[3.2rem] max-w-full items-center justify-center whitespace-nowrap bg-transparent px-1 text-[15px] leading-tight no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4F3E2D]"
    >
      {text}
    </a>
  );
}
