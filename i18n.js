const path = require('path');
const i18n = require('next-i18next').default;
const { defaultNS, ns } = require('next-i18next/commonjs/config/defaultConfig');

module.exports = i18n({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
  },
  defaultNS,
  ns,
  localePath: path.resolve('./public/locales'),
  ns: ['common'],
  defaultNS: 'common',
});
