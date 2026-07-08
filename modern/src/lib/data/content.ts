import {
  type ContentItem,
  type DataNode,
  type Locale,
  type LocalizedString,
  type MenuItem,
  isMenuItem,
} from "./schema";
import { siteData } from "./index";

/** Resolve a LocalizedString to the correct locale */
export function localize(value: LocalizedString | undefined, locale: Locale): string {
  if (value === undefined) return "";
  const raw = typeof value === "string" ? value : value[locale];
  return raw.replace("{{otherversions}}", "Config");
}

/** Resolve a possibly-localized URL */
export function localizeUrl(
  url: string | { en: string; es: string } | undefined,
  locale: Locale,
): string | undefined {
  if (url === undefined) return undefined;
  if (typeof url === "string") return url;
  return url[locale];
}

/**
 * Find a node by path of IDs from the root menu.
 * Returns the node and its ancestors (breadcrumb trail).
 */
export function findByPath(path: string[]): {
  node: DataNode | undefined;
  breadcrumbs: DataNode[];
} {
  let current: DataNode[] = siteData.menu;
  const breadcrumbs: DataNode[] = [];

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    const found = current.find((item) => item.id === segment);

    if (!found) {
      return { node: undefined, breadcrumbs };
    }

    breadcrumbs.push(found);

    if (i < path.length - 1) {
      if (!isMenuItem(found)) {
        return { node: undefined, breadcrumbs };
      }
      current = found.menu;
    } else {
      return { node: found, breadcrumbs };
    }
  }

  return { node: undefined, breadcrumbs };
}

/** Find a node by a single ID anywhere in the tree (depth-first) */
export function findById(id: string, nodes: DataNode[] = siteData.menu): DataNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (isMenuItem(node)) {
      const found = findById(id, node.menu);
      if (found) return found;
    }
  }
  return undefined;
}

/** Get the path (array of IDs) to a node by its ID */
export function getPathTo(id: string, nodes: DataNode[] = siteData.menu): string[] | undefined {
  for (const node of nodes) {
    if (node.id === id) return [node.id];
    if (isMenuItem(node)) {
      const subPath = getPathTo(id, node.menu);
      if (subPath) return [node.id, ...subPath];
    }
  }
  return undefined;
}

/** Get all content items (leaves) from a menu node */
export function getContentItems(node: MenuItem): ContentItem[] {
  return node.menu.filter((child): child is ContentItem => !isMenuItem(child));
}

/** Get all child menus from a menu node */
export function getSubMenus(node: MenuItem): MenuItem[] {
  return node.menu.filter((child): child is MenuItem => isMenuItem(child));
}

/** Get the top-level menu items */
export function getTopMenu(): DataNode[] {
  return siteData.menu;
}

/**
 * Generate breadcrumb data for a given path.
 * Returns array of { id, title, path } objects.
 */
export function getBreadcrumbs(
  path: string[],
  locale: Locale,
): { id: string; title: string; path: string }[] {
  const { breadcrumbs } = findByPath(path);
  return breadcrumbs.map((node, index) => ({
    id: node.id,
    title: localize(node.title, locale),
    path: path.slice(0, index + 1).join("/"),
  }));
}
