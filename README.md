# 🔥 FORGE — Ironman Coaching Suite

A dark-luxury personal coaching PWA with six specialist Claude-powered coaches for the 140.6 journey. Built with React + Vite. Runs entirely in the browser — your API key is stored in your own browser, and requests go direct to Anthropic.

## The Team

| Coach             | Specialist          | Accent  | What they're for                                        |
| ----------------- | ------------------- | ------- | ------------------------------------------------------- |
| 🧭 Coach Kira     | Head Coach          | Pink    | Master plan, weekly sessions, the daily conversation    |
| 🏊 Coach Marina   | Swim                | Blue    | Open water, mass starts, pacing the 3.8km opener        |
| 🚴 Coach Declan   | Cycling             | Gold    | FTP, IF, TSS, on-bike nutrition, "not too hard"         |
| 🏃 Coach Amara    | Running             | Amber   | Running off the bike, the marathon that begins at 180km |
| 🥗 Coach Petra    | Nutrition           | Green   | Carbs/hr, sodium, carb-load, meal prep, food diary events |
| 🗺️ Coach Felix    | Race Planning       | Violet  | Course specifics, T1/T2 bags, taper, race-week logistics |
| 🧠 Coach Soren    | Mental Preparation  | Teal    | Dark moments, mantras, fear, visualisation, affirmations |
| 🔁 Coach Wren     | Habits              | Orange  | Habit design, streaks, systems — Atomic Habits methodology |

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

On first launch you'll be asked for an Anthropic API key (get one at
[console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)).
The key is validated with a single ping to `api.anthropic.com` and then stored
in `localStorage` on your device only.

## Deploy

### GitHub

```bash
git init
git add .
git commit -m "Initial commit — FORGE"
git branch -M main
gh repo create forge-coach --public --source=. --remote=origin --push
```

Or manually:

1. Create a new public repo at [github.com/new](https://github.com/new) named `forge-coach`.
2. `git remote add origin https://github.com/<your-username>/forge-coach.git`
3. `git push -u origin main`

### Vercel

Fastest path (CLI):

```bash
npm i -g vercel
vercel --prod --yes
```

Or via the dashboard:

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the `forge-coach` repo.
3. Click **Deploy** — Vite is auto-detected. No env vars needed.

## Sync across devices (optional)

FORGE can sync everything except your API key (profile, plan, schedule, log,
chats, voice notes) between devices via a free [Supabase](https://supabase.com)
project you own. Sign in with the same email + password on PC and phone and
they stay in sync automatically.

One-time setup (~5 minutes):

1. Create a free account at [supabase.com](https://supabase.com) and click **New project**
   (any name, e.g. `forge`; pick a strong database password — you won't need it day-to-day).
2. In the project, open **SQL Editor**, paste this, and click **Run**:

   ```sql
   create table forge_data (
     user_id uuid not null references auth.users(id) on delete cascade,
     key text not null,
     value jsonb,
     updated_at timestamptz not null default now(),
     primary key (user_id, key)
   );

   alter table forge_data enable row level security;

   create policy "Users manage own data" on forge_data
     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```

3. (Optional, recommended for personal use) **Authentication → Sign In / Up →
   Email** — turn OFF "Confirm email" so you can sign in immediately without a
   confirmation email.
4. Go to **Project Settings → API Keys**: copy the **Project URL** and the
   **anon public** key.
5. Paste both into `src/syncConfig.js` (`HARDCODED_URL` / `HARDCODED_ANON_KEY`),
   commit and push — Vercel redeploys automatically. (Or set
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars in Vercel instead.)
6. In FORGE: **Settings → Account & sync → CREATE ACCOUNT**, then sign in with
   the same account on every device.

The anon key is safe to commit — it's designed to be public, and Row Level
Security means each signed-in user can only ever touch their own rows.

Sync rules: last write wins per record type; the app pulls on launch, on tab
focus, and when you come back online, and pushes a moment after every change.
Signing out stops syncing but leaves local data in place. The Anthropic API
key is **never** synced — enter it once per device (Settings → API key →
COPY KEY makes that easy).

## Calendar / Outlook

- **Plan tab → 📅 Outlook** on any session opens Outlook web with an all-day
  event prefilled — one click to save.
- **Plan tab → 📅 ADD ALL TO CALENDAR** downloads a `.ics` file with every
  upcoming planned session as an all-day event. Import it into Outlook
  (File → Open & Export → Import on desktop, or drag into Outlook web),
  Apple Calendar, or Google Calendar. Re-importing after plan changes updates
  events rather than duplicating them (stable event IDs).

## Install on iPhone (Add to Home Screen)

1. Open the deployed Vercel URL **in Safari** (must be Safari — Chrome on iOS cannot install a PWA).
2. Tap the Share icon at the bottom of the screen.
3. Tap **Add to Home Screen**.
4. Name it "FORGE" and tap Add.

FORGE will launch as a full-screen PWA with the black status bar, no browser chrome, and the fire icon on your home screen.

## Security

- The Anthropic API key is **never** sent to any server other than `api.anthropic.com`.
- It lives only in `localStorage` in the browser that entered it. Clear the browser data (or tap **Change API Key**) to remove it.
- Anthropic billing for all requests goes to the account that owns the key.
- Because the app runs in a browser, the key is present in JavaScript memory while the page is open. This is personal software — don't share your key with other people you don't want billing on your account.

## Stack

- React 19 + Vite 8
- Anthropic Messages API (`claude-sonnet-4-20250514` for coaching, `claude-haiku-20240307` for the key validation ping)
- Optional Supabase (auth + Postgres) for cross-device sync — without it, no backend, no database, no cookies
