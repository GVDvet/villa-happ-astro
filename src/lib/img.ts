/**
 * Villa Happ — Responsive beelden via Vercel Image Optimization
 *
 * De adapter (astro.config: imageService + imagesConfig) stelt
 * /_vercel/image beschikbaar in productie: on-the-fly AVIF/WebP in de
 * gevraagde breedte, aan de edge gecachet. In dev bestaat dat endpoint
 * niet en serveren we het originele bestand.
 *
 * De breedtes hieronder MOETEN 1-op-1 matchen met imagesConfig.sizes
 * in astro.config.mjs; Vercel weigert andere waarden.
 */

export const IMG_WIDTHS = [96, 160, 320, 480, 640, 768, 1080, 1440, 1920] as const;

const isProd = import.meta.env.PROD;

function isOptimizable(src: string): boolean {
  return isProd && src.startsWith('/') && !src.startsWith('//');
}

function nearestWidth(w: number): number {
  return IMG_WIDTHS.find((x) => x >= w) ?? IMG_WIDTHS[IMG_WIDTHS.length - 1];
}

export function optimizedSrc(src: string, targetWidth = 1080, quality = 75): string {
  if (!isOptimizable(src)) return src;
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${nearestWidth(targetWidth)}&q=${quality}`;
}

export function srcsetFor(src: string, widths: readonly number[] = IMG_WIDTHS, quality = 75): string | undefined {
  if (!isOptimizable(src)) return undefined;
  return widths
    .map((w) => `/_vercel/image?url=${encodeURIComponent(src)}&w=${nearestWidth(w)}&q=${quality} ${nearestWidth(w)}w`)
    .join(', ');
}
