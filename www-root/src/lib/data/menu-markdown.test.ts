import { describe, expect, it } from "vitest";
import { menuMarkdown } from "../../../scripts/menu-markdown.mjs";

describe("menuMarkdown", () => {
  it("prints ids, English titles, and types", () => {
    const main = {
      menu: [
        {
          id: "featured",
          title: { en: "Featured Projects", es: "Proyectos" },
          menu: [
            "onedayinmay",
            { id: "install", title: { en: "Installations", es: "Instalaciones" }, menu: ["spark"] },
          ],
        },
        "contact",
        {
          id: "config",
          title: { en: "{{otherversions}} & Español", es: "{{otherversions}} y English" },
          menu: ["language"],
        },
      ],
    };
    const items = [
      { id: "onedayinmay", type: "web", title: "One Day in May" },
      { id: "spark", type: "vid", title: { en: "Spark", es: "Chispa" } },
      { id: "contact", type: "web", title: { en: "Contact", es: "Contacto" } },
      { id: "language", type: "web", title: { en: "Español", es: "English" } },
    ];

    expect(menuMarkdown(main, items)).toBe(
      [
        "### `featured` Featured Projects men",
        "",
        "- `onedayinmay` One Day in May web",
        "",
        "#### `install` Installations men",
        "",
        "- `spark` Spark vid",
        "",
        "### `contact` Contact web",
        "",
        "### `config` Config & Español men",
        "",
        "- `language` Español web",
        "",
      ].join("\n"),
    );
  });
});
