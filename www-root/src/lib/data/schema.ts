import { z } from "zod";

// --- Locale types ---

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

/** `{ en, es }` and nothing else. Compiled JSON rejects extra locale keys. */
export const LocaleTextSchema = z
  .object({
    en: z.string(),
    es: z.string(),
  })
  .strict();

/** A field that is either a plain string (same in both languages) or a locale map */
export const LocalizedStringSchema = z.union([z.string(), LocaleTextSchema]);
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

// --- Item types ---

export const itemTypes = ["web", "tex", "vid", "ima", "men", "main"] as const;
export type ItemType = (typeof itemTypes)[number];

// --- Content item (leaf node) ---

const BaseItemSchema = z
  .object({
    id: z.string(),
    type: z.enum(["web", "tex", "vid", "ima"]),
    title: LocalizedStringSchema,
    desc: LocalizedStringSchema.optional(),
    imgs: z.number().optional(),
    url: z.union([z.string(), LocaleTextSchema]).optional(),
    launch: LocalizedStringSchema.optional(),
    pop: z.string().optional(),
  })
  .strict();

export type ContentItem = z.infer<typeof BaseItemSchema>;

/** Flat source list. The same id is defined once even when several menus link to it. */
export const ItemsFileSchema = z.array(BaseItemSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate item id "${item.id}"`,
        path: [index, "id"],
      });
    }
    seen.add(item.id);
  });
});

// --- Menu item (branch node in the compiled tree) ---

export interface MenuItem {
  id: string;
  type: "men";
  title: LocalizedString;
  menu: (MenuItem | ContentItem)[];
}

const MenuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z
    .object({
      id: z.string(),
      type: z.literal("men"),
      title: LocalizedStringSchema,
      menu: z.array(z.union([MenuItemSchema, BaseItemSchema])),
    })
    .strict(),
);

// --- Source menu: links and order. A content id may appear in more than one menu. ---

export interface MenuBranch {
  id: string;
  title: LocalizedString;
  menu: MenuSourceNode[];
}

export type MenuSourceNode = string | MenuBranch;

export const MenuSourceNodeSchema: z.ZodType<MenuSourceNode> = z.lazy(() =>
  z.union([
    z.string(),
    z
      .object({
        id: z.string(),
        title: LocalizedStringSchema,
        menu: z.array(MenuSourceNodeSchema),
      })
      .strict(),
  ]),
);

export const MainFileSchema = z
  .object({
    success: z.literal(true),
    id: z.string(),
    title: z.string(),
    type: z.literal("main"),
    menu: z.array(MenuSourceNodeSchema),
  })
  .strict();

export type MainFile = z.infer<typeof MainFileSchema>;

// --- Generic UI strings (the compiled `other` object) ---

export const OtherSchema = z
  .object({
    back: LocaleTextSchema,
    high_spd: z.string(),
    high_txt: LocaleTextSchema,
    low_spd: z.string(),
    low_txt: LocaleTextSchema,
    quality: LocaleTextSchema,
  })
  .strict();

export type OtherText = z.infer<typeof OtherSchema>;

// --- Compiled root. Flash, legacy Backbone, and Next all read this document. ---

export const DataSchema = z
  .object({
    success: z.boolean(),
    id: z.string(),
    title: z.string(),
    type: z.literal("main"),
    menu: z.array(z.union([MenuItemSchema, BaseItemSchema])),
    other: OtherSchema,
  })
  .strict();

export type SiteData = z.infer<typeof DataSchema>;

/** Any node in the compiled tree */
export type DataNode = MenuItem | ContentItem;

/** Check if a node is a menu (branch) */
export function isMenuItem(node: DataNode): node is MenuItem {
  return node.type === "men";
}

/** Check if a node is a content item (leaf) */
export function isContentItem(node: DataNode): node is ContentItem {
  return node.type !== "men";
}
