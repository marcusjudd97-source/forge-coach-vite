import { useState } from 'react';

export default function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState('idle'); // idle | validating | error
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setStatus('error');
      setError('Please paste your Anthropic API key.');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      setStatus('error');
      setError('That does not look like an Anthropic key. It should start with "sk-ant-".');
      return;
    }

    setStatus('validating');
    setError('');

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trimmed,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      if (res.ok) {
        localStorage.setItem('forge_api_key', trimmed);
        onSave(trimmed);
        return;
      }

      if (res.status === 401) {
        setStatus('error');
        setError('That key was rejected as invalid. Double-check it at console.anthropic.com.');
        return;
      }
      if (res.status === 429) {
        setStatus('error');
        setError('Rate-limited or over quota. Check your plan and billing on the Anthropic console.');
        return;
      }

      const body = await res.text().catch(() => '');
      setStatus('error');
      setError(`Anthropic API returned ${res.status}. ${body.slice(0, 180)}`);
    } catch (err) {
      setStatus('error');
      setError(
        `Could not reach the Anthropic API. Check your connection and try again. (${err.message || err})`,
      );
    }
  }

  const validating = status === 'validating';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(24px + var(--safe-top)) 20px calc(24px + var(--safe-bottom))',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          animation: 'fadeUp 500ms ease both',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>
          <h1
            style={{
              fontSize: 'clamp(44px, 11vw, 64px)',
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
          <div
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.32em',
              fontSize: 11,
              color: 'var(--text-dim)',
              marginTop: 8,
            }}
          >
            IRONMAN COACHING SUITE
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 28,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              letterSpacing: '0.1em',
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            ENTER YOUR ANTHROPIC API KEY
          </h2>
          <p
            style={{
              color: 'var(--text-mid)',
              fontSize: 15,
              marginBottom: 18,
              lineHeight: 1.5,
            }}
          >
            Your key is stored <strong style={{ color: 'var(--gold)' }}>in this browser only</strong>.
            It is never sent to any server other than Anthropic. Billing goes to your own Anthropic account.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-ant-..."
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                if (status === 'error') {
                  setStatus('idle');
                  setError('');
                }
              }}
              disabled={validating}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 15,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                letterSpacing: '0.02em',
                marginBottom: 14,
              }}
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
                  marginBottom: 14,
                  lineHeight: 1.45,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={validating}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 12,
                background:
                  'linear-gradient(135deg, #c8922a 0%, rgba(200, 146, 42, 0.7) 100%)',
                color: '#1a1408',
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                letterSpacing: '0.16em',
                fontWeight: 600,
                cursor: validating ? 'wait' : 'pointer',
                opacity: validating ? 0.7 : 1,
                transition: 'opacity 150ms ease, transform 150ms ease',
              }}
            >
              {validating ? 'VALIDATING…' : 'ENTER THE FORGE'}
            </button>
          </form>

          <div
            style={{
              marginTop: 18,
              fontSize: 13,
              color: 'var(--text-dim)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Don&apos;t have a key?{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'var(--gold)',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(200, 146, 42, 0.4)',
              }}
            >
              Create one on the Anthropic console →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
