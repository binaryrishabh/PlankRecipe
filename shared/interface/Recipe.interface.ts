export interface Recipe {
  id: String;
  url: String;
  title: String;
  imageUrl: String | null;
  description: String | null;
  servings: String | null;
  prepTime: String | null;
  cookTime: String | null;
  ingredients: String[];
  steps: String[];
  createdAt: String;
}