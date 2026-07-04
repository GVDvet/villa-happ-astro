/**
 * Villa Happ — Site-identiteit (één bron voor domein en indexeerbaarheid)
 *
 * Go-live op het echte domein = alleen PUBLIC_SITE_URL zetten
 * (bijv. https://villa-happ.nl). Canonical, sitemap, robots en de
 * noindex-guard volgen dan automatisch.
 */

export const DEFAULT_SITE = 'https://villa-happ-astro.vercel.app';

export function getSiteOrigin(): string {
  const url = import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE;
  return url.replace(/\/+$/, '');
}

/**
 * Preview-detectie: zolang de site op een *.vercel.app-domein draait
 * mag Google haar niet indexeren (zou concurreren met villa-happ.nl).
 */
export function isPreviewHost(origin: string = getSiteOrigin()): boolean {
  try {
    const host = new URL(origin).hostname;
    return host.endsWith('.vercel.app') || host === 'localhost' || host === '127.0.0.1';
  } catch {
    return true; // onbekend domein: veilig default = niet indexeren
  }
}
