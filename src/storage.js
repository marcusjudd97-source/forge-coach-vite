const KEYS = {
  apiKey: 'forge_api_key',
  profile: 'forge_profile',
  planText: 'forge_plan_text',
  weekPlan: 'forge_week_plan',
  schedule: 'forge_schedule',
  log: 'forge_log',
  voiceNotes: 'forge_voice_notes',
  chats: 'forge_chats',
  milestones: 'forge_milestones',
  goals: 'forge_goals',
  affirmations: 'forge_affirmations',
  daily: 'forge_daily',
  habits: 'forge_habits',
};

// Keys that sync to the cloud when signed in (everything except the API key,
// which never leaves this browser).
export const SYNC_STORAGE_KEYS = Object.values(KEYS).filter((k) => k !== KEYS.apiKey);

const META_KEY = 'forge_sync_meta'; // { [storageKey]: lastLocalWriteMs }

function getMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    const m = raw ? JSON.parse(raw) : {};
    return m && typeof m === 'object' ? m : {};
  } catch {
    return {};
  }
}

function touchMeta(key, ts) {
  try {
    const meta = getMeta();
    meta[key] = ts;
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {}
}

// Sync engine registers here to hear about every local write.
let changeListener = null;
export function setStorageChangeListener(fn) {
  changeListener = fn;
}

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
  if (SYNC_STORAGE_KEYS.includes(key)) {
    const ts = Date.now();
    touchMeta(key, ts);
    if (changeListener) changeListener(key, value ?? null, ts);
  }
}

// Write a value that arrived from the cloud: no listener notification
// (would echo it straight back up), and the meta timestamp is the remote one.
export function applyRemoteValue(key, value, ts) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
  touchMeta(key, ts);
}

// Per-key {value, ts} view used by the sync engine to merge against the cloud.
// A key that has data but no recorded timestamp (pre-sync install) gets ts=1:
// old enough that any cloud copy wins, but still pushed if the cloud is empty.
export function getSyncSnapshot() {
  const meta = getMeta();
  return SYNC_STORAGE_KEYS.map((key) => {
    const value = safeGet(key, null);
    const ts = meta[key] || (value != null ? 1 : 0);
    return { key, value, ts };
  });
}

export const defaultProfile = {
  name: '',
  age: '',
  sex: '',
  weightKg: '',
  heightCm: '',

  racingHistory: '',
  targetRaceName: '',
  targetRaceDate: '',
  targetRaceLocation: '',
  targetFinishTime: '',

  swim100mPace: '',
  weeklySwimVolumeKm: '',
  ftpWatts: '',
  hasPowerMeter: '',
  weeklyBikeHours: '',
  marathonPb: '',
  halfMarathonPb: '',
  weeklyRunKm: '',

  accessPool: '',
  accessOpenWater: '',
  accessTurbo: '',
  accessOutdoorBike: '',
  accessGym: '',
  accessTrails: '',

  typicalWeeklyHours: '',
  bestTrainingDays: '',
  busyTrainingDays: '',
  earlyOrLate: '',

  workCommitments: '',
  familyCommitments: '',
  travelCommitments: '',

  currentInjuries: '',
  injuryHistory: '',

  dietaryRestrictions: '',
  caffeineSensitive: '',
  giHistory: '',

  equipmentBike: '',
  equipmentWatch: '',
  equipmentHRM: '',
  otherEquipment: '',

  notes: '',
};

export const defaultWeekPlan = {
  mon: '',
  tue: '',
  wed: '',
  thu: '',
  fri: '',
  sat: '',
  sun: '',
  feedback: {
    mon: '',
    tue: '',
    wed: '',
    thu: '',
    fri: '',
    sat: '',
    sun: '',
  },
  weekStarts: '',
  weekFocus: '',
};

export const defaultVoiceNotes = {
  headCoach: '',
  swimming: '',
  cycling: '',
  running: '',
  nutrition: '',
  racePlanning: '',
  mentalPrep: '',
};

export const defaultGoals = [
  {
    id: 'g1',
    emoji: '🚗',
    title: 'Business — 40 cars sold per month',
    targetDate: '2026-12-31',
    why: '',
  },
  {
    id: 'g2',
    emoji: '🏊',
    title: 'Ironman',
    targetDate: '2027-08-31',
    why: '',
  },
  {
    id: 'g3',
    emoji: '🏠',
    title: 'Buy my own house',
    targetDate: '2027-03-31',
    why: '',
  },
];

export const defaultAffirmations = [
  'I am organised',
  'I have unwavering self-discipline',
  'I am an Ironman',
  'I am in control of my finances',
  'I am a multimillionaire',
  'I wake up before anyone else and crack on',
  'I am a role model to those around me',
  'I am a business owner and I take charge of my business and where it is heading',
];

// Habit: { id, name, type: 'check' | 'count' | 'number', target, unit }
// - check: done/not done (target/unit unused)
// - count: times per day, done when value >= target (e.g. 2x water bottles)
// - number: free number with a unit (£, min, pages); done when value >= target,
//   or when any value is entered if no target is set
export const defaultHabits = [
  { id: 'h1', name: 'Up before everyone else', type: 'check', target: 0, unit: '' },
  { id: 'h2', name: '15 min towards a goal', type: 'check', target: 0, unit: '' },
];

