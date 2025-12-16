import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Externalize server-side packages that cause issues (moved from experimental in Next.js 16)
  serverExternalPackages: [
    'pino', 
    'thread-stream', 
    '@reown/appkit',
    '@reown/appkit-core',
    '@reown/appkit-utils',
    '@reown/appkit-controllers',
    '@walletconnect/ethereum-provider',
    '@walletconnect/universal-provider',
    '@walletconnect/logger',
    '@walletconnect/utils',
  ],
  
  // Empty turbopack config to silence the webpack warning
  turbopack: {},
  
  // Webpack configuration (fallback for when using --webpack flag)
  webpack: (config, { isServer }) => {
    // Add fallbacks for problematic modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'tap': false,
      'tape': false,
      'why-is-node-running': false,
    };

    // Exclude test files from being bundled
    config.module.rules.push({
      test: /\.test\.(js|mjs|ts|tsx)$/,
      loader: 'ignore-loader',
    });

    return config;
  },
};

export default nextConfig;