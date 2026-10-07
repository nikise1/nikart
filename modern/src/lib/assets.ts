import { STATIC_ORIGIN } from "./static-origin";

const STATIC_BASE = process.env.NEXT_PUBLIC_STATIC_BASE ?? STATIC_ORIGIN;
const CONTENT_BASE = "/content";

/**
 * Legacy HTML5 is served at `/html5/` (express.static adds the slash).
 * `_self/` links in data.json are relative to that document.
 */
const HTML5_DOCUMENT_URL = "https://self.invalid/html5/";

/**
 * The lizard movie is `/fl/main.ruffle.swf`. Flash resolves `_self/`
 * remainders (`../fl`, `en`) against the movie, not the HTML page.
 */
export const FLASH_MOVIE_URL = "https://self.invalid/fl/main.ruffle.swf";

export function resolveRootHref(relative: string, base: string): string {
  if (
    relative.startsWith("http://") ||
    relative.startsWith("https://") ||
    relative.startsWith("mailto:") ||
    relative.startsWith("javascript:")
  ) {
    return relative;
  }
  const resolved = new URL(relative, base);
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

/** Same-origin launch the SWF passes to `popWin` after stripping `_self/`. */
export function resolveFlashLaunchHref(filename: string): string {
  const trimmed = filename.trim();
  if (trimmed === "en" || trimmed === "es" || trimmed.startsWith("../")) {
    return resolveRootHref(trimmed, FLASH_MOVIE_URL);
  }
  return filename;
}

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

export function processUrl(url: string): { href: string; isSelf: boolean } {
  if (url.startsWith("_self/")) {
    // A relative remainder such as `../fl` follows the current route.
    // `/en/config/fl` would open `/en/fl`. Resolve against `/html5/` instead.
    return {
      href: resolveRootHref(url.slice(6), HTML5_DOCUMENT_URL),
      isSelf: true,
    };
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { href: `${STATIC_BASE}/${url}`, isSelf: false };
  }
  return { href: url, isSelf: false };
}
