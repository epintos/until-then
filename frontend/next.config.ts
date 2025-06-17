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
};

export default nextConfig;
