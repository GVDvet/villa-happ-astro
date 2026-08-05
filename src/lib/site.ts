/**
 * Villa Happ — Site-identiteit (één bron voor domein en indexeerbaarheid)
 *
 * Go-live op het echte domein = alleen PUBLIC_SITE_URL zetten
 * (bijv. https://villahapp.nl). Canonical, sitemap, robots en de
 * noindex-guard volgen dan automatisch.
 */

export const DEFAULT_SITE = 'https://villa-happ-astro.vercel.app';

function isLocal(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);
}

/**
 * Het publieke domein van de site.
 *
 * Let op de valkuil die dit oploste: `astro.config` leest
 * `process.env.PUBLIC_SITE_URL` (voor `Astro.site`, dus de canonical),
 * terwijl deze functie `import.meta.env.PUBLIC_SITE_URL` uit `.env` leest
 * (voor sitemap, robots, llms.txt en de links in transactiemails). Staat er
 * lokaal `http://localhost:4321` in `.env`, dan rolde er een productiebuild
 * uit met canonicals op het echte domein én een sitemap vol localhost-URL's.
 *
 * In een productiebuild negeren we daarom een lokaal adres en vallen we
 * terug op het echte domein, met een luide waarschuwing.
 */
export function getSiteOrigin(): string {
  const configured = import.meta.env.PUBLIC_SITE_URL;
  if (configured && isLocal(configured) && import.meta.env.PROD) {
    console.warn(
      `[site] PUBLIC_SITE_URL staat op ${configured} tijdens een productiebuild. ` +
        `Genegeerd; ${DEFAULT_SITE} gebruikt. Zet PUBLIC_SITE_URL op het echte domein ` +
        `zodat sitemap, robots.txt, llms.txt en de maillinks kloppen.`,
    );
    return DEFAULT_SITE;
  }
  return (configured || DEFAULT_SITE).replace(/\/+$/, '');
}

/**
 * Preview-detectie: zolang de site op een *.vercel.app-domein draait
 * mag Google haar niet indexeren (zou concurreren met villahapp.nl).
 */
export function isPreviewHost(origin: string = getSiteOrigin()): boolean {
  try {
    const host = new URL(origin).hostname;
    return host.endsWith('.vercel.app') || host === 'localhost' || host === '127.0.0.1';
  } catch {
    return true; // onbekend domein: veilig default = niet indexeren
  }
}
