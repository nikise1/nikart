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
}

export const swfCompareSources = catalogJson as SwfCompareSource[];

export function piecePageHref(id: string): string {
  return `/swf-compare/pieces/${id}/index.html`;
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
