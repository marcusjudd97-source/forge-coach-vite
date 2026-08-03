import { useEffect, useState } from 'react';
import { storage, todayIso, addDays } from './storage.js';
import {
  Section,
  Field,
  TextInput,
  Select,
  GoldButton,
  GhostButton,
  ViewHeader,
  ViewBody,
} from './ui.jsx';
import { habitDone, habitStreak, habitOnDay } from './DayView.jsx';

const WHEN_LABEL = { morning: '☀️ Morning', evening: '🌙 Evening', any: '☀️🌙 Both' };
const WHEN_OPTIONS = [
  { value: 'morning', label: WHEN_LABEL.morning },
  { value: 'evening', label: WHEN_LABEL.evening },
  { value: 'any', label: WHEN_LABEL.any },
];
const GROUPS = [
  { key: 'morning', title: '☀️ Morning', hint: 'Ticked off on the morning sheet' },
  { key: 'evening', title: '🌙 Evening', hint: 'Ticked off on the evening sheet' },
  { key: 'any', title: '☀️🌙 Both', hint: 'Appears on both sheets' },
];
// Display order Mon→Sun; values are JS getDay() numbers (0 = Sunday)
const WEEK = [
  { d: 1, short: 'M', name: 'Mon' },
  { d: 2, short: 'T', name: 'Tue' },
  { d: 3, short: 'W', name: 'Wed' },
  { d: 4, short: 'T', name: 'Thu' },
  { d: 5, short: 'F', name: 'Fri' },
  { d: 6, short: 'S', name: 'Sat' },
  { d: 0, short: 'S', name: 'Sun' },
];
const ALL_DAYS = WEEK.map((w) => w.d);

function habitDays(h) {
  return Array.isArray(h?.days) && h.days.length ? h.days : ALL_DAYS;
}

function daysSummary(h) {
  const days = habitDays(h);
  if (days.length >= 7) return 'Every day';
  const rest = WEEK.filter((w) => !days.includes(w.d)).map((w) => w.name);
  return `${days.length}× a week · rest ${rest.join(', ')}`;
}

function DayPicker({ value, onChange }) {
  function toggle(d) {
    const has = value.includes(d);
    if (has && value.length === 1) return; // always keep at least one day
    onChange(has ? value.filter((x) => x !== d) : [...value, d]);
  }
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {WEEK.map((w) => {
        const on = value.includes(w.d);
        return (
          <button
            key={w.d}
            onClick={() => toggle(w.d)}
            title={w.name}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1.5px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
              background: on ? 'rgba(200, 146, 42, 0.15)' : 'var(--bg2)',
              color: on ? 'var(--gold)' : 'var(--text-dim)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {w.short}
          </button>
        );
      })}
    </div>
  );
}

function WeekDots({ habit, daily, last7 }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {last7.map((d) => {
        const off = !habitOnDay(habit, d);
        const done = !off && habitDone(habit, daily?.[d]?.habits?.[habit.id]);
        return (
          <span
            key={d}
            title={off ? `${d} — rest day` : d}
            style={{
              width: 16,
              height: 16,
              borderRadius: 5,
              background: done ? 'rgba(111, 178, 65, 0.35)' : off ? 'transparent' : 'var(--bg2)',
              border: off ? '1px dashed var(--border)' : `1px solid ${done ? '#6fb241' : 'var(--border)'}`,
              opacity: off ? 0.45 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: '#6fb241',
            }}
          >
            {done ? '✓' : ''}
          </span>
        );
      })}
    </div>
  );
}

function HabitRow({ habit, daily, last7, selected, onSelect }) {
  const streakN = habitStreak(habit, daily);
  const scheduled = last7.filter((d) => habitOnDay(habit, d));
  const doneCount = scheduled.filter((d) => habitDone(habit, daily?.[d]?.habits?.[habit.id])).length;
  const onTrack = scheduled.length > 0 && doneCount / scheduled.length >= 0.7;
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: 12,
        background: selected ? 'rgba(200, 146, 42, 0.08)' : 'var(--bg3)',
        border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, flex: 1, minWidth: 0 }}>
          {habit.name}
        </span>
        {streakN > 0 && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--gold)', flexShrink: 0 }}>
            🔥 {streakN}
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            letterSpacing: '0.1em',
            color: onTrack ? '#6fb241' : 'var(--text-dim)',
            flexShrink: 0,
          }}
        >
          {doneCount}/{scheduled.length}
        </span>
        <span style={{ color: 'var(--text-dim)', fontSize: 12, flexShrink: 0 }}>{selected ? '▾' : '›'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <WeekDots habit={habit} daily={daily} last7={last7} />
        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>{daysSummary(habit)}</span>
      </div>
    </button>
  );
}

