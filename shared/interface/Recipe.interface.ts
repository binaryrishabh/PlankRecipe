
export interface Recipe {
  id: string;
  url: string;
  title: string;
  imageUrl: string | null;
  description: string | null;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  ingredients: string[];
  steps: string[];
  createdAt: string;
}