import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Google profile images
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Cloudinary images
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Unsplash images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
    ],
  },
  // ✅ Allow build even if ESLint errors exist
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Allow build even if TypeScript errors exist
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
