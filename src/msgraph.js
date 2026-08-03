// ── Direct Microsoft Outlook integration (Graph API) ────────────────────────
//
// Signs in with the athlete's Microsoft account (work or personal) and:
//  - PUSHES the training plan + coach diary events straight INTO their real
//    calendar as timed, editable events (tagged with a hidden ForgeUid
//    property so we can update/remove our own events without touching theirs)
//  - READS their real diary (next 7 days) so coaches can plan around actual
//    meetings and commitments.
//
// App registration: "FORGE" in the MJ Motors tenant, multitenant + personal
// accounts, SPA redirect https://forge-coach-vite.vercel.app

import { PublicClientApplication } from '@azure/msal-browser';
import { addDays, todayIso } from './storage.js';

const CLIENT_ID = 'd67f8c15-6912-4495-aa08-e263465d2c84';
const SCOPES = ['User.Read', 'Calendars.ReadWrite'];
const EXT_PROP = 'String {7f4c1a52-9d3e-4b6a-8f21-0c5e9a7d3b18} Name ForgeUid';
const GRAPH = 'https://graph.microsoft.com/v1.0';

const msal = new PublicClientApplication({
  auth: {
    clientId: CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'localStorage' },
});

let initialized = false;
const listeners = new Set();

function notify() {
  const acct = getOutlookAccount();
  listeners.forEach((fn) => fn(acct));
}

export function onOutlookChange(fn) {
  listeners.add(fn);
  fn(getOutlookAccount());
  return () => listeners.delete(fn);
}

export async function initGraph() {
  if (initialized) return;
  initialized = true;
  await msal.initialize();
  try {
    const result = await msal.handleRedirectPromise();
    if (result?.account) msal.setActiveAccount(result.account);
  } catch {
    // interrupted login — ignore
  }
  if (!msal.getActiveAccount() && msal.getAllAccounts().length) {
    msal.setActiveAccount(msal.getAllAccounts()[0]);
  }
  notify();
}

export function getOutlookAccount() {
  try {
    return msal.getActiveAccount() || null;
  } catch {
    return null;
  }
}

export async function connectOutlook() {
  await msal.initialize();
  await msal.loginRedirect({ scopes: SCOPES, prompt: 'select_account' });
}

export async function disconnectOutlook() {
  const account = msal.getActiveAccount();
  // Local-only sign-out: clear tokens, don't bounce through Microsoft
  await msal.clearCache({ account });
  notify();
}

async function token() {
  const account = msal.getActiveAccount();
  if (!account) throw new Error('Not connected to Outlook.');
  const res = await msal.acquireTokenSilent({ scopes: SCOPES, account });
  return res.accessToken;
}

async function graphFetch(path, opts = {}) {
  const t = await token();
  const res = await fetch(`${GRAPH}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Graph ${res.status}: ${body.slice(0, 160)}`);
  }
  return res.status === 204 ? null : res.json();
}

function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
  } catch {
    return 'Europe/London';
  }
}

// Pull a start time out of session text ("7am", "06:30", "7:15pm"); default 06:00.
function parseSessionTime(text) {
  const t = String(text || '');
  let m = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  m = t.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (m) {
    let h = Number(m[1]) % 12;
    if (/pm/i.test(m[2])) h += 12;
    return `${String(h).padStart(2, '0')}:00`;
  }
  return '06:00';
}

function parseSessionMinutes(text) {
  const first = String(text || '').split('\n')[0];
  let m = first.match(/(?<![x×\d.])(\d+(?:\.\d+)?)\s*(?:hr|hrs|hours|h)\b/i);
  if (m) return Math.round(Number(m[1]) * 60);
  m = first.match(/(?<![x×\d.])(\d+(?:\.\d+)?)\s*(?:min|mins|minutes)\b/i);
  if (m) return Math.round(Number(m[1]));
  return 60;
}

function shortTitle(sessionText) {
  const first = String(sessionText || '').split('\n')[0].trim().slice(0, 80);
  const t = first.toLowerCase();
  let name = '';
  let emoji = '';
  if (/brick/.test(t)) [name, emoji] = ['Brick', '🔁'];
  else if (/\b(swim|pool|css|100m|open water|ow\b)/.test(t)) [name, emoji] = ['Swim', '🏊'];
  else if (/\b(bike|ride|turbo|kickr|ftp|watts|zwift|cycling)/.test(t)) [name, emoji] = ['Bike', '🚴'];
  else if (/\b(run|running|parkrun|marathon|5k|10k|half)/.test(t)) [name, emoji] = ['Run', '🏃'];
  else if (/\b(strength|gym|lift|weights|squat|deadlift|mobility|core)/.test(t)) [name, emoji] = ['Strength', '💪'];
  else if (/\brest\b/.test(t)) return '😴 Rest day';
  if (!name) return first.slice(0, 36) || 'Training';
  const duration =
    first.match(/(?<![x×\d.])\d+(?:\.\d+)?\s*(?:hr|hrs|hours|h)\b/i)?.[0] ||
    first.match(/(?<![x×\d.])\d+(?:\.\d+)?\s*(?:min|mins|minutes)\b/i)?.[0] ||
    first.match(/(?<![x×\d.])\d+(?:\.\d+)?\s*(?:km|mi)\b/i)?.[0] ||
    '';
  return `${emoji} ${name}${duration ? ` ${duration}` : ''}`;
}

