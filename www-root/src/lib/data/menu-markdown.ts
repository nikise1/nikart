import { type DataNode, isMenuItem } from "./schema.ts";

function heading(depth: number): string {
  return "#".repeat(Math.min(depth + 3, 6));
}

function section(node: DataNode, depth: number): string[] {
  if (!isMenuItem(node)) {
    if (depth === 0) return [`### \`${node.id}\` ${node.type}`];
    return [`- \`${node.id}\` ${node.type}`];
  }

  const lines = [`${heading(depth)} \`${node.id}\` ${node.type}`, ""];
  node.menu.forEach((child, index) => {
    if (index > 0 && isMenuItem(child)) lines.push("");
    lines.push(...section(child, depth + 1));
  });
  return lines;
}

/** Id and type for each menu entry. Sections use their compiled type, `men`. */
export function menuMarkdown(menu: DataNode[]): string {
  return `${menu.map((node) => section(node, 0).join("\n")).join("\n\n")}\n`;
}
