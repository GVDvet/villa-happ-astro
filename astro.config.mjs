// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Go-live: zet PUBLIC_SITE_URL=https://villahapp.nl (canonical, sitemap,
  // robots en de noindex-guard volgen automatisch, zie src/lib/site.ts)
  site: process.env.PUBLIC_SITE_URL || 'https://villa-happ-astro.vercel.app',
  output: 'server',
  // Eén vorm van elke URL. Zonder dit wees de canonical naar /shop/ terwijl
  // de sitemap en alle interne links /shop gebruikten: elke pagina werd
  // daarmee een "alternatieve pagina met correcte canonical" in Search
  // Console. Dit stuurt Astro.url; de 308-redirect van /shop/ naar /shop
  // staat in vercel.json ("trailingSlash": false).
  trailingSlash: 'never',
  security: {
    // Uit, en vervangen door src/middleware.ts. Astro's eigen controle kent
    // geen uitzonderingen en weigerde daardoor de Mollie-webhook: die komt
    // form-encoded binnen vanaf Mollie's servers en heeft dus geen Origin.
    // Gevolg was dat een betaalde bestelling nooit op 'betaald' kwam.
    // De middleware doet exact dezelfde controle, met die ene vrijstelling.
    checkOrigin: false,
  },
  build: {
    // Kleine CSS-bundels (~7-9 KiB) inline zetten haalt de render-
    // blokkerende <link>-verzoeken van het kritieke pad (Lighthouse: ~1,3s
    // besparing op mobiel). Default 'auto' inlinet alleen onder 4 KiB.
    inlineStylesheets: 'always',
  },
  adapter: vercel({
    // Web Analytics loopt via de <Analytics /> component uit
    // @vercel/analytics/astro (in Base.astro); de adapter-injectie is
    // uitgezet omdat die naar een niet-bestaand script-pad wees (404).
    imageService: true,
    // Breedtes moeten matchen met IMG_WIDTHS in src/lib/img.ts
    imagesConfig: {
      sizes: [96, 160, 320, 480, 640, 768, 1080, 1440, 1920],
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
