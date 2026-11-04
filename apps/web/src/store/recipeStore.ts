import { create } from 'zustand';
import type { RecipeBundle } from '@shared/interface/RecipeBundle.interface';
import type { Recipe } from '@shared/interface/Recipe.interface';
import type { Tweak } from '@shared/interface/Tweak.interface';
import { fetchRecipeBundle, fetchHistory } from '@/api/recipes';

// helper to make sure we always get an array, even if prisma sends back a string or null
// prisma json columns can be super wierd sometimes depending on the driver version
function ensureArray<T>(val: any): T[] {
  if (!val) return [];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(val) ? val : [];
}

function sanitizeBundle(raw: any): RecipeBundle {
  if (!raw || typeof raw !== 'object') {
    throw new Error("Invalid bundle recieved from server");
  }
  
  const recipe = raw.recipe || {};
  const rawTweaks = ensureArray<any>(raw.tweaks);
  
  const tweaks: Tweak[] = rawTweaks.map((t: any) => ({
    id: t.id || `fallback-${Math.random()}`,
    recipeId: t.recipeId || recipe.id || '',
    author: t.author ?? null,
    date: t.date ?? null,
    text: t.text || '',
    sortOrder: t.sortOrder ?? 0,
    createdAt: t.createdAt || new Date().toISOString(),
    modified: {
      ingredients: ensureArray<string>(t?.modified?.ingredients),
      steps: ensureArray<string>(t?.modified?.steps),
      interpretationNote: t?.modified?.interpretationNote ?? null
    },
    diff: ensureArray<any>(t?.diff)
  }));

  const sanitizedRecipe: Recipe = {
    id: recipe.id || 'unknown-id',
    url: recipe.url || '',
    title: recipe.title || 'Untitled Recipe',
    imageUrl: recipe.imageUrl || null,
    description: recipe.description || null,
    servings: recipe.servings || null,
    prepTime: recipe.prepTime || null,
    cookTime: recipe.cookTime || null,
    ingredients: ensureArray<string>(recipe.ingredients),
    steps: ensureArray<string>(recipe.steps),
    createdAt: recipe.createdAt || new Date().toISOString()
  };

  return {
    recipe: sanitizedRecipe,
    tweaks
  };
}

interface RecipeState {
  bundle: RecipeBundle | null;
  // previously analyzed recipes, newest first. feeds the RecentRecipes strip
  history: RecipeBundle[];
  loading: boolean;
  error: string | null;
  // which tweak the user is currently looking at, null means the plain original
  selectedTweakId: string | null;
  // flipped true on first analyze / chip click, hides the newbie explainer
  explainerDismissed: boolean;
  
  loadBundle: (url: string, opts?: { refresh?: boolean }) => Promise<void>;
  loadHistory: () => Promise<void>;
  selectTweak: (id: string) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  bundle: null,
  history: [],
  loading: false,
  error: null,
  selectedTweakId: null,
  explainerDismissed: false,
  
  loadBundle: async (url: string, opts?: { refresh?: boolean }) => {
    // any real interaction means they get the ui now, bye bye explainer
    set({ loading: true, error: null, selectedTweakId: null, explainerDismissed: true });
    try {
      const rawBundle = await fetchRecipeBundle(url, opts?.refresh);
      // run it through the sanatizer before putting it in state
      const bundle = sanitizeBundle(rawBundle);
      set({ bundle, loading: false, selectedTweakId: null });
      // keep the recent recipes strip fresh after a successful scrape
      void get().loadHistory();
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch recipe. Please check the URL and try again.';
      set({ error: message, loading: false, bundle: null, selectedTweakId: null });
    }
  },
  
  loadHistory: async () => {
    try {
      const raw = await fetchHistory();
      const safe = Array.isArray(raw) ? raw : [];
      // every bundle goes through the same sanatizer as the main flow.
      // one bad entry should get skipped, not nuke the whole list
      const clean: RecipeBundle[] = [];
      for (const item of safe) {
        try {
          clean.push(sanitizeBundle(item));
        } catch {
          // skip this one bad row silently
        }
      }
      set({ history: clean });
    } catch (err) {
      // history is a nice-to-have, never let it break the main page
      console.warn('Could not load history:', err);
    }
  },
  
  selectTweak: (id: string) => set({ selectedTweakId: id }),
  clearSelection: () => set({ selectedTweakId: null }),
  reset: () => set({ bundle: null, error: null, loading: false, selectedTweakId: null }),
}));