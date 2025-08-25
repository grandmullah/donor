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

      // Set base path for GitHub Pages (will be set by environment variable)
      basePath: process.env.NODE_ENV === 'production' ? '/donor' : '',

      // Configure asset prefix for GitHub Pages
      assetPrefix: process.env.NODE_ENV === 'production' ? '/donor/' : '',

      // Ensure proper handling of static files
      distDir: 'out'
};

export default nextConfig;