import { DAY_ORDER } from './storage.js';

const WEEK_BLOCK_RE = /<<<\s*FORGE-WEEKPLAN\s*([\s\S]*?)>>>/i;
const MILESTONE_BLOCK_RE = /<<<\s*FORGE-MILESTONES\s*([\s\S]*?)>>>/i;
const PROFILE_BLOCK_RE = /<<<\s*FORGE-PROFILE\s*([\s\S]*?)>>>/i;
const DIARY_BLOCK_RE = /<<<\s*FORGE-DIARY\s*([\s\S]*?)>>>/i;
const AFFIRM_BLOCK_RE = /<<<\s*FORGE-AFFIRMATIONS\s*([\s\S]*?)>>>/i;
const HABITS_BLOCK_RE = /<<<\s*FORGE-HABITS\s*([\s\S]*?)>>>/i;
const FOODWEEK_BLOCK_RE = /<<<\s*FORGE-FOODWEEK\s*([\s\S]*?)>>>/i;

export function hasWeekBlock(text) {
  return typeof text === 'string' && WEEK_BLOCK_RE.test(text);
}

export function hasMilestonesBlock(text) {
  return typeof text === 'string' && MILESTONE_BLOCK_RE.test(text);
}

export function hasProfileBlock(text) {
  return typeof text === 'string' && PROFILE_BLOCK_RE.test(text);
}

export function hasAffirmationsBlock(text) {
  return typeof text === 'string' && AFFIRM_BLOCK_RE.test(text);
}

export function parseAffirmationsBlock(text) {
  if (!text) return null;
  const match = text.match(AFFIRM_BLOCK_RE);
  if (!match) return null;
  const lines = match[1]
    .split('\n')
    .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean);
  return lines.length ? lines.slice(0, 15) : null;
}

export function hasHabitsBlock(text) {
  return typeof text === 'string' && HABITS_BLOCK_RE.test(text);
}

// Days spec like "mon,tue,fri", "mon-sat" or "daily" → JS weekday numbers
// (0 = Sunday). Returns null for daily/unparseable, meaning every day.
const DAY_NUM = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const DAY_SEQ = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun
function parseDaysSpec(spec) {
  const s = (spec || '').toLowerCase().trim();
  if (!s || s === 'daily' || s === 'everyday' || s === 'every day') return null;
  const days = new Set();
  for (const token of s.split(/[,\s]+/).filter(Boolean)) {
    const range = token.match(/^([a-z]{3,})-([a-z]{3,})$/);
    if (range) {
      const from = DAY_SEQ.indexOf(DAY_NUM[range[1].slice(0, 3)]);
      const to = DAY_SEQ.indexOf(DAY_NUM[range[2].slice(0, 3)]);
      if (from === -1 || to === -1) continue;
      for (let i = from; i !== to; i = (i + 1) % 7) days.add(DAY_SEQ[i]);
      days.add(DAY_SEQ[to]);
    } else if (DAY_NUM[token.slice(0, 3)] !== undefined) {
      days.add(DAY_NUM[token.slice(0, 3)]);
    }
  }
  return days.size > 0 && days.size < 7 ? [...days] : null;
}

// Lines: - Name | morning/evening/any | check/count/number | target | unit | days
export function parseHabitsBlock(text) {
  if (!text) return null;
  const match = text.match(HABITS_BLOCK_RE);
  if (!match) return null;
  const lines = match[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== '-');
  const habits = [];
  for (const raw of lines) {
    const parts = raw.replace(/^[-*•]\s*/, '').split('|').map((p) => p.trim());
    if (parts.length < 2 || !parts[0]) continue;
    const [name, whenRaw, typeRaw, targetRaw, unitRaw, daysRaw] = parts;
    const when = ['morning', 'evening', 'any'].includes((whenRaw || '').toLowerCase())
      ? whenRaw.toLowerCase()
      : 'any';
    const type = ['check', 'count', 'number'].includes((typeRaw || '').toLowerCase())
      ? typeRaw.toLowerCase()
      : 'check';
    const days = parseDaysSpec(daysRaw);
    habits.push({
      name,
      when,
      type,
      target: Number(targetRaw) || 0,
      unit: (unitRaw || '').trim(),
      ...(days ? { days } : {}),
    });
  }
  return habits.length ? habits : null;
}

export function hasFoodWeekBlock(text) {
  return typeof text === 'string' && FOODWEEK_BLOCK_RE.test(text);
}

// Lines: - YYYY-MM-DD | B: … | L: … | D: … | S: … | N: prep/timing note
export function parseFoodWeekBlock(text) {
  if (!text) return null;
  const match = text.match(FOODWEEK_BLOCK_RE);
  if (!match) return null;
  const lines = match[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== '-');
  const plan = {};
  const FIELD = { b: 'breakfast', l: 'lunch', d: 'dinner', s: 'snacks', n: 'note' };
  for (const raw of lines) {
    const parts = raw.replace(/^[-*•]\s*/, '').split('|').map((p) => p.trim());
    const date = parts.shift();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) continue;
    const day = {};
    for (const seg of parts) {
      const m = seg.match(/^([BLDSN])\s*:\s*(.+)$/i);
      if (m) day[FIELD[m[1].toLowerCase()]] = m[2].trim();
    }
    if (Object.keys(day).length) plan[date] = day;
  }
  return Object.keys(plan).length ? plan : null;
}

