import type { RecipeBundle } from "@shared/interface/RecipeBundle.interface";
import { fetchRecipeHtml, fetchReviews } from "./fetcher";
import { parseHtmlToData } from "./jsonLdParser";
import { generateTweaks } from "./tweakEngine";

export async function scrapeRecipe(url: string): Promise<RecipeBundle> {
  // 1. get html (curl under the hood gets us past the 402 block)
  const html = await fetchRecipeHtml(url);

  // 2. parse JSON-LD
  const { recipe, rawReviews: embeddedReviews } = parseHtmlToData(html, url);

  // 3. reviews almost never show up in the json-ld, they live behind the api.
  // allways ask the api first so we capture the full set of reviews, and only
  // fall back to whatever was embedded in the page if the api comes back empty
  let reviews: any[] = [];
  const idMatch = url.match(/\/recipe\/(\d+)/);
  if (idMatch && idMatch[1]) {
    console.log(`[scraper] fetching reviews from api for id ${idMatch[1]}...`);
    reviews = await fetchReviews(idMatch[1]);
  }
  if (reviews.length === 0) {
    reviews = embeddedReviews;
  }

  // 4. run rule engine to turn every review into a tweak (1:1 mapping)
  const tweaks = generateTweaks(recipe, reviews);

  return {
    recipe,
    tweaks
  };
}