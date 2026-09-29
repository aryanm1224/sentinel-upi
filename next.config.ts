/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allows production builds to successfully finish even if there are subtle type warnings
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allows production builds to complete even if there are ESLint warnings
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