// Fallback for replies truncated mid-block: open marker but no closing >>>
const DIARY_BLOCK_OPEN_RE = /<<<\s*FORGE-DIARY\s*([\s\S]*)$/i;

export function hasDiaryBlock(text) {
  return typeof text === 'string' && (DIARY_BLOCK_RE.test(text) || DIARY_BLOCK_OPEN_RE.test(text));
}

// Lines: - YYYY-MM-DD | HH:MM (or "allday") | duration min | Title | notes
export function parseDiaryBlock(text) {
  if (!text) return null;
  const match = text.match(DIARY_BLOCK_RE) || text.match(DIARY_BLOCK_OPEN_RE);
  if (!match) return null;
  const lines = match[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== '-');
  const events = [];
  for (const raw of lines) {
    const stripped = raw.replace(/^[-*•]\s*/, '');
    const parts = stripped.split('|').map((p) => p.trim());
    if (parts.length < 4) continue;
    const [date, timeRaw, durRaw, title, ...rest] = parts;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !title) continue;
    const timeMatch = timeRaw.match(/^(\d{1,2}):(\d{2})$/);
    const time = timeMatch
      ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
      : ''; // anything else (e.g. "allday") = all-day event
    const durationMin = Math.max(0, parseInt(durRaw, 10) || 0) || 60;
    events.push({ date, time, durationMin, title, notes: rest.join(' | ') });
  }
  return events.length ? events : null;
}

const PROFILE_KEYS = new Set([
  'name', 'age', 'sex', 'weightKg', 'heightCm',
  'racingHistory', 'targetRaceName', 'targetRaceDate', 'targetRaceLocation', 'targetFinishTime',
  'swim100mPace', 'weeklySwimVolumeKm', 'ftpWatts', 'hasPowerMeter', 'weeklyBikeHours',
  'marathonPb', 'halfMarathonPb', 'weeklyRunKm',
  'accessPool', 'accessOpenWater', 'accessTurbo', 'accessOutdoorBike', 'accessGym', 'accessTrails',
  'typicalWeeklyHours', 'bestTrainingDays', 'busyTrainingDays', 'earlyOrLate',
  'workCommitments', 'familyCommitments', 'travelCommitments',
  'currentInjuries', 'injuryHistory',
  'dietaryRestrictions', 'caffeineSensitive', 'giHistory',
  'equipmentBike', 'equipmentWatch', 'equipmentHRM', 'otherEquipment',
  'notes',
]);

export function parseProfileBlock(text) {
  if (!text) return null;
  const match = text.match(PROFILE_BLOCK_RE);
  if (!match) return null;
  const body = match[1];
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const updates = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const rawKey = line.slice(0, colonIdx).trim();
    const key = rawKey.replace(/^[-*•]\s*/, '');
    const value = line.slice(colonIdx + 1).trim();
    if (PROFILE_KEYS.has(key)) {
      updates[key] = value;
    }
  }
  return Object.keys(updates).length ? updates : null;
}

export function parseWeekBlock(text) {
  if (!text) return null;
  const match = text.match(WEEK_BLOCK_RE);
  if (!match) return null;
  const body = match[1];
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = {
    weekStarts: '',
    weekFocus: '',
  };
  DAY_ORDER.forEach((d) => {
    out[d] = '';
  });
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();
    if (key === 'weekstarts') {
      out.weekStarts = value;
    } else if (key === 'weekfocus') {
      out.weekFocus = value;
    } else if (DAY_ORDER.includes(key)) {
      out[key] = value;
    } else {
      // allow full day names
      const short = {
        monday: 'mon',
        tuesday: 'tue',
        wednesday: 'wed',
        thursday: 'thu',
        friday: 'fri',
        saturday: 'sat',
        sunday: 'sun',
      }[key];
      if (short) out[short] = value;
    }
  }
  return out;
}

export function parseMilestonesBlock(text) {
  if (!text) return null;
  const match = text.match(MILESTONE_BLOCK_RE);
  if (!match) return null;
  const body = match[1];
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== '-');
  const milestones = [];
  for (const raw of lines) {
    const stripped = raw.replace(/^[-*•]\s*/, '');
    const parts = stripped.split('|').map((p) => p.trim());
    if (parts.length < 2) continue;
    const [dateStr, title, ...rest] = parts;
    const notes = rest.join(' | ');
    milestones.push({
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${milestones.length}`,
      targetDate: dateStr,
      title: title || '(untitled)',
      notes: notes || '',
      done: false,
    });
  }
  return milestones;
}

export function stripForgeBlocks(text) {
  if (!text) return text;
  return text
    .replace(WEEK_BLOCK_RE, '')
    .replace(MILESTONE_BLOCK_RE, '')
    .replace(PROFILE_BLOCK_RE, '')
    .replace(DIARY_BLOCK_RE, '')
    .replace(AFFIRM_BLOCK_RE, '')
    .replace(HABITS_BLOCK_RE, '')
    .replace(FOODWEEK_BLOCK_RE, '')
    .replace(DIARY_BLOCK_OPEN_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
