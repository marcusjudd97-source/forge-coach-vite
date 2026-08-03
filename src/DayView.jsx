import { useEffect, useRef, useState } from 'react';
import {
  storage,
  todayIso,
  addDays,
  formatPretty,
  daysUntil,
  emptyDaySheet,
} from './storage.js';
import {
  Section,
  Field,
  TextInput,
  TextArea,
  GoldButton,
  GhostButton,
  ViewHeader,
  ViewBody,
} from './ui.jsx';

function mergeSheet(stored) {
  const empty = emptyDaySheet();
  return {
    habits: { ...(stored?.habits || {}) },
    morning: { ...empty.morning, ...(stored?.morning || {}) },
    evening: { ...empty.evening, ...(stored?.evening || {}) },
  };
}

export function morningDone(sheet) {
  return !!(
    sheet?.morning?.savedAt ||
    (sheet?.morning?.affirmationsRead && (sheet?.morning?.focus || '').trim())
  );
}

export function eveningDone(sheet) {
  return !!(
    sheet?.evening?.savedAt ||
    ((sheet?.evening?.wentWell || '').trim() && (sheet?.evening?.gratitude1 || '').trim())
  );
}

export function streakCount(daily) {
  let d = todayIso();
  if (!eveningDone(daily?.[d])) d = addDays(d, -1);
  let n = 0;
  while (eveningDone(daily?.[d])) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

export function habitDone(habit, value) {
  if (!habit) return false;
  if (habit.type === 'check') return value === true;
  const n = Number(value) || 0;
  if (habit.type === 'count') return n >= Math.max(1, Number(habit.target) || 1);
  const target = Number(habit.target) || 0;
  return target > 0 ? n >= target : n > 0;
}

// Is this habit scheduled on this date? habit.days holds JS weekday numbers
// (0 = Sunday … 6 = Saturday); absent/empty/full means every day.
export function habitOnDay(habit, dateIso) {
  const days = habit?.days;
  if (!Array.isArray(days) || days.length === 0 || days.length >= 7) return true;
  return days.includes(new Date(dateIso + 'T12:00:00').getDay());
}

export function habitStreak(habit, daily) {
  let d = todayIso();
  if (habitOnDay(habit, d) && !habitDone(habit, daily?.[d]?.habits?.[habit.id])) d = addDays(d, -1);
  let n = 0;
  for (let guard = 0; guard < 3660; guard++) {
    if (!habitOnDay(habit, d)) {
      d = addDays(d, -1);
      continue;
    }
    if (!habitDone(habit, daily?.[d]?.habits?.[habit.id])) break;
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

// Mindset cue of the day — Soren's rotation. One per day, deterministic.
const MINDSET_CUES = [
  'Process over outcome. Win the next hour, not the whole year.',
  "Discipline is remembering what you want. Read your three goals again — slowly.",
  'You don\'t rise to your goals, you fall to your systems. Run the system today.',
  'Hard conversations early. The thing you\'re avoiding is the day\'s real workout.',
  'Compare yourself only to yesterday\'s version of you.',
  'Energy follows attention. Put your attention on the one thing that moves a goal.',
  'Act like the person in your affirmations for one full day. That\'s all it takes — repeated.',
  'Slow is smooth, smooth is fast. No frantic work today.',
  'The 3am fear shrinks when the 6am work gets done.',
  'Nobody is coming. Good — you\'ve got you, and you show up daily.',
  'Today\'s boredom is compounding interest on your goals. Stay in it.',
  'Champions feel like skipping it too. They just don\'t.',
  'Protect the morning. The world can have the afternoon.',
  'One good decision at a time. Stack ten before lunch.',
];

function mindsetCueFor(dateIso) {
  const n = dateIso.split('-').reduce((a, b) => a + Number(b), 0);
  return MINDSET_CUES[n % MINDSET_CUES.length];
}

function Check({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        background: checked ? 'rgba(111, 178, 65, 0.1)' : 'var(--bg3)',
        border: `1px solid ${checked ? 'rgba(111, 178, 65, 0.35)' : 'var(--border)'}`,
        color: 'var(--text)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `1.5px solid ${checked ? '#6fb241' : 'var(--border)'}`,
          background: checked ? 'rgba(111, 178, 65, 0.25)' : 'transparent',
          color: '#6fb241',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span style={{ fontSize: 15 }}>{label}</span>
    </button>
  );
}

function AffirmationsPanel({ affirmations, read, onRead }) {
  return (
    <>
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(200, 146, 42, 0.06)',
          border: '1px solid rgba(200, 146, 42, 0.25)',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'var(--gold)',
            marginBottom: 8,
          }}
        >
          AFFIRMATIONS — SAY THEM LIKE YOU MEAN THEM
        </div>
        {(affirmations || []).map((a, i) => (
          <div key={i} style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7 }}>
            {a}
          </div>
        ))}
      </div>
      <Check checked={read} onChange={onRead} label="I've read my affirmations out loud" />
    </>
  );
}

