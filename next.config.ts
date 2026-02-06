
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        hostname: 'picsum.photos',
        hostname: 'api.qrserver.com',
      }
    ],
  },
  trailingSlash: true,
};

export default nextConfig;
