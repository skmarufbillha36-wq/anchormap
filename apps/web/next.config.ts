import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16
  // Empty turbopack config silences the "webpack config present" warning
  turbopack: {},

  // Allow images from Cloudinary CDN
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // Required for Leaflet CSS import in Next.js
  transpilePackages: ['leaflet', 'leaflet.markercluster'],
};

export default nextConfig;
