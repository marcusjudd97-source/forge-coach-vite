// ── Supabase sync configuration ─────────────────────────────────────────────
//
// To enable cross-device sync, create a free Supabase project (see README,
// "Sync across devices") and paste its URL and anon public key below,
// OR set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY as env vars (e.g. in
// Vercel → Project → Settings → Environment Variables).
//
// The anon key is designed to be public — data is protected by Row Level
// Security, so each signed-in user can only ever read/write their own rows.

const HARDCODED_URL = ''; // e.g. 'https://abcdefgh.supabase.co'
const HARDCODED_ANON_KEY = ''; // the long 'anon public' key from Settings → API keys

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || HARDCODED_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || HARDCODED_ANON_KEY;

export const syncConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
