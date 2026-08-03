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
  Select,
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
    journal: stored?.journal || '',
  };
}

export function habitDone(habit, value) {
  if (!habit) return false;
  if (habit.type === 'check') return value === true;
  const n = Number(value) || 0;
  if (habit.type === 'count') return n >= Math.max(1, Number(habit.target) || 1);
  const target = Number(habit.target) || 0;
  return target > 0 ? n >= target : n > 0;
}

export function habitStreak(habit, daily) {
  let d = todayIso();
  if (!habitDone(habit, daily?.[d]?.habits?.[habit.id])) d = addDays(d, -1);
  let n = 0;
  while (habitDone(habit, daily?.[d]?.habits?.[habit.id])) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

export function morningDone(sheet) {
  return !!(sheet?.morning?.affirmationsRead && (sheet.morning.focus || '').trim());
}

export function eveningDone(sheet) {
  return !!(
    (sheet?.evening?.wentWell || '').trim() && (sheet?.evening?.gratitude1 || '').trim()
  );
}

export function streakCount(daily) {
  // consecutive completed evenings, counting back from today (or yesterday if
  // today's evening isn't done yet — an unfinished today shouldn't kill it)
  let d = todayIso();
  if (!eveningDone(daily?.[d])) d = addDays(d, -1);
  let n = 0;
  while (eveningDone(daily?.[d])) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
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

function DoneBadge({ done, label }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.18em',
        padding: '3px 10px',
        borderRadius: 999,
        background: done ? 'rgba(111, 178, 65, 0.14)' : 'var(--bg3)',
        border: `1px solid ${done ? 'rgba(111, 178, 65, 0.35)' : 'var(--border)'}`,
        color: done ? '#6fb241' : 'var(--text-dim)',
      }}
    >
      {label} {done ? '✓' : '○'}
    </span>
  );
}

