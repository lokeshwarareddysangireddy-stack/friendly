import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
