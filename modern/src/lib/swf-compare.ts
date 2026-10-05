import catalogJson from "./swf-compare-catalog.json";
import { toProxiedStaticUrl } from "./awayfl-static";
import { STATIC_ORIGIN } from "./static-origin";

export interface SwfCompareSource {
  id: string;
  title: string;
  group: string;
  itemId: string;
  wrapper: string;
  primary?: boolean;
  width: number;
  height: number;
  localSwf?: string;
  loaderUrl?: string;
  base?: string;
}

export const swfCompareSources = catalogJson as SwfCompareSource[];

/** Catalog JSON order. Extra movies from one wrapper (`id__name`) follow that source. */
export function orderComparePieceIds(existingIds: readonly string[]): string[] {
  const remaining = new Set(existingIds);
  const ordered: string[] = [];
  for (const source of swfCompareSources) {
    if (remaining.has(source.id)) {
      ordered.push(source.id);
      remaining.delete(source.id);
    }
    const extras = [...remaining]
      .filter((id) => id.startsWith(`${source.id}__`))
      .sort((a, b) => a.localeCompare(b));
    for (const id of extras) {
      ordered.push(id);
      remaining.delete(id);
    }
  }
  ordered.push(...[...remaining].sort((a, b) => a.localeCompare(b)));
  return ordered;
}

export function piecePageHref(id: string): string {
  return `/swf-compare/${id}/index.html`;
}

function compareSourceForId(id: string): SwfCompareSource | undefined {
  return (
    swfCompareSources.find((source) => source.id === id) ??
    swfCompareSources.find((source) => id.startsWith(`${source.id}__`))
  );
}

function originMoviePath(id: string, swfPath: string): string {
  let path = swfPath.trim();
  const localPrefix = `/swf-compare/pieces/${id}/`;
  if (path.startsWith(localPrefix)) {
    path = path.slice(localPrefix.length);
  } else if (path.startsWith("/swf-compare/pieces/")) {
    path = path.replace(/^\/swf-compare\/pieces\/[^/]+\//, "");
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      if (url.hostname === "static.nikart.co.uk") {
        path = url.pathname.replace(/^\//, "");
      } else {
        path = toProxiedStaticUrl(path) ?? path;
      }
    } catch {
      path = toProxiedStaticUrl(path) ?? path;
    }
  }
  return path.replace(/^\/static\//, "").replace(/^\.\//, "").replace(/^\//, "");
}

/** Movie URL: local `/fl` for lizard, otherwise HTTPS origin. */
export function pieceMovieUrl(id: string, swfPath: string): string {
  const source = compareSourceForId(id);
  if (source?.localSwf) {
    return source.localSwf;
  }
  const trimmed = swfPath.trim();
  if (!trimmed) {
    return `${STATIC_ORIGIN}/`;
  }
  return `${STATIC_ORIGIN}/${originMoviePath(id, trimmed)}`;
}

/** Ruffle/AwayFL Loader base: `/fl/` for lizard, otherwise the origin movie directory. */
export function pieceMovieBase(id: string, swfPath: string): string {
  const source = compareSourceForId(id);
  if (source?.base) {
    return source.base;
  }
  return pieceMovieUrl(id, swfPath).replace(/[^/]+$/, "");
}

export function compareIndexHref(hash?: string): string {
  return hash ? `/swf-compare/index.html#${hash}` : "/swf-compare/index.html";
}

export function compareHrefForItem(itemId: string): string | null {
  const pieces = swfCompareSources.filter((piece) => piece.itemId === itemId);
  if (pieces.length === 0) {
    return null;
  }
  const primary = pieces.find((piece) => piece.primary);
  if (primary) {
    return piecePageHref(primary.id);
  }
  if (pieces.length > 1) {
    return compareIndexHref(pieces[0]?.group ?? itemId);
  }
  const first = pieces[0];
  return first ? piecePageHref(first.id) : null;
}

export function compareHrefForSource(href: string): string | null {
  const proxied = toProxiedStaticUrl(href);
  if (!proxied) {
    return null;
  }
  const path = proxied.replace(/^\/static\//, "").split("?")[0] ?? "";
  const match = swfCompareSources.find((piece) => piece.wrapper === path);
  if (!match) {
    return compareHrefForItemPath(path);
  }
  if (match.primary) {
    return piecePageHref(match.id);
  }
  const siblings = swfCompareSources.filter(
    (piece) => piece.itemId === match.itemId,
  );
  if (siblings.length > 1 && !siblings.some((piece) => piece.primary)) {
    return compareIndexHref(match.group);
  }
  return piecePageHref(match.id);
}

function compareHrefForItemPath(path: string): string | null {
  const match = swfCompareSources.find(
    (piece) =>
      path === piece.wrapper ||
      path.startsWith(piece.wrapper.replace(/\/[^/]+$/, "/")),
  );
  return match ? compareHrefForItem(match.itemId) : null;
}
