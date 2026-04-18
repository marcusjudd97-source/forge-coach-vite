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

export default function PlanView({
  planText,
  onPlanTextChange,
  weekPlan,
  onWeekPlanChange,
  onAskFelix,
  onAskKira,
}) {
  const [draftPlan, setDraftPlan] = useState(planText || '');
  const [draftWeek, setDraftWeek] = useState(weekPlan);
  const [saved, setSaved] = useState(false);

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

        <Section title="Master plan (Felix's long-view document)">
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 10 }}>
            Paste or edit the full periodised plan here. When Felix writes one in chat, hit
            "Save last reply as plan" at the top of his chat to drop it here automatically.
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <GhostButton onClick={clearPlan} style={{ color: '#e0918a' }}>
              Clear plan
            </GhostButton>
            <div style={{ display: 'flex', gap: 8 }}>
              {onAskFelix && (
                <GhostButton onClick={() => onAskFelix()}>Talk to Felix</GhostButton>
              )}
              <GoldButton onClick={saveAll}>{saved ? 'SAVED ✓' : 'SAVE PLAN'}</GoldButton>
            </div>
          </div>
        </Section>
      </ViewBody>
    </>
  );
}
