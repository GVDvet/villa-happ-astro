/**
 * Villa Happ — image optimizer
 * Converteert PNG's naar WebP op nette max-afmetingen.
 * Run: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img');

// max breedte per categorie (hoogte schaalt mee)
const MAXW = {
  products: 1100,   // PDP/lifestyle
  heritage: 1100,
  brand: 256,       // logo klein
};

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) { await walk(full); continue; }
    if (extname(e.name).toLowerCase() !== '.png') continue;

    const cat = basename(dir);
    const maxw = MAXW[cat] || 1100;
    const out = join(dir, basename(e.name, '.png') + '.webp');

    const before = (await stat(full)).size;
    await sharp(full)
      .resize({ width: maxw, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(out);
    const after = (await stat(out)).size;

    const pct = Math.round((1 - after / before) * 100);
    console.log(
      `${e.name.padEnd(34)} ${(before / 1024).toFixed(0).padStart(5)}KB → ${(after / 1024).toFixed(0).padStart(5)}KB  (-${pct}%)`
    );
  }
}

console.log('Converting PNG → WebP...\n');
await walk(root);
console.log('\nKlaar.');
