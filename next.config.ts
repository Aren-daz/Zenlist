import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Désactiver le rechargement à chaud de Next.js, la recompilation est gérée par nodemon
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Désactiver le remplacement de module à chaud de webpack
      config.watchOptions = {
        ignored: ['**/*'], // Ignorer tous les changements de fichiers
      };
    }
    return config;
  },
  eslint: {
    // Ignorer les erreurs ESLint lors de la construction
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
