import catalogJson from "./swf-compare-catalog.json";
import { toProxiedStaticUrl } from "./awayfl-static";

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
  return `/swf-compare/pieces/${id}/index.html`;
}

/** Local movie URL under the committed compare-kit copy. */
export function pieceMovieUrl(id: string, swfPath: string): string {
  const trimmed = swfPath.trim();
  if (!trimmed) {
    return `/swf-compare/pieces/${id}/`;
  }
  if (trimmed.startsWith("/swf-compare/pieces/")) {
    return trimmed;
  }
  let path = trimmed;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    path = toProxiedStaticUrl(path) ?? path;
  }
  path = path.replace(/^\/static\//, "").replace(/^\.\//, "").replace(/^\//, "");
  return `/swf-compare/pieces/${id}/${path}`;
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
