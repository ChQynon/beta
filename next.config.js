/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: process.env.BUILD_TYPE === 'static' ? 'export' : undefined,
  images: {
    unoptimized: process.env.BUILD_TYPE === 'static',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  }
};

export default nextConfig; 