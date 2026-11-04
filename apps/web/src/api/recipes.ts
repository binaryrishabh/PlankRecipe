import { apiClient } from './client';
import type { RecipeBundle } from '@shared/interface/RecipeBundle.interface';

export async function fetchRecipeBundle(url: string, refresh?: boolean): Promise<RecipeBundle> {
  // POST /api/recipes { url: string, refresh?: boolean } -> RecipeBundle
  // undefined keys get dropped by json stringify, so normal calls stay clean
  const response = await apiClient.post<RecipeBundle>('/api/recipes', { url, refresh });
  return response.data;
}

// GET /api/recipes/history -> RecipeBundle[] (newest first, capped at 20)
export async function fetchHistory(): Promise<RecipeBundle[]> {
  const response = await apiClient.get<RecipeBundle[]>('/api/recipes/history');
  return response.data;
}