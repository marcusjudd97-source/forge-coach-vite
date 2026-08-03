import { useState } from 'react';
import { storage, todayIso, addDays, formatPretty } from './storage.js';
import {
  Section,
  Field,
  TextInput,
  GoldButton,
  GhostButton,
  ViewHeader,
  ViewBody,
} from './ui.jsx';

const HORIZON_DAYS = 14;

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { key: 'lunch', label: 'Lunch', icon: '🥪' },
  { key: 'dinner', label: 'Dinner', icon: '🍽️' },
  { key: 'snacks', label: 'Snacks', icon: '🥜' },
];

export default function FoodView({ foodPlan, onFoodPlanChange, schedule, onAskPetra }) {
  const today = todayIso();
  const [editingDate, setEditingDate] = useState(null);
  const [draft, setDraft] = useState({});

  const dates = [];
  for (let i = 0; i < HORIZON_DAYS; i++) dates.push(addDays(today, i));

  function startEdit(date) {
    setEditingDate(date);
    setDraft({ breakfast: '', lunch: '', dinner: '', snacks: '', note: '', ...(foodPlan?.[date] || {}) });
  }

  function commitEdit() {
    const next = { ...foodPlan, [editingDate]: { ...draft } };
    storage.setFoodPlan(next);
    onFoodPlanChange(next);
    setEditingDate(null);
  }

  function DayCard({ date, isHero }) {
    const day = foodPlan?.[date] || {};
    const hasFood = MEALS.some((m) => (day[m.key] || '').trim()) || (day.note || '').trim();
    const session = schedule?.[date]?.session || '';
    const isToday = date === today;
    const isTomorrow = date === addDays(today, 1);
    const label = isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : formatPretty(date).toUpperCase();

    return (
      <div
        style={{
          border: `1px solid ${isToday ? 'rgba(74, 138, 42, 0.5)' : 'var(--border)'}`,
          background: isToday ? 'rgba(74, 138, 42, 0.07)' : 'var(--bg3)',
          borderRadius: 14,
          padding: isHero ? 18 : 14,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isHero ? 15 : 13,
              letterSpacing: '0.22em',
              color: isToday ? '#6fb241' : 'var(--text-mid)',
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{formatPretty(date)}</span>
          {session && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              · training: {session.split('\n')[0].slice(0, 40)}
            </span>
          )}
        </div>

        {editingDate === date ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {MEALS.map((m) => (
              <Field key={m.key} label={`${m.icon} ${m.label}`}>
                <TextInput
                  value={draft[m.key]}
                  onChange={(v) => setDraft((d) => ({ ...d, [m.key]: v }))}
                  placeholder={m.key === 'dinner' ? 'e.g. Chilli portion 2 + rice' : ''}
                />
              </Field>
            ))}
            <Field label="📝 Prep note" hint="When/how it happens — what's batched, what cooks fresh, when to start.">
              <TextInput
                value={draft.note}
                onChange={(v) => setDraft((d) => ({ ...d, note: v }))}
                placeholder="e.g. Dinner cooks fresh, 35 min — start 6:15pm"
              />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <GhostButton onClick={() => setEditingDate(null)}>Cancel</GhostButton>
              <GoldButton onClick={commitEdit}>Save</GoldButton>
            </div>
          </div>
        ) : hasFood ? (
          <div onClick={() => startEdit(date)} style={{ cursor: 'text' }}>
            <div style={{ display: 'grid', gap: 5 }}>
              {MEALS.filter((m) => (day[m.key] || '').trim()).map((m) => (
                <div key={m.key} style={{ fontSize: isHero ? 16 : 14, lineHeight: 1.45, color: 'var(--text)' }}>
                  <span style={{ color: 'var(--text-dim)' }}>{m.icon} {m.label}: </span>
                  {day[m.key]}
                </div>
              ))}
            </div>
            {(day.note || '').trim() && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(200, 146, 42, 0.07)',
                  border: '1px solid rgba(200, 146, 42, 0.25)',
                  fontSize: 13,
                  color: 'var(--text-mid)',
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                }}
              >
                📝 {day.note}
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => startEdit(date)}
            style={{ color: 'var(--text-dim)', fontSize: 14, fontStyle: 'italic', cursor: 'text' }}
          >
            Nothing planned. Tap to add, or ask Petra for the week.
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <ViewHeader
        title="FOOD"
        subtitle="The week's fuel, day by day. Petra fills it; tap any day to tweak."
        right={onAskPetra ? <GoldButton onClick={() => onAskPetra()}>TALK TO PETRA</GoldButton> : null}
      />
      <ViewBody>
        <DayCard date={today} isHero />
        <Section title="The week ahead">
          {dates.slice(1).map((d) => (
            <DayCard key={d} date={d} />
          ))}
        </Section>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.5 }}>
          Shopping trips, batch-prep sessions and cook-time events go into your Outlook diary via
          Petra's 📅 ADD TO DIARY button in chat — this tab is the readable plan you check daily.
        </div>
      </ViewBody>
    </>
  );
}
