import { useState } from 'react';
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
import { habitDone, habitStreak } from './DayView.jsx';

const WHEN_LABEL = { morning: '☀️ Morning', evening: '🌙 Evening', any: '☀️🌙 Both' };

export default function HabitsView({ habits, onHabitsChange, daily }) {
  const [newHabit, setNewHabit] = useState({ name: '', type: 'check', target: '', unit: '', when: 'morning' });
  const today = todayIso();
  const last7 = [];
  for (let i = 6; i >= 0; i--) last7.push(addDays(today, -i));

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
    };
    const next = [...(habits || []), habit];
    storage.setHabits(next);
    onHabitsChange(next);
    setNewHabit({ name: '', type: 'check', target: '', unit: '', when: 'morning' });
  }

  function updateHabit(id, key, value) {
    const next = (habits || []).map((h) => (h.id === id ? { ...h, [key]: value } : h));
    storage.setHabits(next);
    onHabitsChange(next);
  }

  function deleteHabit(id) {
    if (!window.confirm('Delete this habit? Its history stays in past daily sheets.')) return;
    const next = (habits || []).filter((h) => h.id !== id);
    storage.setHabits(next);
    onHabitsChange(next);
  }

  return (
    <>
      <ViewHeader
        title="HABITS"
        subtitle="What you hold yourself to, daily. Ticked off on the morning and evening sheets."
      />
      <ViewBody>
        <Section title="Your habits">
          {(habits || []).length === 0 && (
            <div style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 10 }}>
              No habits yet — add your first below.
            </div>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {(habits || []).map((h) => {
              const streakN = habitStreak(h, daily);
              const doneCount = last7.filter((d) => habitDone(h, daily?.[d]?.habits?.[h.id])).length;
              return (
                <div
                  key={h.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, flex: 1, minWidth: 140 }}>
                      {h.name}
                    </span>
                    {streakN > 0 && (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--gold)' }}>
                        🔥 {streakN} DAY{streakN === 1 ? '' : 'S'}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', color: doneCount >= 5 ? '#6fb241' : 'var(--text-dim)' }}>
                      {doneCount}/7 THIS WEEK
                    </span>
                    <button
                      onClick={() => deleteHabit(h.id)}
                      style={{ padding: '2px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: '#e0918a', fontSize: 11, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* last-7-days dots */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {last7.map((d) => {
                      const done = habitDone(h, daily?.[d]?.habits?.[h.id]);
                      return (
                        <span
                          key={d}
                          title={d}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            background: done ? 'rgba(111, 178, 65, 0.35)' : 'var(--bg2)',
                            border: `1px solid ${done ? '#6fb241' : 'var(--border)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            color: '#6fb241',
                          }}
                        >
                          {done ? '✓' : ''}
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Select
                      value={h.when || 'any'}
                      onChange={(v) => updateHabit(h.id, 'when', v)}
                      options={[
                        { value: 'morning', label: WHEN_LABEL.morning },
                        { value: 'evening', label: WHEN_LABEL.evening },
                        { value: 'any', label: WHEN_LABEL.any },
                      ]}
                    />
                    {h.type !== 'check' && (
                      <TextInput
                        type="number"
                        value={h.target || ''}
                        onChange={(v) => updateHabit(h.id, 'target', Number(v) || 0)}
                        placeholder="Target"
                      />
                    )}
                    {h.type === 'number' && (
                      <TextInput
                        value={h.unit || ''}
                        onChange={(v) => updateHabit(h.id, 'unit', v)}
                        placeholder="Unit (£, min…)"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Add a habit">
          <div style={{ display: 'grid', gap: 10 }}>
            <Field label="Habit name">
              <TextInput
                value={newHabit.name}
                onChange={(v) => setNewHabit((n) => ({ ...n, name: v }))}
                placeholder="e.g. No processed food"
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Shown on">
                <Select
                  value={newHabit.when}
                  onChange={(v) => setNewHabit((n) => ({ ...n, when: v }))}
                  options={[
                    { value: 'morning', label: WHEN_LABEL.morning },
                    { value: 'evening', label: WHEN_LABEL.evening },
                    { value: 'any', label: WHEN_LABEL.any },
                  ]}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <GoldButton onClick={addHabit} disabled={!newHabit.name.trim()}>
                ADD HABIT
              </GoldButton>
            </div>
          </div>
        </Section>
      </ViewBody>
    </>
  );
}
