import { useEffect, useRef, useState } from 'react';
import { buildAthleteContext, buildSystemPrompt } from './context.js';
import {
  hasWeekBlock,
  hasMilestonesBlock,
  hasProfileBlock,
  parseWeekBlock,
  parseMilestonesBlock,
  parseProfileBlock,
  stripForgeBlocks,
} from './parsers.js';

function formatMessage(text, accentColor) {
  if (!text) return [];

  function renderInline(str, keyPrefix) {
    const parts = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let m;
    let i = 0;
    while ((m = regex.exec(str)) !== null) {
      if (m.index > lastIndex) {
        parts.push(str.slice(lastIndex, m.index));
      }
      parts.push(
        <strong key={`${keyPrefix}-b-${i++}`} style={{ color: accentColor, fontWeight: 600 }}>
          {m[1]}
        </strong>,
      );
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex));
    return parts;
  }

  const lines = text.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      out.push(<div key={`sp-${i}`} style={{ height: 8 }} />);
      i++;
      continue;
    }

    const isBullet = /^(-|•)\s+/.test(trimmed);
    const isNum = /^\d+\.\s+/.test(trimmed);

    if (isBullet) {
      const items = [];
      while (i < lines.length && /^(-|•)\s+/.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^(-|•)\s+/, '');
        items.push(
          <li key={`li-${i}`} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            <span style={{ color: accentColor, flexShrink: 0 }}>—</span>
            <span>{renderInline(content, `li-${i}`)}</span>
          </li>,
        );
        i++;
      }
      out.push(
        <ul key={`ul-${out.length}`} style={{ listStyle: 'none', padding: 0, margin: '4px 0 8px 0' }}>
          {items}
        </ul>,
      );
      continue;
    }

    if (isNum) {
      const items = [];
      let n = 1;
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push(
          <li key={`ol-${i}`} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            <span style={{ color: accentColor, flexShrink: 0, minWidth: 20 }}>{n}.</span>
            <span>{renderInline(content, `ol-${i}`)}</span>
          </li>,
        );
        n++;
        i++;
      }
      out.push(
        <ol key={`ol-${out.length}`} style={{ listStyle: 'none', padding: 0, margin: '4px 0 8px 0' }}>
          {items}
        </ol>,
      );
      continue;
    }

    out.push(
      <div key={`p-${i}`} style={{ marginBottom: 4 }}>
        {renderInline(line, `p-${i}`)}
      </div>,
    );
    i++;
  }

  return out;
}

