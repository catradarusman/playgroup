import type { NextConfig } from "next";

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
        hostname: "cdns-images.dzcdn.net", // Deezer album covers
      },
      {
        protocol: "https",
        hostname: "e-cdns-images.dzcdn.net", // Deezer album covers (alternate)
      },
    ],
  },
  devIndicators: false,
  reactCompiler: true,
};

export default nextConfig;
