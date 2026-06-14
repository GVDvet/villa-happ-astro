// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://villa-happ-astro.vercel.app',
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
  vite: {
    // Eigen cache-map: omzeilt het door antivirus geblokkeerde .vite/deps bestand
    cacheDir: 'node_modules/.vite-vh',
    ssr: {
      // Mollie SDK is node-only
      noExternal: ['@mollie/api-client'],
    },
  },
});
