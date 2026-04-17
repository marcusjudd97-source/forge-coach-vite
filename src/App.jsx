import { useEffect, useState } from 'react';
import ApiKeySetup from './ApiKeySetup.jsx';
import ChatWindow from './ChatWindow.jsx';
import { COACHES, COACH_ORDER } from './coaches.js';

const MOBILE_BREAKPOINT = 640;

function Sidebar({ activeCoach, onSelectCoach, onChangeKey, isMobile }) {
  return (
    <aside
      style={{
        width: isMobile ? '100%' : 220,
        height: '100%',
        background: 'var(--bg2)',
        borderRight: isMobile ? 'none' : '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        paddingTop: isMobile ? 'var(--safe-top)' : 0,
        paddingLeft: isMobile ? 'var(--safe-left)' : 0,
      }}
    >
      <div
        style={{
          padding: '22px 18px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>🔥</span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              letterSpacing: '0.14em',
              background: 'linear-gradient(180deg, #f5e8c8 0%, #c8922a 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            FORGE
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            letterSpacing: '0.3em',
            color: 'var(--text-dim)',
            marginTop: 8,
          }}
        >
          IRONMAN COACHING SUITE
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 10px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            letterSpacing: '0.28em',
            color: 'var(--text-dim)',
            padding: '4px 10px 10px',
          }}
        >
          THE SIX
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {COACH_ORDER.map((id) => {
            const c = COACHES[id];
            const active = id === activeCoach;
            return (
              <button
                key={id}
                onClick={() => onSelectCoach(id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: active ? c.accentDim : 'transparent',
                  border: `1px solid ${active ? c.accentBorder : 'transparent'}`,
                  color: active ? c.accentColor : 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--bg3)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{c.emoji}</span>
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      letterSpacing: '0.06em',
                      lineHeight: 1.1,
                    }}
                  >
                    {c.name.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontStyle: 'italic',
                      color: active ? c.accentColor : 'var(--text-dim)',
                      opacity: active ? 0.85 : 1,
                      lineHeight: 1.2,
                      marginTop: 2,
                    }}
                  >
                    {c.specialist.replace('The ', '')}
                  </span>
                </span>
                {active && (
                  <span
                    style={{
                      flexShrink: 0,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: c.accentColor,
                      color: c.accentColor,
                      animation: 'glowPulse 1.8s ease-in-out infinite',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        style={{
          padding: '12px 14px calc(14px + var(--safe-bottom))',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onChangeKey}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            color: 'var(--text-mid)',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Change API Key
        </button>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: 'var(--text-dim)',
            textAlign: 'center',
          }}
        >
          Key stored in this browser only
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('forge_api_key') || '';
    } catch {
      return '';
    }
  });
  const [activeCoach, setActiveCoach] = useState('cycling');
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  if (!apiKey) {
    return <ApiKeySetup onSave={setApiKey} />;
  }

  const coach = COACHES[activeCoach];

  function handleChangeKey() {
    try {
      localStorage.removeItem('forge_api_key');
    } catch {}
    setApiKey('');
    setDrawerOpen(false);
  }

  function handleSelectCoach(id) {
    setActiveCoach(id);
    setDrawerOpen(false);
  }

  const mainHeader = isMobile ? (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: `calc(10px + var(--safe-top)) 14px 10px`,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        flexShrink: 0,
      }}
    >
      <button
        aria-label="Open menu"
        onClick={() => setDrawerOpen(true)}
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          color: 'var(--text)',
          background: 'transparent',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 18 }}>{coach.emoji}</span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            letterSpacing: '0.1em',
            color: coach.accentColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {coach.specialist.toUpperCase()}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14 }}>🔥</span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            letterSpacing: '0.16em',
            background: 'linear-gradient(180deg, #f5e8c8 0%, #c8922a 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          FORGE
        </span>
      </div>
    </header>
  ) : (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: coach.accentDim,
          border: `1px solid ${coach.accentBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          flexShrink: 0,
        }}
      >
        {coach.emoji}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            letterSpacing: '0.08em',
            color: 'var(--text)',
            lineHeight: 1,
          }}
        >
          {coach.specialist.toUpperCase()}
        </h1>
        <div
          style={{
            fontStyle: 'italic',
            fontSize: 15,
            color: coach.accentColor,
            marginTop: 6,
          }}
        >
          {coach.tagline}
        </div>
      </div>
    </header>
  );

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {!isMobile && (
        <Sidebar
          activeCoach={activeCoach}
          onSelectCoach={handleSelectCoach}
          onChangeKey={handleChangeKey}
          isMobile={false}
        />
      )}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'var(--bg)',
        }}
      >
        {mainHeader}
        <ChatWindow key={activeCoach} coach={coach} apiKey={apiKey} />
      </main>

      {isMobile && drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 40,
              animation: 'backdropIn 180ms ease both',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              width: 'min(82vw, 300px)',
              background: 'var(--bg2)',
              zIndex: 50,
              animation: 'drawerIn 220ms ease both',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '8px 0 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Sidebar
              activeCoach={activeCoach}
              onSelectCoach={handleSelectCoach}
              onChangeKey={handleChangeKey}
              isMobile={true}
            />
          </div>
        </>
      )}
    </div>
  );
}
