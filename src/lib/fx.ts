/**
 * Villa Happ — Micro-feedback effecten
 *
 * Vlieg-naar-mandje: een kloon van het product vliegt naar het cart-icoon,
 * dat daarna kort opveert. Directe, tastbare bevestiging (Doherty < 400ms,
 * peak-end). Respecteert prefers-reduced-motion (dan alleen de bump).
 */

export function bumpCart() {
  const icon = document.querySelector('.vh-header-cart') as HTMLElement | null;
  if (!icon) return;
  icon.classList.remove('is-bumped');
  void icon.offsetWidth; // forceer reflow zodat de animatie opnieuw start
  icon.classList.add('is-bumped');
}

export function flyToCart(imageUrl: string, fromX: number, fromY: number) {
  if (typeof document === 'undefined') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = document.querySelector('.vh-header-cart') as HTMLElement | null;
  if (reduce || !icon || !imageUrl) { bumpCart(); return; }

  const dest = icon.getBoundingClientRect();
  const dx = dest.left + dest.width / 2 - fromX;
  const dy = dest.top + dest.height / 2 - fromY;

  const fly = document.createElement('img');
  fly.src = imageUrl;
  fly.className = 'vh-fly';
  fly.alt = '';
  fly.style.left = fromX + 'px';
  fly.style.top = fromY + 'px';
  document.body.appendChild(fly);

  requestAnimationFrame(() => {
    fly.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.12)`;
    fly.style.opacity = '0.25';
  });

  setTimeout(() => { fly.remove(); bumpCart(); }, 680);
}
