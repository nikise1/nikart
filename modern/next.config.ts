import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const STATIC_HOST = "https://static.nikart.co.uk";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
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
      {
        source: "/fl/:path*.swf",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Relative card links break when the URL is /swf-compare (no slash /
      // index.html): the browser resolves against /. Always land on the index.
      {
        source: "/swf-compare",
        destination: "/swf-compare/index.html",
        permanent: false,
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
      // AwayFL on /swf-compare/lizard-site/ resolves ../content against the
      // HTML path. Ruffle uses base=/fl/ and hits /content/ directly.
      {
        source: "/swf-compare/content/:path*",
        destination: "/content/:path*",
      },
      // /static is handled by app/static/[...path]/route.ts (Node fetch of the
      // HTTP origin). An afterFiles rewrite to that host wins on Vercel and
      // never reaches the route, so HTTPS previews fail to load SWFs.
    ];
  },
};

export default withNextIntl(nextConfig);
