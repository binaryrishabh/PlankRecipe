
import type { Recipe } from "./Recipe.interface";
import type { Tweak } from "./Tweak.interface";

export interface RecipeBundle {
  recipe: Recipe;
  tweaks: Tweak[];
}