/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Bun runtime
  experimental: {
    // Bun support
    turbopack: {
      // Set root directory to avoid lockfile detection warning in monorepo
      root: process.cwd(),
    },
  },
  // Output configuration
  output: 'standalone',
}

export default nextConfig

