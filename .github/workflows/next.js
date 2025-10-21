/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config.js');

const nextConfig = {
  // i18n yapılandırmasını ekler
  i18n,

  // GitHub Pages için statik HTML'e export etmeyi sağlar
  output: 'export',
  
  // Build sonrası statik dosyaların çıkarılacağı dizin
  distDir: 'out',

  // Statik export için resim optimizasyonunu kapatır
  images: {
    unoptimized: true,
  },

  // Rust tabanlı derleyici ile minify işlemini hızlandırır
  swcMinify: true,

  // React'in potansiyel problemleri belirlemesine yardımcı olur
  reactStrictMode: true,

  // URL'lerin sonuna '/' ekler (ör: /about/)
  trailingSlash: true,

  // Projenin alt yolunu belirler (ör: username.github.io/ReactorDesign)
  basePath: '/ReactorDesign',

  // Varlıkların (JS, CSS, resimler) yükleneceği yolu belirler
  assetPrefix: '/ReactorDesign/',
};

module.exports = nextConfig;
