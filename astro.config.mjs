// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    // Web Analytics (gratis op Vercel)
    webAnalytics: { enabled: true },
    // Image optimization via Vercel
    imageService: true,
  }),
  integrations: [react()],
  vite: {
    ssr: {
      // Mollie SDK is node-only
      noExternal: ['@mollie/api-client'],
    },
  },
});
