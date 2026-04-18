import { Fragment, useState } from 'react';
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr',
              gap: 10,
            }}
          >
            {DAY_ORDER.map((d) => (
              <Fragment key={d}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    letterSpacing: '0.18em',
                    color: 'var(--text-mid)',
                    paddingTop: 10,
                  }}
                >
                  {dayLabel(d).toUpperCase()}
                </div>
                <TextArea
                  rows={2}
                  value={draftWeek[d]}
                  onChange={(v) => updateDay(d, v)}
                  placeholder="Swim 3km — 5×400 @ CSS"
                />
              </Fragment>
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
