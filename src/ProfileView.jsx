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

export default function ProfileView({ profile, onProfileChange }) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

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
    if (!window.confirm('Reset all profile fields? This cannot be undone.')) return;
    setDraft(defaultProfile);
    storage.setProfile(defaultProfile);
    onProfileChange(defaultProfile);
  }

  return (
    <>
      <ViewHeader
        title="YOUR PROFILE"
        subtitle="The more you fill in, the more specific every coach becomes. You can update this at any time."
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <GoldButton onClick={handleSave}>{saved ? 'SAVED ✓' : 'SAVE'}</GoldButton>
          </div>
        }
      />
      <ViewBody>
        <Section title="Athlete">
          <Grid cols={2}>
            <Field label="Name">
              <TextInput value={draft.name} onChange={(v) => update('name', v)} placeholder="Marcus" />
            </Field>
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
            <Field label="Weight (kg)">
              <TextInput value={draft.weightKg} onChange={(v) => update('weightKg', v)} placeholder="74" />
            </Field>
            <Field label="Height (cm)">
              <TextInput value={draft.heightCm} onChange={(v) => update('heightCm', v)} placeholder="180" />
            </Field>
          </Grid>
        </Section>

        <Section title="Racing history & target">
          <Grid cols={1}>
            <Field label="Previous racing (events, times, years)">
              <TextArea
                rows={3}
                value={draft.racingHistory}
                onChange={(v) => update('racingHistory', v)}
                placeholder="e.g. 2 x 70.3, both around 5:45 — Weymouth 2024 and Staffordshire 2025. One standalone marathon 3:45 in 2023."
              />
            </Field>
          </Grid>
          <div style={{ height: 10 }} />
          <Grid cols={2}>
            <Field label="Target race" span={2}>
              <TextInput
                value={draft.targetRaceName}
                onChange={(v) => update('targetRaceName', v)}
                placeholder="Ironman Wales, or 'not yet chosen'"
              />
            </Field>
            <Field label="Race date (YYYY-MM-DD)">
              <TextInput
                type="date"
                value={draft.targetRaceDate}
                onChange={(v) => update('targetRaceDate', v)}
              />
            </Field>
            <Field label="Location">
              <TextInput
                value={draft.targetRaceLocation}
                onChange={(v) => update('targetRaceLocation', v)}
                placeholder="Tenby, Wales"
              />
            </Field>
            <Field label="Goal finish time" span={2}>
              <TextInput
                value={draft.targetFinishTime}
                onChange={(v) => update('targetFinishTime', v)}
                placeholder="12:30 — or 'finish, any time'"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Current fitness">
          <Grid cols={2}>
            <Field label="100m swim pace" hint="pool, e.g. 1:45/100m">
              <TextInput
                value={draft.swim100mPace}
                onChange={(v) => update('swim100mPace', v)}
                placeholder="1:45"
              />
            </Field>
            <Field label="Weekly swim km">
              <TextInput
                value={draft.weeklySwimVolumeKm}
                onChange={(v) => update('weeklySwimVolumeKm', v)}
                placeholder="4"
              />
            </Field>
            <Field label="FTP (watts)">
              <TextInput
                value={draft.ftpWatts}
                onChange={(v) => update('ftpWatts', v)}
                placeholder="245"
              />
            </Field>
            <Field label="Power meter?">
              <Select
                value={draft.hasPowerMeter}
                onChange={(v) => update('hasPowerMeter', v)}
                options={['', 'yes', 'no', 'turbo only']}
              />
            </Field>
            <Field label="Weekly bike hours">
              <TextInput
                value={draft.weeklyBikeHours}
                onChange={(v) => update('weeklyBikeHours', v)}
                placeholder="6"
              />
            </Field>
            <Field label="Marathon PB">
              <TextInput
                value={draft.marathonPb}
                onChange={(v) => update('marathonPb', v)}
                placeholder="3:45"
              />
            </Field>
            <Field label="Half-marathon PB">
              <TextInput
                value={draft.halfMarathonPb}
                onChange={(v) => update('halfMarathonPb', v)}
                placeholder="1:42"
              />
            </Field>
            <Field label="Weekly run km">
              <TextInput
                value={draft.weeklyRunKm}
                onChange={(v) => update('weeklyRunKm', v)}
                placeholder="30"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Access to facilities">
          <Grid cols={2}>
            <Field label="Pool">
              <TextInput
                value={draft.accessPool}
                onChange={(v) => update('accessPool', v)}
                placeholder="25m local, 3x/week"
              />
            </Field>
            <Field label="Open water">
              <TextInput
                value={draft.accessOpenWater}
                onChange={(v) => update('accessOpenWater', v)}
                placeholder="Lake 20 min away, weekends only"
              />
            </Field>
            <Field label="Turbo / indoor trainer">
              <TextInput
                value={draft.accessTurbo}
                onChange={(v) => update('accessTurbo', v)}
                placeholder="Wahoo Kickr, home"
              />
            </Field>
            <Field label="Outdoor riding">
              <TextInput
                value={draft.accessOutdoorBike}
                onChange={(v) => update('accessOutdoorBike', v)}
                placeholder="Country lanes from door"
              />
            </Field>
            <Field label="Gym">
              <TextInput
                value={draft.accessGym}
                onChange={(v) => update('accessGym', v)}
                placeholder="Gym 10 mins, free weights & rack"
              />
            </Field>
            <Field label="Trails / off-road">
              <TextInput
                value={draft.accessTrails}
                onChange={(v) => update('accessTrails', v)}
                placeholder="Forest 5 mins"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Diary & schedule">
          <Grid cols={2}>
            <Field label="Typical weekly training hours" span={2}>
              <TextInput
                value={draft.typicalWeeklyHours}
                onChange={(v) => update('typicalWeeklyHours', v)}
                placeholder="8–10 hrs now, can scale to 14"
              />
            </Field>
            <Field label="Best days to train">
              <TextInput
                value={draft.bestTrainingDays}
                onChange={(v) => update('bestTrainingDays', v)}
                placeholder="Tue / Thu / Sat / Sun"
              />
            </Field>
            <Field label="Busy / protected days">
              <TextInput
                value={draft.busyTrainingDays}
                onChange={(v) => update('busyTrainingDays', v)}
                placeholder="Wed (family)"
              />
            </Field>
            <Field label="Early or late sessions?" span={2}>
              <Select
                value={draft.earlyOrLate}
                onChange={(v) => update('earlyOrLate', v)}
                options={['', 'strong early bird', 'slight early bird', 'flexible', 'slight night owl', 'strong night owl']}
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Commitments & constraints">
          <Grid cols={1}>
            <Field label="Work">
              <TextArea
                rows={2}
                value={draft.workCommitments}
                onChange={(v) => update('workCommitments', v)}
                placeholder="Office Mon–Thu, WFH Fri. Occasional evening meetings."
              />
            </Field>
            <Field label="Family">
              <TextArea
                rows={2}
                value={draft.familyCommitments}
                onChange={(v) => update('familyCommitments', v)}
                placeholder="Partner + 1 toddler. No training Sat morning."
              />
            </Field>
            <Field label="Travel">
              <TextArea
                rows={2}
                value={draft.travelCommitments}
                onChange={(v) => update('travelCommitments', v)}
                placeholder="2 work trips per quarter, usually Mon–Wed"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Injuries">
          <Grid cols={1}>
            <Field label="Current injuries / niggles">
              <TextArea
                rows={2}
                value={draft.currentInjuries}
                onChange={(v) => update('currentInjuries', v)}
                placeholder="Mild achilles tightness after long runs"
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
          </Grid>
        </Section>

        <Section title="Nutrition">
          <Grid cols={2}>
            <Field label="Dietary restrictions" span={2}>
              <TextInput
                value={draft.dietaryRestrictions}
                onChange={(v) => update('dietaryRestrictions', v)}
                placeholder="Vegetarian / dairy-free / none"
              />
            </Field>
            <Field label="Caffeine sensitive?">
              <Select
                value={draft.caffeineSensitive}
                onChange={(v) => update('caffeineSensitive', v)}
                options={['', 'no', 'slightly', 'yes']}
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
        </Section>

        <Section title="Equipment">
          <Grid cols={2}>
            <Field label="Bike">
              <TextInput
                value={draft.equipmentBike}
                onChange={(v) => update('equipmentBike', v)}
                placeholder="Canyon Speedmax CF 2024"
              />
            </Field>
            <Field label="Watch / head unit">
              <TextInput
                value={draft.equipmentWatch}
                onChange={(v) => update('equipmentWatch', v)}
                placeholder="Garmin 965 + Edge 540"
              />
            </Field>
            <Field label="HR monitor">
              <TextInput
                value={draft.equipmentHRM}
                onChange={(v) => update('equipmentHRM', v)}
                placeholder="HRM-Pro chest strap"
              />
            </Field>
            <Field label="Other">
              <TextInput
                value={draft.otherEquipment}
                onChange={(v) => update('otherEquipment', v)}
                placeholder="Roka wetsuit, Hoka run shoes"
              />
            </Field>
          </Grid>
        </Section>

        <Section title="Anything else">
          <Field label="Free notes for every coach to know">
            <TextArea
              rows={4}
              value={draft.notes}
              onChange={(v) => update('notes', v)}
              placeholder="Anything personal the coaches should factor into their advice."
            />
          </Field>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <GhostButton onClick={handleReset} style={{ color: '#e0918a' }}>
            Reset profile
          </GhostButton>
          <GoldButton onClick={handleSave}>{saved ? 'SAVED ✓' : 'SAVE PROFILE'}</GoldButton>
        </div>
      </ViewBody>
    </>
  );
}
