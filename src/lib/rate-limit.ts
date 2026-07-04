/**
 * Villa Happ — Eenvoudige rate limiter voor de API-routes
 *
 * In-memory per serverless-instance: geen harde garantie over meerdere
 * instances heen, maar stopt wel het gangbare misbruik (scripted spam,
 * brute force op één instance) zonder externe dependency. Voor echte
 * volumes later vervangen door Vercel Firewall of Upstash.
 */

interface Bucket { count: number; reset: number }

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();

  // Opportunistische cleanup zodat de map niet onbegrensd groeit
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) {
      if (now > b.reset) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Client-IP uit de request halen (Vercel zet x-forwarded-for). */
export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : 'unknown';
  return `${scope}:${ip}`;
}

export function tooManyRequests(message = 'Te veel verzoeken. Probeer het over een minuut opnieuw.'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
  });
}
