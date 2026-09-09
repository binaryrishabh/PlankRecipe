import type { Recipe } from "@shared/interface/Recipe.interface";
import type { Tweak } from "@shared/interface/Tweak.interface";
import type { RecipeBundle } from "@shared/interface/RecipeBundle.interface";
import type { ModifiedRecipe } from "@shared/interface/ModifiedRecipe.interface";
import type { DiffAnnotation } from "@shared/interface/DiffAnnotation.interface";
import { Diff, type DiffType } from "@shared/enums/Diff.enum";

// prisma hands back Date objects and raw json column values, but the shared
// contracts want plain iso strings and typed arrays. these helpers do the
// translation so the frontend recieves exactly the RecipeBundle shape.

// loose row shapes so we dont have to import the generated prisma types in here
interface DbTweakRow {
  id: string;
  recipeId: string;
  author: string | null;
  date: string | null;
  text: string;
  sortOrder: number;
  modified: unknown;
  diff: unknown;
  createdAt: Date | string;
}

interface DbRecipeRow {
  id: string;
  url: string;
  title: string;
  imageUrl: string | null;
  description: string | null;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  ingredients: unknown;
  steps: unknown;
  createdAt: Date | string;
  tweaks?: DbTweakRow[];
}

function toIsoString(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  // shouldnt ever happen, but we never want to send undefined for a date
  return new Date().toISOString();
}

// prisma usually returns json columns already parsed, but some drivers
// send them back as raw strings, so we play it safe and parse when needed
function parseJsonColumn(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function toStringArray(value: unknown): string[] {
  const parsed = parseJsonColumn(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string");
}

function toModifiedRecipe(value: unknown): ModifiedRecipe {
  const parsed = parseJsonColumn(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ingredients: [], steps: [], interpretationNote: null };
  }
  const obj = parsed as Record<string, unknown>;
  return {
    ingredients: toStringArray(obj.ingredients),
    steps: toStringArray(obj.steps),
    interpretationNote: typeof obj.interpretationNote === "string" ? obj.interpretationNote : null
  };
}

const VALID_DIFF_TYPES = Object.values(Diff) as string[];

function toDiffAnnotations(value: unknown): DiffAnnotation[] {
  const parsed = parseJsonColumn(value);
  if (!Array.isArray(parsed)) return [];

  const annotations: DiffAnnotation[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const obj = item as Record<string, unknown>;

    const diffType = obj.type;
    // skip anything that doesnt look like one of our known diff types
    if (typeof diffType !== "string" || !VALID_DIFF_TYPES.includes(diffType)) continue;

    annotations.push({
      section: obj.section === "steps" ? "steps" : "ingredients",
      index: typeof obj.index === "number" ? obj.index : 0,
      type: diffType as DiffType,
      before: typeof obj.before === "string" ? obj.before : null,
      after: typeof obj.after === "string" ? obj.after : null
    });
  }
  return annotations;
}

function toTweak(row: DbTweakRow): Tweak {
  return {
    id: row.id,
    recipeId: row.recipeId,
    author: row.author,
    date: row.date,
    text: row.text,
    sortOrder: row.sortOrder,
    modified: toModifiedRecipe(row.modified),
    diff: toDiffAnnotations(row.diff),
    createdAt: toIsoString(row.createdAt)
  };
}

// turns one prisma recipe row (with its tweaks included) into the shared
// RecipeBundle contract: { recipe, tweaks } instead of the flat prisma blob
export function toRecipeBundle(row: DbRecipeRow): RecipeBundle {
  const recipe: Recipe = {
    id: row.id,
    url: row.url,
    title: row.title,
    imageUrl: row.imageUrl,
    description: row.description,
    servings: row.servings,
    prepTime: row.prepTime,
    cookTime: row.cookTime,
    ingredients: toStringArray(row.ingredients),
    steps: toStringArray(row.steps),
    createdAt: toIsoString(row.createdAt)
  };

  const tweaks = Array.isArray(row.tweaks) ? row.tweaks.map(toTweak) : [];

  return { recipe, tweaks };
}