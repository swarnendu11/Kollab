import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.STANDALONE === "true" ? { output: "standalone" } : {}),
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  reactStrictMode: false, // Prevents double-invocation of camera/mic streams in dev mode
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
