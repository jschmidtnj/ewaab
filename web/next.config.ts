import withPlugins from 'next-compose-plugins';
import withBundleAnalyzerFunc from '@next/bundle-analyzer';
import runtimeCaching from 'next-pwa/cache';
import withPWA from 'next-pwa';
import { locales } from './src/utils/misc';

const inDevelopment = process.env.NODE_ENV === 'development';

const withBundleAnalyzer = withBundleAnalyzerFunc({
  enabled: !inDevelopment,
});

export default withPlugins([[withBundleAnalyzer], [withPWA]], {
  distDir: 'dist',
  i18n: {
    locales,
    defaultLocale: 'en',
  },
  pwa: {
    disable: inDevelopment,
    dest: 'public',
    runtimeCaching,
  },
  webpack: (config: any) => {
    if (!('fallback' in config.resolve)) {
      config.resolve.fallback = {};
    }
    config.resolve.fallback.util = require.resolve('util/');
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
});
