# Backend — Allrecipes Tweaks API

Bun + Express 5 API that scrapes AllRecipes, extracts community tweaks with Gemini, and persists everything to Neon Postgres.

**Live:** https://allrecipe.backend.lapwork.in/health

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
- Response: `RecipeBundle` — `{ recipe, tweaks[] }` (see `shared/`)

## 🔄 Scrape Pipeline

```
fetchRecipeHtml (curl) → parseHtmlToData (JSON-LD) → fetchReviews (API) → generateTweaks (Gemini)
```

1. **fetcher.ts** — shells out to `curl` with a full Chrome header set to get past the 402 bot block, then hits the AllReviews reviews API (`limit=50`)
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
cd Backend
copy .env.example .env
:: fill in DATABASE_URL, DIRECT_URL, GEMINI_API_KEY
bun install
bunx prisma generate
bun run dev
```

## 🖥️ Production Server (EC2)

- Ubuntu 24.04 on `t3.small`, Bun installed per-user
- Process managed by **PM2** (`pm2 start "bun index.ts" --name plank-backend`)
- nginx reverse-proxies 443 → 3000 with 300s read timeout for long scrapes
- SSL via Let's Encrypt (auto-renewing)
- Deploys are automated — see `.github/workflows/deploy-backend.yml`

Handy PM2 commands:

```bash
pm2 status                 # process list
pm2 logs plank-backend     # live logs
pm2 restart plank-backend  # manual restart
```

## 📁 Structure

```
Backend/
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