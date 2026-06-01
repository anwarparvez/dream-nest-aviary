import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack configuration (moved from experimental)
  turbopack: {
    // Configure Turbopack options if needed
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // React Strict Mode is enabled by default
  reactStrictMode: true,
  // Compress responses
  compress: true,
  // Production browser source maps
  productionBrowserSourceMaps: false,
  // Configure logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;