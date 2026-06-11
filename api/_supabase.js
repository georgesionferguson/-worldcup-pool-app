import { createClient } from '@supabase/supabase-js';

export function adminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export const DEFAULT_COLORS = [
  '#1d4ed8', '#c8102e', '#059669', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4338ca',
  '#0d9488', '#b91c1c',
];
