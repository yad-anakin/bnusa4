/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Ignore TypeScript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignore ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  
    // Configure allowed image sources
  images: {
    domains: ['localhost', 'picsum.photos', 'placehold.co', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'f005.backblazeb2.com',
        pathname: '/file/bnusa-images/**',
      },
      {
        protocol: 'https',
        hostname: 'bnusa-images.s3.us-east-005.backblazeb2.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig; 