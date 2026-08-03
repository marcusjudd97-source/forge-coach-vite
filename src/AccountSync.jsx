import { useEffect, useState } from 'react';
import {
  syncConfigured,
  onSyncStatus,
  signIn,
  signUp,
  signOut,
  fullSync,
} from './sync.js';
import { Section, Field, TextInput, GoldButton, GhostButton } from './ui.jsx';

function timeAgo(ms) {
  if (!ms) return '';
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

export default function AccountSync() {
  const [status, setStatus] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { kind: 'ok' | 'err', text }

  useEffect(() => onSyncStatus(setStatus), []);

  if (!syncConfigured) {
    return (
      <Section title="Account & sync">
        <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          Cross-device sync isn&apos;t set up yet. It needs a free Supabase project — see{' '}
          <strong style={{ color: 'var(--gold)' }}>README → Sync across devices</strong> for the
          5-minute setup. Until then, FORGE keeps working with data stored in this browser only.
        </div>
      </Section>
    );
  }

  const user = status?.user;

  async function run(fn, okText) {
    setBusy(true);
    setMsg(null);
    const res = await fn();
    setBusy(false);
    if (res?.error) {
      setMsg({ kind: 'err', text: res.error });
    } else if (res?.needsConfirmation) {
      setMsg({
        kind: 'ok',
        text: 'Account created — check your email for a confirmation link, then sign in here.',
      });
    } else if (okText) {
      setMsg({ kind: 'ok', text: okText });
    }
  }

  return (
    <Section title="Account & sync">
      {user ? (
        <>
          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>
            Signed in as <strong style={{ color: 'var(--gold)' }}>{user.email}</strong>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14 }}>
            {status.state === 'syncing' && 'Syncing…'}
            {status.state === 'synced' &&
              `Synced ✓${status.lastSyncAt ? ` · ${timeAgo(status.lastSyncAt)}` : ''}`}
            {status.state === 'error' && (
              <span style={{ color: '#e8a090' }}>Sync error: {status.error}</span>
            )}
            {status.state === 'idle' && 'Waiting to sync.'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <GoldButton onClick={() => fullSync()} disabled={status.state === 'syncing'}>
              SYNC NOW
            </GoldButton>
            <GhostButton onClick={() => run(async () => signOut(), 'Signed out. Data stays on this device.')}>
              SIGN OUT
            </GhostButton>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 12, lineHeight: 1.5 }}>
            Profile, plan, log, chats and voice notes sync automatically to your account.
            Your Anthropic API key is never synced — enter it once per device.
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
            Sign in with the same account on your PC and phone and FORGE keeps everything in sync —
            profile, plan, training log, chats and voice notes. (Your API key stays per-device.)
          </div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
            <Field label="Email">
              <TextInput type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <TextInput type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <GoldButton
              disabled={busy || !email.trim() || !password}
              onClick={() => run(() => signIn(email.trim(), password), 'Signed in — syncing.')}
            >
              {busy ? 'WORKING…' : 'SIGN IN'}
            </GoldButton>
            <GhostButton
              disabled={busy || !email.trim() || !password}
              onClick={() => run(() => signUp(email.trim(), password))}
            >
              CREATE ACCOUNT
            </GhostButton>
          </div>
        </>
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
