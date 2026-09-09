import { create } from 'zustand';
import type { RecipeBundle } from '@shared/interface/RecipeBundle.interface';
import { fetchRecipeBundle } from '@/api/recipes';

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
      const bundle = await fetchRecipeBundle(url);
      // fresh recipe so we always land back on the original view
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