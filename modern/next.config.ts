import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const STATIC_HOST = "http://static.nikart.co.uk";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  async rewrites() {
    return [
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
    ];
  },
};

export default withNextIntl(nextConfig);
