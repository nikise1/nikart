import { NextResponse } from "next/server";
import {
  isContentEditorEnabled,
  readContentJson,
  saveContentJson,
} from "@/lib/content-json-file";

export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json(
    { error: "The content editor is only available in next dev." },
    { status: 404 },
  );
}

export function GET() {
  if (!isContentEditorEnabled()) {
    return unavailable();
  }
  return NextResponse.json(readContentJson());
}

export async function PUT(request: Request) {
  if (!isContentEditorEnabled()) {
    return unavailable();
  }
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return NextResponse.json({ error: "The body is not JSON." }, { status: 400 });
  }
  const result = saveContentJson(value);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
