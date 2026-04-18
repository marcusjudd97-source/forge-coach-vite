import { DAY_ORDER, dayLabel, daysUntil, todayKey } from './storage.js';
import { Section, GoldButton, GhostButton, ViewHeader, ViewBody } from './ui.jsx';
import { COACHES, COACH_ORDER } from './coaches.js';

function hasMasterPlan(planText) {
  return !!(planText && planText.trim().length > 40);
}

function hasWeekSet(weekPlan) {
  return DAY_ORDER.some((d) => weekPlan?.[d]?.trim());
}

function summariseLog(log) {
  if (!log.length) return null;
  const last7 = log.filter((e) => {
    const d = new Date(e.date);
    const diff = (Date.now() - d.getTime()) / 86400000;
    return diff <= 7;
  });
  const byDisc = {};
  let totalMin = 0;
  for (const e of last7) {
    const disc = e.discipline || 'other';
    byDisc[disc] = (byDisc[disc] || 0) + (Number(e.durationMin) || 0);
    totalMin += Number(e.durationMin) || 0;
  }
  return { totalMin, byDisc, count: last7.length };
}

export default function HomeView({
  profile,
  planText,
  weekPlan,
  log,
  onGoTo,
  onOpenCoach,
  hasApiKey,
}) {
  const today = todayKey();
  const todayIdx = DAY_ORDER.indexOf(today);
  const next3 = [];
  for (let i = 0; i < 3; i++) {
    const k = DAY_ORDER[(todayIdx + i) % 7];
    next3.push({ key: k, text: weekPlan[k] || '' });
  }
  const race = profile?.targetRaceName;
  const raceDate = profile?.targetRaceDate;
  const days = daysUntil(raceDate);
  const summary = summariseLog(log || []);

  const profileFilled =
    profile && (profile.name || profile.targetRaceName || profile.weightKg);

  return (
    <>
      <ViewHeader
        title={`WELCOME${profile?.name ? ', ' + profile.name.toUpperCase() : ''}`}
        subtitle="Today's focus, your coaches, and your history in one place."
      />
      <ViewBody>
        {race && days != null && days >= 0 && (
          <Section>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.22em',
                    fontSize: 11,
                    color: 'var(--text-dim)',
                  }}
                >
                  RACE COUNTDOWN
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 44,
                    letterSpacing: '0.06em',
                    lineHeight: 1,
                    background: 'linear-gradient(180deg, #f5e8c8 0%, #c8922a 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                    marginTop: 6,
                  }}
                >
                  {days} DAYS
                </div>
                <div style={{ color: 'var(--text-mid)', marginTop: 6, fontSize: 15 }}>
                  until <strong style={{ color: 'var(--text)' }}>{race}</strong>
                  {raceDate ? ` — ${raceDate}` : ''}
                </div>
              </div>
              {profile?.targetFinishTime && (
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.22em',
                      fontSize: 11,
                      color: 'var(--text-dim)',
                    }}
                  >
                    GOAL
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 24,
                      color: 'var(--gold)',
                      marginTop: 4,
                    }}
                  >
                    {profile.targetFinishTime}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {!profileFilled && (
          <Section title="Start here">
            <div style={{ color: 'var(--text-mid)', marginBottom: 14, fontSize: 15 }}>
              Before the coaches can write you a genuine plan, they need to know you. The profile takes
              about 5 minutes and feeds every single conversation from now on.
            </div>
            <GoldButton onClick={() => onGoTo('profile')}>BUILD YOUR PROFILE →</GoldButton>
          </Section>
        )}

        {profileFilled && !hasMasterPlan(planText) && (
          <Section title="Next step — the long view">
            <div style={{ color: 'var(--text-mid)', marginBottom: 14, fontSize: 15 }}>
              Your profile's in. Now ask Felix to draft your master plan — the 104-week periodised
              document that every other coach reads.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <GoldButton onClick={() => onOpenCoach('racePlanning')}>
                TALK TO FELIX →
              </GoldButton>
              <GhostButton onClick={() => onGoTo('plan')}>OPEN PLAN EDITOR</GhostButton>
            </div>
          </Section>
        )}

        {profileFilled && hasMasterPlan(planText) && !hasWeekSet(weekPlan) && (
          <Section title="Next step — this week">
            <div style={{ color: 'var(--text-mid)', marginBottom: 14, fontSize: 15 }}>
              Master plan is saved. Now ask <strong style={{ color: 'var(--gold)' }}>Kira (Head Coach)</strong> to
              turn it into your actual Mon–Sun sessions — reading your fitness, your last 10 log entries
              and whatever is happening in your life this week.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <GoldButton onClick={() => onOpenCoach('headCoach')}>
                TALK TO KIRA →
              </GoldButton>
              <GhostButton onClick={() => onGoTo('plan')}>EDIT WEEK MANUALLY</GhostButton>
            </div>
          </Section>
        )}

        <Section title="Next 3 days">
          {next3.every((d) => !d.text) ? (
            <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
              No sessions set for the next three days. Edit the week on the Plan tab, or ask one of your
              coaches for ideas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {next3.map((d, idx) => (
                <div
                  key={d.key}
                  style={{
                    border: `1px solid ${idx === 0 ? 'rgba(200, 146, 42, 0.45)' : 'var(--border)'}`,
                    background: idx === 0 ? 'rgba(200, 146, 42, 0.08)' : 'var(--bg3)',
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.18em',
                      fontSize: 12,
                      color: idx === 0 ? 'var(--gold)' : 'var(--text-mid)',
                      marginBottom: 6,
                    }}
                  >
                    {idx === 0 ? 'TODAY' : idx === 1 ? 'TOMORROW' : dayLabel(d.key).toUpperCase()} ·{' '}
                    {dayLabel(d.key)}
                  </div>
                  <div
                    style={{
                      color: d.text ? 'var(--text)' : 'var(--text-dim)',
                      fontSize: 15,
                      lineHeight: 1.45,
                      whiteSpace: 'pre-wrap',
                      fontStyle: d.text ? 'normal' : 'italic',
                    }}
                  >
                    {d.text || 'Nothing set.'}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <GhostButton onClick={() => onGoTo('plan')}>EDIT WEEK</GhostButton>
            <GhostButton onClick={() => onGoTo('log')}>LOG A SESSION</GhostButton>
          </div>
        </Section>

        {summary && summary.count > 0 && (
          <Section title="Last 7 days">
            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                color: 'var(--text)',
                fontSize: 15,
              }}
            >
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Sessions: </span>
                <strong>{summary.count}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Total: </span>
                <strong>{Math.round(summary.totalMin / 60 * 10) / 10}h</strong>
              </div>
              {Object.entries(summary.byDisc).map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: 'var(--text-dim)' }}>{k}: </span>
                  <strong>{Math.round(v)}m</strong>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Your six coaches">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 10,
            }}
          >
            {COACH_ORDER.map((id) => {
              const c = COACHES[id];
              return (
                <button
                  key={id}
                  onClick={() => onOpenCoach(id)}
                  disabled={!hasApiKey}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: c.accentDim,
                    border: `1px solid ${c.accentBorder}`,
                    textAlign: 'left',
                    cursor: hasApiKey ? 'pointer' : 'default',
                    opacity: hasApiKey ? 1 : 0.5,
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      letterSpacing: '0.12em',
                      color: c.accentColor,
                    }}
                  >
                    {c.name.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-mid)',
                      fontStyle: 'italic',
                      marginTop: 4,
                      lineHeight: 1.3,
                    }}
                  >
                    {c.specialist.replace('The ', '')}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>
      </ViewBody>
    </>
  );
}
