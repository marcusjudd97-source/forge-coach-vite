import { DAY_ORDER } from './storage.js';

const WEEK_BLOCK_RE = /<<<\s*FORGE-WEEKPLAN\s*([\s\S]*?)>>>/i;
const MILESTONE_BLOCK_RE = /<<<\s*FORGE-MILESTONES\s*([\s\S]*?)>>>/i;

export function hasWeekBlock(text) {
  return typeof text === 'string' && WEEK_BLOCK_RE.test(text);
}

export function hasMilestonesBlock(text) {
  return typeof text === 'string' && MILESTONE_BLOCK_RE.test(text);
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
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
