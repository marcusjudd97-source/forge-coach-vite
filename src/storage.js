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
};

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
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
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
      try {
        localStorage.removeItem(k);
      } catch {}
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
