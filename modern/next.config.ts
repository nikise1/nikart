import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const STATIC_HOST = "http://static.nikart.co.uk";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  async headers() {
    return [
      {
        source: "/ruffle/:path*.wasm",
        headers: [{ key: "Content-Type", value: "application/wasm" }],
      },
      {
        source: "/swf-compare/:path*.swf",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/content/img/:path*",
        destination: "/_generated/img/:path*",
      },
      {
        source: "/video_h264/:path*",
        destination: `${STATIC_HOST}/video_h264/:path*`,
      },
      {
        source: "/video_webm/:path*",
        destination: `${STATIC_HOST}/video_webm/:path*`,
      },
      {
        source: "/games/:path*",
        destination: `${STATIC_HOST}/games/:path*`,
      },
      // /static is handled by app/static/[...path]/route.ts (Node fetch of the
      // HTTP origin). An afterFiles rewrite to that host wins on Vercel and
      // never reaches the route, so HTTPS previews fail to load SWFs.
    ];
  },
};

export default withNextIntl(nextConfig);
