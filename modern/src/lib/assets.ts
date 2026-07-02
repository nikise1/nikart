const STATIC_BASE = "https://static.nikart.co.uk";
const CONTENT_BASE = `${STATIC_BASE}/content`;

export function imgUrl(id: string): string {
  return `${CONTENT_BASE}/img/${id}.jpg`;
}

export function imgSlideUrl(id: string, index: number): string {
  return `${CONTENT_BASE}/img/${id}_${index}.jpg`;
}

export function videoH264Url(id: string): string {
  return `${STATIC_BASE}/video_h264/${id}.mp4`;
}

export function videoWebmUrl(id: string): string {
  return `${STATIC_BASE}/video_webm/${id}.webm`;
}

export function processUrl(
  url: string,
): { href: string; isSelf: boolean } {
  if (url.startsWith("_self/")) {
    return { href: url.slice(6), isSelf: true };
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { href: `${STATIC_BASE}/${url}`, isSelf: false };
  }
  return { href: url, isSelf: false };
}
