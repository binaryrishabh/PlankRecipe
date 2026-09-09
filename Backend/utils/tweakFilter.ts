import type { Recipe } from "@shared/interface/Recipe.interface";
import { normalizeText, tokenize, singularize } from "./textUtils";
import { extractIngredientWords } from "./ingredientMatch";
import {
  TECHNIQUE_WORDS,
  TECHNIQUE_PHRASES,
  MODIFICATION_WORDS,
  MODIFICATION_PHRASES
} from "./cookingSignals";

// decides if a review actually tells us how someone changed the recipe, or if
// its just generic praise like "so yummy!!". a review passes when it mentions
// at least one of: a base recipe ingredient, a cooking technique/utensil/appliance,
// or modification language. anything else gets tossed by the rule engine.

// the actual gate. returns true when the review has actionable cooking info in it
export function isActionableTweak(reviewText: string, recipe: Recipe): boolean {
  const normalized = normalizeText(reviewText);
  const words = tokenize(reviewText);
  const singularWords = new Set(words.map(singularize));

  // 1. does it mention one of the recipes own ingredients?
  const ingredientWords = extractIngredientWords(recipe.ingredients);
  for (const word of singularWords) {
    if (ingredientWords.has(word)) return true;
  }

  // 2. a technique, utensil or appliance word?
  for (const word of words) {
    if (TECHNIQUE_WORDS.has(word)) return true;
  }
  for (const phrase of TECHNIQUE_PHRASES) {
    if (normalized.includes(phrase)) return true;
  }

  // 3. plain modification language?
  for (const word of words) {
    if (MODIFICATION_WORDS.has(word)) return true;
  }
  for (const phrase of MODIFICATION_PHRASES) {
    if (normalized.includes(phrase)) return true;
  }

  // nothing actionable in here, just praise
  return false;
}