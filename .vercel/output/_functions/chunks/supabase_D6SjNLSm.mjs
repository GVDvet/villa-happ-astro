import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON = "your-anon-key";
const SUPABASE_SERVICE = "your-service-role-key";
let _public = null;
let _admin = null;
function getSupabase() {
  if (!_public) {
    _public = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false }
    });
  }
  return _public;
}
function getSupabaseAdmin() {
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
      auth: { persistSession: false }
    });
  }
  return _admin;
}

export { getSupabase as a, getSupabaseAdmin as g };
