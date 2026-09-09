import { apiClient } from './client';
import type { RecipeBundle } from '@shared/interface/RecipeBundle.interface';

export async function fetchRecipeBundle(url: string): Promise<RecipeBundle> {
  // POST /api/recipes { url: string } -> RecipeBundle
  const response = await apiClient.post<RecipeBundle>('/api/recipes', { url });
  return response.data;
}