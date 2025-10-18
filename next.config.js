/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config.js');

const nextConfig = {
  i18n,
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
