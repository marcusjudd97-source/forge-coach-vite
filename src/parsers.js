import { DAY_ORDER } from './storage.js';

const WEEK_BLOCK_RE = /<<<\s*FORGE-WEEKPLAN\s*([\s\S]*?)>>>/i;
const MILESTONE_BLOCK_RE = /<<<\s*FORGE-MILESTONES\s*([\s\S]*?)>>>/i;
const PROFILE_BLOCK_RE = /<<<\s*FORGE-PROFILE\s*([\s\S]*?)>>>/i;
const DIARY_BLOCK_RE = /<<<\s*FORGE-DIARY\s*([\s\S]*?)>>>/i;

export function hasWeekBlock(text) {
  return typeof text === 'string' && WEEK_BLOCK_RE.test(text);
}

export function hasMilestonesBlock(text) {
  return typeof text === 'string' && MILESTONE_BLOCK_RE.test(text);
}

export function hasProfileBlock(text) {
  return typeof text === 'string' && PROFILE_BLOCK_RE.test(text);
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
    .replace(DIARY_BLOCK_OPEN_RE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
