/**
 * Villa Happ — pagina-init onder View Transitions
 *
 * Met de ClientRouter draait een module-script maar één keer per
 * sitebezoek, terwijl de DOM per navigatie vervangen wordt. Registreer
 * DOM-bindende init-code daarom via onPageReady: die draait bij de
 * eerste load én na elke swap, precies één keer per paginaweergave.
 *
 * De init hoort zelf te checken of zijn pagina aanwezig is (marker-
 * element) en direct te returnen zo niet; page-load vuurt namelijk
 * sitebreed. Geef optioneel een cleanup-functie terug voor document-
 * en window-listeners; die draait vlak voor de volgende swap.
 */

type Cleanup = void | (() => void);

let generation = 0;
let generationHooked = false;

export function onPageReady(init: () => Cleanup): void {
  let ranFor = -1;
  let cleanup: Cleanup;

  const run = () => {
    if (ranFor === generation) return; // dubbele events op dezelfde weergave
    ranFor = generation;
    cleanup = init();
  };

  if (!generationHooked) {
    generationHooked = true;
    document.addEventListener('astro:before-swap', () => { generation += 1; });
  }
  document.addEventListener('astro:before-swap', () => {
    if (cleanup) { cleanup(); cleanup = undefined; }
  });

  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run, { once: true });
  document.addEventListener('astro:page-load', run);
}
