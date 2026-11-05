import { apiClient } from './client';
import type { RecipePage, RecipeCard } from '@shared/interface/RecipePage.interface';

declare global {
  interface Window {
    // filled in by the server-rendered /r/<slug> page (api/r.ts) so the
    // client doesn't have to fetch the same data again
    __RECIPE_PAGE__?: RecipePage | null;
    // filled in by the server-rendered /recipes page (api/browse.ts)
    __RECIPE_CARDS__?: RecipeCard[];
  }
}

export async function fetchRecipePage(slug: string): Promise<RecipePage> {
  const preloaded = window.__RECIPE_PAGE__;
  if (preloaded && preloaded.slug === slug) return preloaded;
  const response = await apiClient.get<RecipePage>(`/api/pages/${encodeURIComponent(slug)}`);
  return response.data;
}

export async function fetchRecipeCards(limit = 12): Promise<RecipeCard[]> {
  const preloaded = window.__RECIPE_CARDS__;
  if (preloaded?.length) return preloaded.slice(0, limit);
  const response = await apiClient.get<RecipeCard[]>('/api/pages/cards', { params: { limit } });
  return Array.isArray(response.data) ? response.data : [];
}