export const emptyDaySheet = () => ({
  habits: {},
  morning: {
    affirmationsRead: false,
    focus: '',
    action15: '',
    todos: '',
    budgetNote: '',
  },
  evening: {
    wentWell: '',
    doBetter: '',
    learned: '',
    review: '',
    gratitude1: '',
    gratitude2: '',
    gratitude3: '',
    habitsDone: false,
    tomorrowPlanned: false,
    affirmationsRead: false,
  },
  journal: '',
});

export const emptyLogEntry = () => ({
  id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  date: new Date().toISOString().slice(0, 10),
  discipline: 'bike',
  planned: '',
  actual: '',
  durationMin: '',
  rpe: '',
  avgHr: '',
  avgPower: '',
  status: 'done',
  notes: '',
});

export const storage = {
  getApiKey() {
    try {
      return localStorage.getItem(KEYS.apiKey) || '';
    } catch {
      return '';
    }
  },
  setApiKey(v) {
    try {
      localStorage.setItem(KEYS.apiKey, v);
    } catch {}
  },
  clearApiKey() {
    try {
      localStorage.removeItem(KEYS.apiKey);
    } catch {}
  },

  getProfile() {
    return { ...defaultProfile, ...safeGet(KEYS.profile, {}) };
  },
  setProfile(p) {
    safeSet(KEYS.profile, p);
  },

  getPlanText() {
    return safeGet(KEYS.planText, '');
  },
  setPlanText(t) {
    safeSet(KEYS.planText, t);
  },

  getWeekPlan() {
    const stored = safeGet(KEYS.weekPlan, {}) || {};
    return {
      ...defaultWeekPlan,
      ...stored,
      feedback: { ...defaultWeekPlan.feedback, ...(stored.feedback || {}) },
    };
  },
  setWeekPlan(w) {
    safeSet(KEYS.weekPlan, w);
  },

  getLog() {
    const l = safeGet(KEYS.log, []);
    return Array.isArray(l) ? l : [];
  },
  setLog(l) {
    safeSet(KEYS.log, l);
  },

  getVoiceNotes() {
    return { ...defaultVoiceNotes, ...safeGet(KEYS.voiceNotes, {}) };
  },
  setVoiceNotes(v) {
    safeSet(KEYS.voiceNotes, v);
  },

  getChats() {
    const c = safeGet(KEYS.chats, {});
    return c && typeof c === 'object' ? c : {};
  },
  setChats(c) {
    safeSet(KEYS.chats, c);
  },

  getMilestones() {
    const m = safeGet(KEYS.milestones, []);
    return Array.isArray(m) ? m : [];
  },
  setMilestones(m) {
    safeSet(KEYS.milestones, m);
  },

  getGoals() {
    const g = safeGet(KEYS.goals, null);
    return Array.isArray(g) && g.length ? g : defaultGoals;
  },
  setGoals(g) {
    safeSet(KEYS.goals, g);
  },

  getAffirmations() {
    const a = safeGet(KEYS.affirmations, null);
    return Array.isArray(a) && a.length ? a : defaultAffirmations;
  },
  setAffirmations(a) {
    safeSet(KEYS.affirmations, a);
  },

  getHabits() {
    const h = safeGet(KEYS.habits, null);
    return Array.isArray(h) ? h : defaultHabits;
  },
  setHabits(h) {
    safeSet(KEYS.habits, h);
  },

  // { [dateIso]: {habits, morning, evening, journal} }
  getDaily() {
    const d = safeGet(KEYS.daily, {});
    return d && typeof d === 'object' ? d : {};
  },
  setDaily(d) {
    safeSet(KEYS.daily, d);
  },

  getSchedule() {
    const raw = safeGet(KEYS.schedule, null);
    if (raw && typeof raw === 'object') return raw;

    // One-time migration from legacy weekPlan -> schedule
    const wp = safeGet(KEYS.weekPlan, null);
    if (wp && typeof wp === 'object' && wp.weekStarts) {
      const schedule = {};
      try {
        const base = new Date(wp.weekStarts + 'T00:00:00');
        if (!Number.isNaN(base.getTime())) {
          DAY_ORDER.forEach((d, idx) => {
            const session = (wp[d] || '').trim();
            const feedback = (wp.feedback?.[d] || '').trim();
            if (!session && !feedback) return;
            const dt = new Date(base);
            dt.setDate(base.getDate() + idx);
            const iso = dt.toISOString().slice(0, 10);
            schedule[iso] = { session, feedback };
          });
        }
      } catch {}
      safeSet(KEYS.schedule, schedule);
      return schedule;
    }

    return {};
  },
  setSchedule(s) {
    safeSet(KEYS.schedule, s);
  },

  resetAll() {
    Object.values(KEYS).forEach((k) => {
      if (k === KEYS.apiKey) return;
      safeSet(k, null);
    });
  },
};

export function isoDate(d) {
  // Use LOCAL date, not UTC — avoids "today" appearing as yesterday
  // for anyone west of UTC after midnight local time.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function todayIso() {
  return isoDate(new Date());
}

export function formatPretty(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export function dayOfWeekKey(iso) {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  // Compare date strings only, avoid timezone math issues.
  const today = todayIso();
  const target = dateStr.slice(0, 10);
  const t = new Date(target + 'T00:00:00');
  const n = new Date(today + 'T00:00:00');
  if (Number.isNaN(t.getTime()) || Number.isNaN(n.getTime())) return null;
  const ms = t - n;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function todayKey() {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
}

export function dayLabel(key) {
  return {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  }[key];
}

export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
