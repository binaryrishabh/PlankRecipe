import { tokenize, singularize } from "./textUtils";

// measurement + prep filler words we ignore when pulling ingredient names out
// of the base recipe lines (we want "feta cheese", not "tablespoons crumbled")
export const INGREDIENT_STOPWORDS = new Set([
  "a", "an", "the", "of", "and", "or", "to", "very", "about", "approx", "approximately",
  "cup", "cups", "tbsp", "tsp", "tablespoon", "tablespoons", "teaspoon", "teaspoons",
  "ounce", "ounces", "pound", "pounds", "gram", "grams", "liter", "liters", "pint", "quart",
  "cans", "package", "packages", "clove", "cloves", "pinch", "dash", "stick",
  "large", "small", "medium", "fresh", "frozen", "dried", "ground",
  "chopped", "sliced", "thinly", "halved", "quartered", "diced", "minced",
  "grated", "shredded", "crumbled", "softened", "melted", "divided", "optional",
  "boneless", "skinless", "unsalted", "salted", "packed", "sifted",
  "room", "temperature", "hot", "cold", "warm"
]);

// pulls the meaningfull ingredient words out of lines like "2 tablespoons crumbled feta cheese"
export function extractIngredientWords(ingredients: string[]): Set<string> {
  const words = new Set<string>();
  for (const line of ingredients) {
    for (const rawWord of tokenize(line)) {
      if (rawWord.length < 4) continue; // skips tiny bits like "oz" or stray numbers
      if (INGREDIENT_STOPWORDS.has(rawWord)) continue;
      words.add(singularize(rawWord));
    }
  }
  return words;
}

// which base ingredient lines get mentioned in the given text. matches on
// singularized words so "tomato" still hits the "cherry tomatoes" line
export function findMentionedIngredientLines(text: string, ingredients: string[]): number[] {
  const textWords = new Set(tokenize(text).map(singularize));
  if (textWords.size === 0) return [];

  const mentioned: number[] = [];
  ingredients.forEach((line, index) => {
    for (const word of extractIngredientWords([line])) {
      if (textWords.has(word)) {
        mentioned.push(index);
        break;
      }
    }
  });
  return mentioned;
}