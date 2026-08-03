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
export function getClient() {
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
  authKnown: false, // true once the stored session has been checked
  firstSyncDone: false, // true once the launch pull has completed (or failed)
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
let syncingSince = 0; // 0 = not syncing; stale after 20s so a hung sync can't block forever

export async function fullSync() {
  const supa = getClient();
  if (!supa || !status.user) return;
  if (syncingSince && Date.now() - syncingSince < 20000) return;
  syncingSince = Date.now();
  setStatus({ state: 'syncing' });
  try {
    const { data, error } = await supa.from(TABLE).select('key,value,updated_at');
    if (error) throw error;

    const now = Date.now();
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
      } else if (ts === remoteTs && ts === 1) {
        // Pre-sync data on both devices: timestamps are both the legacy "1",
        // so neither side wins on time. Keep the larger payload — a real
        // profile/log always beats a near-empty default.
        const localLen = JSON.stringify(value ?? null).length;
        const remoteLen = JSON.stringify(row.value ?? null).length;
        if (remoteLen > localLen) {
          applyRemoteValue(key, row.value, remoteTs);
          applied = true;
        } else if (localLen > remoteLen) {
          applyRemoteValue(key, value, now); // re-stamp locally so it now outranks the cloud copy
          pushRows.push({
            user_id: status.user.id,
            key,
            value,
            updated_at: new Date(now).toISOString(),
          });
        }
      }
    }

    if (pushRows.length) {
      const { error: upErr } = await supa
        .from(TABLE)
        .upsert(pushRows, { onConflict: 'user_id,key' });
      if (upErr) throw upErr;
    }

    setStatus({ state: 'synced', error: '', lastSyncAt: Date.now(), firstSyncDone: true });
    if (applied && onRemoteApplied) onRemoteApplied();
  } catch (err) {
    setStatus({ state: 'error', error: err.message || String(err), firstSyncDone: true });
  } finally {
    syncingSince = 0;
  }
}

// One-shot cloud backup taken before any force operation, so a wrong-way
// force can always be undone from Settings.
const BACKUP_KEY = 'backup_pre_force';

async function snapshotCloudToBackup(supa) {
  const { data, error } = await supa.from(TABLE).select('key,value,updated_at');
  if (error) throw error;
  const rows = (data || []).filter((r) => r.key !== BACKUP_KEY);
  await supa.from(TABLE).upsert(
    {
      user_id: status.user.id,
      key: BACKUP_KEY,
      value: { snapshotAt: new Date().toISOString(), rows },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,key' },
  );
}

export async function getForceBackupInfo() {
  const supa = getClient();
  if (!supa || !status.user) return null;
  const { data } = await supa.from(TABLE).select('value').eq('key', BACKUP_KEY).maybeSingle();
  return data?.value?.snapshotAt || null;
}

// Put the cloud back exactly as it was before the last force operation,
// then pull it down to this device.
export async function restoreForceBackup() {
  const supa = getClient();
  if (!supa || !status.user) return { error: 'Not signed in.' };
  setStatus({ state: 'syncing' });
  try {
    const { data, error } = await supa.from(TABLE).select('value').eq('key', BACKUP_KEY).maybeSingle();
    if (error) throw error;
    const rows = data?.value?.rows;
    if (!Array.isArray(rows) || !rows.length) throw new Error('No backup found.');
    await supa.from(TABLE).upsert(
      rows.map((r) => ({
        user_id: status.user.id,
        key: r.key,
        value: r.value,
        updated_at: new Date().toISOString(), // newest → wins on every device
      })),
      { onConflict: 'user_id,key' },
    );
    // Apply to this device immediately
    for (const r of rows) {
      if (SYNC_STORAGE_KEYS.includes(r.key)) applyRemoteValue(r.key, r.value, Date.now());
    }
    setStatus({ state: 'synced', error: '', lastSyncAt: Date.now() });
    if (onRemoteApplied) onRemoteApplied();
    return { restoredAt: data.value.snapshotAt };
  } catch (err) {
    setStatus({ state: 'error', error: err.message || String(err) });
    return { error: err.message || String(err) };
  }
}

// Replace the cloud copy with everything on this device (mirror, including
// removals). Escape hatch when normal merging can't decide.
export async function forceUpload() {
  const supa = getClient();
  if (!supa || !status.user) return { error: 'Not signed in.' };
  setStatus({ state: 'syncing' });
  try {
    await snapshotCloudToBackup(supa);
    const now = Date.now();
    const rows = getSyncSnapshot().map(({ key, value }) => {
      applyRemoteValue(key, value, now); // re-stamp local meta so this version wins everywhere
      return {
        user_id: status.user.id,
        key,
        value,
        updated_at: new Date(now).toISOString(),
      };
    });
    const { error } = await supa.from(TABLE).upsert(rows, { onConflict: 'user_id,key' });
    if (error) throw error;
    setStatus({ state: 'synced', error: '', lastSyncAt: Date.now() });
    return {};
  } catch (err) {
    setStatus({ state: 'error', error: err.message || String(err) });
    return { error: err.message || String(err) };
  }
}

// Replace everything on this device with the cloud copy.
export async function forceDownload() {
  const supa = getClient();
  if (!supa || !status.user) return { error: 'Not signed in.' };
  setStatus({ state: 'syncing' });
  try {
    // Preserve this device's data in the backup too (merged over cloud rows)
    // so an accidental force-download is also undoable.
    const { data: cloudRows, error: bErr } = await supa.from(TABLE).select('key,value,updated_at');
    if (bErr) throw bErr;
    const merged = new Map((cloudRows || []).filter((r) => r.key !== BACKUP_KEY).map((r) => [r.key, r]));
    for (const { key, value } of getSyncSnapshot()) {
      if (value != null) merged.set(key, { key, value, updated_at: new Date().toISOString() });
    }
    await supa.from(TABLE).upsert(
      {
        user_id: status.user.id,
        key: BACKUP_KEY,
        value: { snapshotAt: new Date().toISOString(), rows: [...merged.values()] },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,key' },
    );
    const { data, error } = await supa.from(TABLE).select('key,value,updated_at');
    if (error) throw error;
    const remote = new Map((data || []).map((r) => [r.key, r]));
    for (const { key } of getSyncSnapshot()) {
      const row = remote.get(key);
      if (row) applyRemoteValue(key, row.value, Date.parse(row.updated_at) || Date.now());
      else applyRemoteValue(key, null, Date.now());
    }
    setStatus({ state: 'synced', error: '', lastSyncAt: Date.now() });
    if (onRemoteApplied) onRemoteApplied();
    return {};
  } catch (err) {
    setStatus({ state: 'error', error: err.message || String(err) });
    return { error: err.message || String(err) };
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
    setStatus({ user, authKnown: true });
    if (user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
      // Deferred: Supabase API calls made synchronously from inside this
      // callback can deadlock on the client's internal auth lock.
      setTimeout(() => fullSync(), 0);
    }
  });

  window.addEventListener('online', () => {
    if (status.user) fullSync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && status.user) fullSync();
  });
}
