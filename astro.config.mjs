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
    // Breedtes moeten matchen met IMG_WIDTHS in src/lib/img.ts
    imagesConfig: {
      sizes: [160, 320, 480, 640, 768, 1080, 1440, 1920],
      formats: ['image/avif', 'image/webp'],
      domains: [],
    },
  }),
  prefetch: {
    // Interne links prefetchen bij hover: merkbaar snellere navigatie
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    // Eigen cache-map: omzeilt het door antivirus geblokkeerde .vite/deps bestand
    cacheDir: 'node_modules/.vite-vh',
    ssr: {
      // Mollie SDK is node-only
      noExternal: ['@mollie/api-client'],
    },
  },
});
