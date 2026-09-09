# Frontend — Allrecipes Tweaks UI

React 19 + Vite 8 + Tailwind 4 single-page app. Paste a recipe link, get GitHub-PR-style diffs for every community tweak.

**Live:** https://allrecipes.lapwork.in

## 🧩 Component Map

```
App
├── ErrorBoundary            # catches render crashes, shows reload card
├── UrlInputForm             # the paste-analyze input
├── RecentRecipes            # history chips + re-scrape (⟳) + Show all toggle
├── ErrorDisplay             # backend error banner with dismiss
└── RecipeResults
    ├── SourceLink           # "View original on AllRecipes" pill
    ├── TweakSwitcher        # Original / Tweak #1 / Tweak #2 tabs
    ├── DiffLegend           # color key (added/removed/changed/note)
    └── RecipeView
        ├── NoteCallout      # blue info boxes for freeform notes
        └── DiffList → DiffRow   # per-line rendering + word-level diff
```

## 🎨 How the Diff Rendering Works

All the logic lives in `src/lib/` — pure functions, zero React, easy to reason about:

- **`diff.ts` → `buildSectionDiff`** — takes the original lines + the tweak's annotations and produces display rows. Removed/changed lines are matched **by exact content** against the original, added lines append at the bottom
- **`wordDiff.ts` → `computeWordDiff`** — LCS dynamic-programming diff at the word level, so a changed step shows the exact swapped words struck-through in red with the replacements in green
- **`notes.ts` → `dedupeNotes`** — drops duplicate notes and any note that just repeats the review quote already shown above the recipe

## 🗃️ State (Zustand)

`store/recipeStore.ts` holds:

- `bundle` — the current recipe + tweaks
- `history` — newest-20 from `/api/recipes/history`
- `selectedTweakId` — which tab is active (`null` = original)
- `loadBundle(url, { refresh? })` — sanitize-then-set, with a quiet history refresh after success

Every payload runs through `sanitizeBundle` before touching state — Prisma JSON columns can arrive as strings on some drivers, so arrays are defensively parsed.

## 🚀 Local Setup

```cmd
cd Frontend
npm install
npm run dev
```

Set `VITE_API_URL` in a `.env` file if your backend isn't on `http://localhost:3000`.

## 📦 Production

- Hosted on **Vercel** via the GitHub integration (root directory: `Frontend`)
- Ignored Build Step skips builds when only backend files changed:
  `git diff --quiet HEAD^ HEAD -- ":(top)Frontend" ":(top)shared"`

## 📁 Structure

```
Frontend/src/
├── api/            # axios client + endpoint wrappers
├── components/
│   ├── recipe/     # DiffRow, DiffList, DiffLegend, NoteCallout, RecipeView, SourceLink
│   ├── tweaks/     # TweakSwitcher
│   └── ...         # form, errors, history strip
├── lib/            # diff.ts, wordDiff.ts, notes.ts (pure logic)
└── store/          # zustand store
```