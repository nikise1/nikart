import { z } from "zod";

// --- Locale types ---

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

/** A field that is either a plain string (same in both languages) or a locale map */
export const LocalizedStringSchema = z.union([
  z.string(),
  z.object({ en: z.string(), es: z.string() }),
]);
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

// --- Item types ---

export const itemTypes = ["web", "tex", "vid", "ima", "men", "main"] as const;
export type ItemType = (typeof itemTypes)[number];

// --- Content item (leaf node) ---

const BaseItemSchema = z.object({
  id: z.string(),
  type: z.enum(["web", "tex", "vid", "ima"]),
  title: LocalizedStringSchema,
  desc: LocalizedStringSchema.optional(),
  imgs: z.number().optional(),
  url: z.union([z.string(), z.object({ en: z.string(), es: z.string() })]).optional(),
  launch: LocalizedStringSchema.optional(),
  pop: z.string().optional(),
});

export type ContentItem = z.infer<typeof BaseItemSchema>;

// --- Menu item (branch node) ---

export interface MenuItem {
  id: string;
  type: "men";
  title: LocalizedString;
  menu: (MenuItem | ContentItem)[];
}

const MenuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.literal("men"),
    title: LocalizedStringSchema,
    menu: z.array(z.union([MenuItemSchema, BaseItemSchema])),
  }),
);

// --- Root data ---

export const DataSchema = z.object({
  success: z.boolean(),
  id: z.string(),
  title: z.string(),
  type: z.literal("main"),
  menu: z.array(z.union([MenuItemSchema, BaseItemSchema])),
  other: z.object({
    back: z.object({ en: z.string(), es: z.string() }),
    high_spd: z.string(),
    high_txt: z.object({ en: z.string(), es: z.string() }),
    low_spd: z.string(),
    low_txt: z.object({ en: z.string(), es: z.string() }),
    quality: z.object({ en: z.string(), es: z.string() }),
  }),
});

export type SiteData = z.infer<typeof DataSchema>;

/** Any node in the tree */
export type DataNode = MenuItem | ContentItem;

/** Check if a node is a menu (branch) */
export function isMenuItem(node: DataNode): node is MenuItem {
  return node.type === "men";
}

/** Check if a node is a content item (leaf) */
export function isContentItem(node: DataNode): node is ContentItem {
  return node.type !== "men";
}
