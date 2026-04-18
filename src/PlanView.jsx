import { useState } from 'react';
import { storage, DAY_ORDER, dayLabel } from './storage.js';
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

function makeMilestoneId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function PlanView({
  planText,
  onPlanTextChange,
  weekPlan,
  onWeekPlanChange,
  milestones,
  onMilestonesChange,
  onAskFelix,
  onAskKira,
}) {
  const [draftPlan, setDraftPlan] = useState(planText || '');
  const [draftWeek, setDraftWeek] = useState(weekPlan);
  const [saved, setSaved] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ targetDate: '', title: '', notes: '' });

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
    const next = (milestones || []).map((m) => (m.id === id ? { ...m, done: !m.done } : m));
    saveMilestones(next);
  }

  function deleteMilestone(id) {
    if (!window.confirm('Delete this milestone?')) return;
    const next = (milestones || []).filter((m) => m.id !== id);
    saveMilestones(next);
  }

  function clearAllMilestones() {
    if (!window.confirm('Clear ALL milestones? This cannot be undone.')) return;
    saveMilestones([]);
  }

  function saveAll() {
    storage.setPlanText(draftPlan);
    storage.setWeekPlan(draftWeek);
    onPlanTextChange(draftPlan);
    onWeekPlanChange(draftWeek);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  function updateDay(d, v) {
    setDraftWeek((w) => ({ ...w, [d]: v }));
    setSaved(false);
  }

  function updateFeedback(d, v) {
    setDraftWeek((w) => ({
      ...w,
      feedback: { ...(w.feedback || {}), [d]: v },
    }));
    setSaved(false);
  }

  function clearPlan() {
    if (!window.confirm('Clear the master plan? This cannot be undone.')) return;
    setDraftPlan('');
    storage.setPlanText('');
    onPlanTextChange('');
  }

  return (
    <>
      <ViewHeader
        title="YOUR PLAN"
        subtitle="Felix writes the long plan. You run it day by day. Every coach reads both when advising you."
        right={<GoldButton onClick={saveAll}>{saved ? 'SAVED ✓' : 'SAVE'}</GoldButton>}
      />
      <ViewBody>
        <Section title="This week">
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {onAskKira && (
              <GoldButton onClick={() => onAskKira()}>
                PLAN THIS WEEK WITH KIRA →
              </GoldButton>
            )}
            <span style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>
              Kira reads your profile, master plan and last 10 log entries.
            </span>
          </div>
          <Field label="Week starting (YYYY-MM-DD)">
            <TextInput
              type="date"
              value={draftWeek.weekStarts}
              onChange={(v) => updateDay('weekStarts', v)}
            />
          </Field>
          <div style={{ height: 10 }} />
          <Field label="Focus of the week">
            <TextInput
              value={draftWeek.weekFocus}
              onChange={(v) => updateDay('weekFocus', v)}
              placeholder="Aerobic base — volume over intensity"
            />
          </Field>
          <div style={{ height: 14 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DAY_ORDER.map((d) => (
              <div
                key={d}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 12,
                  background: 'var(--bg3)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    letterSpacing: '0.22em',
                    color: 'var(--gold)',
                    marginBottom: 8,
                  }}
                >
                  {dayLabel(d).toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  Session
                </div>
                <TextArea
                  rows={2}
                  value={draftWeek[d]}
                  onChange={(v) => updateDay(d, v)}
                  placeholder="Swim 3km — 5×400 @ CSS"
                />
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    margin: '10px 0 4px',
                  }}
                >
                  How it went (feedback — Kira reads this)
                </div>
                <TextArea
                  rows={2}
                  value={draftWeek.feedback?.[d] || ''}
                  onChange={(v) => updateFeedback(d, v)}
                  placeholder="e.g. Felt flat in the warmup, dialled it in by the main set. RPE 7."
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Master plan (Kira's long-view document)">
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 10 }}>
            The arc from today to race day. When Kira writes your full plan in chat, hit
            "Save last reply as plan" at the top of her chat to drop it here automatically.
          </div>
          <TextArea
            rows={18}
            value={draftPlan}
            onChange={(v) => {
              setDraftPlan(v);
              setSaved(false);
            }}
            placeholder="## Phase 1 — Base (Weeks 1-12)\n- 8-10 hrs/week\n- Aerobic bias (Z1-Z2), technique work, strength 2x/week\n- Key sessions: long ride Sat, long run Sun, threshold swim Tue\n\n..."
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
            <GhostButton onClick={clearPlan} style={{ color: '#e0918a' }}>
              Clear plan
            </GhostButton>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {onAskKira && (
                <GhostButton onClick={() => onAskKira()}>Talk to Kira</GhostButton>
              )}
              {onAskFelix && (
                <GhostButton onClick={() => onAskFelix()}>Race-day with Felix</GhostButton>
              )}
              <GoldButton onClick={saveAll}>{saved ? 'SAVED ✓' : 'SAVE PLAN'}</GoldButton>
            </div>
          </div>
        </Section>

        <Section title="Milestones">
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
            Dated markers on the road to race day — fitness tests, volume benchmarks, race rehearsals,
            phase transitions. Every coach reads these in their context.
          </div>
          {onAskKira && (
            <div style={{ marginBottom: 16 }}>
              <GoldButton onClick={() => onAskKira()}>
                GENERATE MILESTONES WITH KIRA →
              </GoldButton>
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
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Notes (optional)">
                <TextInput
                  value={newMilestone.notes}
                  onChange={(v) => setNewMilestone((n) => ({ ...n, notes: v }))}
                  placeholder="Steady Z2, fuel at 75 g/hr, no bonks."
                />
              </Field>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <GoldButton onClick={addMilestone} disabled={!newMilestone.title.trim()}>
                ADD MILESTONE
              </GoldButton>
            </div>
          </div>

          {(milestones || []).length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: 10 }}>
              No milestones yet. Either add one above, or ask Kira to generate a full set based on your
              race date.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(milestones || []).map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  background: m.done ? 'rgba(74, 138, 42, 0.08)' : 'var(--bg3)',
                  opacity: m.done ? 0.75 : 1,
                }}
              >
                <button
                  onClick={() => toggleMilestone(m.id)}
                  aria-label={m.done ? 'Mark as pending' : 'Mark as done'}
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
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
                  {m.done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'baseline',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 12,
                        letterSpacing: '0.18em',
                        color: 'var(--gold)',
                      }}
                    >
                      {m.targetDate || '—'}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 16,
                        color: 'var(--text)',
                        textDecoration: m.done ? 'line-through' : 'none',
                      }}
                    >
                      {m.title}
                    </span>
                  </div>
                  {m.notes && (
                    <div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 4, fontStyle: 'italic' }}>
                      {m.notes}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteMilestone(m.id)}
                  style={{
                    flexShrink: 0,
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: '#e0918a',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {(milestones || []).length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <GhostButton onClick={clearAllMilestones} style={{ color: '#e0918a' }}>
                Clear all milestones
              </GhostButton>
            </div>
          )}
        </Section>
      </ViewBody>
    </>
  );
}
