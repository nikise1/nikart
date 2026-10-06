import { NextResponse } from "next/server";
import { readContentJsonForEditor, saveContentJson } from "@/lib/content-json-file";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(readContentJsonForEditor());
}

export async function PUT(request: Request) {
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
