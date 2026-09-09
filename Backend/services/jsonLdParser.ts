import type { Recipe } from "@shared/interface/Recipe.interface";
import crypto from "crypto";

// more forgiving regex incase they add id or class attributes to the script tag
// the old one was too strict and broke when they changed their html structure
const SCRIPT_REGEX = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;

// quick and dirty html entity decoder so we dont get weird &#39; in the titles
function decodeHtmlEntities(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// basic ISO 8601 duration parser (e.g., PT1H15M), kinda messy but works
function parseDuration(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;

  const days = parseInt(match[1] || "0");
  const hours = parseInt(match[2] || "0");
  const mins = parseInt(match[3] || "0");

  const parts: string[] = [];
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

// recusive search because sometimes the recipe object is burried deep inside a graph or nested array
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
    
    // check all keys recursively just in case its hidden under a weird property name
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        const res = findRecipeInJsonLd(obj[key]);
        if (res) return res;
      }
    }
  }
  return null;
}

export interface ParsedData {
  recipe: Recipe;
  rawReviews: any[];
}

export function parseHtmlToData(html: string, url: string): ParsedData {
  let recipeData: any = null;
  let match: RegExpExecArray | null;

  // reset regex state just in case
  SCRIPT_REGEX.lastIndex = 0;

  while ((match = SCRIPT_REGEX.exec(html)) !== null) {
    try {
      const capturedGroup = match[1];
      if (!capturedGroup) continue;

      const raw = capturedGroup.trim();
      const json = JSON.parse(raw);
      const recipe = findRecipeInJsonLd(json);
      if (recipe) {
        recipeData = recipe;
        break;
      }
    } catch (e) {
      // ignore non-JSON scripts or malformed json
    }
  }

  if (!recipeData) {
    throw new Error("Could not find recipe data in JSON-LD. The page structure might have changed.");
  }

  const recipe: Recipe = {
    id: crypto.randomUUID(),
    url: url,
    title: decodeHtmlEntities(recipeData.name) || "Untitled Recipe",
    imageUrl: extractImage(recipeData.image),
    description: decodeHtmlEntities(recipeData.description),
    servings: extractServings(recipeData.recipeYield),
    prepTime: parseDuration(recipeData.prepTime),
    cookTime: parseDuration(recipeData.cookTime),
    ingredients: extractIngredients(recipeData.recipeIngredient),
    steps: extractSteps(recipeData.recipeInstructions),
    createdAt: new Date().toISOString()
  };

  return {
    recipe,
    rawReviews: recipeData.review || []
  };
}