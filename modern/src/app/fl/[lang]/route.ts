import { NextResponse } from "next/server";

interface FlLangRouteContext {
  params: Promise<{ lang: string }>;
}

export async function GET(request: Request, { params }: FlLangRouteContext) {
  const { lang } = await params;
  const response = NextResponse.redirect(new URL("/fl", request.url));

  if (lang === "en" || lang === "es") {
    response.cookies.set("NEXT_LOCALE", lang, { path: "/" });
  }

  return response;
}
