import { create } from 'zustand';
import type { RecipeBundle } from '@shared/interface/RecipeBundle.interface';
import { fetchRecipeBundle } from '@/api/recipes';

interface RecipeState {
  bundle: RecipeBundle | null;
  loading: boolean;
  error: string | null;
  loadBundle: (url: string) => Promise<void>;
  reset: () => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  bundle: null,
  loading: false,
  error: null,
  
  loadBundle: async (url: string) => {
    set({ loading: true, error: null });
    try {
      const bundle = await fetchRecipeBundle(url);
      set({ bundle, loading: false });
    } catch (err: any) {
      // Extract error message from backend ApiError interface or Axios fallback
      const message = err.response?.data?.message || err.message || 'Failed to fetch recipe. Please check the URL and try again.';
      set({ error: message, loading: false, bundle: null });
    }
  },
  
  reset: () => set({ bundle: null, error: null, loading: false }),
}));