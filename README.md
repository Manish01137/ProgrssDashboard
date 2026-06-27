# 🔥 War Room — Discipline & Habit Tracking Dashboard

Your personal command center. Track six daily habits with real targets, keep
streaks alive with freeze tokens, earn XP and badges, and get an AI-powered
weekly review. Mobile-first, installable as a PWA, dark-mode by default.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase
(Postgres + Google Auth) · Recharts · Anthropic API**. Deploys to **Vercel**.

---

## ✨ Features

- **Daily logging** — tap to mark habits done, enter quantities, navigate to any past day. Auto-saves.
- **Six tracked habits with targets** — DSA problems, gym minutes, freelance hours, sleep hours, clean eating (y/n), overall discipline (y/n).
- **Streaks** — per-habit and overall, with Duolingo-style **freeze tokens** so one missed day doesn't reset everything.
- **GitHub-style contribution heatmap** — 90d / 180d / 1-year views.
- **Stats** — current & best streak, weekly completion %, total days logged, **XP + level system** (perfect days give a bonus).
- **Weekly Review** — sends your last 7 days to Claude (`claude-sonnet-4-6`) and returns what you're crushing, what you're skipping, and one concrete suggestion. Runs **server-side only**.
- **Countdown banner** — days until August 1.
- **Charts** — completion trend over time + per-habit weekly bars (Recharts).
- **Freelance project tracker** — name, deadline, status, hours, earnings.
- **Milestone badges** — 7/30-day streaks, 100/500 DSA, gym, earnings, perfect days, and more.
- **Dark mode default + light toggle**, smooth transitions, installable PWA.

---

## 🗂 Project structure

```
.
├── schema.sql                 # paste into the Supabase SQL editor
├── .env.example               # every required env var
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # service worker (installability + offline shell)
│   └── icon.svg               # app icon
└── src/
    ├── middleware.ts          # refreshes session, gates protected routes
    ├── types/                 # shared TypeScript types
    ├── lib/
    │   ├── supabase/          # browser + server clients, middleware helper
    │   ├── habits.ts          # the 6 habits + targets + XP values (edit me!)
    │   ├── dates.ts           # date helpers
    │   ├── streaks.ts         # streak + freeze-token logic
    │   ├── xp.ts              # XP + level curve
    │   ├── badges.ts          # milestone badge definitions
    │   └── useDashboard.ts    # client hook: loads logs + profile, saves
    ├── components/            # Nav, HabitCard, Heatmap, Charts, Badges, etc.
    └── app/
        ├── layout.tsx         # root layout (fonts, theme, PWA, SW register)
        ├── login/             # Google sign-in screen
        ├── auth/callback/     # OAuth code → session exchange
        ├── api/weekly-review/ # server-side Anthropic call
        └── (app)/             # authed area: / (today), /stats, /projects
```

Targets, XP values, and habit definitions live in [`src/lib/habits.ts`](src/lib/habits.ts) —
edit that one file to tune the app to your goals.

---

## 🚀 Setup — step by step

### Prerequisites

- Node.js 18.18+ (20+ recommended) and npm
- A free [Supabase](https://supabase.com) account
- A [Google Cloud](https://console.cloud.google.com) account (for OAuth)
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

---

### 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**. Pick a name, a strong database password, and a region close to you.
2. Wait ~2 minutes for it to provision.

### 2. Create the database tables

1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open [`schema.sql`](schema.sql) from this repo, copy the **entire** file, paste it in, and click **Run**.
3. You should see "Success". This creates the `profiles`, `habit_logs`, and `projects` tables, plus Row Level Security so each user can only ever see their own data.

### 3. Get your Supabase API keys

1. Go to **Project Settings → API**.
2. Copy the **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy the **`anon` / `public`** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 4. Set up Google authentication

**a) Create Google OAuth credentials**

1. Go to <https://console.cloud.google.com> → create/select a project.
2. **APIs & Services → OAuth consent screen** → choose **External** → fill in app name, your email, save. (You can leave it in "Testing" mode and add your own email as a test user.)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Under **Authorized redirect URIs**, add your Supabase callback URL:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (Find `<your-project-ref>` in your Supabase URL, e.g. `abcdefgh`.)
6. Click **Create** and copy the **Client ID** and **Client secret**.

**b) Enable Google in Supabase**

1. In Supabase: **Authentication → Sign In / Providers → Google** → toggle **Enabled**.
2. Paste the **Client ID** and **Client Secret** from Google. Save.
3. In Supabase **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000` (for local dev; update to your Vercel URL after deploy)
   - **Redirect URLs**: add both `http://localhost:3000/**` and (later) `https://your-app.vercel.app/**`

### 5. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ `ANTHROPIC_API_KEY` has **no** `NEXT_PUBLIC_` prefix on purpose — it must stay
> server-side and is only ever read inside the `/api/weekly-review` route.

### 6. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, sign in with Google, and start logging.

---

## ☁️ Deploy to Vercel

1. Push this project to a GitHub repo.
2. Go to <https://vercel.com/new> and **import** the repo. Vercel auto-detects Next.js — no config needed.
3. Before deploying, add **Environment Variables** (Project → Settings → Environment Variables):
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `ANTHROPIC_API_KEY` | your Anthropic key |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` (your real domain) |
4. Click **Deploy**.
5. **After the first deploy**, update auth URLs:
   - **Supabase → Authentication → URL Configuration**: set **Site URL** to your Vercel URL and add `https://your-app.vercel.app/**` to **Redirect URLs**.
   - Update `NEXT_PUBLIC_SITE_URL` in Vercel to the real domain and redeploy.

That's it — your data syncs across every device and persists permanently.

---

## 📱 Install on your phone

1. Open your deployed URL in mobile **Chrome** (Android) or **Safari** (iOS).
2. **Android:** menu → "Add to Home screen" / "Install app".
   **iOS:** Share → "Add to Home Screen".
3. It launches full-screen like a native app.

> The icon is an SVG ([`public/icon.svg`](public/icon.svg)). Most modern browsers
> accept it for installation. If you want platform-perfect maskable PNG icons,
> drop `icon-192.png` / `icon-512.png` into `public/` and add them to
> `public/manifest.json`.

---

## 🔧 Customizing

- **Targets / habits / XP** — [`src/lib/habits.ts`](src/lib/habits.ts)
- **Freeze tokens** — default is 3 (in `schema.sql`, `profiles.freeze_tokens`)
- **Badges** — [`src/lib/badges.ts`](src/lib/badges.ts)
- **Level curve** — [`src/lib/xp.ts`](src/lib/xp.ts)
- **Countdown target** — [`src/components/CountdownBanner.tsx`](src/components/CountdownBanner.tsx)

---

## 🧰 Scripts

```bash
npm run dev     # local dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint
```

Built clean and Vercel-ready out of the box. Now go build the chain — and don't break it. 🔥
# ProgrssDashboard
