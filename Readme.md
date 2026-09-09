# 🍳 Allrecipes Tweaks

Paste any [AllRecipes](https://www.allrecipes.com) link and instantly see how home cooks modified the recipe — with **GitHub-PR-style visual diffs** highlighting every added, removed, and changed ingredient or step.

Built as a 48-hour take-home assignment for **Plank**.

## 🔗 Live Links

| What | Where |
|---|---|
| **Frontend** | https://allrecipes.lapwork.in (hosted on Vercel) |
| **Backend API** | https://allrecipe.backend.lapwork.in (AWS EC2 + nginx + SSL) |
| **API health** | https://allrecipe.backend.lapwork.in/health |
| **DB latency** | https://allrecipe.backend.lapwork.in/health/db |

## ✨ What It Does

1. User pastes an [AllRecipes URL](https://allrecipes.com)
2. Backend scrapes the recipe (JSON-LD) and pulls **every** review via the AllReviews API
3. Each review runs through **Gemini 3.5 Flash Lite**, which extracts structured diffs (added / removed / changed / note)
4. Every diff is validated against the real recipe lines — hallucinated lines get dropped
5. Frontend renders a switcher tab per tweak, lighting up changes like a code review
6. Everything is **persisted in Postgres** so recipes can be revisited instantly later

## 🏗️ Architecture

```
┌────────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│  Vercel        │      │  AWS EC2 (t3.small) │      │  Neon Postgres   │
│  React 19 UI   │ ───▶ │  Bun + Express 5    │ ───▶ │  (serverless)    │
└────────────────┘      └─────────────────────┘      └──────────────────┘
                               │
                               ├── curl ──▶ allrecipes.com (HTML + reviews API)
                               └── fetch ─▶ Gemini 3.5 Flash Lite (diff extraction)
```

### Why curl instead of plain fetch?

AllRecipes blocks standard TLS fingerprints with a 402 bot wall. The backend shells out to `curl` with a full Chrome header set, which sails through.

## 🧰 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 8, Zustand, Tailwind CSS 4, TypeScript |
| Backend | Bun, Express 5, Zod 4, TypeScript |
| Database | Neon serverless Postgres + Prisma 7 (adapter-pg) |
| LLM | Gemini 3.5 Flash Lite via OpenAI-compatible endpoint (raw fetch, no SDK) |
| CI/CD | GitHub Actions → SSH deploy (backend), Vercel Git integration (frontend) |
| Hosting | AWS EC2 + nginx + Let's Encrypt (backend), Vercel (frontend) |

## 📁 Repo Structure

```
PlankRecipe/
├── Backend/          # Bun + Express API (see Backend/README.md)
├── Frontend/         # React + Vite UI (see Frontend/README.md)
├── shared/           # TS contracts shared by both apps (see shared/README.md)
└── .github/
    └── workflows/
        └── deploy-backend.yml   # SSH deploy to EC2 on backend changes
```

## 🚀 Running Locally

**Prereqs:** [Bun](https://bun.sh), Node.js 20+, Git

```cmd
git clone https://github.com/binaryrishabh/PlankRecipe.git
cd PlankRecipe
```

**Backend** (runs on `http://localhost:3000`):

```cmd
cd Backend
copy .env.example .env
:: edit .env with your DATABASE_URL + GEMINI_API_KEY
bun install
bunx prisma generate
bun run dev
```

**Frontend** (runs on `http://localhost:5173`) — open a second terminal:

```cmd
cd Frontend
npm install
npm run dev
```

## 🔑 Environment Variables

**Backend** (`Backend/.env`):

| Var | Purpose |
|---|---|
| `PORT` | API port (default 3000) |
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection (used only for migrations) |
| `GEMINI_API_KEY` | Google AI Studio key |
| `CORS_ORIGIN` | Allowed origins, comma-separated |

**Frontend** (`Frontend/.env`):

| Var | Purpose |
|---|---|
| `VITE_API_URL` | Backend URL (defaults to `http://localhost:3000`) |

## 🔄 CI/CD — Decoupled Pipelines

Pushes only trigger what actually changed:

| Push touches | What runs |
|---|---|
| `Backend/**` or `shared/**` | GitHub Actions SSHes into EC2 → `git pull` → `bun install` → `pm2 restart` → health check |
| `Frontend/**` or `shared/**` | Vercel builds + deploys (backend-only pushes are skipped via Ignored Build Step) |

GitHub repo secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.

## ⚠️ Known Edge Cases

- Reviews are capped at 50 per recipe (one API page — fully covers the Featured Tweaks section)
- Praise-only reviews with zero modifications are hidden rather than shown as blank tabs
- Recipes with unusual JSON-LD nesting fall back to a recursive search; truly broken pages return a clear error instead of crashing

## 📄 License

Private take-home assignment — all rights reserved.