/** POST /api/beheer/logout — sessiecookie wissen. */
import type { APIRoute } from 'astro';
import { BEHEER_COOKIE } from '../../../lib/beheer-sessie';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(BEHEER_COOKIE, { path: '/' });
  return redirect('/beheer', 303);
};
