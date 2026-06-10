import { c as createComponent } from './astro-component_CWRrAAE8.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate } from './entrypoint_Cg1PWc_S.mjs';
import { $ as $$Base, r as renderScript } from './Base_DkAHPksC.mjs';
import { $ as $$Placeholder } from './Placeholder_Cq4rMHWw.mjs';

const $$Shop = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Shop · Villa Happ" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Placeholder", $$Placeholder, { "eyebrow": "De collectie", "title": "Shop", "text": "De volledige collectie komt eraan. Heritage hoodies, limited drops en meer, binnenkort hier te koop." })} ` })} ${renderScript($$result, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/shop.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/shop.astro", void 0);

const $$file = "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/pages/shop.astro";
const $$url = "/shop";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Shop,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
