import { create } from 'zustand';

// "My Kitchen": recipes a visitor saved, kept in this browser only (no account).
// localStorage can be missing or throw (private mode, blocked storage), so every
// access is guarded and the app works the same without it — saves just won't persist.

export interface SavedRecipe {
  slug: string;
  title: string;
  tweakCount: number;
  savedAt: string;
}

const KEY = 'cooks-diff:kitchen:v1';

function read(): SavedRecipe[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((r) => r && typeof r.slug === 'string') : [];
  } catch {
    return [];
  }
}

function write(items: SavedRecipe[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage unavailable: keep it in memory for this visit
  }
}

interface KitchenState {
  saved: SavedRecipe[];
  isSaved: (slug: string) => boolean;
  toggle: (recipe: Omit<SavedRecipe, 'savedAt'>) => void;
  remove: (slug: string) => void;
}

export const useKitchen = create<KitchenState>((set, get) => ({
  saved: read(),
  isSaved: (slug) => get().saved.some((r) => r.slug === slug),
  toggle: (recipe) => {
    const saved = get().isSaved(recipe.slug)
      ? get().saved.filter((r) => r.slug !== recipe.slug)
      : [{ ...recipe, savedAt: new Date().toISOString() }, ...get().saved];
    write(saved);
    set({ saved });
  },
  remove: (slug) => {
    const saved = get().saved.filter((r) => r.slug !== slug);
    write(saved);
    set({ saved });
  },
}));

// keep tabs in sync when the kitchen changes in another tab
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) useKitchen.setState({ saved: read() });
  });
}
