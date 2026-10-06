import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DataSchema } from "./data/schema";

const libDir = dirname(fileURLToPath(import.meta.url));

export function contentJsonSourcePath(): string {
  return join(libDir, "../../..", "public", "content", "json", "data.json");
}

export function isContentEditorEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function readContentJson(filePath = contentJsonSourcePath()): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export type ContentJsonSaveResult =
  | { ok: true }
  | { ok: false; error: string };

export function saveContentJson(
  value: unknown,
  options?: { filePath?: string; sync?: boolean },
): ContentJsonSaveResult {
  const parsed = DataSchema.safeParse(value);
  if (!parsed.success) {
    const lines = parsed.error.issues.slice(0, 8).map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    });
    return { ok: false, error: lines.join("\n") };
  }

  const filePath = options?.filePath ?? contentJsonSourcePath();
  writeFileSync(filePath, `${JSON.stringify(value, null, 4)}\n`);

  if (options?.sync !== false) {
    const modernRoot = join(libDir, "../..");
    const result = spawnSync(
      process.execPath,
      [join(modernRoot, "scripts/sync-content-json.mjs")],
      { encoding: "utf8" },
    );
    if (result.status !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim();
      return {
        ok: false,
        error: detail || "Could not refresh the minified copy.",
      };
    }
  }

  return { ok: true };
}
