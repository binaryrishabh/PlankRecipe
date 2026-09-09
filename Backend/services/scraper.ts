import crypto from "crypto";
import type { Recipe } from "@shared/interface/Recipe.interface";
import type { RecipeBundle } from "@shared/interface/RecipeBundle.interface";

// Scrappy regex for JSON-LD since we arent adding an HTML parser dependancy
// sometimes allrecipes blocks bots so we fake the user agent
const SCRIPT_REGEX = /<script type="application\/ld\+json">(.*?)<\/script>/gis;

// basic ISO 8601 duration parser (e.g. PT1H15M), kinda messy but works
function parseDuration(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  
  const days = parseInt(match[1] || "0");
  const hours = parseInt(match[2] || "0");
  const mins = parseInt(match[3] || "0");
  
  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? "s" : ""}`);
  
  return parts.length > 0 ? parts.join(" ") : iso;
}

function extractImage(image: any): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (Array.isArray(image) && image.length > 0) {
    if (typeof image[0] === "string") return image[0];
    if (image[0]?.url) return image[0].url;
  }
  if (typeof image === "object" && image.url) return image.url;
  return null;
}

function extractServings(yieldVal: any): string | null {
  if (!yieldVal) return null;
  if (typeof yieldVal === "string") return yieldVal;
  if (Array.isArray(yieldVal)) return yieldVal.join(", ");
  return String(yieldVal);
}

function extractSteps(instructions: any): string[] {
  if (!instructions) return [];
  if (Array.isArray(instructions)) {
    return instructions.map((inst: any) => {
      if (typeof inst === "string") return inst;
      if (inst?.text) return inst.text;
      return String(inst);
    }).filter(Boolean);
  }
  return [];
}

function extractIngredients(ingredients: any): string[] {
  if (!ingredients) return [];
  if (Array.isArray(ingredients)) {
    return ingredients.map((ing: any) => String(ing)).filter(Boolean);
  }
  return [];
}

function findRecipeInJsonLd(obj: any): any {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = findRecipeInJsonLd(item);
      if (res) return res;
    }
  } else if (typeof obj === "object") {
    const type = obj["@type"];
    if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
      return obj;
    }
    if (obj["@graph"]) {
      const res = findRecipeInJsonLd(obj["@graph"]);
      if (res) return res;
    }
  }
  return null;
}

export async function scrapeRecipe(url: string): Promise<RecipeBundle> {
  const response = await fetch(url, {
    headers: {
      // allrecipes blocks default fetch user agents, so we pretend to be a normal browser
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recipe page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  
  let recipeData: any = null;
  let match;
  
  // reset regex state just in case
  SCRIPT_REGEX.lastIndex = 0;
  
  while ((match = SCRIPT_REGEX.exec(html)) !== null) {
    try {
      const raw = match[1].trim();
      const json = JSON.parse(raw);
      const recipe = findRecipeInJsonLd(json);
      if (recipe) {
        recipeData = recipe;
        break;
      }
    } catch (e) {
      // ignore non-json scripts
    }
  }

  if (!recipeData) {
    throw new Error("Could not find recipe data in JSON-LD. The page structure might have changed.");
  }

  const recipe: Recipe = {
    id: crypto.randomUUID(),
    url: url,
    title: recipeData.name || "Untitled Recipe",
    imageUrl: extractImage(recipeData.image),
    description: recipeData.description || null,
    servings: extractServings(recipeData.recipeYield),
    prepTime: parseDuration(recipeData.prepTime),
    cookTime: parseDuration(recipeData.cookTime),
    ingredients: extractIngredients(recipeData.recipeIngredient),
    steps: extractSteps(recipeData.recipeInstructions),
    createdAt: new Date().toISOString()
  };

  // Tweaks extraction is a later round; empty array for now
  return {
    recipe,
    tweaks: []
  };
}