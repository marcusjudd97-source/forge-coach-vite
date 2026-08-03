// ── Cloud sync engine (Supabase) ────────────────────────────────────────────
//
// One table, `forge_data`, one row per (user, storage key). Merging is
// last-write-wins per key: on every full sync the newer side (local vs cloud)
// overwrites the older. Local writes are pushed with a short debounce; pulls
// happen on sign-in, app start, tab focus, and coming back online.
//
// The Anthropic API key is deliberately NOT synced — it stays in this browser.

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, syncConfigured } from './syncConfig.js';
import {
  SYNC_STORAGE_KEYS,
  getSyncSnapshot,
  applyRemoteValue,
  setStorageChangeListener,
} from './storage.js';

export { syncConfigured };

const TABLE = 'forge_data';
const PUSH_DEBOUNCE_MS = 1200;

let client = null;
function getClient() {
  if (!syncConfigured) return null;
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

// ── status ──────────────────────────────────────────────────────────────────

let status = {
  state: 'idle', // idle | syncing | synced | error
  error: '',
  lastSyncAt: null, // ms epoch
  user: null, // supabase user or null
};
const statusListeners = new Set();

function setStatus(patch) {
  status = { ...status, ...patch };
  statusListeners.forEach((fn) => fn(status));
}

export function getSyncStatus() {
  return status;
}

export function onSyncStatus(fn) {
  statusListeners.add(fn);
  fn(status);
  return () => statusListeners.delete(fn);
}

// ── push queue ──────────────────────────────────────────────────────────────

const dirty = new Map(); // key -> { value, ts }
let pushTimer = null;

function queuePush(key, value, ts) {
  if (!status.user) return; // signed out: local-only, fullSync reconciles later
  dirty.set(key, { value, ts });
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(flushPush, PUSH_DEBOUNCE_MS);
}

async function flushPush() {
  pushTimer = null;
  const supa = getClient();
  if (!supa || !status.user || dirty.size === 0) return;
  const batch = [...dirty.entries()];
  dirty.clear();
  const rows = batch.map(([key, { value, ts }]) => ({
    user_id: status.user.id,
    key,
    value,
    updated_at: new Date(ts).toISOString(),
  }));
  setStatus({ state: 'syncing' });
  const { error } = await supa.from(TABLE).upsert(rows, { onConflict: 'user_id,key' });
  if (error) {
    // Re-queue anything that wasn't overwritten by a newer local write meanwhile.
    batch.forEach(([key, entry]) => {
      if (!dirty.has(key)) dirty.set(key, entry);
    });
    setStatus({ state: 'error', error: error.message });
    return;
  }
  setStatus({ state: 'synced', error: '', lastSyncAt: Date.now() });
}

// ── full sync (pull + reconcile) ────────────────────────────────────────────

let onRemoteApplied = null;
let syncing = false;

export async function fullSync() {
  const supa = getClient();
  if (!supa || !status.user || syncing) return;
  syncing = true;
  setStatus({ state: 'syncing' });
  try {
    const { data, error } = await supa.from(TABLE).select('key,value,updated_at');
    if (error) throw error;

    const remote = new Map((data || []).map((r) => [r.key, r]));
    const pushRows = [];
    let applied = false;

    for (const { key, value, ts } of getSyncSnapshot()) {
      const row = remote.get(key);
      const remoteTs = row ? Date.parse(row.updated_at) || 0 : 0;
      if (remoteTs > ts) {
        applyRemoteValue(key, row.value, remoteTs);
        applied = true;
      } else if (ts > remoteTs && ts > 0) {
        pushRows.push({
          user_id: status.user.id,
          key,
          value,
          updated_at: new Date(ts).toISOString(),
        });
      }
    }

    if (pushRows.length) {
      const { error: upErr } = await supa
        .from(TABLE)
        .upsert(pushRows, { onConflict: 'user_id,key' });
      if (upErr) throw upErr;
    }

    setStatus({ state: 'synced', error: '', lastSyncAt: Date.now() });
    if (applied && onRemoteApplied) onRemoteApplied();
  } catch (err) {
    setStatus({ state: 'error', error: err.message || String(err) });
  } finally {
    syncing = false;
  }
}

// ── auth ────────────────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const supa = getClient();
  if (!supa) return { error: 'Sync is not configured.' };
  const { data, error } = await supa.auth.signUp({ email, password });
  if (error) return { error: error.message };
  // With email confirmation enabled Supabase returns a user but no session.
  if (!data.session) return { needsConfirmation: true };
  return {};
}

export async function signIn(email, password) {
  const supa = getClient();
  if (!supa) return { error: 'Sync is not configured.' };
  const { error } = await supa.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return {};
}

export async function signOut() {
  const supa = getClient();
  if (!supa) return;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  await flushPush().catch(() => {});
  await supa.auth.signOut();
  dirty.clear();
  setStatus({ state: 'idle', error: '', user: null });
}

// ── init ────────────────────────────────────────────────────────────────────

let initialized = false;

export function initSync({ onRemoteApplied: cb } = {}) {
  onRemoteApplied = cb || null;
  if (!syncConfigured || initialized) return;
  initialized = true;
  const supa = getClient();

  setStorageChangeListener(queuePush);

  supa.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;
    setStatus({ user });
    if (user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
      fullSync();
    }
  });

  window.addEventListener('online', () => {
    if (status.user) fullSync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && status.user) fullSync();
  });
}
