/**
 * Villa Happ — Client-side cart store
 *
 * Cart wordt opgeslagen in localStorage. Bij checkout wordt de
 * cart-payload naar /api/checkout/create gepost, waar de prijzen
 * server-side worden gevalideerd (klant kan prijzen niet manipuleren).
 */

import type { CartItem } from './types';

const STORAGE_KEY = 'vh_cart_v1';

type Listener = (items: CartItem[]) => void;
const listeners = new Set<Listener>();

function safeStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function getCart(): CartItem[] {
  const s = safeStorage();
  if (!s) return [];
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCart(items: CartItem[]) {
  const s = safeStorage();
  if (s) s.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach(l => l(items));
  // Update header badge
  if (typeof document !== 'undefined') {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach(el => {
      el.textContent = String(count);
      el.setAttribute('data-cart-count', String(count));
    });
  }
}

export function addToCart(item: CartItem) {
  const items = getCart();
  const existing = items.find(i => i.variant_id === item.variant_id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }
  setCart(items);
}

export function updateQuantity(variantId: string, qty: number) {
  const items = getCart();
  const item = items.find(i => i.variant_id === variantId);
  if (!item) return;
  if (qty <= 0) {
    setCart(items.filter(i => i.variant_id !== variantId));
  } else {
    item.quantity = qty;
    setCart(items);
  }
}

export function removeFromCart(variantId: string) {
  setCart(getCart().filter(i => i.variant_id !== variantId));
}

export function clearCart() {
  setCart([]);
}

export function cartSubtotal(): number {
  return getCart().reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0);
}

export function cartCount(): number {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function onCartChange(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ---------- Verzendkosten (zelfde regels als de checkout-API) ---------- */
export function shippingCostCents(country: string, subtotalCents: number): number {
  if (subtotalCents >= 7500) return 0;
  if (country === 'BE') return 695;
  if (country === 'DE') return 895;
  return 495; // NL
}

export const FREE_SHIPPING_CENTS = 7500;

/* ---------- Demo-modus detectie ---------- */
export function isDemoItem(item: CartItem): boolean {
  return item.variant_id.startsWith('demo-');
}

export function cartHasDemo(): boolean {
  return getCart().some(isDemoItem);
}

/* ---------- Cart drawer openen vanaf elke pagina ---------- */
export function openCart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vh:open-cart'));
  }
}

// Init badge bij page load (en na elke View Transitions-swap)
if (typeof window !== 'undefined') {
  const syncBadge = () => {
    const count = cartCount();
    document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach(el => {
      el.textContent = String(count);
      el.setAttribute('data-cart-count', String(count));
    });
  };
  window.addEventListener('DOMContentLoaded', syncBadge);
  document.addEventListener('astro:page-load', syncBadge);
}
