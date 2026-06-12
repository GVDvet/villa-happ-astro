// Knipt textuur-swatches uit de Back-Cap foto's voor het 3D-model (v2).
import sharp from 'sharp';

const DIR = 'C:/Users/geoff/Documents/Villa Happ';
const OUT = 'C:/Users/geoff/Documents/Villa Happ/3D/textures';

const FRONT = `${DIR}/WhatsApp Image 2026-06-12 at 13.59.29 (5).jpeg`;
const BACK = `${DIR}/WhatsApp Image 2026-06-12 at 13.59.29 (2).jpeg`;

const meta = async (p) => { const m = await sharp(p).metadata(); return [m.width, m.height]; };
const [fw, fh] = await meta(FRONT);
const [bw, bh] = await meta(BACK);

async function crop(src, name, fx, fy, fw_, fh_, W, H, outW = 1024) {
  const left = Math.round(fx * W), top = Math.round(fy * H);
  const width = Math.round(fw_ * W), height = Math.round(fh_ * H);
  await sharp(src).extract({ left, top, width, height }).resize(outW).jpeg({ quality: 90 }).toFile(`${OUT}/${name}.jpg`);
  console.log(name, `${width}x${height} @ ${left},${top}`);
}

// patch: alleen het leer, rand tot rand, klinknagels binnen beeld
await crop(FRONT, 'tex-patch', 0.332, 0.474, 0.296, 0.128, fw, fh, 1024);
// heather stof: klein egaal stuk vlak boven de patch
await crop(FRONT, 'tex-fabric', 0.355, 0.408, 0.155, 0.062, fw, fh, 768);
// klep: stiksels + holo-sticker, zonder houten vloer
await crop(FRONT, 'tex-brim', 0.16, 0.655, 0.62, 0.125, fw, fh, 1024);
// mesh: ongewijzigd (was goed)
await crop(BACK, 'tex-mesh', 0.34, 0.43, 0.22, 0.13, bw, bh, 768);
console.log('klaar');