export default function ChatWindow({
  coach,
  apiKey,
  messages,
  onMessagesChange,
  profile,
  planText,
  schedule,
  log,
  voiceNote,
  milestones,
  onSavePlanFromMessage,
  onApplyWeekPlan,
  onApplyMilestones,
  onApplyProfileUpdates,
  onClearChat,
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const started = (messages || []).length > 0;
  const isFelix = coach.id === 'racePlanning';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-apply profile updates from the latest assistant message (silent)
  useEffect(() => {
    if (!onApplyProfileUpdates) return;
    const arr = messages || [];
    if (!arr.length) return;
    const last = arr[arr.length - 1];
    if (!last || last.role !== 'assistant') return;
    if (!hasProfileBlock(last.content)) return;
    const updates = parseProfileBlock(last.content);
    if (updates) onApplyProfileUpdates(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    const next = Math.min(140, textareaRef.current.scrollHeight);
    textareaRef.current.style.height = `${next}px`;
  }, [input]);

  function buildSystem() {
    const ctx = buildAthleteContext({
      profile,
      planText,
      schedule,
      log,
      voiceNote,
      milestones,
    });
    return buildSystemPrompt(coach.systemPrompt, ctx);
  }

  async function callClaude(history) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1600,
        system: buildSystem(),
        messages: history,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ''}`);
    }
    const data = await res.json();
    const parts = Array.isArray(data.content) ? data.content : [];
    return parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('\n')
      .trim();
  }

  async function sendMessage(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const newHistory = [...(messages || []), { role: 'user', content }];
    onMessagesChange(newHistory);
    setInput('');
    setLoading(true);

    try {
      const reply = await callClaude(newHistory);
      onMessagesChange([...newHistory, { role: 'assistant', content: reply || '…' }]);
    } catch (err) {
      onMessagesChange([
        ...newHistory,
        {
          role: 'assistant',
          content: `**Connection error.** ${err.message || String(err)}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setLoading(true);
    const greetingPrompt =
      "Please introduce yourself as my coach on the FORGE team. Read my athlete profile in your system context carefully. If my profile is empty or missing crucial pieces, ask the onboarding questions you need in order to start coaching me well. If my profile is well-filled, acknowledge what you've read about me and dive straight into useful coaching — don't re-ask questions I've already answered. Keep the opening message tight and warm.";
    const newHistory = [{ role: 'user', content: greetingPrompt }];
    onMessagesChange(newHistory);
    try {
      const reply = await callClaude(newHistory);
      onMessagesChange([...newHistory, { role: 'assistant', content: reply || '…' }]);
    } catch (err) {
      onMessagesChange([
        ...newHistory,
        {
          role: 'assistant',
          content: `**Connection error.** ${err.message || String(err)}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const accent = coach.accentColor;

  // Landing state
  if (!started) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 560,
            textAlign: 'center',
            animation: 'fadeUp 480ms ease both',
          }}
        >
          <div
            style={{
              fontSize: 72,
              marginBottom: 18,
              filter: `drop-shadow(0 8px 22px ${coach.accentBorder})`,
              lineHeight: 1,
            }}
          >
            {coach.emoji}
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 7vw, 44px)',
              letterSpacing: '0.08em',
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            {coach.specialist.toUpperCase()}
          </h2>
          <div
            style={{
              fontSize: 15,
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
              marginBottom: 14,
            }}
          >
            {coach.name}
          </div>
          <p
            style={{
              fontStyle: 'italic',
              fontSize: 17,
              color: accent,
              marginBottom: 28,
              fontFamily: 'var(--font-body)',
            }}
          >
            “{coach.tagline}”
          </p>

          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              borderRadius: 14,
              background: coach.gradient,
              color: '#0a0a0f',
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              letterSpacing: '0.18em',
              fontWeight: 600,
              marginBottom: 28,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'OPENING…' : 'START SESSION →'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coach.suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(p)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: `1px solid ${coach.accentBorder}`,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  fontStyle: 'italic',
                  textAlign: 'left',
                  cursor: loading ? 'wait' : 'pointer',
                  transition: 'background 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = coach.accentDim;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chat state
  const lastAssistant = [...(messages || [])].reverse().find((m) => m.role === 'assistant');
  const lastAssistantContent = lastAssistant?.content || '';
  const showSavePlanBtn =
    (isFelix || coach.id === 'headCoach') &&
    lastAssistantContent &&
    lastAssistantContent.length > 200;
  const showApplyWeekBtn = hasWeekBlock(lastAssistantContent);
  const showApplyMilestonesBtn = hasMilestonesBlock(lastAssistantContent);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {(showSavePlanBtn || showApplyWeekBtn || showApplyMilestonesBtn || messages.length > 0) && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '8px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg2)',
            flexWrap: 'wrap',
          }}
        >
          {showApplyWeekBtn && onApplyWeekPlan && (
            <button
              onClick={() => {
                const parsed = parseWeekBlock(lastAssistantContent);
                if (parsed) onApplyWeekPlan(parsed);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: coach.accentDim,
                border: `1px solid ${coach.accentBorder}`,
                color: coach.accentColor,
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.18em',
                cursor: 'pointer',
              }}
            >
              APPLY TO MY PLAN
            </button>
          )}
          {showApplyMilestonesBtn && onApplyMilestones && (
            <button
              onClick={() => {
                const parsed = parseMilestonesBlock(lastAssistantContent);
                if (parsed && parsed.length) onApplyMilestones(parsed);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: coach.accentDim,
                border: `1px solid ${coach.accentBorder}`,
                color: coach.accentColor,
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.18em',
                cursor: 'pointer',
              }}
            >
              APPLY MILESTONES
            </button>
          )}
          {showSavePlanBtn && (
            <button
              onClick={() => onSavePlanFromMessage(stripForgeBlocks(lastAssistantContent))}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'transparent',
                border: `1px solid ${coach.accentBorder}`,
                color: coach.accentColor,
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.18em',
                cursor: 'pointer',
              }}
            >
              SAVE LAST REPLY AS PLAN
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(`Clear your conversation with ${coach.name}? This cannot be undone.`)) {
                onClearChat();
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.18em',
              cursor: 'pointer',
            }}
          >
            CLEAR CHAT
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '20px 18px 12px',
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {messages.map((m, idx) => {
            // Hide the first synthetic greeting prompt — it's a scaffolding message
            if (idx === 0 && m.role === 'user' && m.content.startsWith('Please introduce yourself')) {
              return null;
            }
            if (m.role === 'user') {
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '11px 15px',
                      borderRadius: '14px 14px 2px 14px',
                      background: coach.gradient,
                      color: '#0a0a0f',
                      fontFamily: 'var(--font-body)',
                      fontSize: 16,
                      lineHeight: 1.5,
                      animation: 'fadeUp 300ms ease both',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            }
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  animation: 'fadeUp 300ms ease both',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: coach.accentDim,
                    border: `1px solid ${coach.accentBorder}`,
                    fontSize: 18,
                  }}
                >
                  {coach.emoji}
                </div>
                <div
                  style={{
                    maxWidth: 'calc(100% - 50px)',
                    padding: '11px 15px',
                    borderRadius: '14px 14px 14px 2px',
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 16,
                    lineHeight: 1.55,
                    wordBreak: 'break-word',
                  }}
                >
                  {formatMessage(stripForgeBlocks(m.content), accent)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: coach.accentDim,
                  border: `1px solid ${coach.accentBorder}`,
                  fontSize: 18,
                }}
              >
                {coach.emoji}
              </div>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px 14px 14px 2px',
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: accent,
                      animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && messages.length >= 2 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                paddingTop: 6,
              }}
            >
              {coach.suggestedPrompts.slice(0, 3).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(p)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 999,
                    background: 'transparent',
                    border: `1px solid ${coach.accentBorder}`,
                    color: 'var(--text-mid)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    fontStyle: 'italic',
                    cursor: 'pointer',
                    transition: 'background 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = coach.accentDim;
                    e.currentTarget.style.color = 'var(--text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-mid)';
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg2)',
          padding: `12px 14px calc(12px + var(--safe-bottom))`,
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Message ${coach.name}…`}
            disabled={loading}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 140,
              padding: '11px 14px',
              borderRadius: 14,
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 16,
              lineHeight: 1.45,
              fontFamily: 'var(--font-body)',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send"
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: input.trim() ? coach.gradient : 'var(--bg3)',
              color: input.trim() ? '#0a0a0f' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              transition: 'background 150ms ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
