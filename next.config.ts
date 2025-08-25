import type { NextConfig } from "next";

const nextConfig: NextConfig = {
      // Enable static export for GitHub Pages
      output: 'export',

      // Add trailing slash for proper routing on GitHub Pages
      trailingSlash: true,

      // Disable image optimization for static export
      images: {
            unoptimized: true
      },

      // Set base path for GitHub Pages from environment variable
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

      // Configure asset prefix for GitHub Pages from environment variable
      assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',

      // Ensure proper handling of static files
      distDir: 'out'
};

export default nextConfig;
