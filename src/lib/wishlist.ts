/**
 * Villa Happ — Client-side verlanglijst (localStorage)
 *
 * Mirror van het cart-patroon. Werkt zonder account; klaar voor server-sync
 * zodra er accounts zijn. Endowed progress + loss aversion + Zeigarnik:
 * bewaarde stukken houden de intentie levend.
 */

export interface WishItem {
  slug: string;
  name: string;
  price_cents: number;
  compare_at_cents?: number;
  image_url: string;
  color?: string;
}

const KEY = 'vh_wishlist_v1';
type Listener = (items: WishItem[]) => void;
const listeners = new Set<Listener>();

function store() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

export function getWishlist(): WishItem[] {
  const s = store();
  if (!s) return [];
  try {
    const raw = s.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function save(items: WishItem[]) {
  const s = store();
  if (s) s.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l(items));
  updateBadge(items.length);
}

export function inWishlist(slug: string): boolean {
  return getWishlist().some((i) => i.slug === slug);
}

/** Toggle een stuk. Returnt true als het nu bewaard is, false als verwijderd. */
export function toggleWishlist(item: WishItem): boolean {
  const items = getWishlist();
  const idx = items.findIndex((i) => i.slug === item.slug);
  if (idx >= 0) { items.splice(idx, 1); save(items); return false; }
  items.push(item); save(items); return true;
}

export function removeWish(slug: string) {
  save(getWishlist().filter((i) => i.slug !== slug));
}

export function wishlistCount(): number {
  return getWishlist().length;
}

export function onWishlistChange(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function updateBadge(n: number) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-wish-count]').forEach((el) => {
    el.textContent = String(n);
    el.setAttribute('data-wish-count', String(n));
  });
}

// Init badge bij page load (en na elke View Transitions-swap)
if (typeof window !== 'undefined') {
  const syncBadge = () => updateBadge(wishlistCount());
  window.addEventListener('DOMContentLoaded', syncBadge);
  document.addEventListener('astro:page-load', syncBadge);
}
