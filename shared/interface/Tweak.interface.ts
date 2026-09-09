
import type { DiffAnnotation } from "./DiffAnnotation.interface";
import type { ModifiedRecipe } from "./ModifiedRecipe.interface";

export interface Tweak {
  id: string;
  recipeId: string;
  author: string | null;
  date: string | null;
  text: string;
  sortOrder: number;
  modified: ModifiedRecipe;
  diff: DiffAnnotation[];
  createdAt: string;
}