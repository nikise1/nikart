import { originStaticUrl } from "@/lib/static-origin";

interface StaticProxyContext {
  params: Promise<{ path: string[] }>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PASS_THROUGH_HEADERS = ["content-type", "last-modified", "etag"] as const;

function originHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of PASS_THROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  headers.set(
    "cache-control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  return headers;
}

async function fetchOrigin(
  url: string,
  request: Request,
): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: request.method === "HEAD" ? "HEAD" : "GET",
      headers: { accept: request.headers.get("accept") ?? "*/*" },
      redirect: "follow",
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

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
  const upstream = await fetchOrigin(`${url}${search}`, request);
  if (!upstream) {
    return new Response("Origin fetch failed", { status: 502 });
  }

  const headers = originHeaders(upstream);

  if (request.method === "HEAD") {
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      headers.set("content-length", contentLength);
    }
    return new Response(null, { status: upstream.status, headers });
  }

  const body = await upstream.arrayBuffer();
  headers.set("content-length", String(body.byteLength));
  return new Response(body, { status: upstream.status, headers });
}

export function GET(
  request: Request,
  context: StaticProxyContext,
): Promise<Response> {
  return proxyStatic(request, context);
}

export function HEAD(
  request: Request,
  context: StaticProxyContext,
): Promise<Response> {
  return proxyStatic(request, context);
}
