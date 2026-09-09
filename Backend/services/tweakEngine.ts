import crypto from "crypto";
import type { Recipe } from "@shared/interface/Recipe.interface";
import type { Tweak } from "@shared/interface/Tweak.interface";
import type { ModifiedRecipe } from "@shared/interface/ModifiedRecipe.interface";
import type { DiffAnnotation } from "@shared/interface/DiffAnnotation.interface";
import { config } from "../utils/config";

// gemini openai-compatible endpoint
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
// flash-lite is fastest + cheapest for extraction
const MODEL = "gemini-3.5-flash-lite";

// diffs-only schema. the frontend rebuilds the modified view from the
// original recipe + these diffs, so asking the llm to rewrite the whole
// recipe was just wasting tokens and time
const SYSTEM_PROMPT = `You extract recipe modifications from user reviews.
Return ONLY valid JSON with this exact schema:
{
  "diffs": [
    {
      "section": "ingredients" | "steps",
      "type": "added" | "removed" | "changed" | "note",
      "before": "exact original string or null",
      "after": "new string or null"
    }
  ]
}
Rules:
- For "removed" and "changed", copy the original recipe line EXACTLY into "before".
- "added" = new ingredient/step, "note" = general advice that maps to no specific line.
- If the review has no real modifications, return {"diffs": []}.`;

const VALID_TYPES = ["added", "removed", "changed", "note"];

// lowercase + squish spaces so sloppy llm quotes can still be matched
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// the frontend matches "before" strings EXACTLY against recipe lines, but the
// llm almost never quotes them perfectly. so we find the closest real line and
// swap it in — without this the diffs silently never light up
function fixDiffs(rawDiffs: any[], recipe: Recipe): DiffAnnotation[] {
  if (!Array.isArray(rawDiffs)) return [];

  const fixed: DiffAnnotation[] = [];

  for (const d of rawDiffs) {
    if (!d || !VALID_TYPES.includes(d.type)) continue;

    const section = d.section === "steps" ? "steps" : "ingredients";
    const source = section === "steps" ? recipe.steps : recipe.ingredients;

    let before: string | null = typeof d.before === "string" ? d.before : null;
    const after: string | null = typeof d.after === "string" ? d.after : null;

    // drop diffs missing the fields their type needs
    if ((d.type === "added" || d.type === "note") && !after) continue;
    if (d.type === "changed" && (!before || !after)) continue;
    if (d.type === "removed" && !before) continue;

    // swap the llm's sloppy quote for the real recipe line
    if (before && (d.type === "changed" || d.type === "removed")) {
      const normBefore = normalize(before);
      const match =
        source.find((line) => line === before) ||
        source.find((line) => normalize(line).includes(normBefore)) ||
        source.find((line) => normBefore.includes(normalize(line)));

      if (!match) continue; // llm invented this line, drop it
      before = match;
    }

    fixed.push({
      section,
      index: 0, // frontend matches by content not position, so this stays 0
      type: d.type,
      before,
      after
    });
  }

  return fixed;
}

async function extractTweak(recipe: Recipe, reviewText: string): Promise<any[]> {
  if (!reviewText.trim()) return [];

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
        { role: "user", content: `Recipe:\nIngredients: ${JSON.stringify(recipe.ingredients)}\nSteps: ${JSON.stringify(recipe.steps)}\n\nReview: "${reviewText}"` }
      ]
    })
  });

  if (!response.ok) {
    // log the real reason so we stop guessing (429 = billing not active on the key, 400 = bad request etc)
    const body = await response.text();
    console.warn(`[extractor] gemini error ${response.status}: ${body.slice(0, 200)}`);
    return [];
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed?.diffs) ? parsed.diffs : [];
  } catch {
    console.warn("[extractor] llm returned invalid json for a review, skipping");
    return [];
  }
}

export async function generateTweaks(recipe: Recipe, rawReviews: any[]): Promise<Tweak[]> {
  const reviews = rawReviews.slice(0, 20);

  // fire all at once. gemini paid tier handles concurrent requests easily
  const results = await Promise.all(reviews.map(async (review, index) => {
    const text = review.reviewBody || review.text || "";

    const rawDiffs = await extractTweak(recipe, text);
    const diffs = fixDiffs(rawDiffs, recipe);

    // llm found nothing (or the call failed) — keep the review as a plain note
    if (diffs.length === 0 && text.trim()) {
      diffs.push({ section: "steps", index: 0, type: "note", before: null, after: text });
    }

    // frontend renders the modified view from original + diffs, so modified
    // just carries the origional arrays to satisfy the shared contract
    const modified: ModifiedRecipe = {
      ingredients: [...recipe.ingredients],
      steps: [...recipe.steps],
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

  const withRealDiffs = results.filter((t) => t.diff.some((d) => d.type !== "note")).length;
  console.log(`[extractor] done — ${withRealDiffs}/${results.length} tweaks have real diffs`);

  return results;
}