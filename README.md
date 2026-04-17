# 🔥 FORGE — Ironman Coaching Suite

A dark-luxury personal coaching PWA with six specialist Claude-powered coaches for the 140.6 journey. Built with React + Vite. Runs entirely in the browser — your API key is stored in your own browser, and requests go direct to Anthropic.

## The Six

| Coach             | Specialist          | Accent  | What they're for                                        |
| ----------------- | ------------------- | ------- | ------------------------------------------------------- |
| 🏊 Coach Marina   | Swim                | Blue    | Open water, mass starts, pacing the 3.8km opener        |
| 🚴 Coach Declan   | Cycling             | Gold    | FTP, IF, TSS, on-bike nutrition, "not too hard"         |
| 🏃 Coach Amara    | Running             | Amber   | Running off the bike, the marathon that begins at 180km |
| 🥗 Coach Petra    | Nutrition           | Green   | Carbs/hr, sodium, carb-load, race-morning breakfast     |
| 🗺️ Coach Felix    | Race Planning       | Violet  | Course specifics, T1/T2 bags, taper, race-week logistics |
| 🧠 Coach Soren    | Mental Preparation  | Teal    | Dark moments, mantras, fear, visualisation              |

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
- No backend, no database, no cookies
