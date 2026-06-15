/**
 * Villa Happ — Onlangs bekeken (localStorage)
 *
 * Mere-exposure + Zeigarnik: stukken die je net zag opnieuw tonen verlaagt
 * de drempel om terug te keren. Max 8, nieuwste eerst.
 */

export interface RecentItem {
  slug: string;
  name: string;
  price_cents: number;
  image_url: string;
}

const KEY = 'vh_recent_v1';
const MAX = 8;

function store() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

export function getRecent(): RecentItem[] {
  const s = store();
  if (!s) return [];
  try {
    const raw = s.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function recordRecent(item: RecentItem) {
  const s = store();
  if (!s) return;
  let items = getRecent().filter((i) => i.slug !== item.slug);
  items.unshift(item);
  items = items.slice(0, MAX);
  try { s.setItem(KEY, JSON.stringify(items)); } catch {}
}
