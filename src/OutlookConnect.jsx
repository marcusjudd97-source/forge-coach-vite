import { useEffect, useState } from 'react';
import { storage } from './storage.js';
import {
  onOutlookChange,
  connectOutlook,
  disconnectOutlook,
  pushToOutlook,
} from './msgraph.js';
import { Section, GoldButton, GhostButton } from './ui.jsx';

export default function OutlookConnect() {
  const [account, setAccount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => onOutlookChange(setAccount), []);

  async function pushNow() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await pushToOutlook({
        schedule: storage.getSchedule(),
        calendarEvents: storage.getCalendarEvents(),
      });
      setMsg({
        kind: 'ok',
        text: `Outlook updated — ${r.created} added, ${r.updated} changed, ${r.removed} removed. They're real, editable events in your own calendar.`,
      });
    } catch (err) {
      setMsg({ kind: 'err', text: `Push failed: ${err.message || err}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Microsoft Outlook — direct">
      <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
        Connect your Microsoft account (work or personal) and FORGE writes training sessions and
        coach diary events <strong style={{ color: 'var(--gold)' }}>directly into your actual
        calendar</strong> — timed, editable, in your day like any other appointment — and reads
        your real diary so the coaches plan around your meetings. Sessions default to 6am unless
        the session text names a time (e.g. "7am pre-office").
      </div>

      {account ? (
        <>
          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>
            Connected as{' '}
            <strong style={{ color: 'var(--gold)' }}>{account.username}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <GoldButton onClick={pushNow} disabled={busy}>
              {busy ? 'PUSHING…' : 'PUSH PLAN TO OUTLOOK NOW'}
            </GoldButton>
            <GhostButton
              onClick={() => {
                disconnectOutlook();
                setMsg(null);
              }}
            >
              DISCONNECT
            </GhostButton>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 10, lineHeight: 1.5 }}>
            FORGE also pushes automatically a few seconds after your plan or diary changes, and
            only ever touches events it created — your own appointments are never modified.
          </div>
        </>
      ) : (
        <GoldButton onClick={() => connectOutlook()}>CONNECT OUTLOOK →</GoldButton>
      )}

      {msg && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 14,
            lineHeight: 1.45,
            background: msg.kind === 'err' ? 'rgba(200, 74, 42, 0.12)' : 'rgba(111, 178, 65, 0.1)',
            border: `1px solid ${msg.kind === 'err' ? 'rgba(200, 74, 42, 0.35)' : 'rgba(111, 178, 65, 0.3)'}`,
            color: msg.kind === 'err' ? '#e8a090' : '#a8cf8e',
          }}
        >
          {msg.text}
        </div>
      )}
    </Section>
  );
}
