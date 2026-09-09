import crypto from "crypto";
import type { Recipe } from "@shared/interface/Recipe.interface";
import type { Tweak } from "@shared/interface/Tweak.interface";
import type { DiffAnnotation } from "@shared/interface/DiffAnnotation.interface";
import type { ModifiedRecipe } from "@shared/interface/ModifiedRecipe.interface";
import { Diff, type DiffType } from "@shared/enums/Diff.enum";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const MAX_REVIEWS = 15;

const SYSTEM_PROMPT = `You are a recipe modification extractor. You will be given a base recipe (ingredients and steps) and a user review. 
Extract how the user modified the recipe. 
Return ONLY valid JSON matching this exact schema:
{
  "modifiedIngredients": ["string"],
  "modifiedSteps": ["string"],
  "diffs": [
    {
      "section": "ingredients" | "steps",
      "index": number,
      "type": "added" | "removed" | "changed" | "note",
      "before": "string" | null,
      "after": "string" | null
    }
  ]
}
Rules:
- For 'changed' diffs, the 'before' string MUST exactly match the original recipe string character-for-character.
- If the review is just generic praise with no actual recipe modifications, return empty arrays for ingredients/steps, and a single 'note' diff containing the review text.
- Do not hallucinate ingredients. Only use what the reviewer explicitly mentioned.`;

// calls the external analyzer api to figure out what changed in the recipe
async function analyzeReview(recipe: Recipe, reviewText: string): Promise<{ modified: ModifiedRecipe; diffs: DiffAnnotation[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  
  // fallback to a simple note if the api key isnt configured
  if (!apiKey) {
    return createFallbackNote(reviewText, recipe);
  }

  const userPrompt = `Base Recipe:\n${JSON.stringify({ ingredients: recipe.ingredients, steps: recipe.steps })}\n\nUser Review:\n"${reviewText}"`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.warn(`[extractor] api request failed with status ${response.status}`);
      return createFallbackNote(reviewText, recipe);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return createFallbackNote(reviewText, recipe);
    }

    const parsed = JSON.parse(content);
    return validateAndMapResponse(parsed, recipe, reviewText);
  } catch (err: any) {
    // if json parsing fails or network error occured, just use the fallback
    console.warn(`[extractor] error parsing response: ${err.message}`);
    return createFallbackNote(reviewText, recipe);
  }
}

function createFallbackNote(reviewText: string, recipe: Recipe): { modified: ModifiedRecipe; diffs: DiffAnnotation[] } {
  return {
    modified: {
      ingredients: [...recipe.ingredients],
      steps: [...recipe.steps],
      interpretationNote: null
    },
    diffs: [{
      section: "steps",
      index: 0,
      type: Diff.NOTE,
      before: null,
      after: reviewText ? `Community tweak: ${reviewText}` : "Community tweak: (reviewer left no text)"
    }]
  };
}

// the analyzer sometimes hallucinates slight variations of the 'before' string,
// so we strictly validate the diffs to ensure the frontend diff viewer doesnt break
function validateAndMapResponse(parsed: any, recipe: Recipe, reviewText: string): { modified: ModifiedRecipe; diffs: DiffAnnotation[] } {
  if (!parsed || !Array.isArray(parsed.diffs)) {
    return createFallbackNote(reviewText, recipe);
  }

  const validDiffs: DiffAnnotation[] = [];
  const validTypes = Object.values(Diff) as string[];

  for (const d of parsed.diffs) {
    if (!d || typeof d !== "object") continue;
    
    const section = d.section === "steps" ? "steps" : "ingredients";
    if (!validTypes.includes(d.type)) continue;

    const before = typeof d.before === "string" ? d.before : null;
    const after = typeof d.after === "string" ? d.after : null;
    const index = typeof d.index === "number" ? d.index : 0;

    // for changed/removed, verify the before string actually exists in the original recipe
    if (section === "ingredients" && (d.type === "changed" || d.type === "removed")) {
      if (before && !recipe.ingredients.includes(before)) {
        continue; 
      }
    }

    validDiffs.push({
      section,
      index,
      type: d.type as DiffType,
      before,
      after
    });
  }

  // if no valid diffs were extracted, treat it as a generic note
  if (validDiffs.length === 0) {
    return createFallbackNote(reviewText, recipe);
  }

  const modifiedIngredients = Array.isArray(parsed.modifiedIngredients) 
    ? parsed.modifiedIngredients.filter((i: any) => typeof i === "string") 
    : [...recipe.ingredients];
    
  const modifiedSteps = Array.isArray(parsed.modifiedSteps) 
    ? parsed.modifiedSteps.filter((s: any) => typeof s === "string") 
    : [...recipe.steps];

  return {
    modified: {
      ingredients: modifiedIngredients,
      steps: modifiedSteps,
      interpretationNote: null
    },
    diffs: validDiffs
  };
}

export async function generateTweaks(recipe: Recipe, rawReviews: any[]): Promise<Tweak[]> {
  const tweaks: Tweak[] = [];
  
  // only process the first 15 reviews to avoid hitting rate limits on the free tier
  const reviewsToProcess = rawReviews.slice(0, MAX_REVIEWS);

  for (let i = 0; i < reviewsToProcess.length; i++) {
    const review = reviewsToProcess[i];
    const text = review.reviewBody || "";
    const author = review.author?.name || null;
    const date = review.datePublished || null;

    const result = await analyzeReview(recipe, text);

    tweaks.push({
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      author,
      date,
      text,
      sortOrder: i,
      modified: result.modified,
      diff: result.diffs,
      createdAt: new Date().toISOString()
    });
  }

  return tweaks;
}