import { useRef, useState } from 'react';
import { storage } from './storage.js';
import { COACHES, COACH_ORDER } from './coaches.js';
import {
  Section,
  Field,
  TextArea,
  GoldButton,
  GhostButton,
  ViewHeader,
  ViewBody,
} from './ui.jsx';

export default function SettingsView({
  voiceNotes,
  onVoiceNotesChange,
  onChangeApiKey,
  onResetAll,
  onDataImported,
}) {
  const [draft, setDraft] = useState(voiceNotes);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [keyShown, setKeyShown] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const fileRef = useRef(null);

  const currentKey = storage.getApiKey() || '';
  const maskedKey = currentKey
    ? `${currentKey.slice(0, 12)}${'•'.repeat(Math.max(0, currentKey.length - 16))}${currentKey.slice(-4)}`
    : '';

  async function copyKey() {
    if (!currentKey) return;
    try {
      await navigator.clipboard.writeText(currentKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2200);
    } catch {
      window.prompt('Copy your key manually (Cmd/Ctrl+C):', currentKey);
    }
  }

  function updateVoice(id, v) {
    setDraft((d) => ({ ...d, [id]: v }));
    setVoiceSaved(false);
  }

  function saveVoices() {
    storage.setVoiceNotes(draft);
    onVoiceNotesChange(draft);
    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 2200);
  }

  function exportData() {
    const dump = {
      exportedAt: new Date().toISOString(),
      version: 1,
      profile: storage.getProfile(),
      planText: storage.getPlanText(),
      weekPlan: storage.getWeekPlan(),
      log: storage.getLog(),
      voiceNotes: storage.getVoiceNotes(),
      chats: storage.getChats(),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `forge-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') throw new Error('Not a valid FORGE backup file.');
      if (!window.confirm('Import this file? It will replace your current profile, plan, log, voice notes and chats (but not your API key).')) {
        e.target.value = '';
        return;
      }
      if (data.profile) storage.setProfile(data.profile);
      if (data.planText !== undefined) storage.setPlanText(data.planText);
      if (data.weekPlan) storage.setWeekPlan(data.weekPlan);
      if (data.log) storage.setLog(data.log);
      if (data.voiceNotes) storage.setVoiceNotes(data.voiceNotes);
      if (data.chats) storage.setChats(data.chats);
      onDataImported?.();
      setImportMsg(`Imported backup from ${data.exportedAt || 'unknown date'}.`);
    } catch (err) {
      setImportMsg(`Import failed: ${err.message || err}`);
    } finally {
      e.target.value = '';
    }
  }

  function handleResetAll() {
    if (!window.confirm('Wipe your profile, plan, log, voice notes, and chat histories? Your API key stays. Cannot be undone.')) return;
    storage.resetAll();
    onResetAll();
  }

  return (
    <>
      <ViewHeader title="SETTINGS" subtitle="Voice, backup, and key management." />
      <ViewBody>
        <Section title="Coach voice notes">
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
            Free-text instructions that get injected into each coach's system prompt. Use this to tune
            tone ("be firmer with me," "less jargon," "use more analogies from cricket"). Leave blank to
            keep the default.
          </div>
          {COACH_ORDER.map((id) => {
            const c = COACHES[id];
            return (
              <div key={id} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      letterSpacing: '0.14em',
                      color: c.accentColor,
                    }}
                  >
                    {c.name.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-dim)',
                      fontStyle: 'italic',
                    }}
                  >
                    {c.specialist.replace('The ', '')}
                  </span>
                </div>
                <TextArea
                  rows={2}
                  value={draft[id]}
                  onChange={(v) => updateVoice(id, v)}
                  placeholder={`How would you like ${c.name} to speak to you?`}
                />
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <GoldButton onClick={saveVoices}>{voiceSaved ? 'SAVED ✓' : 'SAVE VOICE NOTES'}</GoldButton>
          </div>
        </Section>

        <Section title="Backup & restore">
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
            FORGE stores everything in this browser. Download a full JSON backup anytime, and restore
            from one on a new device, after clearing cookies, or before re-installing the PWA.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <GoldButton onClick={exportData}>EXPORT JSON BACKUP</GoldButton>
            <GhostButton onClick={handleImportClick}>IMPORT BACKUP</GhostButton>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChosen}
              style={{ display: 'none' }}
            />
          </div>
          {importMsg && (
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: importMsg.startsWith('Import failed') ? '#e8a090' : 'var(--gold)',
              }}
            >
              {importMsg}
            </div>
          )}
        </Section>

        <Section title="API key">
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
            Stored only in this browser. Copy it here to paste into another device (e.g. FORGE on
            your phone). Anthropic only ever shows you the key once on their site — this is how you
            retrieve it afterwards.
          </div>

          {currentKey ? (
            <>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: 13,
                  letterSpacing: '0.02em',
                  marginBottom: 12,
                  wordBreak: 'break-all',
                  userSelect: 'all',
                }}
              >
                {keyShown ? currentKey : maskedKey}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <GhostButton onClick={() => setKeyShown((s) => !s)}>
                  {keyShown ? 'HIDE KEY' : 'SHOW KEY'}
                </GhostButton>
                <GoldButton onClick={copyKey}>{keyCopied ? 'COPIED ✓' : 'COPY KEY'}</GoldButton>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  fontStyle: 'italic',
                  marginBottom: 14,
                }}
              >
                ⚠️ Treat the key like a password. Never paste it into chat or public places.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 14 }}>
              No key stored in this browser yet.
            </div>
          )}

          <GhostButton onClick={onChangeApiKey}>CHANGE / REMOVE API KEY</GhostButton>
        </Section>

        <Section title="Danger zone">
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
            Wipe every FORGE record in this browser — profile, plan, training log, chats, voice notes.
            Your API key stays. Export a backup first if you want to keep anything.
          </div>
          <GhostButton
            onClick={handleResetAll}
            style={{ color: '#e0918a', borderColor: 'rgba(224, 145, 138, 0.4)' }}
          >
            RESET ALL DATA
          </GhostButton>
        </Section>
      </ViewBody>
    </>
  );
}
