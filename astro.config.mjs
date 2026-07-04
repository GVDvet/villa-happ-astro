// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Go-live: zet PUBLIC_SITE_URL=https://villa-happ.nl (canonical, sitemap,
  // robots en de noindex-guard volgen automatisch, zie src/lib/site.ts)
  site: process.env.PUBLIC_SITE_URL || 'https://villa-happ-astro.vercel.app',
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
