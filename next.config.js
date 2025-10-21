/** @type {import('next').NextConfig} */

const nextConfig = {

  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  swcMinify: true,
  reactStrictMode: true,
  trailingSlash: true,
  basePath: '/ReactorDesign',
  assetPrefix: '/ReactorDesign/',
};

module.exports = nextConfig;
