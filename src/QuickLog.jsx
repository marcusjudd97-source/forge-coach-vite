import { useEffect, useState } from 'react';
import { GoldButton, GhostButton } from './ui.jsx';

const RPE_LABELS = {
  1: 'very easy',
  2: 'easy',
  3: 'steady',
  4: 'moderate',
  5: 'moderate+',
  6: 'tempo',
  7: 'threshold',
  8: 'hard',
  9: 'very hard',
  10: 'max',
};

const STATUS_OPTIONS = [
  { value: 'done', label: 'Done as planned', color: '#6fb241' },
  { value: 'modified', label: 'Modified', color: '#c8922a' },
  { value: 'skipped', label: 'Skipped', color: '#e0918a' },
];

export default function QuickLog({
  open,
  dayLabel,
  dateString,
  discipline,
  sessionText,
  prevEntry,
  onSave,
  onClose,
}) {
  const [status, setStatus] = useState(prevEntry?.status || 'done');
  const [rpe, setRpe] = useState(prevEntry?.rpe || '');
  const [avgHr, setAvgHr] = useState(prevEntry?.avgHr || '');
  const [durationMin, setDurationMin] = useState(prevEntry?.durationMin || '');
  const [note, setNote] = useState(prevEntry?.notes || '');

  useEffect(() => {
    if (open) {
      setStatus(prevEntry?.status || 'done');
      setRpe(prevEntry?.rpe || '');
      setAvgHr(prevEntry?.avgHr || '');
      setDurationMin(prevEntry?.durationMin || '');
      setNote(prevEntry?.notes || '');
    }
  }, [open, prevEntry]);

  if (!open) return null;

  function submit() {
    onSave({
      status,
      rpe: String(rpe || ''),
      avgHr: String(avgHr || ''),
      durationMin: String(durationMin || ''),
      notes: note.trim(),
      discipline,
      date: dateString,
      planned: sessionText || '',
    });
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 70,
          animation: 'backdropIn 180ms ease both',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg2)',
          borderTop: '1px solid var(--border)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 80,
          paddingBottom: 'calc(20px + var(--safe-bottom))',
          animation: 'drawerIn 220ms ease both',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            padding: '18px 20px 8px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              letterSpacing: '0.22em',
              color: 'var(--text-dim)',
            }}
          >
            LOG SESSION
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              color: 'var(--text)',
              letterSpacing: '0.08em',
              marginTop: 4,
            }}
          >
            {dayLabel.toUpperCase()}
            {dateString ? ` · ${dateString}` : ''}
          </div>
          {sessionText && (
            <div
              style={{
                color: 'var(--text-mid)',
                fontSize: 14,
                marginTop: 6,
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              {sessionText.length > 160 ? sessionText.slice(0, 160) + '…' : sessionText}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px 6px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Status
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map((s) => {
              const active = status === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: active ? `${s.color}22` : 'var(--bg3)',
                    border: `1px solid ${active ? s.color : 'var(--border)'}`,
                    color: active ? s.color : 'var(--text-mid)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    letterSpacing: '0.14em',
                    cursor: 'pointer',
                  }}
                >
                  {s.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '12px 20px 6px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Effort (RPE)</span>
            <span style={{ color: rpe ? 'var(--gold)' : 'var(--text-dim)' }}>
              {rpe ? `${rpe} · ${RPE_LABELS[rpe] || ''}` : '—'}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
              gap: 4,
            }}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const active = String(rpe) === String(n);
              return (
                <button
                  key={n}
                  onClick={() => setRpe(active ? '' : n)}
                  style={{
                    padding: '10px 0',
                    borderRadius: 8,
                    background: active ? 'rgba(200, 146, 42, 0.2)' : 'var(--bg3)',
                    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                    color: active ? 'var(--gold)' : 'var(--text-mid)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '12px 20px 6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.18em',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Avg HR
            </div>
            <input
              type="number"
              inputMode="numeric"
              value={avgHr}
              onChange={(e) => setAvgHr(e.target.value)}
              placeholder="145"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 16,
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.18em',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Duration (min)
            </div>
            <input
              type="number"
              inputMode="numeric"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              placeholder="60"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 16,
              }}
            />
          </div>
        </div>

        <div style={{ padding: '12px 20px 6px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            How it went
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="One sentence — legs, weather, mood, anything Kira should know."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 16,
              fontFamily: 'var(--font-body)',
              resize: 'vertical',
            }}
          />
        </div>

        <div
          style={{
            padding: '14px 20px 0',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}
        >
          <GhostButton onClick={onClose}>CANCEL</GhostButton>
          <GoldButton onClick={submit}>SAVE</GoldButton>
        </div>
      </div>
    </>
  );
}
