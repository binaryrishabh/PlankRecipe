# shared/ — Cross-App Contracts

Single source of truth for the types both apps speak. The backend maps Prisma rows **into** these shapes (`Backend/utils/mappers.ts`), the frontend sanitizes payloads **against** them (`Frontend/src/store/recipeStore.ts`).

## Contracts

| File | Shape |
|---|---|
| `interface/Recipe.interface.ts` | The scraped recipe (ingredients, steps, times, image) |
| `interface/Tweak.interface.ts` | One community review + its modified recipe + diffs |
| `interface/DiffAnnotation.interface.ts` | One atomic change: `{ section, index, type, before, after }` |
| `interface/ModifiedRecipe.interface.ts` | The tweaked ingredient/step lists |
| `interface/RecipeBundle.interface.ts` | `{ recipe, tweaks[] }` — the main API payload |
| `interface/ApiError.interface.ts` | `{ success: false, message }` |
| `enums/Diff.enum.ts` | `added` / `removed` / `changed` / `note` (const object, not a TS enum — avoids the string-literal gotcha) |

## How each app consumes it

- **Backend:** `tsconfig` path alias `@shared/*` → Bun resolves it directly at runtime
- **Frontend:** Vite alias `@shared` → `../shared` (see `vite.config.ts`) + matching tsconfig path

No duplication, no drift — change a contract once, both sides see it.