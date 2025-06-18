import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed static export configurations to ensure proper client-side routing and chunk loading
  // output: "export",
  // distDir: "out",
  images: {
    unoptimized: true,
  },
  // basePath: "",
  // assetPrefix: "./",
  // trailingSlash: true,

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'lucide-react', 'ethers'],
  },

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
