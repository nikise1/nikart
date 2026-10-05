export const STATIC_ORIGIN_HOST = "static.nikart.co.uk";
export const STATIC_ORIGIN = `https://${STATIC_ORIGIN_HOST}`;

export function originStaticUrl(segments: string[]): string | null {
  if (segments.length === 0) {
    return null;
  }
  for (const segment of segments) {
    if (!segment || segment === "." || segment === "..") {
      return null;
    }
    if (segment.includes("/") || segment.includes("\\")) {
      return null;
    }
  }
  return `${STATIC_ORIGIN}/${segments.map(encodeURIComponent).join("/")}`;
}
