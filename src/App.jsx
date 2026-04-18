import { useEffect, useMemo, useState } from 'react';
import ApiKeySetup from './ApiKeySetup.jsx';
import ChatWindow from './ChatWindow.jsx';
import HomeView from './HomeView.jsx';
import PlanView from './PlanView.jsx';
import ProfileView from './ProfileView.jsx';
import LogView from './LogView.jsx';
import SettingsView from './SettingsView.jsx';
import { COACHES, COACH_ORDER } from './coaches.js';
import { storage, addDays, DAY_ORDER } from './storage.js';

const MOBILE_BREAKPOINT = 640;

const NAV = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'plan', label: 'Plan', icon: '📋' },
  { id: 'coaches', label: 'Coaches', icon: '💬' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const DESKTOP_NAV = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'plan', label: 'Plan', icon: '📋' },
  { id: 'coaches', label: 'Coaches', icon: '💬' },
  { id: 'log', label: 'Log (history)', icon: '📊' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

function SettingsGear({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Settings"
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--text-mid)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );
}

function Brand({ compact }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: compact ? 16 : 22, lineHeight: 1 }}>🔥</span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: compact ? 18 : 28,
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
  );
}

function DesktopSidebar({ view, onNav, onSettings, activeCoach, onSelectCoach, showCoaches, navItems }) {
  return (
    <aside
      style={{
        width: 240,
        height: '100%',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '22px 18px 12px', borderBottom: '1px solid var(--border)' }}>
        <Brand />
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

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {(navItems || NAV).map((n) => {
            const active = n.id === view;
            return (
              <button
                key={n.id}
                onClick={() => onNav(n.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: active ? 'rgba(200, 146, 42, 0.12)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(200, 146, 42, 0.3)' : 'transparent'}`,
                  color: active ? 'var(--gold)' : 'var(--text)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  letterSpacing: '0.12em',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{n.icon}</span>
                <span>{n.label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {showCoaches && (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.28em',
                color: 'var(--text-dim)',
                padding: '4px 10px 8px',
              }}
            >
              THE SIX
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {COACH_ORDER.map((id) => {
                const c = COACHES[id];
                const active = id === activeCoach;
                return (
                  <button
                    key={id}
                    onClick={() => onSelectCoach(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: active ? c.accentDim : 'transparent',
                      border: `1px solid ${active ? c.accentBorder : 'transparent'}`,
                      color: active ? c.accentColor : 'var(--text)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{c.emoji}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.08em' }}>
                      {c.name.split(' ')[1]?.toUpperCase() || c.name.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Data local to browser</span>
        <SettingsGear onClick={onSettings} />
      </div>
    </aside>
  );
}

function MobileBottomNav({ view, onNav }) {
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg2)',
        paddingBottom: 'var(--safe-bottom)',
        flexShrink: 0,
      }}
    >
      {NAV.map((n) => {
        const active = view === n.id;
        return (
          <button
            key={n.id}
            onClick={() => onNav(n.id)}
            style={{
              flex: 1,
              padding: '10px 4px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'transparent',
              color: active ? 'var(--gold)' : 'var(--text-mid)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                letterSpacing: '0.14em',
              }}
            >
              {n.label.toUpperCase()}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileHeader({ title, right, left }) {
  return (
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
      <div style={{ minWidth: 40 }}>{left}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          letterSpacing: '0.16em',
          color: 'var(--text)',
          flex: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </header>
  );
}

function CoachPicker({ onSelect, hasApiKey }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 16px calc(24px + var(--safe-bottom))' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            letterSpacing: '0.14em',
            color: 'var(--gold)',
            marginBottom: 6,
          }}
        >
          CHOOSE YOUR COACH
        </h2>
        <p style={{ color: 'var(--text-mid)', fontSize: 15, marginBottom: 18 }}>
          Each one reads your profile, plan and last 10 log entries before replying.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {COACH_ORDER.map((id) => {
            const c = COACHES[id];
            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                disabled={!hasApiKey}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: c.accentDim,
                  border: `1px solid ${c.accentBorder}`,
                  textAlign: 'left',
                  cursor: hasApiKey ? 'pointer' : 'default',
                  opacity: hasApiKey ? 1 : 0.5,
                  transition: 'transform 150ms ease',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15,
                    letterSpacing: '0.12em',
                    color: c.accentColor,
                    lineHeight: 1.1,
                  }}
                >
                  {c.name.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)', fontStyle: 'italic', marginTop: 4, lineHeight: 1.3 }}>
                  {c.specialist.replace('The ', '')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 10, fontStyle: 'italic', lineHeight: 1.35 }}>
                  {c.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => storage.getApiKey());
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [planText, setPlanText] = useState(() => storage.getPlanText());
  const [schedule, setSchedule] = useState(() => storage.getSchedule());
  const [log, setLog] = useState(() => storage.getLog());
  const [voiceNotes, setVoiceNotes] = useState(() => storage.getVoiceNotes());
  const [chats, setChats] = useState(() => storage.getChats());
  const [milestones, setMilestones] = useState(() => storage.getMilestones());

  const [view, setView] = useState('home');
  const [activeCoach, setActiveCoach] = useState('');
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!apiKey) {
    return (
      <ApiKeySetup
        onSave={(k) => {
          storage.setApiKey(k);
          setApiKey(k);
        }}
      />
    );
  }

  function handleChangeApiKey() {
    storage.clearApiKey();
    setApiKey('');
  }

  function handleResetAll() {
    storage.resetAll();
    setProfile(storage.getProfile());
    setPlanText(storage.getPlanText());
    setSchedule(storage.getSchedule());
    setLog(storage.getLog());
    setVoiceNotes(storage.getVoiceNotes());
    setChats(storage.getChats());
    setMilestones(storage.getMilestones());
    setView('home');
    setActiveCoach('');
  }

  function handleDataImported() {
    setProfile(storage.getProfile());
    setPlanText(storage.getPlanText());
    setSchedule(storage.getSchedule());
    setLog(storage.getLog());
    setVoiceNotes(storage.getVoiceNotes());
    setChats(storage.getChats());
    setMilestones(storage.getMilestones());
  }

  function applyWeekPlan(parsed) {
    const weekStarts = parsed.weekStarts || '';
    if (!weekStarts) {
      window.alert(
        "Kira didn't include a valid week start date. Ask her to re-send with a weekStarts in the FORGE-WEEKPLAN block.",
      );
      return;
    }
    const next = { ...schedule };
    DAY_ORDER.forEach((d, idx) => {
      const session = (parsed[d] || '').trim();
      if (!session) return;
      const dateKey = addDays(weekStarts, idx);
      const existing = next[dateKey] || {};
      next[dateKey] = { ...existing, session };
    });
    storage.setSchedule(next);
    setSchedule(next);
    window.alert(
      `Applied — your Plan tab now shows Kira's week of ${weekStarts}. Existing sessions on other dates are untouched.`,
    );
  }

  function applyMilestones(parsed) {
    const existing = storage.getMilestones();
    const next = [...existing, ...parsed];
    storage.setMilestones(next);
    setMilestones(next);
    window.alert(`Added ${parsed.length} milestones. See Plan → Milestones.`);
  }

  function applyProfileUpdates(updates) {
    if (!updates || !Object.keys(updates).length) return;
    const current = storage.getProfile();
    const next = { ...current, ...updates };
    storage.setProfile(next);
    setProfile(next);
  }

  function openCoach(id) {
    setActiveCoach(id);
    setView('coaches');
  }

  function setCoachMessages(coachId, msgs) {
    const next = { ...chats, [coachId]: msgs };
    setChats(next);
    storage.setChats(next);
  }

  function clearCoachChat(coachId) {
    const next = { ...chats };
    delete next[coachId];
    setChats(next);
    storage.setChats(next);
  }

  function savePlanFromMessage(text) {
    setPlanText(text);
    storage.setPlanText(text);
    window.alert('Saved — the plan is now on the Plan tab and every coach can see it.');
  }

  const coach = activeCoach ? COACHES[activeCoach] : null;
  const activeMessages = useMemo(
    () => (coach ? chats[coach.id] || [] : []),
    [chats, coach],
  );

  let body;
  let mobileTitle = 'FORGE';
  let mobileLeft = null;
  let mobileRight = <SettingsGear onClick={() => setView('settings')} />;
  const desktopShowCoachList = view === 'coaches';

  if (view === 'settings') {
    body = (
      <SettingsView
        voiceNotes={voiceNotes}
        onVoiceNotesChange={(v) => {
          setVoiceNotes(v);
          storage.setVoiceNotes(v);
        }}
        onChangeApiKey={handleChangeApiKey}
        onResetAll={handleResetAll}
        onDataImported={handleDataImported}
      />
    );
    mobileTitle = 'SETTINGS';
    mobileRight = (
      <button
        onClick={() => setView('home')}
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-mid)',
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.18em',
          cursor: 'pointer',
        }}
      >
        DONE
      </button>
    );
  } else if (view === 'home') {
    body = (
      <HomeView
        profile={profile}
        planText={planText}
        schedule={schedule}
        log={log}
        hasApiKey={!!apiKey}
        onGoTo={(v) => setView(v)}
        onOpenCoach={(id) => openCoach(id)}
      />
    );
  } else if (view === 'plan') {
    body = (
      <PlanView
        planText={planText}
        onPlanTextChange={setPlanText}
        schedule={schedule}
        onScheduleChange={setSchedule}
        log={log}
        onLogChange={setLog}
        milestones={milestones}
        onMilestonesChange={setMilestones}
        onAskFelix={() => openCoach('racePlanning')}
        onAskKira={() => openCoach('headCoach')}
      />
    );
  } else if (view === 'log') {
    body = <LogView log={log} onLogChange={setLog} />;
  } else if (view === 'profile') {
    body = (
      <ProfileView
        profile={profile}
        onProfileChange={setProfile}
        onAskKira={() => openCoach('headCoach')}
      />
    );
  } else if (view === 'coaches') {
    if (!coach) {
      body = <CoachPicker onSelect={openCoach} hasApiKey={!!apiKey} />;
      mobileTitle = 'COACHES';
    } else {
      mobileTitle = `${coach.emoji} ${coach.specialist.replace('The ', '').toUpperCase()}`;
      mobileLeft = (
        <button
          onClick={() => setActiveCoach('')}
          aria-label="Back to coaches"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            color: 'var(--text)',
            background: 'transparent',
            border: '1px solid var(--border)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      );

      body = (
        <>
          {!isMobile && (
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
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: coach.accentDim,
                  border: `1px solid ${coach.accentBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                {coach.emoji}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.08em', color: 'var(--text)', lineHeight: 1 }}>
                  {coach.specialist.toUpperCase()}
                </h1>
                <div style={{ fontStyle: 'italic', fontSize: 14, color: coach.accentColor, marginTop: 4 }}>
                  {coach.tagline}
                </div>
              </div>
            </header>
          )}
          <ChatWindow
            key={coach.id}
            coach={coach}
            apiKey={apiKey}
            messages={activeMessages}
            onMessagesChange={(m) => setCoachMessages(coach.id, m)}
            profile={profile}
            planText={planText}
            schedule={schedule}
            log={log}
            voiceNote={voiceNotes[coach.id]}
            milestones={milestones}
            onSavePlanFromMessage={savePlanFromMessage}
            onApplyWeekPlan={applyWeekPlan}
            onApplyMilestones={applyMilestones}
            onApplyProfileUpdates={applyProfileUpdates}
            onClearChat={() => clearCoachChat(coach.id)}
          />
        </>
      );
    }
  }

  if (!isMobile) {
    return (
      <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
        <DesktopSidebar
          view={view}
          onNav={(v) => {
            setView(v);
            if (v !== 'coaches') setActiveCoach('');
          }}
          onSettings={() => setView('settings')}
          activeCoach={activeCoach}
          onSelectCoach={openCoach}
          showCoaches={desktopShowCoachList}
          navItems={DESKTOP_NAV}
        />
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
          {body}
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      <MobileHeader title={mobileTitle} right={mobileRight} left={mobileLeft} />
      <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {body}
      </main>
      {view !== 'settings' && !(view === 'coaches' && coach) && (
        <MobileBottomNav
          view={view}
          onNav={(v) => {
            setView(v);
            if (v !== 'coaches') setActiveCoach('');
          }}
        />
      )}
    </div>
  );
}
