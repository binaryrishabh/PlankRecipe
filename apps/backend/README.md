# Backend — Allrecipes Tweaks API

Bun + Express 5 API that scrapes AllRecipes, extracts community tweaks with Gemini, and persists everything to Neon Postgres.

**Live:** https://allrecipes-backend.lapwork.in/health

## 📡 Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/recipes` | Scrape a recipe (or serve from cache). Body: `{ url, refresh? }` |
| `GET` | `/api/recipes/history` | Newest 20 analyzed recipes with tweaks |
| `GET` | `/health` | Liveness check |
| `GET` | `/health/db` | Proves the Neon connection works, returns latency |

### POST /api/recipes

```json
{ "url": "https://www.allrecipes.com/recipe/236372/...", "refresh": false }
```

- If the URL was scraped before **and** has real diffs → returns the saved bundle instantly (no re-scrape, no LLM spend)
- `refresh: true` forces a fresh scrape (used by the re-scrape button in the UI)
- Response: `RecipeBundle` — `{ recipe, tweaks[] }` (see `packages/shared/`)

## 🔄 Scrape Pipeline

```
fetchRecipeHtml (playwright | curl) → parseHtmlToData (JSON-LD) → fetchReviews (API) → generateTweaks (Gemini)
```

1. **fetcher.ts** — picks the engine from `SCRAPER_ENGINE`: `playwright` (production) drives a real headless Chromium; `curl` (default, local) shells out to `curl` with a full Chrome header set. Both get past the 402 bot block, then hit the AllReviews reviews API (`limit=50`)
2. **jsonLdParser.ts** — recursive JSON-LD search (recipe objects sometimes hide inside `@graph`), entity decoding, ISO-8601 duration parsing
3. **tweakEngine.ts** — fires one Gemini call per review in parallel, then runs `fixDiffs`:
   - drops diffs missing required fields
   - fuzzy-matches the LLM's `before` quote against real recipe lines and swaps in the exact original (the frontend matches exactly, so sloppy LLM quotes would silently never light up)
   - drops invented lines entirely
4. **routes/recipes.ts** — cache check → scrape → upsert recipe → replace tweaks → respond

## 🗄️ Database Schema (Prisma)

```
Recipe (1) ──▶ (many) Tweak
```

- `Recipe.ingredients` / `Recipe.steps` — JSON string arrays
- `Tweak.modified` — JSON `ModifiedRecipe`
- `Tweak.diff` — JSON `DiffAnnotation[]`
- Cascade delete on recipe removal; indexed on `[recipeId, sortOrder]`

## 🚀 Local Setup

```cmd
cd apps/backend
copy .env.example .env
:: fill in DATABASE_URL, GEMINI_API_KEY
bun install
bunx prisma generate
bun run dev
```

## 🖥️ Production Server

- Self-hosted Ubuntu server; the API listens on `127.0.0.1` only
- Public traffic: Cloudflare Tunnel → nginx → app (TLS ends at Cloudflare; `trust proxy` is limited to loopback)
- Runs as the systemd service **`allrecipes.service`** (restarts on failure and on boot)
- Secrets live in a root-only env file on the server, loaded by the unit — never in the repo
- `SCRAPER_ENGINE=playwright` with headless Chromium installed on the server
- The DB connection is forced to IPv4 (`lib/prisma.ts`) because the server has no working IPv6
- Deploys are automated and the server is never edited by hand — push to `main` and `.github/workflows/deploy-backend.yml` takes over (Tailscale → SSH → reset to `main` → install → migrate → restart → health checks)

Handy commands on the server:

```bash
systemctl status allrecipes.service        # service state
journalctl -u allrecipes.service -f        # live logs
sudo systemctl restart allrecipes.service  # manual restart
```

## 📁 Structure

```
apps/backend/
├── index.ts              # app entry, cors, health routes
├── routes/recipes.ts     # POST /api/recipes + GET /history
├── services/
│   ├── fetcher.ts        # curl-based html + reviews fetching
│   ├── jsonLdParser.ts   # html → Recipe contract
│   ├── scraper.ts        # orchestrates the pipeline
│   └── tweakEngine.ts    # Gemini extraction + diff validation
├── utils/
│   ├── config.ts         # env loading
│   └── mappers.ts        # prisma rows → shared contracts
├── zod_schemas/recipes.ts
├── lib/prisma.ts
└── prisma/schema.prisma
```