import { describe, expect, it } from "vitest";
import { menuMarkdown } from "./menu-markdown";
import type { DataNode } from "./schema";

describe("menuMarkdown", () => {
  it("prints ids and types", () => {
    const menu: DataNode[] = [
      {
        id: "featured",
        type: "men",
        title: { en: "Featured Projects", es: "Proyectos" },
        menu: [
          { id: "onedayinmay", type: "web", title: "One Day in May" },
          {
            id: "install",
            type: "men",
            title: { en: "Installations", es: "Instalaciones" },
            menu: [{ id: "spark", type: "vid", title: { en: "Spark", es: "Chispa" } }],
          },
        ],
      },
      { id: "contact", type: "web", title: { en: "Contact", es: "Contacto" } },
      {
        id: "config",
        type: "men",
        title: { en: "{{otherversions}} & Español", es: "{{otherversions}} y English" },
        menu: [{ id: "language", type: "web", title: { en: "Español", es: "English" } }],
      },
    ];

    expect(menuMarkdown(menu)).toBe(
      [
        "### `featured` men",
        "",
        "- `onedayinmay` web",
        "",
        "#### `install` men",
        "",
        "- `spark` vid",
        "",
        "### `contact` web",
        "",
        "### `config` men",
        "",
        "- `language` web",
        "",
      ].join("\n"),
    );
  });
});
