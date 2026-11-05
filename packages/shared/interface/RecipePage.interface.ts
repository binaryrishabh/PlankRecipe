// Public, indexable summary of an analyzed recipe (served at /r/<slug>).
// Holds only Cook's Diff's own analysis plus short ingredient-level changes —
// never the source's photos, review text or full instructions. The full recipe
// stays behind the interactive tool and a link to the original page.

export interface IngredientChangeStat {
  line: string; // the original ingredient line
  changed: number; // cooks who changed it
  removed: number; // cooks who left it out
  examples: string[]; // a few of the replacement lines cooks used
}

export interface AddedIngredientStat {
  line: string;
  count: number;
}

export interface RecipePageTweak {
  n: number; // 1-based position
  ingredientChanges: { type: "added" | "removed" | "changed"; before: string | null; after: string | null }[];
  stepChanges: number;
  notes: number;
}

export interface RecipePage {
  slug: string;
  title: string;
  sourceUrl: string;
  sourceHost: string;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  analyzedAt: string;
  tweakCount: number;
  cooksWithChanges: number;
  totals: { added: number; removed: number; changed: number; notes: number };
  mostChangedIngredients: IngredientChangeStat[];
  commonAdditions: AddedIngredientStat[];
  tweaks: RecipePageTweak[];
}

export interface RecipePageListItem {
  slug: string;
  title: string;
  tweakCount: number;
  updatedAt: string;
}
