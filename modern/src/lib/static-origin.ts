const ORIGIN = "http://static.nikart.co.uk";

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
  return `${ORIGIN}/${segments.map(encodeURIComponent).join("/")}`;
}
