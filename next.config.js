/** @type {import('next').NextConfig} */

const basePath = '/ReactorDesign';

const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  trailingSlash: true,
  basePath,
  assetPrefix: `${basePath}/`,
  // exposed so plain <link>/<a> tags (which Next does not prefix) can build correct URLs
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;
