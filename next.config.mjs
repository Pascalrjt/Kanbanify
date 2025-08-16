/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Vercel production optimizations
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Enable static optimization for better performance
  output: 'standalone',
}

export default nextConfig