function HabitEditor({ habit, onPatch, onDelete, onClose }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Field label="Habit name">
        <TextInput value={habit.name} onChange={(v) => onPatch({ name: v })} placeholder="Habit name" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Shown on">
          <Select value={habit.when || 'any'} onChange={(v) => onPatch({ when: v })} options={WHEN_OPTIONS} />
        </Field>
        <Field label="Type">
          <Select
            value={habit.type || 'check'}
            onChange={(v) => onPatch({ type: v })}
            options={[
              { value: 'check', label: 'Tick (done / not)' },
              { value: 'count', label: 'Times per day' },
              { value: 'number', label: 'Number (£, min…)' },
            ]}
          />
        </Field>
        {habit.type !== 'check' && (
          <Field label={habit.type === 'count' ? 'Times / day' : 'Daily target'}>
            <TextInput
              type="number"
              value={habit.target || ''}
              onChange={(v) => onPatch({ target: Number(v) || 0 })}
              placeholder={habit.type === 'count' ? '2' : '10'}
            />
          </Field>
        )}
        {habit.type === 'number' && (
          <Field label="Unit">
            <TextInput value={habit.unit || ''} onChange={(v) => onPatch({ unit: v })} placeholder="£ / min / pages" />
          </Field>
        )}
      </div>
      <Field label="Which days" hint="Untick a day to give yourself a scheduled rest — streaks skip it.">
        <DayPicker value={habitDays(habit)} onChange={(days) => onPatch({ days })} />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
        <GhostButton onClick={onDelete} style={{ color: '#e0918a', borderColor: 'rgba(224, 145, 138, 0.4)' }}>
          DELETE
        </GhostButton>
        <GhostButton onClick={onClose}>DONE</GhostButton>
      </div>
    </div>
  );
}

export default function HabitsView({ habits, onHabitsChange, daily }) {
  const [newHabit, setNewHabit] = useState({ name: '', type: 'check', target: '', unit: '', when: 'morning', days: ALL_DAYS });
  const [selectedId, setSelectedId] = useState(null);
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 760px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 760px)');
    const onChange = (e) => setWide(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const today = todayIso();
  const last7 = [];
  for (let i = 6; i >= 0; i--) last7.push(addDays(today, -i));

  const list = habits || [];
  const selected = list.find((h) => h.id === selectedId) || null;

  function save(next) {
    storage.setHabits(next);
    onHabitsChange(next);
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
      when: newHabit.when,
      days: newHabit.days.length ? newHabit.days : ALL_DAYS,
    };
    save([...list, habit]);
    setNewHabit({ name: '', type: 'check', target: '', unit: '', when: 'morning', days: ALL_DAYS });
    setSelectedId(habit.id);
  }

  function patchHabit(id, patch) {
    save(list.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  function deleteHabit(id) {
    if (!window.confirm('Delete this habit? Its history stays in past daily sheets.')) return;
    save(list.filter((h) => h.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const editor = selected && (
    <HabitEditor
      habit={selected}
      onPatch={(patch) => patchHabit(selected.id, patch)}
      onDelete={() => deleteHabit(selected.id)}
      onClose={() => setSelectedId(null)}
    />
  );

  const groupSections = GROUPS.map(({ key, title, hint }) => {
    const groupHabits = list.filter((h) => (h.when || 'any') === key);
    if (!groupHabits.length) return null;
    return (
      <Section key={key} title={title}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 10 }}>{hint}</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {groupHabits.map((h) => (
            <div key={h.id}>
              <HabitRow
                habit={h}
                daily={daily}
                last7={last7}
                selected={selectedId === h.id}
                onSelect={() => setSelectedId(selectedId === h.id ? null : h.id)}
              />
              {!wide && selectedId === h.id && (
                <div
                  style={{
                    marginTop: 6,
                    padding: 14,
                    borderRadius: 12,
                    background: 'var(--bg2)',
                    border: '1px solid var(--gold)',
                  }}
                >
                  {editor}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    );
  });

  return (
    <>
      <ViewHeader
        title="HABITS"
        subtitle="What you hold yourself to — on the days you've committed to."
      />
      <ViewBody>
        <div
          style={{
            display: wide ? 'grid' : 'block',
            gridTemplateColumns: wide ? 'minmax(0, 1fr) 300px' : undefined,
            gap: 14,
            alignItems: 'start',
          }}
        >
          <div>
            {list.length === 0 && (
              <Section title="Your habits">
                <div style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  No habits yet — add your first below, or ask Wren to build you a stack.
                </div>
              </Section>
            )}
            {groupSections}

            <Section title="Add a habit">
              <div style={{ display: 'grid', gap: 10 }}>
                <Field label="Habit name">
                  <TextInput
                    value={newHabit.name}
                    onChange={(v) => setNewHabit((n) => ({ ...n, name: v }))}
                    placeholder="e.g. 6am wake up"
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Shown on">
                    <Select
                      value={newHabit.when}
                      onChange={(v) => setNewHabit((n) => ({ ...n, when: v }))}
                      options={WHEN_OPTIONS}
                    />
                  </Field>
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
                <Field label="Which days">
                  <DayPicker value={newHabit.days} onChange={(days) => setNewHabit((n) => ({ ...n, days }))} />
                </Field>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <GoldButton onClick={addHabit} disabled={!newHabit.name.trim()}>
                    ADD HABIT
                  </GoldButton>
                </div>
              </div>
            </Section>
          </div>

          {wide && (
            <div style={{ position: 'sticky', top: 0 }}>
              <Section title="Edit habit" style={{ marginBottom: 0 }}>
                {editor || (
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Select a habit on the left to edit its name, days and target.
                  </div>
                )}
              </Section>
            </div>
          )}
        </div>
      </ViewBody>
    </>
  );
}
