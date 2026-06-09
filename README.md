# Villa Happ — Astro storefront

E-commerce frontend voor Villa Happ, het heritage lifestyle merk uit Tilburg. Gebouwd met **Astro 5 + React islands + Three.js + Mollie + Supabase**.

## ✨ Wat zit erin

- 🎬 **Scroll-driven homepage** met dynamische 2D camera-flight over 9 story scenes (GSAP + ScrollTrigger + Lenis)
- 🎲 **Hybrid 3D**: subtle Three.js scene in de hero (React Three Fiber via Astro island)
- 🎨 **Editorial design system** met Villa Happ tokens (Inter sans + Plantin/Cormorant italic accents)
- 🛒 **Mollie checkout** met iDEAL, Bancontact, Apple/Shop Pay, Klarna
- 📦 **Supabase backend** voor producten, varianten (size/color), voorraad, orders, drops, newsletter
- 📬 **Newsletter** signup via Supabase
- 🌱 **SSR mode** met `@astrojs/node` adapter — dynamic cart/checkout
- ♿ **A11y**: skip link, focus management, reduced-motion safe-mode

## 🚀 Quick start

```bash
cp .env.example .env
# Vul Supabase + Mollie keys in (zie hieronder)

npm install
npm run dev
# Open http://localhost:4321
```

## 🔑 Environment variables

