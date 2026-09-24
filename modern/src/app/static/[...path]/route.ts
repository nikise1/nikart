import { originStaticUrl } from "@/lib/static-origin";

interface StaticProxyContext {
  params: Promise<{ path: string[] }>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function proxyStatic(
  request: Request,
  { params }: StaticProxyContext,
): Promise<Response> {
  const { path } = await params;
  const url = originStaticUrl(path);
  if (!url) {
    return new Response("Bad path", { status: 400 });
  }

  const search = new URL(request.url).search;
  const upstream = await fetch(`${url}${search}`, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers: { accept: request.headers.get("accept") ?? "*/*" },
    redirect: "follow",
    cache: "no-store",
  });

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  headers.set("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400");

  if (request.method === "HEAD") {
    return new Response(null, { status: upstream.status, headers });
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

export function GET(request: Request, context: StaticProxyContext): Promise<Response> {
  return proxyStatic(request, context);
}

export function HEAD(request: Request, context: StaticProxyContext): Promise<Response> {
  return proxyStatic(request, context);
}
