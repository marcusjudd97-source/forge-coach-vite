import { useEffect, useState } from 'react';
import {
  syncConfigured,
  onSyncStatus,
  signIn,
  signUp,
  signOut,
  fullSync,
  forceUpload,
  forceDownload,
  restoreForceBackup,
  getClient,
} from './sync.js';

const FEED_BASE = 'https://forge-coach-vite.vercel.app/api/calendar';
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
  const [feedUrl, setFeedUrl] = useState('');
  const [feedCopied, setFeedCopied] = useState(false);

  async function showFeedUrl() {
    const supa = getClient();
    const user = status?.user;
    if (!supa || !user) return;
    setBusy(true);
    try {
      let { data } = await supa.from('calendar_tokens').select('token').maybeSingle();
      if (!data) {
        const ins = await supa
          .from('calendar_tokens')
          .insert({ user_id: user.id })
          .select('token')
          .single();
        if (ins.error) throw ins.error;
        data = ins.data;
      }
      setFeedUrl(`${FEED_BASE}?token=${data.token}`);
    } catch (err) {
      setMsg({ kind: 'err', text: `Couldn't get feed URL: ${err.message || err}` });
    } finally {
      setBusy(false);
    }
  }

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setFeedCopied(true);
      setTimeout(() => setFeedCopied(false), 2200);
    } catch {
      window.prompt('Copy the feed URL:', feedUrl);
    }
  }

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
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.22em',
                color: 'var(--gold)',
                marginBottom: 8,
              }}
            >
              📅 OUTLOOK LIVE FEED
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.5 }}>
              Subscribe Outlook to your private FORGE calendar once, and every training session and
              coach diary event appears there automatically — no more manual imports. In Outlook:
              <strong style={{ color: 'var(--text-mid)' }}> Add calendar → Subscribe from web</strong>,
              paste the URL, name it FORGE.
            </div>
            {feedUrl ? (
              <>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    fontSize: 12,
                    wordBreak: 'break-all',
                    marginBottom: 8,
                    userSelect: 'all',
                  }}
                >
                  {feedUrl}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <GoldButton onClick={copyFeedUrl}>{feedCopied ? 'COPIED ✓' : 'COPY FEED URL'}</GoldButton>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 10 }}>
                  Treat this URL like a password — anyone with it can read your training calendar.
                  Outlook refreshes subscribed calendars every few hours.
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 10 }}>
                <GhostButton onClick={showFeedUrl} disabled={busy}>
                  {busy ? 'WORKING…' : 'GET MY FEED URL'}
                </GhostButton>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              If the automatic merge ever gets stuck, force a direction from the device you trust:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <GhostButton
                disabled={status.state === 'syncing'}
                onClick={() => {
                  if (!window.confirm('Replace the CLOUD copy with everything on THIS device?')) return;
                  run(() => forceUpload(), 'Uploaded — this device is now the master copy.');
                }}
              >
                ⬆ FORCE UPLOAD
              </GhostButton>
              <GhostButton
                disabled={status.state === 'syncing'}
                onClick={() => {
                  if (!window.confirm('Replace everything on THIS device with the cloud copy? Local-only changes will be lost.')) return;
                  run(() => forceDownload(), 'Downloaded — this device now matches the cloud.');
                }}
              >
                ⬇ FORCE DOWNLOAD
              </GhostButton>
              <GhostButton
                disabled={status.state === 'syncing'}
                onClick={() => {
                  if (!window.confirm('Undo the last force upload/download by restoring the automatic cloud backup taken just before it?')) return;
                  run(async () => {
                    const r = await restoreForceBackup();
                    return r;
                  }, 'Backup restored — cloud and this device are back to the pre-force state.');
                }}
              >
                ↩ UNDO LAST FORCE
              </GhostButton>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 }}>
              A cloud backup is taken automatically right before every force, so one wrong press is
              always reversible with ↩.
            </div>
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
