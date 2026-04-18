import { DAY_ORDER, dayLabel, daysUntil } from './storage.js';

function line(label, value) {
  if (value === undefined || value === null || value === '') return null;
  return `- ${label}: ${value}`;
}

function block(title, lines) {
  const real = lines.filter(Boolean);
  if (real.length === 0) return '';
  return `### ${title}\n${real.join('\n')}`;
}

function profileBlock(profile) {
  if (!profile) return '';
  const sections = [];

  sections.push(
    block('Athlete', [
      line('Name', profile.name),
      line('Age', profile.age),
      line('Sex', profile.sex),
      line('Weight (kg)', profile.weightKg),
      line('Height (cm)', profile.heightCm),
    ]),
  );

  sections.push(
    block('Racing history & target', [
      line('Previous racing', profile.racingHistory),
      line('Target race', profile.targetRaceName),
      line('Race date', profile.targetRaceDate),
      line('Race location', profile.targetRaceLocation),
      line('Goal finish time', profile.targetFinishTime),
    ]),
  );

  sections.push(
    block('Current fitness', [
      line('100m swim pace', profile.swim100mPace),
      line('Weekly swim km', profile.weeklySwimVolumeKm),
      line('FTP (W)', profile.ftpWatts),
      line('Power meter?', profile.hasPowerMeter),
      line('Weekly bike hours', profile.weeklyBikeHours),
      line('Marathon PB', profile.marathonPb),
      line('Half-marathon PB', profile.halfMarathonPb),
      line('Weekly run km', profile.weeklyRunKm),
    ]),
  );

  sections.push(
    block('Access to facilities', [
      line('Pool', profile.accessPool),
      line('Open water', profile.accessOpenWater),
      line('Turbo / indoor trainer', profile.accessTurbo),
      line('Outdoor riding', profile.accessOutdoorBike),
      line('Gym', profile.accessGym),
      line('Trails / off-road running', profile.accessTrails),
    ]),
  );

  sections.push(
    block('Diary & schedule', [
      line('Typical weekly training hours', profile.typicalWeeklyHours),
      line('Best days to train', profile.bestTrainingDays),
      line('Busy / protected days', profile.busyTrainingDays),
      line('Early bird or night owl', profile.earlyOrLate),
    ]),
  );

  sections.push(
    block('Commitments & constraints', [
      line('Work', profile.workCommitments),
      line('Family', profile.familyCommitments),
      line('Travel', profile.travelCommitments),
    ]),
  );

  sections.push(
    block('Injury', [
      line('Current injuries', profile.currentInjuries),
      line('Injury history', profile.injuryHistory),
    ]),
  );

  sections.push(
    block('Nutrition', [
      line('Dietary restrictions', profile.dietaryRestrictions),
      line('Caffeine sensitive', profile.caffeineSensitive),
      line('GI history', profile.giHistory),
    ]),
  );

  sections.push(
    block('Equipment', [
      line('Bike', profile.equipmentBike),
      line('Watch', profile.equipmentWatch),
      line('HR monitor', profile.equipmentHRM),
      line('Other', profile.otherEquipment),
    ]),
  );

  sections.push(block('Notes', [line('Free notes', profile.notes)]));

  const filled = sections.filter(Boolean);
  if (filled.length === 0) return '';
  return `## Athlete Profile\n\n${filled.join('\n\n')}`;
}

function weekPlanBlock(weekPlan) {
  if (!weekPlan) return '';
  const feedback = weekPlan.feedback || {};
  const dayLines = DAY_ORDER
    .map((d) => {
      const session = weekPlan[d];
      const fb = feedback[d];
      if (!session && !fb) return null;
      let line = `- **${dayLabel(d)}:** ${session || '(nothing planned)'}`;
      if (fb && fb.trim()) line += `\n  · feedback: ${fb.trim()}`;
      return line;
    })
    .filter(Boolean);
  if (dayLines.length === 0 && !weekPlan.weekFocus) return '';
  const headerBits = [];
  if (weekPlan.weekStarts) headerBits.push(`Week of ${weekPlan.weekStarts}`);
  if (weekPlan.weekFocus) headerBits.push(`Focus: ${weekPlan.weekFocus}`);
  const header = headerBits.length ? headerBits.join(' — ') + '\n' : '';
  return `## This Week's Plan\n${header}${dayLines.join('\n')}`;
}

function planTextBlock(planText) {
  if (!planText || !planText.trim()) return '';
  const trimmed = planText.length > 3500 ? planText.slice(0, 3500) + '…\n[plan truncated]' : planText;
  return `## Master Training Plan\n\n${trimmed}`;
}

