import { c as createComponent } from './astro-component_CWRrAAE8.mjs';
import 'piccolore';
import { m as maybeRenderHead, k as renderTemplate } from './entrypoint_Cg1PWc_S.mjs';
import 'clsx';

const $$Placeholder = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Placeholder;
  const { eyebrow = "Binnenkort", title, text = "Deze pagina is in de maak. Kom binnenkort terug, of schrijf je in voor onze nieuwsbrief om als eerste op de hoogte te zijn." } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="vh-placeholder" data-astro-cid-cvyyj45i> <div class="vh-placeholder-inner" data-astro-cid-cvyyj45i> <p class="vh-placeholder-eyebrow vh-mono" data-astro-cid-cvyyj45i>${eyebrow}</p> <h1 class="vh-placeholder-title" data-astro-cid-cvyyj45i>${title}</h1> <p class="vh-placeholder-text" data-astro-cid-cvyyj45i>${text}</p> <a href="/" class="vh-btn vh-btn--primary" data-magnetic data-astro-cid-cvyyj45i> <span data-astro-cid-cvyyj45i>Terug naar home</span> <svg class="vh-btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" data-astro-cid-cvyyj45i> <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-cvyyj45i></path> </svg> </a> </div> </section>`;
}, "C:/Users/geoff/Documents/Villa Happ/Astro_Website/src/components/Placeholder.astro", void 0);

export { $$Placeholder as $ };
