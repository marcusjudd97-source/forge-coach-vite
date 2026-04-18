const KEYS = {
  apiKey: 'forge_api_key',
  profile: 'forge_profile',
  planText: 'forge_plan_text',
  weekPlan: 'forge_week_plan',
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

  resetAll() {
    Object.values(KEYS).forEach((k) => {
      if (k === KEYS.apiKey) return;
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  },
};

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const ms = target - now;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
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
