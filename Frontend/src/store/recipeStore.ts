import { create } from 'zustand';
import type { RecipeBundle } from '@shared/interface/RecipeBundle.interface';
import type { Recipe } from '@shared/interface/Recipe.interface';
import type { Tweak } from '@shared/interface/Tweak.interface';
import { fetchRecipeBundle } from '@/api/recipes';

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
  loading: boolean;
  error: string | null;
  // which tweak the user is currently looking at, null means the plain original
  selectedTweakId: string | null;
  loadBundle: (url: string) => Promise<void>;
  selectTweak: (id: string) => void;
  clearSelection: () => void;
  reset: () => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  bundle: null,
  loading: false,
  error: null,
  selectedTweakId: null,

  loadBundle: async (url: string) => {
    set({ loading: true, error: null, selectedTweakId: null });
    try {
      const rawBundle = await fetchRecipeBundle(url);
      // run it through the sanatizer before putting it in state
      const bundle = sanitizeBundle(rawBundle);
      set({ bundle, loading: false, selectedTweakId: null });
    } catch (err: any) {
      // pull the message out of the backend error shape, fall back to axios/JS error
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch recipe. Please check the URL and try again.';
      set({ error: message, loading: false, bundle: null, selectedTweakId: null });
    }
  },

  selectTweak: (id: string) => set({ selectedTweakId: id }),
  clearSelection: () => set({ selectedTweakId: null }),
  reset: () => set({ bundle: null, error: null, loading: false, selectedTweakId: null }),
}));