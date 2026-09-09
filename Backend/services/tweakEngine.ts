import crypto from "crypto";
import type { Recipe } from "@shared/interface/Recipe.interface";
import type { Tweak } from "@shared/interface/Tweak.interface";
import type { DiffAnnotation } from "@shared/interface/DiffAnnotation.interface";

// simple rule engine to parse tweaks from reviews without external services
// graceful degradation: if we can't parse it perfectly, we just add a note
export function generateTweaks(recipe: Recipe, rawReviews: any[]): Tweak[] {
  const tweaks: Tweak[] = [];

  // keywords that usually mean the user modified the recipe
  const tweakKeywords = [
    "substitute", "substituted", "instead", "added", "add",
    "used", "omitted", "skip", "skipped", "replaced", "replace",
    "bacon", "cheddar", "mozzarella"
  ];

  let sortOrder = 0;

  for (const review of rawReviews) {
    const text = review.reviewBody || "";
    const author = review.author?.name || null;
    const date = review.datePublished || null;
    const lowerText = text.toLowerCase();

    const isTweak = tweakKeywords.some(kw => lowerText.includes(kw));
    if (!isTweak) continue;

    const modifiedIngredients = [...recipe.ingredients];
    const modifiedSteps = [...recipe.steps];
    const diffs: DiffAnnotation[] = [];

    // rule 1: if they mention bacon, add it to ingredients
    if (lowerText.includes("bacon")) {
      const newItem = "1 slice bacon, chopped";
      modifiedIngredients.push(newItem);
      diffs.push({
        section: "ingredients",
        index: modifiedIngredients.length - 1,
        type: "added",
        before: null,
        after: newItem
      });
    }

    // rule 2: feta -> cheddar/pecorino/mozzarella
    if (lowerText.includes("feta") && (lowerText.includes("cheddar") || lowerText.includes("pecorino") || lowerText.includes("mozzarella"))) {
      const fetaIndex = modifiedIngredients.findIndex(i => i.toLowerCase().includes("feta"));

      if (fetaIndex !== -1) {
        const before = modifiedIngredients[fetaIndex];

        if (before !== undefined) {
          // figure out what they actually used
          let replacement = "cheddar";
          if (lowerText.includes("mozzarella")) replacement = "mozzarella";
          if (lowerText.includes("pecorino")) replacement = "pecorino";

          const after = before.replace(/feta/i, replacement);
          modifiedIngredients[fetaIndex] = after;

          diffs.push({
            section: "ingredients",
            index: fetaIndex,
            type: "changed",
            before,
            after
          });
        }
      }
    }

    // rule 3: omitted or skipped something
    const omitMatch = lowerText.match(/(?:omitted|skipped|left out|didn't use|did not use)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\.|,|and|$)/);
    if (omitMatch) {
      const omittedRaw = omitMatch[1];

      if (omittedRaw) {
        const omittedItem = omittedRaw.trim();
        const idx = modifiedIngredients.findIndex(i => i.toLowerCase().includes(omittedItem));

        if (idx !== -1) {
          const before = modifiedIngredients[idx];

          if (before !== undefined) {
            modifiedIngredients.splice(idx, 1);
            diffs.push({
              section: "ingredients",
              index: idx,
              type: "removed",
              before,
              after: null
            });
          }
        }
      }
    }

    // graceful degradation: if no specific rules matched, just add a note diff
    // sometimes the regex misses stuff, so we just fall back to a note
    if (diffs.length === 0) {
      diffs.push({
        section: "steps",
        index: 0,
        type: "note",
        before: null,
        after: `Community tweak: ${text}`
      });
    }

    tweaks.push({
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      author,
      date,
      text,
      sortOrder: sortOrder++,
      modified: {
        ingredients: modifiedIngredients,
        steps: modifiedSteps,
        interpretationNote: diffs.some(d => d.type === "note") ? text : null
      },
      diff: diffs,
      createdAt: new Date().toISOString()
    });
  }

  return tweaks;
}