// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
  vite: {
    ssr: {
      // Mollie SDK is node-only
      noExternal: ['@mollie/api-client'],
    },
  },
});
