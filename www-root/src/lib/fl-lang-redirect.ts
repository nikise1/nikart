import { NextResponse } from "next/server";
import type { FlashLangCode } from "./flash-config";

export function redirectFlLang(request: Request, lang: FlashLangCode) {
  const response = NextResponse.redirect(new URL("/fl", request.url));
  response.cookies.set("NEXT_LOCALE", lang, { path: "/" });
  return response;
}
