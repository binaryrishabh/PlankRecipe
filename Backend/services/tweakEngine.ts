import crypto from "crypto";
import type { Recipe } from "@shared/interface/Recipe.interface";
import type { Tweak } from "@shared/interface/Tweak.interface";
import type { ModifiedRecipe } from "@shared/interface/ModifiedRecipe.interface";
import type { DiffAnnotation } from "@shared/interface/DiffAnnotation.interface";
import { config } from "../utils/config";

// gemini openai-compatible endpoint. paid tier handles bursts easily
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
// flash-lite is fastest + cheapest for extraction. swap to gemini-2.5-flash if needed
const MODEL = "gemini-2.5-flash-lite"; 

const SYSTEM_PROMPT = `You extract recipe modifications from user reviews. 
Return ONLY valid JSON with this exact schema:
{
  "modifiedIngredients": ["string"],
  "modifiedSteps": ["string"],
  "diffs": [
    {
      "section": "ingredients" | "steps",
      "index": 0,
      "type": "added" | "removed" | "changed" | "note",
      "before": "exact original string or null",
      "after": "new string or null"
    }
  ]
}
If no modifications exist, return empty arrays and a single 'note' diff with the review text.`;

async function extractTweak(recipe: Recipe, reviewText: string) {
  if (!reviewText.trim()) return null;

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.GEMINI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        // keeping prompt short so the llm doesnt get confused or waste tokens
        { role: "user", content: `Recipe: ${JSON.stringify({ingredients: recipe.ingredients, steps: recipe.steps})}\nReview: "${reviewText}"` }
      ]
    })
  });

  if (!response.ok) return null;
  
  const data = await response.json() as any;
  return JSON.parse(data.choices[0].message.content);
}

export async function generateTweaks(recipe: Recipe, rawReviews: any[]): Promise<Tweak[]> {
  // limit to 20 reviews to keep it snappy
  const reviews = rawReviews.slice(0, 20);
  
  // fire all at once. gemini paid tier handles concurrent requests easily
  // no need for complex promise pools or rate limiters
  const results = await Promise.all(reviews.map(async (review, index) => {
    const text = review.reviewBody || review.text || "";
    const parsed = await extractTweak(recipe, text);
    
    // fallback if LLM fails or returns garbage
    const diffs: DiffAnnotation[] = parsed?.diffs || [{ 
      section: "steps", index: 0, type: "note", before: null, after: text 
    }];
    
    const modified: ModifiedRecipe = {
      ingredients: parsed?.modifiedIngredients || recipe.ingredients,
      steps: parsed?.modifiedSteps || recipe.steps,
      interpretationNote: null
    };

    return {
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      author: review.author?.name || null,
      date: review.datePublished || null,
      text,
      sortOrder: index,
      modified,
      diff: diffs,
      createdAt: new Date().toISOString()
    };
  }));

  return results;
}