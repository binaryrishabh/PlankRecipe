import type { Recipe } from "@shared/interface/Recipe.interface";

// decides if a review actually tells us how someone changed the recipe, or if
// its just generic praise like "so yummy!!". a review passes when it mentions
// at least one of: a base recipe ingredient, a cooking technique/utensil/appliance,
// or modification language. anything else gets tossed by the rule engine.

// measurement + prep filler words we ignore when pulling ingredient names out
// of the base recipe lines (we want "feta cheese", not "tablespoons crumbled")
const INGREDIENT_STOPWORDS = new Set([
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

// cooking techniques, utensils and appliances that hint someone actually did something
const TECHNIQUE_WORDS = new Set([
  "microwave", "skillet", "oven", "bake", "baked", "baking",
  "saute", "sauteed", "sauteing",
  "colander", "strainer", "pan", "pot", "wok", "saucepan", "spatula",
  "boil", "boiled", "boiling", "fry", "fried", "frying",
  "grill", "grilled", "grilling", "roast", "roasted", "roasting",
  "broil", "broiled", "toast", "toasted", "simmer", "simmered",
  "whisk", "whisked", "stir", "stirred", "mix", "mixed", "blend", "blended",
  "blender", "ramekin", "griddle", "steamer", "casserole",
  "preheat", "preheated", "marinate", "marinated", "knead", "kneaded",
  "cook", "cooked", "stovetop", "refrigerate", "refrigerated", "chill", "chilled"
]);

// multi word techniques checked against the whole normalized text
const TECHNIQUE_PHRASES = [
  "slow cooker", "crockpot", "crock pot", "instant pot", "air fryer", "airfryer",
  "baking dish", "baking sheet", "sheet pan", "cast iron",
  "nonstick", "non-stick", "non stick", "food processor", "stand mixer", "hand mixer"
];

// words that scream "i changed the recipe"
const MODIFICATION_WORDS = new Set([
  "substitute", "substituted", "substitutes", "swap", "swapped", "swaps",
  "add", "added", "adding", "omitted", "omit", "skipped", "instead",
  "changed", "change", "extra", "double", "doubled", "halved", "halve",
  "replaced", "replace", "without", "omission", "tweak", "tweaked",
  "adjust", "adjusted", "modification", "modified", "variation"
]);

const MODIFICATION_PHRASES = [
  "left out", "cut back", "used less", "used more", "in place of", "next time"
];

// strip accents + lowercase so things like sautéed still match sauteed
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z]+/)
    .filter(Boolean);
}

// dead simple plural handling, enough for food words (tomatoes -> tomato, berries -> berry)
function singularize(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

// pulls the meaningfull ingredient words out of lines like "2 tablespoons crumbled feta cheese"
function extractIngredientWords(ingredients: string[]): Set<string> {
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