function GratitudePanel({ values, onChange }) {
  return (
    <Field label="3 things I'm grateful for">
      <div style={{ display: 'grid', gap: 8 }}>
        <TextInput value={values.gratitude1} onChange={(v) => onChange('gratitude1', v)} placeholder="1." />
        <TextInput value={values.gratitude2} onChange={(v) => onChange('gratitude2', v)} placeholder="2." />
        <TextInput value={values.gratitude3} onChange={(v) => onChange('gratitude3', v)} placeholder="3." />
      </div>
    </Field>
  );
}

function HabitList({ habits, when, date, sheet, daily, onValue }) {
  const list = (habits || []).filter(
    (h) => ((h.when || 'any') === when || (h.when || 'any') === 'any') && habitOnDay(h, date)
  );
  if (!list.length) return null;
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.22em',
          color: 'var(--text-dim)',
          marginBottom: 8,
        }}
      >
        HABITS
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {list.map((h) => {
          const val = sheet.habits[h.id];
          const done = habitDone(h, val);
          const streakN = habitStreak(h, daily);
          const step = h.type === 'count' ? 1 : Number(h.target) ? Math.ceil(Number(h.target) / 4) : 1;
          const targetLabel =
            h.type === 'count'
              ? `${Number(val) || 0}/${Math.max(1, Number(h.target) || 1)}`
              : h.type === 'number'
                ? `${h.unit || ''}${Number(val) || 0}${h.target ? ` / ${h.unit || ''}${h.target}` : ''}`
                : '';
          return (
            <div
              key={h.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: done ? 'rgba(111, 178, 65, 0.1)' : 'var(--bg3)',
                border: `1px solid ${done ? 'rgba(111, 178, 65, 0.35)' : 'var(--border)'}`,
              }}
            >
              {h.type === 'check' ? (
                <button
                  onClick={() => onValue(h.id, !val)}
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: `1.5px solid ${done ? '#6fb241' : 'var(--border)'}`,
                    background: done ? 'rgba(111, 178, 65, 0.25)' : 'transparent',
                    color: '#6fb241',
                    cursor: 'pointer',
                    fontSize: 15,
                  }}
                >
                  {done ? '✓' : ''}
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => onValue(h.id, Math.max(0, (Number(val) || 0) - step))}
                    style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    −
                  </button>
                  <button
                    onClick={() => onValue(h.id, (Number(val) || 0) + step)}
                    style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 15, color: 'var(--text)' }}>{h.name}</span>
                {targetLabel && (
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.08em', color: done ? '#6fb241' : 'var(--text-mid)', marginLeft: 8 }}>
                    {targetLabel}
                  </span>
                )}
              </div>
              {streakN > 0 && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--gold)', flexShrink: 0 }}>
                  🔥 {streakN}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DayView({
  goals,
  affirmations,
  daily,
  onDailyChange,
  schedule,
  habits,
  onGoTo,
  onOpenCoach,
}) {
  const today = todayIso();
  const [date, setDate] = useState(today);
  // Default to the form that matches the time of day
  const [part, setPart] = useState(() => (new Date().getHours() < 15 ? 'morning' : 'evening'));
  const [sheet, setSheet] = useState(() => mergeSheet(daily?.[date]));
  const [justSaved, setJustSaved] = useState('');
  const saveTimer = useRef(null);
  const sheetRef = useRef(sheet);
  sheetRef.current = sheet;

  useEffect(() => {
    setSheet(mergeSheet(daily?.[date]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function persist(nextSheet) {
    const next = { ...storage.getDaily(), [date]: nextSheet };
    storage.setDaily(next);
    onDailyChange(next);
  }

  function update(section, key, value) {
    const s = sheetRef.current;
    const next = { ...s, [section]: { ...s[section], [key]: value } };
    sheetRef.current = next;
    setSheet(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(next), 600);
  }

  function setHabitValue(id, value) {
    const s = sheetRef.current;
    const next = { ...s, habits: { ...s.habits, [id]: value } };
    sheetRef.current = next;
    setSheet(next);
    persist(next);
  }

  function saveForm(section) {
    const s = sheetRef.current;
    const next = { ...s, [section]: { ...s[section], savedAt: new Date().toISOString() } };
    sheetRef.current = next;
    setSheet(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    persist(next);
    setJustSaved(section);
    setTimeout(() => setJustSaved(''), 2200);
  }

  const isToday = date === today;
  const session = schedule?.[date]?.session || '';
  const streak = streakCount(daily);
  const m = sheet.morning;
  const e = sheet.evening;
  // Food planned on the previous evening feeds this morning's sheet
  const plannedFood = daily?.[addDays(date, -1)]?.evening || {};
  const hasPlannedFood = !!(plannedFood.foodBreakfast || plannedFood.foodLunch || plannedFood.foodDinner);
  const cue = mindsetCueFor(date);

  const partBtn = (id, label) => (
    <button
      onClick={() => setPart(id)}
      style={{
        flex: 1,
        padding: '12px 10px',
        borderRadius: 12,
        background: part === id ? 'rgba(200, 146, 42, 0.14)' : 'var(--bg3)',
        border: `1px solid ${part === id ? 'rgba(200, 146, 42, 0.45)' : 'var(--border)'}`,
        color: part === id ? 'var(--gold)' : 'var(--text-mid)',
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        letterSpacing: '0.14em',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <ViewHeader
        title={isToday ? 'TODAY' : formatPretty(date).toUpperCase()}
        subtitle={`${date} · Morning and evening sheets.`}
        right={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <GhostButton onClick={() => setDate(addDays(date, -1))}>←</GhostButton>
            {!isToday && <GhostButton onClick={() => setDate(today)}>TODAY</GhostButton>}
            <GhostButton onClick={() => setDate(addDays(date, 1))} disabled={date >= today}>
              →
            </GhostButton>
          </div>
        }
      />
      <ViewBody>
        {/* North-star goals */}
        <Section>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.26em',
              color: 'var(--text-dim)',
              marginBottom: 10,
            }}
          >
            WHAT I AM WORKING TOWARDS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(goals || []).map((g) => {
              const d = daysUntil(g.targetDate);
              return (
                <div key={g.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16 }}>{g.emoji}</span>
                  <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>{g.title}</span>
                  {d != null && d >= 0 && (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--gold)' }}>
                      {d} DAYS
                    </span>
                  )}
                  {g.why && (
                    <span style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      — {g.why}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <GhostButton
              onClick={() => window.open('https://outlook.live.com/calendar/0/view/week', '_blank', 'noopener')}
            >
              📅 REVIEW WEEK IN OUTLOOK
            </GhostButton>
            {streak > 0 && (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--gold)' }}>
                🔥 {streak} DAY STREAK
              </span>
            )}
          </div>
        </Section>

        {/* Morning / Evening switch */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {partBtn('morning', `☀️ MORNING ${morningDone(sheet) ? '✓' : ''}`)}
          {partBtn('evening', `🌙 EVENING ${eveningDone(sheet) ? '✓' : ''}`)}
        </div>

        {part === 'morning' ? (
          <Section title="☀️ Morning sheet">
            <div style={{ display: 'grid', gap: 14 }}>
              <AffirmationsPanel
                affirmations={affirmations}
                read={m.affirmationsRead}
                onRead={(v) => update('morning', 'affirmationsRead', v)}
              />
              <GratitudePanel values={m} onChange={(k, v) => update('morning', k, v)} />

              {/* Mindset — Soren */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(42, 200, 168, 0.06)',
                  border: '1px solid rgba(42, 200, 168, 0.3)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.22em', color: '#2ac8a8', marginBottom: 6 }}>
                  🧠 SOREN'S MINDSET CUE
                </div>
                <div style={{ fontSize: 15, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  “{cue}”
                </div>
                {onOpenCoach && (
                  <div style={{ marginTop: 10 }}>
                    <GhostButton onClick={() => onOpenCoach('mentalPrep')} style={{ fontSize: 11, padding: '8px 12px' }}>
                      GO DEEPER WITH SOREN →
                    </GhostButton>
                  </div>
                )}
              </div>

              {session && (
                <div
                  style={{
                    fontSize: 14,
                    color: 'var(--text-mid)',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ color: 'var(--text-dim)' }}>🏋️ Training today: </span>
                  {session}
                </div>
              )}

              {hasPlannedFood && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(74, 138, 42, 0.07)',
                    border: '1px solid rgba(74, 138, 42, 0.3)',
                    fontSize: 14,
                    color: 'var(--text)',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.22em', color: '#6fb241', marginBottom: 6 }}>
                    🥗 TODAY'S FOOD — AS PLANNED LAST NIGHT
                  </div>
                  {plannedFood.foodBreakfast && <div><span style={{ color: 'var(--text-dim)' }}>Breakfast:</span> {plannedFood.foodBreakfast}</div>}
                  {plannedFood.foodLunch && <div><span style={{ color: 'var(--text-dim)' }}>Lunch:</span> {plannedFood.foodLunch}</div>}
                  {plannedFood.foodDinner && <div><span style={{ color: 'var(--text-dim)' }}>Dinner:</span> {plannedFood.foodDinner}</div>}
                </div>
              )}

              <Field label="Budget — account balance" hint="Check the pot. Write the number down — eyes on it daily.">
                <TextInput
                  value={m.balance}
                  onChange={(v) => update('morning', 'balance', v)}
                  placeholder="£"
                />
              </Field>
              <Field label="Current main focus">
                <TextInput
                  value={m.focus}
                  onChange={(v) => update('morning', 'focus', v)}
                  placeholder="The ONE thing today serves"
                />
              </Field>
              <Field label="15 minutes towards a goal — what exactly?">
                <TextInput
                  value={m.action15}
                  onChange={(v) => update('morning', 'action15', v)}
                  placeholder="e.g. 15 min prospecting calls before 9am"
                />
              </Field>
              <Field label="Top 3 to-dos / priority">
                <TextArea rows={3} value={m.todos} onChange={(v) => update('morning', 'todos', v)} placeholder={'1.\n2.\n3.'} />
              </Field>

              <HabitList habits={habits} when="morning" date={date} sheet={sheet} daily={daily} onValue={setHabitValue} />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                {onGoTo && (
                  <GhostButton onClick={() => onGoTo('habits')}>MANAGE HABITS</GhostButton>
                )}
                <GoldButton onClick={() => saveForm('morning')}>
                  {justSaved === 'morning' ? 'SAVED ✓' : m.savedAt ? 'UPDATE MORNING SHEET' : 'SAVE MORNING SHEET'}
                </GoldButton>
              </div>
              {m.savedAt && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'right' }}>
                  Saved {new Date(m.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — use ← to review past days.
                </div>
              )}
            </div>
          </Section>
        ) : (
          <Section title="🌙 Evening sheet">
            <div style={{ display: 'grid', gap: 14 }}>
              <AffirmationsPanel
                affirmations={affirmations}
                read={e.affirmationsRead}
                onRead={(v) => update('evening', 'affirmationsRead', v)}
              />
              <GratitudePanel values={e} onChange={(k, v) => update('evening', k, v)} />

              <Field label="What went well today?">
                <TextArea rows={2} value={e.wentWell} onChange={(v) => update('evening', 'wentWell', v)} />
              </Field>
              <Field label="What could I have done better?">
                <TextArea rows={2} value={e.doBetter} onChange={(v) => update('evening', 'doBetter', v)} />
              </Field>
              <Field label="One thing I learned">
                <TextInput value={e.learned} onChange={(v) => update('evening', 'learned', v)} />
              </Field>
              <Field label="One thing to review">
                <TextInput value={e.review} onChange={(v) => update('evening', 'review', v)} />
              </Field>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(74, 138, 42, 0.07)',
                  border: '1px solid rgba(74, 138, 42, 0.3)',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.22em', color: '#6fb241' }}>
                  🥗 TOMORROW'S FOOD — DECIDE IT NOW, EAT IT TOMORROW
                </div>
                <Field label="Breakfast">
                  <TextInput value={e.foodBreakfast} onChange={(v) => update('evening', 'foodBreakfast', v)} placeholder="e.g. Overnight oats jar + banana" />
                </Field>
                <Field label="Lunch">
                  <TextInput value={e.foodLunch} onChange={(v) => update('evening', 'foodLunch', v)} placeholder="e.g. Chicken rice bowl from batch" />
                </Field>
                <Field label="Dinner">
                  <TextInput value={e.foodDinner} onChange={(v) => update('evening', 'foodDinner', v)} placeholder="e.g. Chilli portion 2 + greens" />
                </Field>
              </div>

              <Check
                checked={e.tomorrowPlanned}
                onChange={(v) => update('evening', 'tomorrowPlanned', v)}
                label="Tomorrow planned / diary reviewed"
              />

              <HabitList habits={habits} when="evening" date={date} sheet={sheet} daily={daily} onValue={setHabitValue} />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                {onGoTo && (
                  <GhostButton onClick={() => onGoTo('habits')}>MANAGE HABITS</GhostButton>
                )}
                <GoldButton onClick={() => saveForm('evening')}>
                  {justSaved === 'evening' ? 'SAVED ✓' : e.savedAt ? 'UPDATE EVENING SHEET' : 'SAVE EVENING SHEET'}
                </GoldButton>
              </div>
              {e.savedAt && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'right' }}>
                  Saved {new Date(e.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — use ← to review past days.
                </div>
              )}
            </div>
          </Section>
        )}
      </ViewBody>
    </>
  );
}
