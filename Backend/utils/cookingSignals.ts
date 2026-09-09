// word + phrase banks that describe cooking activity and recipe modifications.
// shared by the actionable-review gate and the step synthesis fallback.

// cooking techniques, utensils and appliances that hint someone actually did something
export const TECHNIQUE_WORDS = new Set([
  "microwave", "skillet", "oven", "bake", "baked", "baking",
  "saute", "sauteed", "sauteing",
  "colander", "strainer", "pan", "pot", "wok", "saucepan", "spatula",
  "boil", "boiled", "boiling", "fry", "fried", "frying",
  "grill", "grilled", "grilling", "roast", "roasted", "roasting",
  "broil", "broiled", "toast", "toasted", "simmer", "simmered",
  "whisk", "whisked", "stir", "stirred", "mix", "mixed", "blend", "blended",
  "blender", "ramekin", "griddle", "steamer", "casserole",
  "preheat", "preheated", "marinate", "marinated", "knead", "kneaded",
  "cook", "cooked", "stovetop", "refrigerate", "refrigerated", "chill", "chilled",
  "covered", "cover", "drain", "drained", "rinse", "rinsed", "toss", "tossed"
]);

// multi word techniques checked against the whole normalized text
export const TECHNIQUE_PHRASES = [
  "slow cooker", "crockpot", "crock pot", "instant pot", "air fryer", "airfryer",
  "baking dish", "baking sheet", "sheet pan", "cast iron",
  "nonstick", "non-stick", "non stick", "food processor", "stand mixer", "hand mixer",
  "with foil", "aluminum foil", "paper towels"
];

// words that scream "i changed the recipe"
export const MODIFICATION_WORDS = new Set([
  "substitute", "substituted", "substitutes", "swap", "swapped", "swaps",
  "add", "added", "adding", "omitted", "omit", "skipped", "instead",
  "changed", "change", "extra", "double", "doubled", "halved", "halve",
  "replaced", "replace", "without", "omission", "tweak", "tweaked",
  "adjust", "adjusted", "modification", "modified", "variation"
]);

export const MODIFICATION_PHRASES = [
  "left out", "cut back", "used less", "used more", "in place of", "next time"
];

// matches "10 minutes", "2 hrs", "350 degrees" and friends
export const TIME_OR_TEMP_REGEX = /\b\d+\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?|degrees?)\b/i;