/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude backend files and Prisma from Next.js build
  webpack: (config, { isServer }) => {
    // Properly exclude Prisma from the build
    if (isServer) {
      config.externals = [...config.externals, 'prisma', '@prisma/client'];
    }
    
    // Handle the debug module issue
    config.resolve.alias = {
      ...config.resolve.alias,
      './debug': path.resolve(__dirname, 'debug-shim.js')
    };
    
    // Completely exclude the backend directory
    config.module.rules.push({
      test: /backend\//,
      loader: 'ignore-loader'
    });
    
    return config;
  }
};

export default nextConfig;
