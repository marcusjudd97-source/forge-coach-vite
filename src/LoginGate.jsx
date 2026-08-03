import { useState } from 'react';
import { signIn, signUp } from './sync.js';

// Full-screen gate: when sync is configured, the app requires a signed-in
// account before showing anything — the account is the single source of truth.
export default function LoginGate({ onSkip }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function go(fn) {
    setBusy(true);
    setError('');
    const res = await fn(email.trim(), password);
    setBusy(false);
    if (res?.error) setError(res.error);
    else if (res?.needsConfirmation)
      setError('Account created — check your email for a confirmation link, then sign in.');
    // success → auth listener flips the gate automatically
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: 15,
    marginBottom: 12,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(24px + var(--safe-top)) 20px calc(24px + var(--safe-bottom))',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeUp 500ms ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🔥</div>
          <h1
            style={{
              fontSize: 'clamp(40px, 10vw, 56px)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.14em',
              lineHeight: 1,
              margin: 0,
              background: 'linear-gradient(180deg, #f5e8c8 0%, #c8922a 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            FORGE
          </h1>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, padding: 26 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              letterSpacing: '0.1em',
              color: 'var(--text)',
              marginBottom: 6,
            }}
          >
            SIGN IN
          </h2>
          <p style={{ color: 'var(--text-mid)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            Your account holds everything — plan, habits, sheets, food. Sign in and this device
            mirrors it exactly.
          </p>

          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            style={inputStyle}
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && email.trim() && password) go(signIn);
            }}
            disabled={busy}
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                background: 'rgba(200, 74, 42, 0.12)',
                border: '1px solid rgba(200, 74, 42, 0.35)',
                color: '#e8a090',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 14,
                marginBottom: 12,
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={() => go(signIn)}
            disabled={busy || !email.trim() || !password}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #c8922a 0%, rgba(200, 146, 42, 0.7) 100%)',
              color: '#1a1408',
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              letterSpacing: '0.16em',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy || !email.trim() || !password ? 0.6 : 1,
              marginBottom: 10,
            }}
          >
            {busy ? 'WORKING…' : 'SIGN IN'}
          </button>
          <button
            onClick={() => go(signUp)}
            disabled={busy || !email.trim() || !password}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 12,
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              letterSpacing: '0.16em',
              cursor: 'pointer',
            }}
          >
            CREATE ACCOUNT
          </button>

          {onSkip && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={onSkip}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: 12,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Continue offline on this device (nothing will sync)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
