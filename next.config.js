/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

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
    return config;
  }
};

export default nextConfig;
