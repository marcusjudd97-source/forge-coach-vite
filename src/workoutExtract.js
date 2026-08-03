// Screenshot → structured workout. The athlete photographs/screenshots a
// completed workout (Apple Fitness, Garmin, Zwift, Strava…) and Claude's
// vision pulls out the numbers to prefill a log entry.

import { storage, todayIso } from './storage.js';

async function fileToResizedJpegBase64(file, maxDim = 1400) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read that image.'));
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractWorkoutFromImage(file) {
  const apiKey = storage.getApiKey();
  if (!apiKey) throw new Error('No API key set on this device.');
  const base64 = await fileToResizedJpegBase64(file);

  const prompt = `This image is a screenshot or photo of a COMPLETED workout — from Apple Fitness/Watch, Garmin, Wahoo, Zwift, Strava, a gym machine display, or similar.

Extract what is visible and reply with ONLY a JSON object, no other text:
{
  "date": "YYYY-MM-DD or null if not visible (today is ${todayIso()}; resolve 'Yesterday' etc. from that)",
  "discipline": "swim" | "bike" | "run" | "strength" | "brick" | "other",
  "durationMin": number or null (total moving/elapsed minutes, rounded),
  "distanceKm": number or null,
  "avgHr": number or null,
  "avgPower": number or null,
  "summary": "one plain-English line with the key stats, e.g. 'Pool swim 2.1km in 44min, avg HR 138'"
}
Use null for anything not visible. Do not invent numbers.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 160)}` : ''}`);
  }
  const data = await res.json();
  const reply = (data.content || [])
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('\n');
  const jsonMatch = reply.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Couldn't read a workout from that image.");
  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Couldn't read a workout from that image.");
  }
  return {
    date: typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null,
    discipline: ['swim', 'bike', 'run', 'strength', 'brick', 'other'].includes(parsed.discipline)
      ? parsed.discipline
      : 'other',
    durationMin: Number(parsed.durationMin) || null,
    distanceKm: Number(parsed.distanceKm) || null,
    avgHr: Number(parsed.avgHr) || null,
    avgPower: Number(parsed.avgPower) || null,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
  };
}
