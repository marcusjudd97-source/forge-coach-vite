// ── Calendar export ─────────────────────────────────────────────────────────
//
// Sessions have a date but no time, so they export as all-day events:
// the session text goes in the title (first line) and description (full text).

import { addDays, todayIso } from './storage.js';

function firstLine(text) {
  return (text || '').split('\n')[0].trim().slice(0, 80);
}

// Short, scannable event title like "🏊 Swim 2.5km" or "🚴 Bike 75 min" —
// the full session text goes in the event description instead.
export function shortSessionTitle(sessionText) {
  const first = firstLine(sessionText);
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

  // (?<![x×\d.]) keeps rep counts like "2x20min" from matching as the duration
  const duration =
    first.match(/(?<![x×\d.])\d+(?:\.\d+)?\s*(?:hr|hrs|hours|h)\b/i)?.[0] ||
    first.match(/(?<![x×\d.])\d+(?:\.\d+)?\s*(?:min|mins|minutes)\b/i)?.[0] ||
    first.match(/(?<![x×\d.])\d+(?:\.\d+)?\s*(?:km|mi)\b/i)?.[0] ||
    '';
  return `${emoji} ${name}${duration ? ` ${duration}` : ''}`;
}

// One-click "Add to Outlook" — opens Outlook web's new-event screen prefilled.
export function outlookEventUrl(dateIso, sessionText) {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: shortSessionTitle(sessionText),
    body: sessionText,
    startdt: dateIso,
    enddt: addDays(dateIso, 1),
    allday: 'true',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function icsEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// RFC 5545 wants content lines ≤75 octets, folded with CRLF + space.
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

export function upcomingSessionDates(schedule, fromDate) {
  const from = fromDate || todayIso();
  return Object.keys(schedule || {})
    .filter((d) => (schedule[d]?.session || '').trim() && d >= from)
    .sort();
}

export function buildScheduleIcs(schedule, fromDate) {
  const dates = upcomingSessionDates(schedule, fromDate);
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FORGE//Ironman Coaching Suite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine('X-WR-CALNAME:FORGE Training'),
  ];
  for (const d of dates) {
    const session = schedule[d].session.trim();
    lines.push(
      'BEGIN:VEVENT',
      // Stable UID per date so a re-import updates instead of duplicating.
      `UID:forge-${d}@forge-coach`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${d.replaceAll('-', '')}`,
      `DTEND;VALUE=DATE:${addDays(d, 1).replaceAll('-', '')}`,
      foldLine(`SUMMARY:${icsEscape(shortSessionTitle(session))}`),
      foldLine(`DESCRIPTION:${icsEscape(session)}`),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

// Diary events from a coach's FORGE-DIARY block: timed where a time is given
// (floating local time — calendar apps read it in the athlete's own timezone),
// all-day otherwise.
export function buildEventsIcs(events) {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FORGE//Ironman Coaching Suite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine('X-WR-CALNAME:FORGE Food & Prep'),
  ];
  (events || []).forEach((ev, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:forge-diary-${ev.date}-${i}@forge-coach`,
      `DTSTAMP:${dtstamp}`,
    );
    if (ev.time) {
      const start = new Date(`${ev.date}T${ev.time}:00`);
      const end = new Date(start.getTime() + (ev.durationMin || 60) * 60000);
      const fmt = (d) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}` +
        `T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
      lines.push(`DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`);
    } else {
      lines.push(
        `DTSTART;VALUE=DATE:${ev.date.replaceAll('-', '')}`,
        `DTEND;VALUE=DATE:${addDays(ev.date, 1).replaceAll('-', '')}`,
      );
    }
    lines.push(
      foldLine(`SUMMARY:${icsEscape(ev.title)}`),
      foldLine(`DESCRIPTION:${icsEscape(ev.notes || '')}`),
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadIcs(filename, icsText) {
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
