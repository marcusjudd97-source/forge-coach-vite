// Live Outlook/calendar feed. Subscribe once (Outlook → Add calendar →
// Subscribe from web) and every FORGE training session + coach diary event
// stays in sync automatically. Auth = unguessable per-user token, validated
// by the security-definer calendar_feed() function in Supabase; only the
// public publishable key is used here, so nothing secret lives in this repo.

const SUPABASE_URL = 'https://fbkltxhywiqjtmqvxytw.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_db1GkFe5qadPON4cgL-aeQ_aLxhMlLQ';

function icsEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function foldLine(line) {
  const out = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  out.push(rest);
  return out.join('\r\n');
}

function addDaysIso(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function shortSessionTitle(sessionText) {
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

export default async function handler(req, res) {
  const token = req.query?.token;
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    res.status(401).send('Missing or malformed token');
    return;
  }

  const upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/calendar_feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: PUBLISHABLE_KEY,
      Authorization: `Bearer ${PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ feed_token: token }),
  });
  if (!upstream.ok) {
    res.status(502).send('Upstream error');
    return;
  }
  const data = (await upstream.json()) || {};
  const schedule = data.forge_schedule || {};
  const events = Array.isArray(data.forge_calendar_events) ? data.forge_calendar_events : [];

  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FORGE//Ironman Coaching Suite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine('X-WR-CALNAME:FORGE'),
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ];

  // Training sessions from the plan: last 30 days + everything ahead
  const cutoff = addDaysIso(new Date().toISOString().slice(0, 10), -30);
  for (const [date, entry] of Object.entries(schedule)) {
    const session = (entry?.session || '').trim();
    if (!session || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < cutoff) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:forge-sched-${date}@forge-coach`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${date.replaceAll('-', '')}`,
      `DTEND;VALUE=DATE:${addDaysIso(date, 1).replaceAll('-', '')}`,
      foldLine(`SUMMARY:${icsEscape(shortSessionTitle(session))}`),
      foldLine(`DESCRIPTION:${icsEscape(session)}`),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }

  // Coach diary events (food, prep, admin…)
  events.forEach((ev, i) => {
    if (!ev || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date || '') || !ev.title || ev.date < cutoff) return;
    lines.push('BEGIN:VEVENT', `UID:forge-ev-${ev.date}-${i}@forge-coach`, `DTSTAMP:${dtstamp}`);
    if (ev.time && /^\d{2}:\d{2}$/.test(ev.time)) {
      const start = `${ev.date.replaceAll('-', '')}T${ev.time.replace(':', '')}00`;
      const mins = Number(ev.durationMin) || 60;
      const endDate = new Date(`${ev.date}T${ev.time}:00Z`);
      endDate.setUTCMinutes(endDate.getUTCMinutes() + mins);
      const end =
        endDate.toISOString().slice(0, 10).replaceAll('-', '') +
        'T' +
        endDate.toISOString().slice(11, 16).replace(':', '') +
        '00';
      lines.push(`DTSTART:${start}`, `DTEND:${end}`);
    } else {
      lines.push(
        `DTSTART;VALUE=DATE:${ev.date.replaceAll('-', '')}`,
        `DTEND;VALUE=DATE:${addDaysIso(ev.date, 1).replaceAll('-', '')}`,
      );
    }
    lines.push(
      foldLine(`SUMMARY:${icsEscape(ev.title)}`),
      foldLine(`DESCRIPTION:${icsEscape(ev.notes || '')}`),
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(lines.join('\r\n') + '\r\n');
}
