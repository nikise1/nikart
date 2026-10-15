import { NextResponse } from "next/server";
import type { FlashLangCode } from "./flash-config";

/** `/html5` is the legacy HTML5 document. Modern serves that view at `/{locale}`. */
export function redirectHtml5Home(request: Request) {
  return NextResponse.redirect(new URL("/", request.url));
}

/** `/html5/en` and `/html5/es` set the language, then open that locale's home. */
export function redirectHtml5Lang(request: Request, lang: FlashLangCode) {
  const response = NextResponse.redirect(new URL(`/${lang}`, request.url));
  response.cookies.set("NEXT_LOCALE", lang, { path: "/" });
  return response;
}
