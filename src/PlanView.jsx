import { useState } from 'react';
import {
  storage,
  todayIso,
  addDays,
  formatPretty,
  dayOfWeekKey,
  dayLabel,
  daysUntil,
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
import QuickLog from './QuickLog.jsx';

const HORIZON_DAYS = 14;

function makeMilestoneId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function inferDiscipline(text) {
  const t = (text || '').toLowerCase();
  if (/brick/.test(t)) return 'brick';
  if (/\b(swim|pool|csa?|css|100m|open water|ow\b)/.test(t)) return 'swim';
  if (/\b(bike|ride|turbo|kickr|ftp|watts|zwift|cycling)/.test(t)) return 'bike';
  if (/\b(run|running|parkrun|marathon|5k|10k|half)/.test(t)) return 'run';
  if (/\b(strength|gym|lift|weights|squat|deadlift|mobility|core)/.test(t)) return 'strength';
  if (/\brest\b/.test(t)) return 'rest';
  return 'other';
}

function entryForDate(log, date) {
  if (!date) return null;
  return [...(log || [])].reverse().find((e) => e.date === date) || null;
}

function statusPill(status) {
  if (!status || status === 'done') return { label: 'DONE', color: '#6fb241', bg: 'rgba(111, 178, 65, 0.12)' };
  if (status === 'modified') return { label: 'MODIFIED', color: '#c8922a', bg: 'rgba(200, 146, 42, 0.14)' };
  if (status === 'skipped') return { label: 'SKIPPED', color: '#e0918a', bg: 'rgba(224, 145, 138, 0.14)' };
  return null;
}

export default function PlanView({
  planText,
  onPlanTextChange,
  schedule,
  onScheduleChange,
  log,
  onLogChange,
  milestones,
  onMilestonesChange,
  onAskFelix,
  onAskKira,
}) {
  const [draftPlan, setDraftPlan] = useState(planText || '');
  const [masterSaved, setMasterSaved] = useState(false);
  const [showMaster, setShowMaster] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [quickLog, setQuickLog] = useState(null);
  const [newMilestone, setNewMilestone] = useState({ targetDate: '', title: '', notes: '' });

  const today = todayIso();

  function updateSession(date, session) {
    const existing = schedule?.[date] || {};
    const next = { ...schedule, [date]: { ...existing, session } };
    storage.setSchedule(next);
    onScheduleChange(next);
  }

  function updateFeedback(date, feedback) {
    const existing = schedule?.[date] || {};
    const next = { ...schedule, [date]: { ...existing, feedback } };
    storage.setSchedule(next);
    onScheduleChange(next);
  }

  function startEdit(date) {
    setEditingDate(date);
    setEditingText(schedule?.[date]?.session || '');
  }
  function commitEdit() {
    if (editingDate) updateSession(editingDate, editingText);
    setEditingDate(null);
    setEditingText('');
  }

  function saveMaster() {
    storage.setPlanText(draftPlan);
    onPlanTextChange(draftPlan);
    setMasterSaved(true);
    setTimeout(() => setMasterSaved(false), 2200);
  }
  function clearMaster() {
    if (!window.confirm('Clear the master plan?')) return;
    setDraftPlan('');
    storage.setPlanText('');
    onPlanTextChange('');
  }

  function openQuickLog(date) {
    const session = schedule?.[date]?.session || '';
    const discipline = inferDiscipline(session);
    const prev = entryForDate(log, date);
    setQuickLog({ date, session, discipline, prevEntry: prev });
  }

  function saveQuickLog(data) {
    const id = quickLog?.prevEntry?.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const entry = {
      id,
      date: data.date,
      discipline: data.discipline || 'other',
      status: data.status,
      planned: data.planned || '',
      actual: data.notes,
      rpe: data.rpe,
      avgHr: data.avgHr,
      avgPower: '',
      durationMin: data.durationMin,
      notes: data.notes,
    };
    const existing = (log || []).filter((e) => e.id !== id);
    const nextLog = [...existing, entry].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    storage.setLog(nextLog);
    onLogChange(nextLog);

    const shortFeedback = [
      data.status && data.status !== 'done' ? `[${data.status}]` : '',
      data.rpe ? `RPE ${data.rpe}` : '',
      data.avgHr ? `HR ${data.avgHr}` : '',
      data.durationMin ? `${data.durationMin}min` : '',
      data.notes,
    ]
      .filter(Boolean)
      .join(' · ');
    updateFeedback(data.date, shortFeedback);

    setQuickLog(null);
  }

  function saveMilestones(next) {
    storage.setMilestones(next);
    onMilestonesChange(next);
  }
  function addMilestone() {
    const title = (newMilestone.title || '').trim();
    if (!title) return;
    const item = {
      id: makeMilestoneId(),
      title,
      targetDate: newMilestone.targetDate || '',
      notes: (newMilestone.notes || '').trim(),
      done: false,
    };
    const next = [...(milestones || []), item].sort((a, b) =>
      (a.targetDate || '').localeCompare(b.targetDate || ''),
    );
    saveMilestones(next);
    setNewMilestone({ targetDate: '', title: '', notes: '' });
  }
  function toggleMilestone(id) {
    saveMilestones((milestones || []).map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  }
  function deleteMilestone(id) {
    if (!window.confirm('Delete this milestone?')) return;
    saveMilestones((milestones || []).filter((m) => m.id !== id));
  }

  // Build rolling 14-day window from today
  const dates = [];
  for (let i = 0; i < HORIZON_DAYS; i++) dates.push(addDays(today, i));

  function DayCard({ date, isHero }) {
    const dow = dayOfWeekKey(date);
    const session = schedule?.[date]?.session || '';
    const entry = entryForDate(log, date);
    const pill = entry ? statusPill(entry.status) : null;
    const isToday = date === today;
    const isTomorrow = date === addDays(today, 1);
    const daysOut = daysUntil(date);

    let label;
    if (isToday) label = 'TODAY';
    else if (isTomorrow) label = 'TOMORROW';
    else label = dayLabel(dow).toUpperCase();

    return (
      <div
        style={{
          border: `1px solid ${isToday ? 'rgba(200, 146, 42, 0.45)' : 'var(--border)'}`,
          background: isToday ? 'rgba(200, 146, 42, 0.08)' : 'var(--bg3)',
          borderRadius: 14,
          padding: isHero ? 18 : 14,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isHero ? 15 : 13,
                letterSpacing: '0.22em',
                color: isToday ? 'var(--gold)' : 'var(--text-mid)',
              }}
            >
              {label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              {formatPretty(date)}
              {!isToday && !isTomorrow && daysOut != null && daysOut > 0 ? ` · in ${daysOut}d` : ''}
            </span>
          </div>
          {pill && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.18em',
                padding: '3px 8px',
                borderRadius: 999,
                background: pill.bg,
                color: pill.color,
              }}
            >
              {pill.label}
            </span>
          )}
        </div>

        {editingDate === date ? (
          <>
            <TextArea
              rows={3}
              value={editingText}
              onChange={setEditingText}
              placeholder="e.g. Bike threshold 75 min"
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <GhostButton onClick={() => setEditingDate(null)}>Cancel</GhostButton>
              <GoldButton onClick={commitEdit}>Save</GoldButton>
            </div>
          </>
        ) : (
          <div
            onClick={() => startEdit(date)}
            style={{
              color: session ? 'var(--text)' : 'var(--text-dim)',
              fontSize: isHero ? 17 : 15,
              lineHeight: 1.45,
              fontStyle: session ? 'normal' : 'italic',
              whiteSpace: 'pre-wrap',
              marginBottom: 10,
              cursor: 'text',
            }}
          >
            {session || 'Tap to add a session.'}
          </div>
        )}

        {entry && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-mid)',
              lineHeight: 1.4,
              padding: '8px 12px',
              background: 'var(--bg2)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              marginBottom: 10,
            }}
          >
            <div style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: '0.14em', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              HOW IT WENT
            </div>
            {[
              entry.rpe && `RPE ${entry.rpe}`,
              entry.avgHr && `HR ${entry.avgHr}`,
              entry.durationMin && `${entry.durationMin} min`,
            ].filter(Boolean).join(' · ') || ' '}
            {entry.notes && (
              <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text)' }}>
                {entry.notes}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <GoldButton onClick={() => openQuickLog(date)} style={isHero ? { fontSize: 14, padding: '14px 28px' } : undefined}>
            {entry ? 'EDIT LOG' : 'LOG THIS'}
          </GoldButton>
          {!editingDate && session && (
            <GhostButton onClick={() => startEdit(date)}>Edit session</GhostButton>
          )}
        </div>
      </div>
    );
  }

  const heroDate = today;
  const restDates = dates.slice(1);

  return (
    <>
      <ViewHeader
        title="YOUR PLAN"
        subtitle="The next 14 days. Tap any day to edit its session or log it."
        right={
          onAskKira ? (
            <GoldButton onClick={() => onAskKira()}>TALK TO KIRA</GoldButton>
          ) : null
        }
      />
      <ViewBody>
        <DayCard date={heroDate} isHero />

        <Section title="What's coming">
          {restDates.map((d) => (
            <DayCard key={d} date={d} />
          ))}
        </Section>

        <Section>
          <button
            onClick={() => setShowMilestones((s) => !s)}
            style={{
              width: '100%',
              padding: 6,
              background: 'transparent',
              color: 'var(--text)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                letterSpacing: '0.22em',
                color: 'var(--gold)',
              }}
            >
              MILESTONES ({(milestones || []).length})
            </span>
            <span style={{ color: 'var(--text-dim)' }}>{showMilestones ? '▲' : '▼'}</span>
          </button>

          {showMilestones && (
            <div style={{ marginTop: 14 }}>
              {onAskKira && (
                <div style={{ marginBottom: 12 }}>
                  <GhostButton onClick={() => onAskKira()}>GENERATE WITH KIRA</GhostButton>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  marginBottom: 14,
                }}
              >
                <Field label="Target date">
                  <TextInput
                    type="date"
                    value={newMilestone.targetDate}
                    onChange={(v) => setNewMilestone((n) => ({ ...n, targetDate: v }))}
                  />
                </Field>
                <Field label="Title">
                  <TextInput
                    value={newMilestone.title}
                    onChange={(v) => setNewMilestone((n) => ({ ...n, title: v }))}
                    placeholder="First 100km ride"
                  />
                </Field>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                  <GoldButton onClick={addMilestone} disabled={!newMilestone.title.trim()}>
                    ADD
                  </GoldButton>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(milestones || []).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 10,
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      background: m.done ? 'rgba(74, 138, 42, 0.08)' : 'var(--bg3)',
                      opacity: m.done ? 0.75 : 1,
                    }}
                  >
                    <button
                      onClick={() => toggleMilestone(m.id)}
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: `1.5px solid ${m.done ? '#6fb241' : 'var(--border)'}`,
                        background: m.done ? 'rgba(111, 178, 65, 0.2)' : 'transparent',
                        color: '#6fb241',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                        cursor: 'pointer',
                      }}
                    >
                      {m.done && '✓'}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--gold)' }}>
                          {m.targetDate || '—'}
                        </span>
                        <span style={{ fontSize: 15, textDecoration: m.done ? 'line-through' : 'none' }}>
                          {m.title}
                        </span>
                      </div>
                      {m.notes && (
                        <div style={{ fontSize: 13, color: 'var(--text-mid)', fontStyle: 'italic', marginTop: 3 }}>
                          {m.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteMilestone(m.id)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: '#e0918a',
                        fontSize: 11,
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section>
          <button
            onClick={() => setShowMaster((s) => !s)}
            style={{
              width: '100%',
              padding: 6,
              background: 'transparent',
              color: 'var(--text)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                letterSpacing: '0.22em',
                color: 'var(--gold)',
              }}
            >
              MASTER PLAN
            </span>
            <span style={{ color: 'var(--text-dim)' }}>{showMaster ? '▲' : '▼'}</span>
          </button>

          {showMaster && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>
                The arc from today to race day. Kira writes it; she also writes each week from it.
              </div>
              <TextArea
                rows={14}
                value={draftPlan}
                onChange={(v) => {
                  setDraftPlan(v);
                  setMasterSaved(false);
                }}
                placeholder="## Phase 1 — Base ..."
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                <GhostButton onClick={clearMaster} style={{ color: '#e0918a' }}>Clear</GhostButton>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {onAskFelix && (
                    <GhostButton onClick={() => onAskFelix()}>Race-day with Felix</GhostButton>
                  )}
                  <GoldButton onClick={saveMaster}>{masterSaved ? 'SAVED ✓' : 'SAVE MASTER PLAN'}</GoldButton>
                </div>
              </div>
            </div>
          )}
        </Section>
      </ViewBody>

      <QuickLog
        open={!!quickLog}
        dayLabel={
          quickLog
            ? quickLog.date === today
              ? 'Today'
              : quickLog.date === addDays(today, 1)
                ? 'Tomorrow'
                : formatPretty(quickLog.date)
            : ''
        }
        dateString={quickLog?.date || ''}
        discipline={quickLog?.discipline || 'other'}
        sessionText={quickLog?.session || ''}
        prevEntry={quickLog?.prevEntry}
        onSave={saveQuickLog}
        onClose={() => setQuickLog(null)}
      />
    </>
  );
}
