import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Turbopack-specific configuration
  turbo: {
    // Exclude canvas from being processed by Next.js on the server.
    // It's a client-side dependency of jspdf and pdfjs-dist.
    externals: ['canvas'],
  },
  // Fallback for Webpack if Turbopack is not used
  webpack: (config, { isServer }) => {
    // Exclude canvas from being processed by Next.js on the server.
    if (isServer) {
        config.externals.push('canvas');
    }
    return config;
  },
};

export default nextConfig;
