/**
 * Villa Happ — Supabase client wrappers
 *
 * Public client: gebruikt anon key, alleen RLS-toegestane queries.
 * Admin client: gebruikt service role key, server-only.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.warn('[Villa Happ] Supabase env vars ontbreken — running zonder DB.');
    return null;
  }
  if (!_public) {
    _public = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false },
    });
  }
  return _public;
}

/**
 * Admin client — server-only. Bypass RLS. Gebruik alleen in API routes.
 */
export function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    console.warn('[Villa Happ] Supabase admin keys ontbreken.');
    return null;
  }
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
      auth: { persistSession: false },
    });
  }
  return _admin;
}
