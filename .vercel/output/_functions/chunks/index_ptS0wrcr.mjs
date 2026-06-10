import { c as createComponent } from './astro-component_CWRrAAE8.mjs';
import 'piccolore';
import { m as maybeRenderHead, k as renderTemplate, o as renderComponent, p as Fragment, h as addAttribute } from './entrypoint_Cg1PWc_S.mjs';
import { r as renderScript, $ as $$Base } from './Base_DkAHPksC.mjs';
import 'clsx';
import { a as getSupabase } from './supabase_D6SjNLSm.mjs';

const $$Loader = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="vh-loader" id="vh-loader"> <p class="vh-loader-year" data-loader-year>1960</p> <div class="vh-loader-bar"><span></span></div> <p class="vh-loader-text">Het archief wordt geopend</p> </div>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/Loader.astro", void 0);

const $$Hero = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section class="vh-hero" id="vh-hero"> <div class="vh-hero-stage"> <!-- Polaroid chrome (wordt zichtbaar als de foto terugzoomt) --> <div class="vh-hero-chrome" aria-hidden="true"> <p class="vh-hero-chrome-cap vh-mono">Archief · Frame 001 — Tilburg</p> <p class="vh-hero-chrome-note">Waar het begon.</p> </div> <div class="vh-hero-media"> <img src="/img/products/hoodie-grey-lifestyle.webp" alt="Villa Happ Heritage Hoodie, gedragen in herfstbos" width="1920" height="1280" fetchpriority="high"> <div class="vh-hero-scrim"></div> </div> </div> <!-- Viewfinder frame (cinematic) --> <div class="vh-viewfinder" aria-hidden="true"> <span class="vf-corner vf-tl"></span> <span class="vf-corner vf-tr"></span> <span class="vf-corner vf-bl"></span> <span class="vf-corner vf-br"></span> <span class="vf-rec"><i></i>REC</span> <span class="vf-coords">51.5555° N · 5.0913° E</span> <span class="vf-frame">FRAME 001 / VILLA HAPP</span> </div> <!-- Roterend heritage-zegel --> <div class="vh-seal" aria-hidden="true"> <svg viewBox="0 0 200 200"> <defs> <path id="vh-seal-path" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"></path> </defs> <text> <textPath href="#vh-seal-path" startOffset="0">
VILLA HAPP · EST. 1960 · TILBURG · HERITAGE LIFESTYLE ·&nbsp;
</textPath> </text> </svg> <span class="vh-seal-mark">VH</span> </div> <div class="vh-hero-inner"> <h1 class="vh-hero-title"> <span class="vh-line"><span>Heritage,</span></span> <span class="vh-line"><span class="vh-hero-em">gedragen</span></span> <span class="vh-line"><span>nu.</span></span> </h1> <div class="vh-hero-bottom"> <p class="vh-hero-sub">
Een Nederlands lifestylelabel met 65 jaar verhaal. Limited edition drops,
        gemaakt met dezelfde toewijding als waarmee het begon.
</p> <div class="vh-hero-actions"> <a href="/shop" class="vh-btn vh-btn--light" data-magnetic> <span>Shop de collectie</span> <svg class="vh-btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"> <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </svg> </a> <a href="/drops" class="vh-btn vh-btn--ghost"><span>Bekijk drops</span></a> </div> </div> </div> <div class="vh-hero-scroll-cue"><span>Scroll</span></div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/Hero.astro", void 0);