function logBlock(log, limit = 10) {
  if (!Array.isArray(log) || log.length === 0) return '';
  const recent = log.slice(-limit).reverse();
  const lines = recent.map((e) => {
    const bits = [e.date, (e.discipline || '').toUpperCase()];
    if (e.status && e.status !== 'done') bits.push(`[${e.status}]`);
    const head = bits.join(' · ');
    const parts = [];
    if (e.planned) parts.push(`planned: ${e.planned}`);
    if (e.actual) parts.push(`actual: ${e.actual}`);
    const metrics = [];
    if (e.durationMin) metrics.push(`${e.durationMin}min`);
    if (e.rpe) metrics.push(`RPE ${e.rpe}`);
    if (e.avgHr) metrics.push(`HR ${e.avgHr}`);
    if (e.avgPower) metrics.push(`${e.avgPower}W`);
    if (metrics.length) parts.push(metrics.join(', '));
    if (e.notes) parts.push(`notes: ${e.notes}`);
    return `- ${head}${parts.length ? ' — ' + parts.join('; ') : ''}`;
  });
  return `## Recent Training Log (last ${recent.length})\n${lines.join('\n')}`;
}

function countdownBlock(profile) {
  if (!profile?.targetRaceDate) return '';
  const d = daysUntil(profile.targetRaceDate);
  if (d == null) return '';
  if (d < 0) return '';
  return `## Race Countdown\n- **${d} days** until ${profile.targetRaceName || 'target race'}.`;
}

function dateBlock() {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const dow = now.getDay(); // 0=Sun ... 6=Sat
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];

  // Monday of the current calendar week (most recent Monday, today if Monday)
  const currentMondayOffset = dow === 0 ? -6 : 1 - dow;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() + currentMondayOffset);
  const currentMondayIso = currentMonday.toISOString().slice(0, 10);

  // Monday of next week
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7);
  const nextMondayIso = nextMonday.toISOString().slice(0, 10);

  // Default interpretation of "this week"
  // - If today is Mon/Tue/Wed/Thu: "this week" = the current week (from currentMonday)
  // - If today is Fri/Sat/Sun: "this week" usually means next week (you're planning forward)
  const lateInWeek = dow === 0 || dow === 5 || dow === 6;
  const defaultWeekStarts = lateInWeek ? nextMondayIso : currentMondayIso;
  const guidance = lateInWeek
    ? 'It is late in the week, so "this week" from the athlete typically means next week (the week starting on the next Monday). Confirm with them if ambiguous.'
    : 'It is early/mid week, so "this week" from the athlete means the current calendar week (the one already in progress).';

  return `## Today
- Today is **${weekday}, ${iso}**.
- **Current week's Monday:** ${currentMondayIso} (the week already in progress).
- **Next week's Monday:** ${nextMondayIso}.
- **Default \`weekStarts\` for "this week":** ${defaultWeekStarts}.
- ${guidance}
- When the athlete mentions "this week," "next week" or gives a specific date, use it. Otherwise default to ${defaultWeekStarts}.`;
}

function milestonesBlock(milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0) return '';
  const sorted = [...milestones].sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''));
  const lines = sorted.slice(0, 20).map((m) => {
    const status = m.done ? '✅' : '⏳';
    const parts = [status, m.targetDate || '—', m.title || '(untitled)'];
    if (m.notes) parts.push(`— ${m.notes}`);
    return `- ${parts.join(' · ')}`;
  });
  return `## Milestones\n${lines.join('\n')}`;
}

function voiceBlock(voiceNote) {
  if (!voiceNote || !voiceNote.trim()) return '';
  return `## Athlete's Voice Preferences for You\nThe athlete has specifically asked you to coach them in the following way. Honour it unless it conflicts with their safety:\n\n"${voiceNote.trim()}"`;
}

export function buildAthleteContext({ profile, planText, weekPlan, log, voiceNote, milestones }) {
  const blocks = [
    dateBlock(),
    countdownBlock(profile),
    profileBlock(profile),
    planTextBlock(planText),
    weekPlanBlock(weekPlan),
    milestonesBlock(milestones),
    logBlock(log),
    voiceBlock(voiceNote),
  ].filter(Boolean);

  if (blocks.length === 0) return '';

  return `
---
# ATHLETE CONTEXT

The following is persistent context about this athlete. Use it in every reply. Reference specific numbers from it. Adapt your recommendations to their diary, injuries, access, and commitments. If something is blank and you need it to coach well, ask for it — but do not ask again for anything that is already filled in.

${blocks.join('\n\n')}

---
`.trim();
}

export function buildSystemPrompt(baseSystemPrompt, athleteContext) {
  if (!athleteContext) return baseSystemPrompt;
  return `${baseSystemPrompt}\n\n${athleteContext}`;
}
