import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: { skipWaiting: true },
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling pino/thread-stream server-side.
  // thread-stream ships test/ files that import dev-only deps (tap, desm, etc.)
  // which aren't installed in production and cause 70 "Module not found" build errors.
  serverExternalPackages: ["pino", "thread-stream", "pino-abstract-transport"],

  // Expose VERCEL_PROJECT_PRODUCTION_URL to client-side code
  env: {
    NEXT_PUBLIC_VERCEL_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
  allowedDevOrigins: [
    "*.ngrok.app",
    "*.neynar.com",
    "*.neynar.app",
    "*.studio.neynar.com",
    "*.dev-studio.neynar.com",
    "*.nip.io",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co", // Spotify album covers
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Prevent Vercel/CDN from caching sw.js — browsers must always revalidate
  // so users pick up new service workers immediately after a deployment.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
  devIndicators: false,
  reactCompiler: true,
};

export default withPWA(nextConfig);
