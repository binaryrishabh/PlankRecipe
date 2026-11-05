import { apiClient } from './client';
import type { RecipePage } from '@shared/interface/RecipePage.interface';

declare global {
  interface Window {
    // filled in by the server-rendered /r/<slug> page (api/r.ts) so the
    // client doesn't have to fetch the same data again
    __RECIPE_PAGE__?: RecipePage | null;
  }
}

export async function fetchRecipePage(slug: string): Promise<RecipePage> {
  const preloaded = window.__RECIPE_PAGE__;
  if (preloaded && preloaded.slug === slug) return preloaded;
  const response = await apiClient.get<RecipePage>(`/api/pages/${encodeURIComponent(slug)}`);
  return response.data;
}
