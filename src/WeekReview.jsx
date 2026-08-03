import { todayIso, addDays } from './storage.js';
import { Section } from './ui.jsx';
import { morningDone, eveningDone, habitDone } from './DayView.jsx';

function Dots({ days, isDone }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {days.map((d) => {
        const done = isDone(d);
        return (
          <span
            key={d}
            title={d}
            style={{
              width: 14,
              height: 14,
              borderRadius: 5,
              background: done ? 'rgba(111, 178, 65, 0.35)' : 'var(--bg2)',
              border: `1px solid ${done ? '#6fb241' : 'var(--border)'}`,
            }}
          />
        );
      })}
    </span>
  );
}

function Row({ label, count, total, days, isDone, warn }) {
  const good = total === 0 || count / Math.max(1, total) >= 0.7;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 14, color: 'var(--text)', flex: 1, minWidth: 150 }}>{label}</span>
      {days && <Dots days={days} isDone={isDone} />}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          letterSpacing: '0.1em',
          color: warn ? '#e0918a' : good ? '#6fb241' : 'var(--gold)',
          minWidth: 34,
          textAlign: 'right',
        }}
      >
        {count}/{total}
      </span>
    </div>
  );
}

export default function WeekReview({ daily, habits, schedule, log }) {
  const today = todayIso();
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));

  const mDone = days.filter((d) => morningDone(daily?.[d])).length;
  const eDone = days.filter((d) => eveningDone(daily?.[d])).length;

  const loggedDates = new Set((log || []).map((x) => x.date));
  const planned = days.filter((d) => (schedule?.[d]?.session || '').trim());
  const trained = planned.filter((d) => loggedDates.has(d));
  const unlogged = planned.filter((d) => !loggedDates.has(d) && d !== today);

  const habitRows = (habits || []).map((h) => ({
    habit: h,
    done: days.filter((d) => habitDone(h, daily?.[d]?.habits?.[h.id])).length,
  }));

  const nothingYet =
    mDone === 0 && eDone === 0 && planned.length === 0 && habitRows.every((r) => r.done === 0);
  if (nothingYet) return null;

  return (
    <Section title="This week — doing vs saying">
      <div style={{ display: 'grid', gap: 10 }}>
        <Row label="☀️ Morning sheets" count={mDone} total={7} days={days} isDone={(d) => morningDone(daily?.[d])} />
        <Row label="🌙 Evening sheets" count={eDone} total={7} days={days} isDone={(d) => eveningDone(daily?.[d])} />
        {planned.length > 0 && (
          <Row
            label="🏋️ Planned sessions logged"
            count={trained.length}
            total={planned.length}
            days={planned}
            isDone={(d) => loggedDates.has(d)}
            warn={unlogged.length > 0}
          />
        )}
        {unlogged.length > 0 && (
          <div style={{ fontSize: 13, color: '#e0918a', lineHeight: 1.5 }}>
            ⚠️ Planned but never logged:{' '}
            {unlogged
              .map((d) => `${d.slice(5)} (${(schedule[d].session || '').split('\n')[0].slice(0, 30)})`)
              .join(' · ')}{' '}
            — log them or tell Kira what happened.
          </div>
        )}
        {habitRows.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'grid', gap: 8 }}>
            {habitRows.map(({ habit, done }) => (
              <Row
                key={habit.id}
                label={`🔁 ${habit.name}`}
                count={done}
                total={7}
                days={days}
                isDone={(d) => habitDone(habit, daily?.[d]?.habits?.[habit.id])}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
