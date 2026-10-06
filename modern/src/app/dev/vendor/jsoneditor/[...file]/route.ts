import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isContentEditorEnabled } from "@/lib/content-json-file";

const assets: Record<string, string> = {
  "jsoneditor.min.js": "application/javascript; charset=utf-8",
  "jsoneditor.min.css": "text/css; charset=utf-8",
  "img/jsoneditor-icons.svg": "image/svg+xml",
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string[] }> },
) {
  if (!isContentEditorEnabled()) {
    return new Response("The content editor is only available in next dev.", {
      status: 404,
    });
  }
  const { file } = await context.params;
  const relativePath = file.join("/");
  const contentType = assets[relativePath];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }
  const body = readFileSync(
    join(process.cwd(), "node_modules/jsoneditor/dist", relativePath),
  );
  return new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  });
}
