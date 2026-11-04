import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const jsonDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "content", "json");

function english(title) {
  const text = typeof title === "string" ? title : title.en;
  return text.replaceAll("{{otherversions}}", "Config");
}

function leaf(id, items) {
  const item = items.get(id);
  const title = item ? english(item.title) : id;
  const type = item?.type ?? "?";
  return `- \`${id}\` ${title} ${type}`;
}

function section(node, items, depth) {
  if (typeof node === "string") {
    if (depth > 0) return [leaf(node, items)];
    const item = items.get(node);
    const title = item ? english(item.title) : node;
    const type = item?.type ?? "?";
    return [`### \`${node}\` ${title} ${type}`];
  }

  const heading = depth === 0 ? "###" : "####";
  const lines = [`${heading} \`${node.id}\` ${english(node.title)} men`, ""];
  node.menu.forEach((child, index) => {
    if (index > 0 && typeof child !== "string") lines.push("");
    lines.push(...section(child, items, depth + 1));
  });
  return lines;
}

/** Menu from main.json, with each English title followed by its type. */
export function menuMarkdown(main, items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return `${main.menu.map((node) => section(node, byId, 0).join("\n")).join("\n\n")}\n`;
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(realpathSync(entry)).href) {
  const main = JSON.parse(readFileSync(join(jsonDir, "main.json"), "utf8"));
  const items = JSON.parse(readFileSync(join(jsonDir, "items.json"), "utf8"));
  process.stdout.write(menuMarkdown(main, items));
}