| Variable | Required | Doel |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (https://xxx.supabase.co) |
| `PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only admin key — orders + inventory mutations |
| `MOLLIE_API_KEY` | ✅ | `test_xxx` of `live_xxx` |
| `PUBLIC_SITE_URL` | ✅ | Base URL voor redirects/webhook (`http://localhost:4321` of prod URL) |
| `RESEND_API_KEY` | optional | Voor order confirmation emails |
| `MAIL_FROM` | optional | Default `hello@villahapp.com` |

## 🗄 Supabase setup

1. Maak een nieuwe Supabase project op [supabase.com](https://supabase.com).
2. Kopieer de URL + anon key + service role key naar `.env`.
3. Open **SQL Editor** in Supabase dashboard en plak `supabase/schema.sql` — run.
4. (Optional) Decomment de `INSERT INTO` regels onderaan `schema.sql` voor seed data.

### Storage (productafbeeldingen)
- Maak een storage bucket `products` (public) in Supabase.
- Upload productafbeeldingen. Image URLs lijken op `https://xxx.supabase.co/storage/v1/object/public/products/hoodie-grey.png`.
- Of: gebruik lokale paden onder `/public/img/products/` (sneller voor self-hosted).

## 💳 Mollie setup

1. Account op [mollie.com](https://mollie.com) — registreer als business.
2. Test API key uit dashboard → kopieer als `MOLLIE_API_KEY=test_xxx`.
3. **Webhook**: in productie, zorg dat `PUBLIC_SITE_URL` publiek bereikbaar is (Mollie POST naar `/api/checkout/webhook`).
4. Voor lokaal testen: gebruik [ngrok](https://ngrok.com) → `ngrok http 4321` → vul ngrok URL als `PUBLIC_SITE_URL`.

## 📁 Project structure

```
.
├── public/
│   └── img/                   # productafbeeldingen, heritage, brand assets
├── src/
│   ├── components/
│   │   ├── 3d/                # Three.js islands (Hero3D, ProductViewer)
│   │   ├── home/              # 9 scenes + 4 interludes
│   │   ├── layout/            # Header, Footer
│   │   ├── product/           # PDP, gallery, swatches (TODO)
│   │   ├── commerce/          # Cart drawer, checkout (TODO)
│   │   └── ui/                # Buttons, modals, toasts (TODO)
│   ├── layouts/Base.astro     # Site-wide shell
│   ├── lib/
│   │   ├── supabase.ts        # Supabase clients (public + admin)
│   │   ├── mollie.ts          # Mollie SDK wrapper
│   │   ├── commerce.ts        # Products, drops, inventory queries
│   │   ├── cart.ts            # Client-side cart (localStorage)
│   │   ├── homepage-motion.ts # Camera-flight engine (GSAP)
│   │   └── types.ts           # TypeScript types
│   ├── pages/
│   │   ├── index.astro        # Homepage met 9 scenes
│   │   ├── shop/              # (TODO) Listing + PDP
│   │   ├── cart.astro         # (TODO) Cart page
│   │   ├── checkout/          # (TODO) Checkout form + success
│   │   └── api/
│   │       ├── newsletter.ts
│   │       └── checkout/
│   │           ├── create.ts  # Create order + Mollie payment
│   │           └── webhook.ts # Mollie status callback
│   └── styles/
│       ├── tokens.css         # Design tokens
│       ├── base.css           # Reset + typography baseline
│       ├── buttons.css        # Button system
│       └── home.css           # Homepage scenes
├── supabase/schema.sql        # Postgres schema
└── astro.config.mjs
```

## 🎬 Hoe de camera-flight werkt

1. **9 scenes** zijn absoluut gepositioneerd in een grote canvas (`.vh-canvas`).
2. **Posities** voor elke scene in `src/lib/homepage-motion.ts` → `SCENE_POSITIONS`. Tweak x/y/scale/rotation voor verschillende flight pathways.
3. **GSAP timeline** animeert `transform: translate3d + scale + rotate` op de canvas terwijl je scrollt.
4. **ScrollTrigger** pint de hele homepage en koppelt scroll progress aan de timeline.
5. **Lenis** geeft smooth scroll feel.
6. **Reveal animations** per scene via `.is-active` class (set door `onUpdate`).
7. **Mobiel**: camera-flight uit, scenes stacken normaal (zie `home.css` media query).

### Tweak een scene
Open `src/lib/homepage-motion.ts`:
```ts
const SCENE_POSITIONS = [
  { x: 0,    y: 0,    scale: 1,    rotation: 0 },     // Hero
  { x: 1.8,  y: -0.6, scale: 1.05, rotation: -2 },    // Origin
  // ...
];
```
`x` en `y` zijn multipliers van viewport. Tweak voor verschillende routes.

## 🎲 Three.js 3D in de hero

Zie `src/components/3d/Hero3D.tsx`. Nu een floating distorted orb. Vervangen door echt 3D model:

```tsx
import { useGLTF } from '@react-three/drei';

function HoodieModel() {
  const { scene } = useGLTF('/models/hoodie.glb');
  return <primitive object={scene} scale={1.5} />;
}
```

Plaats `.glb` in `public/models/`. Export vanuit Blender met Draco compressie.

## 🧞 Commands

| Command | Action |
|---|---|
| `npm install` | Install deps |
| `npm run dev` | Dev server op `localhost:4321` |
| `npm run build` | Production build naar `./dist/` |
| `npm run preview` | Preview production build |
| `npm run astro check` | TypeScript / Astro typecheck |

## 🚢 Deployment

### Vercel
1. Push naar GitHub.
2. Connect repo in Vercel → framework: Astro (auto-detected).
3. Add env vars in Vercel dashboard.
4. Deploy.
5. In Mollie: zet `PUBLIC_SITE_URL` op je Vercel URL (`https://villa-happ.vercel.app`).

### Netlify
1. Push naar GitHub.
2. Add `@astrojs/netlify` adapter (vervang `@astrojs/node`):
   ```bash
   npm uninstall @astrojs/node
   npx astro add netlify
   ```
3. Add env vars in Netlify dashboard.

### Self-hosted (VPS / Cloudways)
1. Build lokaal: `npm run build`.
2. Upload `dist/` naar server.
3. Run met `node ./dist/server/entry.mjs` (Astro Node adapter standalone).
4. Reverse proxy via Nginx → port 4321.

## 🛠 Volgende stappen (TODO)

- [ ] Shop listing `/shop` met filters (kleur, maat, prijs)
- [ ] Product detail page `/shop/[slug]` met gallery, swatch selector, voorraad badge
- [ ] Cart drawer (slide-out) + free shipping bar
- [ ] Checkout form (multi-step: address → shipping → payment)
- [ ] Success/cancelled pages
- [ ] Drops archive `/drops` + single drop pagina
- [ ] Heritage/story pagina
- [ ] Journal (blog)
- [ ] Wishlist (localStorage)
- [ ] Search modal
- [ ] Toast notifications
- [ ] Order confirmation emails (Resend)
- [ ] Admin dashboard (kan via Supabase Studio of custom)

## 📝 Licentie

Proprietary — Villa Happ © 2026
