import { useState } from 'react';
import { storage, emptyLogEntry } from './storage.js';
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

const DISCIPLINES = [
  { value: 'swim', label: 'Swim' },
  { value: 'bike', label: 'Bike' },
  { value: 'run', label: 'Run' },
  { value: 'brick', label: 'Brick' },
  { value: 'strength', label: 'Strength' },
  { value: 'rest', label: 'Rest' },
  { value: 'other', label: 'Other' },
];

const STATUS = [
  { value: 'done', label: 'Done as planned' },
  { value: 'modified', label: 'Modified' },
  { value: 'skipped', label: 'Skipped' },
];

export default function LogView({ log, onLogChange }) {
  const [entry, setEntry] = useState(emptyLogEntry());
  const [editingId, setEditingId] = useState(null);

  function update(field, value) {
    setEntry((e) => ({ ...e, [field]: value }));
  }

  function save() {
    const trimmed = {
      ...entry,
      planned: (entry.planned || '').trim(),
      actual: (entry.actual || '').trim(),
      notes: (entry.notes || '').trim(),
    };
    let next;
    if (editingId) {
      next = log.map((e) => (e.id === editingId ? { ...trimmed, id: editingId } : e));
    } else {
      next = [...log, trimmed];
    }
    next.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    storage.setLog(next);
    onLogChange(next);
    setEntry(emptyLogEntry());
    setEditingId(null);
  }

  function edit(e) {
    setEntry(e);
    setEditingId(e.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remove(id) {
    if (!window.confirm('Delete this entry?')) return;
    const next = log.filter((e) => e.id !== id);
    storage.setLog(next);
    onLogChange(next);
    if (editingId === id) {
      setEntry(emptyLogEntry());
      setEditingId(null);
    }
  }

  function cancelEdit() {
    setEntry(emptyLogEntry());
    setEditingId(null);
  }

  const recent = [...log].reverse();

  return (
    <>
      <ViewHeader
        title="TRAINING LOG"
        subtitle="Every session, every skip, every RPE. Your coaches read the last 10 entries before every reply."
      />
      <ViewBody>
        <Section title={editingId ? 'Edit entry' : 'New entry'}>
          <Grid cols={2}>
            <Field label="Date">
              <TextInput type="date" value={entry.date} onChange={(v) => update('date', v)} />
            </Field>
            <Field label="Discipline">
              <Select
                value={entry.discipline}
                onChange={(v) => update('discipline', v)}
                options={DISCIPLINES}
              />
            </Field>
            <Field label="Status">
              <Select
                value={entry.status}
                onChange={(v) => update('status', v)}
                options={STATUS}
              />
            </Field>
            <Field label="Duration (min)">
              <TextInput
                value={entry.durationMin}
                onChange={(v) => update('durationMin', v)}
                placeholder="60"
              />
            </Field>
            <Field label="RPE (1–10)">
              <TextInput value={entry.rpe} onChange={(v) => update('rpe', v)} placeholder="7" />
            </Field>
            <Field label="Avg HR">
              <TextInput
                value={entry.avgHr}
                onChange={(v) => update('avgHr', v)}
                placeholder="145"
              />
            </Field>
            <Field label="Avg power (W)" span={2}>
              <TextInput
                value={entry.avgPower}
                onChange={(v) => update('avgPower', v)}
                placeholder="210"
              />
            </Field>
          </Grid>
          <div style={{ height: 12 }} />
          <Field label="Planned (what the session was supposed to be)">
            <TextArea
              rows={2}
              value={entry.planned}
              onChange={(v) => update('planned', v)}
              placeholder="90 min Z2 with 3×8 min @ threshold"
            />
          </Field>
          <div style={{ height: 12 }} />
          <Field label="Actual (what you actually did)">
            <TextArea
              rows={2}
              value={entry.actual}
              onChange={(v) => update('actual', v)}
              placeholder="75 min Z2, only 2×8 @ threshold — legs felt flat"
            />
          </Field>
          <div style={{ height: 12 }} />
          <Field label="Notes (how you felt, weather, fuel, anything worth a coach knowing)">
            <TextArea
              rows={3}
              value={entry.notes}
              onChange={(v) => update('notes', v)}
              placeholder="Slept 5hrs, hot day, stomach fine"
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            {editingId && <GhostButton onClick={cancelEdit}>Cancel</GhostButton>}
            <GoldButton onClick={save}>{editingId ? 'UPDATE' : 'ADD ENTRY'}</GoldButton>
          </div>
        </Section>

        <Section title={`Log (${log.length} entr${log.length === 1 ? 'y' : 'ies'})`}>
          {recent.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Nothing logged yet. Add your first session above.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.map((e) => (
              <div
                key={e.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'var(--bg3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.12em',
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: 'var(--text)' }}>{e.date}</span>
                    <span style={{ color: 'var(--gold)' }}>
                      {(e.discipline || '').toUpperCase()}
                    </span>
                    {e.status && e.status !== 'done' && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: e.status === 'skipped' ? 'rgba(200,74,42,0.2)' : 'rgba(200,146,42,0.2)',
                          color: e.status === 'skipped' ? '#e8a090' : 'var(--gold)',
                        }}
                      >
                        {e.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => edit(e)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text-mid)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(e.id)}
                      style={{
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
                </div>
                {e.planned && (
                  <div style={{ fontSize: 14, color: 'var(--text-mid)', marginBottom: 4 }}>
                    <em style={{ color: 'var(--text-dim)' }}>planned:</em> {e.planned}
                  </div>
                )}
                {e.actual && (
                  <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                    <em style={{ color: 'var(--text-dim)' }}>actual:</em> {e.actual}
                  </div>
                )}
                {(e.durationMin || e.rpe || e.avgHr || e.avgPower) && (
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>
                    {[
                      e.durationMin && `${e.durationMin}min`,
                      e.rpe && `RPE ${e.rpe}`,
                      e.avgHr && `HR ${e.avgHr}`,
                      e.avgPower && `${e.avgPower}W`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
                {e.notes && (
                  <div style={{ fontSize: 14, color: 'var(--text-mid)', fontStyle: 'italic' }}>
                    {e.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      </ViewBody>
    </>
  );
}
