import { c as createComponent } from './astro-component_CWRrAAE8.mjs';
import 'piccolore';
import { q as createRenderInstruction, m as maybeRenderHead, o as renderComponent, p as Fragment, k as renderTemplate, h as addAttribute, v as renderSlot, w as renderHead, u as unescapeHTML } from './entrypoint_Cg1PWc_S.mjs';
import 'clsx';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

const $$Header = createComponent(($$result, $$props, $$slots) => {
  const navLinks = [
    { label: "Home", href: "/", preview: "/img/products/hoodie-grey-lifestyle.webp" },
    { label: "Shop", href: "/shop", preview: "/img/products/hoodie-grey-front.webp" },
    { label: "Brands", href: "/brands", preview: "/img/products/hoodie-blue-lifestyle.webp" },
    { label: "Drops", href: "/drops", preview: "/img/products/hoodie-blue-front.webp" },
    { label: "Story", href: "/story", preview: "/img/heritage/origin-babyparadijs.webp" },
    { label: "Journal", href: "/journal", preview: "/img/products/hoodie-logo-detail.webp" }
  ];
  return renderTemplate`${maybeRenderHead()}<header class="vh-header" id="vh-header" data-astro-cid-qlfjksao> <a href="/" class="vh-header-logo" aria-label="Villa Happ home" data-astro-cid-qlfjksao> <img src="/img/brand/villa-happ-logo.webp" alt="Villa Happ" width="36" height="36" data-astro-cid-qlfjksao> </a> <nav class="vh-header-nav" aria-label="Hoofdnavigatie" data-astro-cid-qlfjksao> <ul class="vh-header-nav-list" role="list" data-astro-cid-qlfjksao> ${navLinks.map((link, idx) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-qlfjksao": true }, { "default": ($$result2) => renderTemplate` <li data-astro-cid-qlfjksao><a${addAttribute(link.href, "href")} class="vh-header-nav-link"${addAttribute(link.preview, "data-nav-preview")} data-astro-cid-qlfjksao>${link.label}</a></li> ${idx < navLinks.length - 1 && renderTemplate`<span class="vh-header-nav-sep" aria-hidden="true" data-astro-cid-qlfjksao>·</span>`}` })}`)} </ul> </nav> <!-- Nav hover-reveal preview --> <div class="vh-nav-preview" id="vh-nav-preview" aria-hidden="true" data-astro-cid-qlfjksao> <img src="" alt="" data-astro-cid-qlfjksao> </div> <div class="vh-header-actions" data-astro-cid-qlfjksao> <button type="button" class="vh-header-icon" aria-label="Zoeken" data-astro-cid-qlfjksao> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-astro-cid-qlfjksao> <circle cx="11" cy="11" r="8" data-astro-cid-qlfjksao></circle> <line x1="21" y1="21" x2="16.65" y2="16.65" data-astro-cid-qlfjksao></line> </svg> </button> <a href="/wishlist" class="vh-header-icon" aria-label="Wishlist" data-astro-cid-qlfjksao> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-astro-cid-qlfjksao> <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" data-astro-cid-qlfjksao></path> </svg> </a> <a href="/cart" class="vh-header-icon vh-header-cart" aria-label="Winkelmandje" data-astro-cid-qlfjksao> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-astro-cid-qlfjksao> <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" data-astro-cid-qlfjksao></path> <line x1="3" y1="6" x2="21" y2="6" data-astro-cid-qlfjksao></line> <path d="M16 10a4 4 0 0 1-8 0" data-astro-cid-qlfjksao></path> </svg> <span class="vh-header-cart-count" data-cart-count data-astro-cid-qlfjksao>0</span> </a> <button type="button" class="vh-header-hamburger" id="vh-hamburger" aria-label="Menu openen" aria-expanded="false" data-astro-cid-qlfjksao> <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-astro-cid-qlfjksao> <line x1="3" y1="6" x2="21" y2="6" data-astro-cid-qlfjksao></line> <line x1="3" y1="12" x2="21" y2="12" data-astro-cid-qlfjksao></line> <line x1="3" y1="18" x2="21" y2="18" data-astro-cid-qlfjksao></line> </svg> </button> </div> </header> <!-- Mobile menu --> <div class="vh-mobile-menu" id="vh-mobile-menu" aria-hidden="true" data-astro-cid-qlfjksao> <ul class="vh-mobile-menu-list" role="list" data-astro-cid-qlfjksao> ${navLinks.map((link, idx) => renderTemplate`<li${addAttribute(`--idx: ${idx + 1};`, "style")} data-astro-cid-qlfjksao> <span class="vh-mobile-menu-num" data-astro-cid-qlfjksao>0${idx + 1}</span> <a${addAttribute(link.href, "href")} class="vh-mobile-menu-link" data-astro-cid-qlfjksao>${link.label}</a> </li>`)} </ul> </div>  ${renderScript($$result, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/layout/Header.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/layout/Header.astro", void 0);

const $$Footer = createComponent(async ($$result, $$props, $$slots) => {
  const navCols = [
    {
      title: "Shop",
      links: [
        { label: "Hele collectie", href: "/shop" },
        { label: "Limited drops", href: "/drops" },
        { label: "H_APProved brands", href: "/brands" },
        { label: "Wishlist", href: "/wishlist" }
      ]
    },
    {
      title: "Verhaal",
      links: [
        { label: "Heritage", href: "/story" },
        { label: "Journal", href: "/journal" },
        { label: "Pers", href: "/pers" }
      ]
    },
    {
      title: "Service",
      links: [
        { label: "Contact", href: "/contact" },
        { label: "Verzending", href: "/verzending" },
        { label: "Retourneren", href: "/retourneren" },
        { label: "FAQ", href: "/faq" }
      ]
    }
  ];
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer class="vh-footer" data-astro-cid-35ed7um5> <div class="vh-footer-inner vh-container" data-astro-cid-35ed7um5> <div class="vh-footer-mega" aria-hidden="true" data-astro-cid-35ed7um5> ${[..."VILLA HAPP"].map(
    (ch) => ch === " " ? renderTemplate`<span class="vh-mega-sp" data-astro-cid-35ed7um5></span>` : renderTemplate`<span class="vh-mega-ch" data-astro-cid-35ed7um5>${ch}</span>`
  )} </div> <div class="vh-footer-top" data-astro-cid-35ed7um5> <!-- Brand + Newsletter --> <div class="vh-footer-brand-col" data-astro-cid-35ed7um5> <img src="/img/brand/villa-happ-logo.webp" alt="Villa Happ" width="48" height="48" class="vh-footer-logo" data-astro-cid-35ed7um5> <p class="vh-footer-tagline" data-astro-cid-35ed7um5>
Een lifestylelabel met historie,<br data-astro-cid-35ed7um5>
karakter en toekomst.
</p> <form class="vh-newsletter" id="vh-newsletter" data-astro-cid-35ed7um5> <h3 class="vh-footer-heading" data-astro-cid-35ed7um5>Blijf in the know</h3> <p class="vh-newsletter-tagline" data-astro-cid-35ed7um5>
Als eerste op de hoogte van nieuwe drops en exclusieve releases.
</p> <div class="vh-newsletter-row" data-astro-cid-35ed7um5> <label for="vh-newsletter-email" class="vh-sr-only" data-astro-cid-35ed7um5>E-mailadres</label> <input type="email" id="vh-newsletter-email" name="email" placeholder="jouw@e-mailadres.nl" required autocomplete="email" data-astro-cid-35ed7um5> <button type="submit" data-astro-cid-35ed7um5>
Inschrijven
<svg width="14" height="14" viewBox="0 0 16 16" fill="none" data-astro-cid-35ed7um5> <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-35ed7um5></path> </svg> </button> </div> <p class="vh-newsletter-msg" data-msg role="status" aria-live="polite" data-astro-cid-35ed7um5></p> </form> </div> <!-- Nav columns --> <div class="vh-footer-cols" data-astro-cid-35ed7um5> ${navCols.map((col) => renderTemplate`<div class="vh-footer-col" data-astro-cid-35ed7um5> <h4 class="vh-footer-heading" data-astro-cid-35ed7um5>${col.title}</h4> <ul role="list" data-astro-cid-35ed7um5> ${col.links.map((link) => renderTemplate`<li data-astro-cid-35ed7um5><a${addAttribute(link.href, "href")} data-astro-cid-35ed7um5>${link.label}</a></li>`)} </ul> </div>`)} </div> </div> <div class="vh-footer-bottom" data-astro-cid-35ed7um5> <p class="vh-footer-copy" data-astro-cid-35ed7um5>© ${year} Villa Happ. Alle rechten voorbehouden.</p> <ul class="vh-footer-legal" role="list" data-astro-cid-35ed7um5> <li data-astro-cid-35ed7um5><a href="/privacy" data-astro-cid-35ed7um5>Privacy</a></li> <li data-astro-cid-35ed7um5><a href="/algemene-voorwaarden" data-astro-cid-35ed7um5>Voorwaarden</a></li> <li data-astro-cid-35ed7um5><a href="/cookies" data-astro-cid-35ed7um5>Cookies</a></li> </ul> </div> </div> </footer>  ${renderScript($$result, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/layout/Footer.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/layout/Footer.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Base = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Base;
  const {
    title = "Villa Happ · Heritage lifestyle, gemaakt voor nu",
    description = "Nederlands lifestylelabel sinds 1960. Van familieverhaal naar mode-erfgoed. Limited edition drops en gecureerde merken uit Tilburg.",
    ogImage = "/img/brand/villa-happ-logo.webp",
    bodyClass = "",
    showHeader = true,
    showFooter = true
  } = Astro2.props;
  const canonicalURL = new URL(Astro2.url.pathname, Astro2.site || Astro2.url.origin);
  return renderTemplate(_a || (_a = __template([`<html lang="nl" class="no-js" data-astro-cid-5hce7sga> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/webp" href="/img/brand/villa-happ-logo.webp"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preload" as="image" href="/img/products/hoodie-grey-lifestyle.webp" fetchpriority="high"><script>document.documentElement.classList.remove('no-js');<\/script><title>`, '</title><meta name="description"', '><link rel="canonical"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:type" content="website"><meta property="og:url"', '><meta property="og:site_name" content="Villa Happ"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#F7F3EC"><!-- JSON-LD: Organization --><script type="application/ld+json">', "<\/script>", "</head> <body", ' data-astro-cid-5hce7sga> <a class="vh-skip-link" href="#main-content" data-astro-cid-5hce7sga>Ga naar inhoud</a> <!-- Page transition wipe --> <div class="vh-wipe" id="vh-wipe" aria-hidden="true" data-astro-cid-5hce7sga> <span class="vh-wipe-mark" data-astro-cid-5hce7sga>Villa Happ</span> </div> ', ' <main id="main-content" data-astro-cid-5hce7sga> ', " </main> ", "  <script>\n    (function () {\n      var wipe = document.getElementById('vh-wipe');\n      if (!wipe) return;\n      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n\n      // Reveal bij binnenkomst (alleen na interne navigatie)\n      if (!reduce && sessionStorage.getItem('vh-nav')) {\n        sessionStorage.removeItem('vh-nav');\n        wipe.classList.add('cover-instant');\n        requestAnimationFrame(function () {\n          requestAnimationFrame(function () {\n            wipe.classList.remove('cover-instant');\n            wipe.classList.add('reveal');\n            setTimeout(function () { wipe.classList.remove('reveal'); }, 600);\n          });\n        });\n      }\n\n      // Cover bij interne link-klik\n      document.addEventListener('click', function (e) {\n        if (reduce) return;\n        var a = e.target.closest && e.target.closest('a');\n        if (!a) return;\n        var href = a.getAttribute('href');\n        if (!href || href.charAt(0) === '#' || a.target === '_blank') return;\n        if (href.indexOf('http') === 0 && href.indexOf(window.location.origin) !== 0) return;\n        if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;\n        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;\n        // Zelfde pagina? niets doen\n        var url = new URL(href, window.location.href);\n        if (url.pathname === window.location.pathname) return;\n\n        e.preventDefault();\n        sessionStorage.setItem('vh-nav', '1');\n        wipe.classList.add('cover');\n        setTimeout(function () { window.location.href = url.href; }, 560);\n      });\n\n      // Bij terug-knop (bfcache) reset wipe\n      window.addEventListener('pageshow', function (ev) {\n        if (ev.persisted) { wipe.className = 'vh-wipe'; }\n      });\n    })();\n  <\/script> </body> </html>"])), title, addAttribute(description, "content"), addAttribute(canonicalURL.toString(), "href"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(canonicalURL.toString(), "content"), unescapeHTML(JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Villa Happ",
    url: canonicalURL.origin,
    logo: `${canonicalURL.origin}/img/brand/villa-happ-logo.webp`,
    description: "Nederlands lifestylelabel sinds 1960.",
    foundingDate: "1960",
    foundingLocation: { "@type": "Place", name: "Tilburg, Nederland" }
  })), renderHead(), addAttribute(`vh-body ${bodyClass}`, "class"), showHeader && renderTemplate`${renderComponent($$result, "Header", $$Header, { "data-astro-cid-5hce7sga": true })}`, renderSlot($$result, $$slots["default"]), showFooter && renderTemplate`${renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-5hce7sga": true })}`);
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/layouts/Base.astro", void 0);

export { $$Base as $, renderScript as r };
