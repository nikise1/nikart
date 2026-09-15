const STATIC_HOST = "static.nikart.co.uk";
const STATIC_PREFIX = "/static/";

const FLASH_PATH_PREFIXES = ["games/", "banners/", "websites/", "3d/"];

export interface FlashEmbed {
  swfUrl: string;
  width: string;
  height: string;
  parameters: Record<string, string>;
  backgroundColor?: string;
}

export interface AwayFlPopupOptions {
  width?: number;
  height?: number;
  title?: string;
}

export function toProxiedStaticUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("mailto:")) {
    return null;
  }

  if (trimmed.startsWith("../static/")) {
    return `${STATIC_PREFIX}${trimmed.slice("../static/".length)}`;
  }

  if (trimmed.startsWith(STATIC_PREFIX)) {
    return trimmed;
  }

  if (trimmed.includes(STATIC_HOST)) {
    try {
      const url = new URL(trimmed);
      return `${STATIC_PREFIX}${url.pathname.replace(/^\//, "")}${url.search}`;
    } catch {
      return null;
    }
  }

  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("/")
  ) {
    return `${STATIC_PREFIX}${trimmed.replace(/^\.\//, "")}`;
  }

  return null;
}

export function isAwayFlLaunch(href: string): boolean {
  const proxied = toProxiedStaticUrl(href);
  if (!proxied) {
    return false;
  }

  const path = proxied.slice(STATIC_PREFIX.length).split("?")[0] ?? "";
  if (path.toLowerCase().endsWith(".dcr")) {
    return false;
  }

  return FLASH_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function buildAwayFlPopupUrl(
  source: string,
  options: AwayFlPopupOptions = {},
): string {
  const params = new URLSearchParams({ src: source });
  if (options.width) {
    params.set("w", String(options.width));
  }
  if (options.height) {
    params.set("h", String(options.height));
  }
  if (options.title) {
    params.set("title", options.title);
  }
  return `/fl/away?${params.toString()}`;
}

export function parsePopSize(
  pop: string | undefined,
): { width: number; height: number } | undefined {
  if (!pop) {
    return undefined;
  }
  const nums = pop.match(/\d+/g);
  if (!nums || nums.length < 2) {
    return undefined;
  }
  const width = Number(nums[0]);
  const height = Number(nums[1]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return undefined;
  }
  return { width, height };
}

export function parseFlashEmbed(
  html: string,
  pageUrl: string,
): FlashEmbed | null {
  const embedSwf = html.match(
    /embedSWF\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"][^'"]*['"]\s*,\s*['"]?([^'",\s]+)['"]?\s*,\s*['"]?([^'",\s)]+)/i,
  );
  if (embedSwf?.[1] && embedSwf[2] && embedSwf[3]) {
    return embedFromMovie(embedSwf[1], pageUrl, embedSwf[2], embedSwf[3]);
  }

  const swfObject1 = html.match(
    /new\s+SWFObject\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"][^'"]*['"]\s*,\s*['"]?([^'",\s]+)['"]?\s*,\s*['"]?([^'",\s)]+)/i,
  );
  if (swfObject1?.[1] && swfObject1[2] && swfObject1[3]) {
    const bg = html.match(/['"](#[0-9a-fA-F]{3,8})['"]\s*\)/);
    return embedFromMovie(
      swfObject1[1],
      pageUrl,
      swfObject1[2],
      swfObject1[3],
      bg?.[1],
    );
  }

  const movie = html.match(
    /(?:name=["']movie["'][^>]*value=["']([^"']+\.swf[^"']*)["']|value=["']([^"']+\.swf[^"']*)["'][^>]*name=["']movie["']|<(?:embed|EMBED)[^>]*src=["']([^"']+\.swf[^"']*)["'])/i,
  );
  const moviePath = movie?.[1] ?? movie?.[2] ?? movie?.[3];
  if (moviePath) {
    return embedFromMovie(moviePath, pageUrl, "100%", "100%");
  }

  const acFl = parseAcFlRunContent(html, pageUrl);
  if (acFl) {
    return acFl;
  }

  return null;
}

export function siblingSwfCandidates(pageUrl: string): string[] {
  const url = new URL(pageUrl, "http://localhost");
  const dir = url.pathname.replace(/\/[^/]*$/, "/");
  return [`${dir}Main.swf`, `${dir}main.swf`];
}

function parseAcFlRunContent(html: string, pageUrl: string): FlashEmbed | null {
  const blocks = html.matchAll(/AC_FL_RunContent\s*\(([\s\S]*?)\)\s*;/gi);
  let best: FlashEmbed | null = null;
  for (const block of blocks) {
    const body = block[1] ?? "";
    const src = acFlArg(body, "src");
    if (!src || /playerProductInstall/i.test(src)) {
      continue;
    }
    const movie = src.toLowerCase().endsWith(".swf") ? src : `${src}.swf`;
    const width = acFlArg(body, "width") ?? "100%";
    const height = acFlArg(body, "height") ?? "100%";
    const backgroundColor = acFlArg(body, "bgcolor");
    best = embedFromMovie(movie, pageUrl, width, height, backgroundColor);
  }
  return best;
}

function acFlArg(body: string, key: string): string | undefined {
  const match = body.match(
    new RegExp(`['"]${key}['"]\\s*,\\s*['"]([^'"]*)['"]`, "i"),
  );
  return match?.[1];
}

function embedFromMovie(
  movie: string,
  pageUrl: string,
  width: string,
  height: string,
  backgroundColor?: string,
): FlashEmbed {
  const resolved = new URL(movie, pageUrl);
  const parameters: Record<string, string> = {};
  resolved.searchParams.forEach((value, key) => {
    parameters[key] = value;
  });

  return {
    swfUrl: `${resolved.pathname}${resolved.search}`,
    width,
    height,
    parameters,
    ...(backgroundColor ? { backgroundColor } : {}),
  };
}
