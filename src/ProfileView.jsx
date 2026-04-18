import { useState } from 'react';
import { storage, defaultProfile } from './storage.js';
import {
  Section,
  Field,
  TextInput,
  TextArea,
  Select,
  Grid,
  GoldButton,
  GhostButton,
  ViewHeader,
  ViewBody,
} from './ui.jsx';

export default function ProfileView({ profile, onProfileChange, onAskKira }) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function update(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    storage.setProfile(draft);
    onProfileChange(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  function handleReset() {
    if (!window.confirm('Reset all profile fields? Cannot be undone.')) return;
    setDraft(defaultProfile);
    storage.setProfile(defaultProfile);
    onProfileChange(defaultProfile);
  }

  return (
    <>
      <ViewHeader
        title="YOUR PROFILE"
        subtitle="The essentials get you started. Kira fills in the rest as you chat with her."
        right={<GoldButton onClick={handleSave}>{saved ? 'SAVED ✓' : 'SAVE'}</GoldButton>}
      />
      <ViewBody>
        {onAskKira && (
          <Section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 26, flexShrink: 0 }}>🧭</div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    letterSpacing: '0.22em',
                    color: '#c8317b',
                    marginBottom: 4,
                  }}
                >
                  PREFER TO TALK IT THROUGH?
                </div>
                <div style={{ color: 'var(--text-mid)', fontSize: 14, lineHeight: 1.45 }}>
                  Skip the form — open Kira, tell her about yourself, and she'll save everything to your
                  profile as you speak.
                </div>
              </div>
              <GhostButton onClick={() => onAskKira()}>OPEN KIRA</GhostButton>
            </div>
          </Section>
        )}

        <Section title="Essentials">
          <Grid cols={2}>
            <Field label="Name">
              <TextInput value={draft.name} onChange={(v) => update('name', v)} placeholder="Marcus" />
            </Field>
            <Field label="Weight (kg)">
              <TextInput value={draft.weightKg} onChange={(v) => update('weightKg', v)} placeholder="74" />
            </Field>
            <Field label="Target race" span={2}>
              <TextInput
                value={draft.targetRaceName}
                onChange={(v) => update('targetRaceName', v)}
                placeholder="Ironman Wales, or 'not yet chosen'"
              />
            </Field>
            <Field label="Race date">
              <TextInput
                type="date"
                value={draft.targetRaceDate}
                onChange={(v) => update('targetRaceDate', v)}
              />
            </Field>
            <Field label="Goal finish time">
              <TextInput
                value={draft.targetFinishTime}
                onChange={(v) => update('targetFinishTime', v)}
                placeholder="12:30 — or 'finish, any time'"
              />
            </Field>
          </Grid>
        </Section>

        <Section>
          <button
            onClick={() => setShowAdvanced((s) => !s)}
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
              MORE DETAILS (OPTIONAL)
            </span>
            <span style={{ color: 'var(--text-dim)' }}>{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 16 }}>
              <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 14, fontStyle: 'italic' }}>
                Everything here is optional. Kira can and will ask about any of this in conversation and
                fill it in for you silently.
              </div>

              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  letterSpacing: '0.22em',
                  color: 'var(--text-mid)',
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                IDENTITY
              </h4>
              <Grid cols={2}>
                <Field label="Age">
                  <TextInput value={draft.age} onChange={(v) => update('age', v)} placeholder="28" />
                </Field>
                <Field label="Sex">
                  <Select
                    value={draft.sex}
                    onChange={(v) => update('sex', v)}
                    options={[
                      { value: '', label: '—' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other / prefer not to say' },
                    ]}
                  />
                </Field>
                <Field label="Height (cm)">
                  <TextInput value={draft.heightCm} onChange={(v) => update('heightCm', v)} placeholder="180" />
                </Field>
                <Field label="Target race location">
                  <TextInput
                    value={draft.targetRaceLocation}
                    onChange={(v) => update('targetRaceLocation', v)}
                    placeholder="Tenby, Wales"
                  />
                </Field>
                <Field label="Previous racing" span={2}>
                  <TextArea
                    rows={2}
                    value={draft.racingHistory}
                    onChange={(v) => update('racingHistory', v)}
                    placeholder="2 x 70.3 at 5:45, marathon PB 3:45."
                  />
                </Field>
              </Grid>

              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  letterSpacing: '0.22em',
                  color: 'var(--text-mid)',
                  marginBottom: 10,
                  marginTop: 18,
                }}
              >
                CURRENT FITNESS
              </h4>
              <Grid cols={2}>
                <Field label="100m swim pace">
                  <TextInput value={draft.swim100mPace} onChange={(v) => update('swim100mPace', v)} placeholder="1:45" />
                </Field>
                <Field label="Weekly swim km">
                  <TextInput value={draft.weeklySwimVolumeKm} onChange={(v) => update('weeklySwimVolumeKm', v)} placeholder="4" />
                </Field>
                <Field label="FTP (W)">
                  <TextInput value={draft.ftpWatts} onChange={(v) => update('ftpWatts', v)} placeholder="245" />
                </Field>
                <Field label="Power meter?">
                  <Select
                    value={draft.hasPowerMeter}
                    onChange={(v) => update('hasPowerMeter', v)}
                    options={['', 'yes', 'no', 'turbo only']}
                  />
                </Field>
                <Field label="Weekly bike hours">
                  <TextInput value={draft.weeklyBikeHours} onChange={(v) => update('weeklyBikeHours', v)} placeholder="6" />
                </Field>
                <Field label="Marathon PB">
                  <TextInput value={draft.marathonPb} onChange={(v) => update('marathonPb', v)} placeholder="3:45" />
                </Field>
                <Field label="Half-marathon PB">
                  <TextInput value={draft.halfMarathonPb} onChange={(v) => update('halfMarathonPb', v)} placeholder="1:42" />
                </Field>
                <Field label="Weekly run km">
                  <TextInput value={draft.weeklyRunKm} onChange={(v) => update('weeklyRunKm', v)} placeholder="30" />
                </Field>
              </Grid>

              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  letterSpacing: '0.22em',
                  color: 'var(--text-mid)',
                  marginBottom: 10,
                  marginTop: 18,
                }}
              >
                ACCESS · DIARY · CONSTRAINTS
              </h4>
              <Grid cols={1}>
                <Field label="Facilities (pool, turbo, gym, trails)">
                  <TextArea
                    rows={2}
                    value={draft.accessPool}
                    onChange={(v) => update('accessPool', v)}
                    placeholder="25m pool 3x/week · Kickr at home · gym 10 min walk"
                  />
                </Field>
                <Field label="Typical weekly training hours">
                  <TextInput
                    value={draft.typicalWeeklyHours}
                    onChange={(v) => update('typicalWeeklyHours', v)}
                    placeholder="8–10 hrs now, can scale to 14"
                  />
                </Field>
                <Field label="Best / busy days">
                  <TextInput
                    value={draft.bestTrainingDays}
                    onChange={(v) => update('bestTrainingDays', v)}
                    placeholder="Best: Tue/Thu/Sat/Sun · Busy: Wed (family)"
                  />
                </Field>
                <Field label="Work / family / travel">
                  <TextArea
                    rows={2}
                    value={draft.workCommitments}
                    onChange={(v) => update('workCommitments', v)}
                    placeholder="Office Mon-Thu, WFH Fri. Toddler at home. Occasional work trips."
                  />
                </Field>
              </Grid>

              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  letterSpacing: '0.22em',
                  color: 'var(--text-mid)',
                  marginBottom: 10,
                  marginTop: 18,
                }}
              >
                INJURIES & NUTRITION
              </h4>
              <Grid cols={1}>
                <Field label="Current injuries / niggles">
                  <TextArea
                    rows={2}
                    value={draft.currentInjuries}
                    onChange={(v) => update('currentInjuries', v)}
                    placeholder="Mild achilles after long runs"
                  />
                </Field>
                <Field label="Injury history">
                  <TextArea
                    rows={2}
                    value={draft.injuryHistory}
                    onChange={(v) => update('injuryHistory', v)}
                    placeholder="ITB 2023, plantar 2022 — both fully recovered"
                  />
                </Field>
                <Field label="Dietary restrictions">
                  <TextInput
                    value={draft.dietaryRestrictions}
                    onChange={(v) => update('dietaryRestrictions', v)}
                    placeholder="none / vegetarian / dairy-free"
                  />
                </Field>
                <Field label="GI history on long sessions">
                  <TextInput
                    value={draft.giHistory}
                    onChange={(v) => update('giHistory', v)}
                    placeholder="Fine usually; cramps past 4hrs"
                  />
                </Field>
              </Grid>

              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  letterSpacing: '0.22em',
                  color: 'var(--text-mid)',
                  marginBottom: 10,
                  marginTop: 18,
                }}
              >
                EQUIPMENT
              </h4>
              <Grid cols={2}>
                <Field label="Bike">
                  <TextInput value={draft.equipmentBike} onChange={(v) => update('equipmentBike', v)} placeholder="Canyon Speedmax CF 2024" />
                </Field>
                <Field label="Watch / head unit">
                  <TextInput value={draft.equipmentWatch} onChange={(v) => update('equipmentWatch', v)} placeholder="Garmin 965 + Edge 540" />
                </Field>
              </Grid>

              <div style={{ height: 14 }} />
              <Field label="Free notes — anything every coach should know">
                <TextArea
                  rows={3}
                  value={draft.notes}
                  onChange={(v) => update('notes', v)}
                  placeholder="Anything personal the coaches should factor into their advice."
                />
              </Field>
            </div>
          )}
        </Section>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 10, flexWrap: 'wrap' }}>
          <GhostButton onClick={handleReset} style={{ color: '#e0918a' }}>
            Reset profile
          </GhostButton>
          <GoldButton onClick={handleSave}>{saved ? 'SAVED ✓' : 'SAVE PROFILE'}</GoldButton>
        </div>
      </ViewBody>
    </>
  );
}