export default function DayView({
  goals,
  affirmations,
  daily,
  onDailyChange,
  schedule,
  habits,
  onHabitsChange,
}) {
  const [date, setDate] = useState(todayIso());
  const [sheet, setSheet] = useState(() => mergeSheet(daily?.[date]));
  const [manageHabits, setManageHabits] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', type: 'check', target: '', unit: '' });
  const saveTimer = useRef(null);
  const sheetRef = useRef(sheet);
  sheetRef.current = sheet;

  // Load when navigating between days
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
    const next =
      section === 'journal'
        ? { ...s, journal: value }
        : { ...s, [section]: { ...s[section], [key]: value } };
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
    persist(next); // habit taps save immediately — they're the streak source
  }

  function addHabit() {
    const name = newHabit.name.trim();
    if (!name) return;
    const habit = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name,
      type: newHabit.type,
      target: Number(newHabit.target) || 0,
      unit: newHabit.unit.trim(),
    };
    const next = [...(habits || []), habit];
    storage.setHabits(next);
    onHabitsChange(next);
    setNewHabit({ name: '', type: 'check', target: '', unit: '' });
  }

  function deleteHabit(id) {
    if (!window.confirm('Delete this habit? Its history stays in past days.')) return;
    const next = (habits || []).filter((h) => h.id !== id);
    storage.setHabits(next);
    onHabitsChange(next);
  }

  // Flush pending save on unmount
  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        persist(sheetRef.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date],
  );

  const today = todayIso();
  const isToday = date === today;
  const session = schedule?.[date]?.session || '';
  const streak = streakCount(daily);
  const m = sheet.morning;
  const e = sheet.evening;

  return (
    <>
      <ViewHeader
        title={isToday ? 'TODAY' : formatPretty(date).toUpperCase()}
        subtitle={`${date} · Morning sheet, evening recap, journal.`}
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <DoneBadge done={morningDone(sheet)} label="MORNING" />
            <DoneBadge done={eveningDone(sheet)} label="EVENING" />
            {streak > 0 && (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--gold)' }}>
                🔥 {streak} DAY STREAK
              </span>
            )}
          </div>
        </Section>

        {/* Morning sheet */}
        <Section title="☀️ Morning sheet">
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(200, 146, 42, 0.06)',
              border: '1px solid rgba(200, 146, 42, 0.25)',
              marginBottom: 12,
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
          <div style={{ marginBottom: 12 }}>
            <Check
              checked={m.affirmationsRead}
              onChange={(v) => update('morning', 'affirmationsRead', v)}
              label="I've read my affirmations out loud"
            />
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
                marginBottom: 12,
              }}
            >
              <span style={{ color: 'var(--text-dim)' }}>Training today: </span>
              {session}
            </div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
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
              <TextArea
                rows={3}
                value={m.todos}
                onChange={(v) => update('morning', 'todos', v)}
                placeholder={'1.\n2.\n3.'}
              />
            </Field>
            <Field label="Budget note (food / going out)" hint="Optional — keep yourself honest.">
              <TextInput
                value={m.budgetNote}
                onChange={(v) => update('morning', 'budgetNote', v)}
                placeholder="e.g. £10 food, no going out"
              />
            </Field>
          </div>
        </Section>

        {/* Habits */}
        <Section title="✅ Habits">
          {(habits || []).length === 0 && !manageHabits && (
            <div style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 10 }}>
              No habits yet — add the things you want to hold yourself to daily.
            </div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {(habits || []).map((h) => {
              const val = sheet.habits[h.id];
              const done = habitDone(h, val);
              const streakN = habitStreak(h, daily);
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
                      onClick={() => setHabitValue(h.id, !val)}
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
                        onClick={() => setHabitValue(h.id, Math.max(0, (Number(val) || 0) - (h.type === 'count' ? 1 : Number(h.target) ? Math.ceil(Number(h.target) / 4) : 1)))}
                        style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', cursor: 'pointer' }}
                      >
                        −
                      </button>
                      <button
                        onClick={() => setHabitValue(h.id, (Number(val) || 0) + (h.type === 'count' ? 1 : Number(h.target) ? Math.ceil(Number(h.target) / 4) : 1))}
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
                  {manageHabits && (
                    <button
                      onClick={() => deleteHabit(h.id)}
                      style={{ padding: '2px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: '#e0918a', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <GhostButton onClick={() => setManageHabits((v) => !v)}>
              {manageHabits ? 'DONE MANAGING' : 'MANAGE HABITS'}
            </GhostButton>
          </div>

          {manageHabits && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: 10,
              }}
            >
              <Field label="Habit name">
                <TextInput
                  value={newHabit.name}
                  onChange={(v) => setNewHabit((n) => ({ ...n, name: v }))}
                  placeholder="e.g. No processed food"
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <Field label="Type">
                  <Select
                    value={newHabit.type}
                    onChange={(v) => setNewHabit((n) => ({ ...n, type: v }))}
                    options={[
                      { value: 'check', label: 'Tick (done / not)' },
                      { value: 'count', label: 'Times per day' },
                      { value: 'number', label: 'Number (£, min…)' },
                    ]}
                  />
                </Field>
                {newHabit.type !== 'check' && (
                  <Field label={newHabit.type === 'count' ? 'Times / day' : 'Daily target'}>
                    <TextInput
                      type="number"
                      value={newHabit.target}
                      onChange={(v) => setNewHabit((n) => ({ ...n, target: v }))}
                      placeholder={newHabit.type === 'count' ? '2' : '10'}
                    />
                  </Field>
                )}
                {newHabit.type === 'number' && (
                  <Field label="Unit">
                    <TextInput
                      value={newHabit.unit}
                      onChange={(v) => setNewHabit((n) => ({ ...n, unit: v }))}
                      placeholder="£ / min / pages"
                    />
                  </Field>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <GoldButton onClick={addHabit} disabled={!newHabit.name.trim()}>
                  ADD HABIT
                </GoldButton>
              </div>
            </div>
          )}
        </Section>

        {/* Evening sheet */}
        <Section title="🌙 Evening recap">
          <div style={{ display: 'grid', gap: 12 }}>
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
            <Field label="3 things I'm grateful for">
              <div style={{ display: 'grid', gap: 8 }}>
                <TextInput value={e.gratitude1} onChange={(v) => update('evening', 'gratitude1', v)} placeholder="1." />
                <TextInput value={e.gratitude2} onChange={(v) => update('evening', 'gratitude2', v)} placeholder="2." />
                <TextInput value={e.gratitude3} onChange={(v) => update('evening', 'gratitude3', v)} placeholder="3." />
              </div>
            </Field>
            <div style={{ display: 'grid', gap: 8 }}>
              <Check
                checked={e.tomorrowPlanned}
                onChange={(v) => update('evening', 'tomorrowPlanned', v)}
                label="Tomorrow planned / reviewed"
              />
              <Check
                checked={e.affirmationsRead}
                onChange={(v) => update('evening', 'affirmationsRead', v)}
                label="Affirmations read tonight"
              />
            </div>
          </div>
        </Section>

        {/* Journal */}
        <Section title="📓 Journal">
          <TextArea
            rows={8}
            value={sheet.journal}
            onChange={(v) => update('journal', null, v)}
            placeholder="Free page. Whatever's in your head — get it out here."
          />
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 8 }}>
            Autosaves as you type. Use ← to reread any previous day.
          </div>
        </Section>
      </ViewBody>
    </>
  );
}
