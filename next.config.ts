/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is now stable in Next.js 16
  turbopack: {
    // Configure Turbopack options
    resolveAlias: {
      // Add any aliases if needed
    },
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
    // Next.js 16 optimizes images by default
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Server Actions are fully stable in Next.js 16
  // React Strict Mode is enabled by default
  reactStrictMode: true,
  // Compress responses
  compress: true,
  // Production browser source maps
  productionBrowserSourceMaps: false,
  // Enable instrumentation (optional)
  instrumentationHook: false,
  // Configure logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;