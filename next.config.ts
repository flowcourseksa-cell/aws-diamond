import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tdzzsmwvmddhypaoequv.supabase.co',
      },
    ],
  },
  serverExternalPackages: ['@sparticuz/chromium-min'],
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium-min'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default withSerwist(nextConfig);
