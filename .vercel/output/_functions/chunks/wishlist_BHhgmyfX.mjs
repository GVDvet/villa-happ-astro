import { c as createComponent } from './astro-component_CWRrAAE8.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate } from './entrypoint_Cg1PWc_S.mjs';
import { $ as $$Base, r as renderScript } from './Base_DkAHPksC.mjs';
import { $ as $$Placeholder } from './Placeholder_Cq4rMHWw.mjs';

const $$Wishlist = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Wishlist · Villa Happ" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Placeholder", $$Placeholder, { "eyebrow": "Bewaard", "title": "Wishlist", "text": "Jouw favoriete stukken, op één plek. Deze functie komt binnenkort beschikbaar." })} ` })} ${renderScript($$result, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/wishlist.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/wishlist.astro", void 0);

const $$file = "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/wishlist.astro";
const $$url = "/wishlist";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Wishlist,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
