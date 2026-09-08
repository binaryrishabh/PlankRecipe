import { type DiffAnnotation } from "./DiffAnnotation.interface";
import { type ModifiedRecipe } from "./ModifiedRecipe.interface";

export interface Tweak {
  id: string;
  recipeId: string;
  author: String | null;
  date: String | null;
  text: string;
  sordOrder: number;
  modified: ModifiedRecipe;
  diff: DiffAnnotation;
  createdAt: string;
}