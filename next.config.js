/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: false,
  i18n,
  output: 'export', // Enable static exports for GitHub Pages
  distDir: 'out',   // Output directory for static files
  images: {
    unoptimized: true, // Required for static export
  },
}
module.exports = nextConfig;
