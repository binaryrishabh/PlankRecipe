import { config } from "../utils/config";
import type { Recipe } from "@shared/interface/Recipe.interface";
import type { DiffAnnotation } from "@shared/interface/DiffAnnotation.interface";
import type { ModifiedRecipe } from "@shared/interface/ModifiedRecipe.interface";
import type { DiffType } from "@shared/enums/Diff.enum";

export interface LLMTweakResult {
  modified: ModifiedRecipe;
  diff: DiffAnnotation[];
}

// the system prompt forces the model to act like a strict diff generator.
// we explicitly tell it that 'before' strings must be verbatim copies of the
// original ingredients so the frontend's exact-match replay logic doesnt break.
const SYSTEM_PROMPT = `You are an expert recipe editor. You will be given an original recipe (ingredients and steps) and a community review describing how the reviewer modified it.
Your job is to output the modified recipe and a list of diff annotations.

Rules for diff annotations:
- "added": A new ingredient or step was added. 'before' must be null, 'after' is the new text.
- "removed": An ingredient was omitted. 'before' must be the EXACT original ingredient string, 'after' is null.
- "changed": An ingredient was substituted or its quantity changed. 'before' must be the EXACT original ingredient string, 'after' is the new string.
- "note": If the review describes a technique or tip that doesn't fit a specific ingredient/step change, add a note. 'section' is "steps", 'index' is 0, 'before' is null, 'after' is the note text.

CRITICAL: For "changed" and "removed", the 'before' string MUST exactly match one of the original ingredient strings provided, character for character. Do not alter the original text in the 'before' field.

Output ONLY valid JSON matching this TypeScript interface:
{
  "modified": {
    "ingredients": string[],
    "steps": string[],
    "interpretationNote": string | null
  },
  "diff": Array<{
    "section": "ingredients" | "steps",
    "index": number,
    "type": "added" | "removed" | "changed" | "note",
    "before": string | null,
    "after": string | null
  }>
}
Do not include markdown formatting or code blocks. Just the raw JSON.`;

export async function generateTweakWithLLM(recipe: Recipe, reviewText: string, author: string | null): Promise<LLMTweakResult | null> {
  // degrade gracefully if the env var is missing or empty
  if (!config.LLM_API_KEY) {
    return null; 
  }

  const userPrompt = `Original Ingredients:\n${recipe.ingredients.join("\n")}\n\nOriginal Steps:\n${recipe.steps.join("\n")}\n\nReviewer (${author || "Anonymous"}): "${reviewText}"`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.LLM_TIMEOUT_MS);

  try {
    const response = await fetch(config.LLM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: config.LLM_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[llm] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return validateLLMResponse(parsed, recipe);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.warn("[llm] request timed out");
    } else {
      console.warn(`[llm] error: ${err.message}`);
    }
    return null;
  }
}

// sanitizes the LLM output to guarantee it matches the shared contracts.
// if the model hallucinates a slightly different 'before' string, we try to
// map it back to the real original ingredient so the frontend can still render it.
function validateLLMResponse(parsed: any, recipe: Recipe): LLMTweakResult | null {
  if (!parsed || typeof parsed !== "object") return null;
  if (!parsed.modified || !Array.isArray(parsed.modified.ingredients) || !Array.isArray(parsed.modified.steps)) return null;
  if (!Array.isArray(parsed.diff)) return null;

  const validDiff: DiffAnnotation[] = [];
  const originalIngredients = recipe.ingredients;

  for (const d of parsed.diff) {
    if (!d || typeof d !== "object") continue;
    
    const section = d.section === "steps" ? "steps" : "ingredients";
    const type = d.type;
    
    if (!["added", "removed", "changed", "note"].includes(type)) continue;

    let before = typeof d.before === "string" ? d.before : null;
    let after = typeof d.after === "string" ? d.after : null;
    let index = typeof d.index === "number" ? d.index : 0;

    // CRITICAL: ensure 'before' exactly matches an original ingredient for changed/removed
    if (section === "ingredients" && (type === "changed" || type === "removed")) {
      if (!before || !originalIngredients.includes(before)) {
        // try to find a close match if the LLM hallucinated a slight variation
        const match = originalIngredients.find(orig => 
          orig.toLowerCase().includes((before || "").toLowerCase()) || 
          (before || "").toLowerCase().includes(orig.toLowerCase())
        );
        if (match) {
          before = match;
          index = originalIngredients.indexOf(match);
        } else {
          continue; // drop invalid diff if we cant map it to a real ingredient
        }
      }
    }

    validDiff.push({
      section,
      index,
      type: type as DiffType,
      before,
      after
    });
  }

  return {
    modified: {
      ingredients: parsed.modified.ingredients.filter((i: any) => typeof i === "string"),
      steps: parsed.modified.steps.filter((s: any) => typeof s === "string"),
      // keep interpretationNote but force to null if we already have a note diff to avoid duplicate banners
      interpretationNote: validDiff.some(d => d.type === "note") 
        ? null 
        : (typeof parsed.modified.interpretationNote === "string" ? parsed.modified.interpretationNote : null)
    },
    diff: validDiff
  };
}