function addMinutes(dateIso, timeHHMM, mins) {
  const [h, m] = timeHHMM.split(':').map(Number);
  const total = h * 60 + m + mins;
  const dayShift = Math.floor(total / 1440);
  const rem = total % 1440;
  return {
    date: dayShift ? addDays(dateIso, dayShift) : dateIso,
    time: `${String(Math.floor(rem / 60)).padStart(2, '0')}:${String(rem % 60).padStart(2, '0')}`,
  };
}

// Desired state of "our" events in the athlete's calendar.
function buildDesiredEvents({ schedule, calendarEvents }) {
  const tz = deviceTimeZone();
  const today = todayIso();
  const from = addDays(today, -7);
  const desired = new Map(); // uid -> graph event payload

  for (const [date, entry] of Object.entries(schedule || {})) {
    const session = (entry?.session || '').trim();
    if (!session || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < from) continue;
    if (/^😴/.test(shortTitle(session))) continue; // rest days don't need diary slots
    const time = parseSessionTime(session);
    const mins = parseSessionMinutes(session);
    const end = addMinutes(date, time, mins);
    desired.set(`forge-sched-${date}`, {
      subject: shortTitle(session),
      body: { contentType: 'text', content: session },
      start: { dateTime: `${date}T${time}:00`, timeZone: tz },
      end: { dateTime: `${end.date}T${end.time}:00`, timeZone: tz },
    });
  }

  (calendarEvents || []).forEach((ev) => {
    if (!ev || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date || '') || !ev.title || ev.date < from) return;
    const time = /^\d{2}:\d{2}$/.test(ev.time || '') ? ev.time : '18:00';
    const mins = Number(ev.durationMin) || 60;
    const end = addMinutes(ev.date, time, mins);
    desired.set(`forge-ev-${ev.date}-${ev.title.slice(0, 30)}`, {
      subject: ev.title,
      body: { contentType: 'text', content: ev.notes || '' },
      start: { dateTime: `${ev.date}T${time}:00`, timeZone: tz },
      end: { dateTime: `${end.date}T${end.time}:00`, timeZone: tz },
    });
  });

  return desired;
}

// Fetch our previously-created events (by hidden ForgeUid) in a wide window.
async function fetchOurEvents() {
  const today = todayIso();
  const from = addDays(today, -30);
  const to = addDays(today, 120);
  const map = new Map(); // uid -> { id, subject, start, end, bodyPreview }
  let url =
    `/me/calendarView?startDateTime=${from}T00:00:00&endDateTime=${to}T23:59:59` +
    `&$select=id,subject,start,end&$top=200` +
    `&$expand=singleValueExtendedProperties($filter=id eq '${EXT_PROP}')`;
  while (url) {
    const page = await graphFetch(url.startsWith('http') ? url.replace(GRAPH, '') : url);
    for (const ev of page.value || []) {
      const uid = ev.singleValueExtendedProperties?.find((p) => p.id === EXT_PROP)?.value;
      if (uid) map.set(uid, ev);
    }
    url = page['@odata.nextLink'] ? page['@odata.nextLink'].replace(GRAPH, '') : null;
  }
  return map;
}

// Reconcile: create / update / delete our events to match the desired plan.
export async function pushToOutlook({ schedule, calendarEvents }) {
  const desired = buildDesiredEvents({ schedule, calendarEvents });
  const existing = await fetchOurEvents();
  let created = 0;
  let updated = 0;
  let removed = 0;

  for (const [uid, payload] of desired) {
    const current = existing.get(uid);
    if (!current) {
      await graphFetch('/me/events', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          singleValueExtendedProperties: [{ id: EXT_PROP, value: uid }],
        }),
      });
      created++;
    } else {
      const changed =
        current.subject !== payload.subject ||
        !(current.start?.dateTime || '').startsWith(payload.start.dateTime);
      if (changed) {
        await graphFetch(`/me/events/${current.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        updated++;
      }
    }
  }

  for (const [uid, ev] of existing) {
    if (!desired.has(uid)) {
      await graphFetch(`/me/events/${ev.id}`, { method: 'DELETE' });
      removed++;
    }
  }

  return { created, updated, removed };
}

// The athlete's REAL diary (their events, not ours) for coach context.
export async function fetchOutlookWeek() {
  const today = todayIso();
  const to = addDays(today, 8);
  const page = await graphFetch(
    `/me/calendarView?startDateTime=${today}T00:00:00&endDateTime=${to}T23:59:59` +
      `&$select=subject,start,end,isAllDay&$orderby=start/dateTime&$top=100` +
      `&$expand=singleValueExtendedProperties($filter=id eq '${EXT_PROP}')`,
  );
  return (page.value || [])
    .filter((ev) => !ev.singleValueExtendedProperties?.some((p) => p.id === EXT_PROP))
    .map((ev) => ({
      subject: ev.subject || '(no title)',
      date: (ev.start?.dateTime || '').slice(0, 10),
      start: ev.isAllDay ? '' : (ev.start?.dateTime || '').slice(11, 16),
      end: ev.isAllDay ? '' : (ev.end?.dateTime || '').slice(11, 16),
      allDay: !!ev.isAllDay,
    }));
}