const $$Marquee = createComponent(($$result, $$props, $$slots) => {
  const items = ["Limited Edition", "Sinds 1960", "Made in Tilburg", "Drie generaties", "Premium materials", "Genummerde oplage"];
  const loop = [...items, ...items];
  return renderTemplate`${maybeRenderHead()}<div class="vh-marquee" aria-hidden="true"> <div class="vh-marquee-track"> ${loop.map((t) => renderTemplate`<span class="vh-marquee-item">${t}</span>`)} </div> </div>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/Marquee.astro", void 0);

const $$Manifesto = createComponent(($$result, $$props, $$slots) => {
  const text = "Wij maken geen wegwerpmode. Wij maken stukken met een verhaal, gedragen door de generatie van toen, en die van nu.";
  const accentWords = /* @__PURE__ */ new Set(["verhaal", "generatie", "nu."]);
  const inlineAfter = {
    "verhaal,": "/img/products/hoodie-logo-detail.webp",
    "generatie": "/img/heritage/origin-babyparadijs.webp"
  };
  const words = text.split(" ");
  return renderTemplate`${maybeRenderHead()}<section class="vh-manifesto"> <div class="vh-manifesto-inner"> <p class="vh-manifesto-label vh-mono">01 / Manifest</p> <p class="vh-manifesto-text"> ${words.map((w) => {
    const clean = w.replace(/[.,]/g, "");
    const isAccent = accentWords.has(w) || accentWords.has(clean);
    const inlineImg = inlineAfter[w];
    return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <span${addAttribute(`vh-word${isAccent ? " vh-word-accent" : ""}`, "class")}>${w} </span> ${inlineImg && renderTemplate`<span class="vh-inline-img"><img${addAttribute(inlineImg, "src")} alt="" loading="lazy"></span>`}${inlineImg && " "}` })}`;
  })} </p> </div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/Manifesto.astro", void 0);

const $$YearMask = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section class="vh-yearmask"> <p class="vh-yearmask-label vh-mono">Anno</p> <h2 class="vh-yearmask-text" data-yearmask style="background-image: url('/img/products/hoodie-grey-lifestyle.webp');">1960</h2> <p class="vh-yearmask-cap">Het jaar waarin alles begon.</p> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/YearMask.astro", void 0);

const $$HeritageScroll = createComponent(($$result, $$props, $$slots) => {
  const steps = [
    {
      num: "02 / Het begin",
      year: "1960",
      title: "Het begon in Tilburg",
      text: "Wat startte als Babyparadijs groeide uit tot de basis van een familiegeschiedenis die de Nederlandse kindermode blijvend zou beïnvloeden.",
      img: "/img/heritage/origin-babyparadijs.webp"
    },
    {
      num: "03 / De groei",
      year: "1999",
      title: "Een eigen gezicht",
      text: "Met een eigen winkelconcept en herkenbare stijl werd Villa Happ meer dan een producent. Het werd een merkbeleving, geliefd door een hele generatie.",
      img: null
    },
    {
      num: "04 / De comeback",
      year: "2024",
      title: "Terug waar het hoort",
      text: "Met de derde generatie keert Villa Happ terug. Niet als herhaling van vroeger, maar als een nieuwe vertaling van een rijk verleden.",
      img: "/img/products/hoodie-logo-detail.webp"
    }
  ];
  return renderTemplate`${maybeRenderHead()}<section class="vh-heritage"> <div class="vh-heritage-track"> <!-- Intro panel --> <div class="vh-heritage-panel vh-heritage-panel--intro"> <span class="vh-sticker vh-sticker--light" style="--rot: -7deg; top: 20%; right: 14%;">Est. 1960 ✦ Tilburg</span> <span class="vh-sticker vh-sticker--light" style="--rot: 4deg; bottom: 18%; left: 12%;">Familie-archief</span> <div> <p class="vh-heritage-intro-label vh-mono">Het verhaal</p> <h2 class="vh-heritage-intro-title">65 jaar, drie generaties, één <span class="vh-italic-accent">verhaal</span></h2> <p class="vh-heritage-intro-hint vh-mono">Scroll om te ontdekken</p> </div> </div> <!-- Timeline panels --> ${steps.map((step) => renderTemplate`<div class="vh-heritage-panel"> <div class="vh-heritage-text-col"> <p class="vh-heritage-step-num vh-mono">${step.num}</p> <p class="vh-heritage-year">${step.year}</p> <h3 class="vh-heritage-step-title">${step.title}</h3> <p class="vh-heritage-step-text">${step.text}</p> </div> <div${addAttribute(`vh-heritage-media${step.img ? "" : " vh-heritage-media--placeholder"}`, "class")}> ${step.img ? renderTemplate`<img${addAttribute(step.img, "src")}${addAttribute(step.title, "alt")} loading="lazy">` : renderTemplate`<span>${step.year.slice(2)}</span>`} </div> </div>`)} </div> <div class="vh-heritage-progress"><span></span></div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/HeritageScroll.astro", void 0);

async function getFeaturedProducts(limit = 3) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("products").select("*").eq("status", "published").eq("featured", true).order("created_at", { ascending: false }).limit(limit);
  if (error) {
    const fb = await sb.from("products").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(limit);
    return fb.data || [];
  }
  return data || [];
}
async function getActiveDrop() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("drops").select("*").in("status", ["live", "coming-soon"]).order("launch_date", { ascending: true }).limit(1).single();
  return data || null;
}
function formatPrice(cents, currency = "EUR") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(cents / 100);
}

const $$DropSpotlight = createComponent(async ($$result, $$props, $$slots) => {
  const drop = await getActiveDrop();
  const fallback = {
    title: "Sweater Stories",
    description: "De eerste limited edition van de derde generatie. Een collectie hoodies in heritage colorways. Oplage 500 stuks per kleur, elk genummerd en geleverd met certificaat van echtheid.",
    image_url: "/img/products/hoodie-blue-lifestyle.webp",
    total_pieces: 500,
    status: "coming-soon",
    launch_date: new Date(Date.now() + 1e3 * 60 * 60 * 24 * 14).toISOString(),
    slug: "sweater-stories"
  };
  const d = drop || fallback;
  const launchTs = d.launch_date ? Math.floor(new Date(d.launch_date).getTime() / 1e3) : 0;
  const isLive = d.status === "live";
  const isComing = d.status === "coming-soon" && launchTs * 1e3 > Date.now();
  return renderTemplate`${maybeRenderHead()}<section class="vh-spotlight"> <div class="vh-spotlight-inner"> <div class="vh-spotlight-text vh-reveal"> <p class="vh-spotlight-label vh-mono">05 / ${isLive ? "Nu live" : "Binnenkort"} · Drop 001</p> <h2 class="vh-spotlight-title">${d.title}</h2> <p class="vh-spotlight-desc">${d.description}</p> <div class="vh-spotlight-meta"> ${d.total_pieces && renderTemplate`<div> <span class="vh-spotlight-meta-label vh-mono">Oplage</span> <span class="vh-spotlight-meta-value">${d.total_pieces} stuks</span> </div>`} ${launchTs > 0 && renderTemplate`<div> <span class="vh-spotlight-meta-label vh-mono">${isLive ? "Gelanceerd" : "Lanceert"}</span> <span class="vh-spotlight-meta-value">${new Date(launchTs * 1e3).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}</span> </div>`} </div> ${isComing && renderTemplate`<div class="vh-spotlight-countdown"${addAttribute(launchTs, "data-countdown")}> <div class="vh-cd-cell"><div class="vh-cd-num" data-cd-days>00</div><div class="vh-cd-label">dagen</div></div> <div class="vh-cd-cell"><div class="vh-cd-num" data-cd-hours>00</div><div class="vh-cd-label">uur</div></div> <div class="vh-cd-cell"><div class="vh-cd-num" data-cd-minutes>00</div><div class="vh-cd-label">min</div></div> <div class="vh-cd-cell"><div class="vh-cd-num" data-cd-seconds>00</div><div class="vh-cd-label">sec</div></div> </div>`} <div> <a${addAttribute(`/drops/${d.slug}`, "href")} class="vh-btn vh-btn--primary" data-magnetic> <span>${isLive ? "Shop deze drop" : "Zet me op de lijst"}</span> <svg class="vh-btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"> <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </svg> </a> </div> </div> <div class="vh-spotlight-media vh-reveal-img" data-cursor="Bekijk"> <span class="vh-spotlight-badge vh-mono">Drop 001</span> <span class="vh-sticker vh-sticker--solid" style="--rot: 6deg; bottom: 20px; right: 20px;">Limited ✦ 500</span> <img${addAttribute(d.image_url, "src")}${addAttribute(d.title, "alt")} width="900" height="1125" loading="lazy"> </div> </div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/DropSpotlight.astro", void 0);

const $$ShopGrid = createComponent(async ($$result, $$props, $$slots) => {
  const dbProducts = await getFeaturedProducts(6);
  const fallback = [
    { slug: "heritage-hoodie-grey", name: "Heritage Hoodie", price_cents: 12900, image_url: "/img/products/hoodie-grey-front.webp", hover_url: "/img/products/hoodie-grey-back.webp", badge: "Nieuw", meta: "Heather Grey" },
    { slug: "heritage-hoodie-blue", name: "Heritage Hoodie", price_cents: 12900, image_url: "/img/products/hoodie-blue-front.webp", hover_url: "/img/products/hoodie-blue-lifestyle.webp", badge: null, meta: "Tilburg Blue" },
    { slug: "heritage-hoodie-unisex", name: "Heritage Hoodie", price_cents: 12900, image_url: "/img/products/hoodie-grey-lifestyle.webp", hover_url: "/img/products/hoodie-grey-new2.webp", badge: "Bestseller", meta: "Oversized fit" }
  ];
  const products = dbProducts.length > 0 ? dbProducts.map((p) => ({
    slug: p.slug,
    name: p.name,
    price_cents: p.price_cents,
    image_url: p.image_url || "/img/products/hoodie-grey-front.webp",
    hover_url: p.gallery && p.gallery[0] || p.image_url || "/img/products/hoodie-grey-back.webp",
    badge: p.compare_at_cents ? "Sale" : p.featured ? "Featured" : null,
    meta: p.category || ""
  })) : fallback;
  return renderTemplate`${maybeRenderHead()}<section class="vh-shop"> <div class="vh-shop-inner"> <div class="vh-shop-header vh-reveal"> <span class="vh-spin-star" data-spin aria-hidden="true">✱</span> <div> <p class="vh-shop-label vh-mono">06 / De collectie</p> <h2 class="vh-shop-title">Nu te <span class="vh-italic-accent">dragen</span></h2> </div> <a href="/shop" class="vh-shop-link">
Bekijk alles
<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"> <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </svg> </a> </div> <div class="vh-shop-grid"> ${products.map((p, i) => renderTemplate`<a${addAttribute(`/shop/${p.slug}`, "href")} class="vh-shop-card vh-reveal"${addAttribute(`transition-delay:${i % 3 * 0.1}s`, "style")}> <div class="vh-shop-card-media"> <span class="vh-shop-card-num">0${i + 1}</span> ${p.badge && renderTemplate`<span class="vh-shop-card-badge">${p.badge}</span>`} <img${addAttribute(p.image_url, "src")}${addAttribute(p.name, "alt")} class="vh-shop-card-img is-primary" width="600" height="750" loading="lazy"> <img${addAttribute(p.hover_url, "src")} alt="" class="vh-shop-card-img is-hover" width="600" height="750" loading="lazy" aria-hidden="true"> <button class="vh-shop-card-quick" type="button"${addAttribute(p.slug, "data-quick-add")}>Snel toevoegen</button> </div> <div class="vh-shop-card-info"> <p class="vh-shop-card-name">${p.name}</p> <p class="vh-shop-card-price">${formatPrice(p.price_cents)}</p> </div> ${p.meta && renderTemplate`<p class="vh-shop-card-meta">${p.meta}</p>`} </a>`)} </div> </div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/ShopGrid.astro", void 0);

const $$Lookbook = createComponent(($$result, $$props, $$slots) => {
  const shots = [
    { img: "/img/products/hoodie-grey-lifestyle.webp", id: "VH·FR 01" },
    { img: "/img/products/hoodie-blue-lifestyle.webp", id: "VH·FR 02" },
    { img: "/img/products/hoodie-logo-detail.webp", id: "VH·FR 03" },
    { img: "/img/products/hoodie-grey-back.webp", id: "VH·FR 04" },
    { img: "/img/heritage/origin-babyparadijs.webp", id: "VH·FR 05" },
    { img: "/img/products/hoodie-blue-front.webp", id: "VH·FR 06" },
    { img: "/img/products/hoodie-grey-front.webp", id: "VH·FR 07" },
    { img: "/img/products/hoodie-grey-new2.webp", id: "VH·FR 08" }
  ];
  return renderTemplate`${maybeRenderHead()}<section class="vh-film-section"> <div class="vh-film-header vh-reveal"> <div> <p class="vh-film-label vh-mono">07 / Uit het archief</p> <h2 class="vh-film-title">Gedragen door <span class="vh-italic-accent">generaties</span></h2> </div> <p class="vh-film-hint vh-mono">Sleep de strook ↔</p> </div> <div class="vh-film" data-cursor="Drag"> <div class="vh-film-track" data-film-track> ${shots.map((s) => renderTemplate`<div class="vh-film-frame"> <div class="vh-film-shot"> <img${addAttribute(s.img, "src")} alt="" loading="lazy" draggable="false"> <span class="vh-film-id vh-mono">${s.id}</span> </div> </div>`)} ${shots.map((s) => renderTemplate`<div class="vh-film-frame" aria-hidden="true"> <div class="vh-film-shot"> <img${addAttribute(s.img, "src")} alt="" loading="lazy" draggable="false"> <span class="vh-film-id vh-mono">${s.id}</span> </div> </div>`)} </div> </div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/Lookbook.astro", void 0);

const $$KineticWordmark = createComponent(($$result, $$props, $$slots) => {
  const word = "Villa Happ";
  const repeat = 6;
  return renderTemplate`${maybeRenderHead()}<section class="vh-kinetic" aria-hidden="true"> <div class="vh-kinetic-row" data-kinetic-row> ${Array.from({ length: repeat }).map((_, i) => renderTemplate`<span${addAttribute(`vh-kinetic-word${i % 2 === 1 ? " is-outline" : ""}`, "class")}>${word}<i class="vh-kinetic-star">✦</i></span>`)} </div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/KineticWordmark.astro", void 0);

const $$Brands = createComponent(($$result, $$props, $$slots) => {
  const brands = ["Patta", "Daily Paper", "Olaf", "Filling Pieces", "Arte", "New Amsterdam"];
  return renderTemplate`${maybeRenderHead()}<section class="vh-brands"> <div class="vh-brands-inner"> <p class="vh-brands-label vh-mono">08 / H_APProved</p> <h2 class="vh-brands-title vh-reveal">Merken die wij dragen, <span class="vh-italic-accent">gecureerd</span> voor jou.</h2> <div class="vh-brands-grid vh-reveal"> ${brands.map((b) => renderTemplate`<a href="/brands" class="vh-brand-cell">${b}</a>`)} </div> </div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/Brands.astro", void 0);

const $$NewsletterCTA = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section class="vh-newsletter-cta"> <div class="vh-newsletter-cta-inner"> <p class="vh-newsletter-cta-label vh-mono">09 / Word lid</p> <h2 class="vh-newsletter-cta-title vh-reveal">Mis geen enkele <span class="vh-italic-accent">drop</span></h2> <p class="vh-newsletter-cta-desc vh-reveal">
Schrijf je in en wees als eerste op de hoogte van nieuwe releases,
      exclusieve drops en het verhaal achter elk stuk.
</p> <form class="vh-newsletter-cta-form vh-reveal" id="vh-newsletter-hero" novalidate> <label for="vh-nl-hero-email" class="vh-sr-only">E-mailadres</label> <input type="email" id="vh-nl-hero-email" name="email" placeholder="jouw@e-mailadres.nl" required autocomplete="email"> <button type="submit">Inschrijven →</button> </form> <p class="vh-newsletter-cta-msg" data-msg role="status" aria-live="polite"></p> </div> </section> ${renderScript($$result, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/NewsletterCTA.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/home/NewsletterCTA.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "bodyClass": "vh-home", "title": "Villa Happ — Heritage lifestyle, gemaakt voor nu" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Loader", $$Loader, {})} ${renderComponent($$result2, "Hero", $$Hero, {})} ${renderComponent($$result2, "Marquee", $$Marquee, {})} ${renderComponent($$result2, "Manifesto", $$Manifesto, {})} ${renderComponent($$result2, "YearMask", $$YearMask, {})} ${renderComponent($$result2, "HeritageScroll", $$HeritageScroll, {})} ${renderComponent($$result2, "DropSpotlight", $$DropSpotlight, {})} ${renderComponent($$result2, "ShopGrid", $$ShopGrid, {})} ${renderComponent($$result2, "Lookbook", $$Lookbook, {})} ${renderComponent($$result2, "KineticWordmark", $$KineticWordmark, {})} ${renderComponent($$result2, "Brands", $$Brands, {})} ${renderComponent($$result2, "NewsletterCTA", $$NewsletterCTA, {})} ` })} ${renderScript($$result, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/index.astro?astro&type=script&index=0&lang.ts")} ${renderScript($$result, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/index.astro?astro&type=script&index=1&lang.ts")}`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/index.astro", void 0);

const $$file = "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
