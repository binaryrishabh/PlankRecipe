import type { RecipeBundle } from "@shared/interface/RecipeBundle.interface";
import { fetchRecipeHtml, fetchReviews } from "./fetcher";
import { parseHtmlToData } from "./jsonLdParser";
import { generateTweaks } from "./tweakEngine";

export async function scrapeRecipe(url: string): Promise<RecipeBundle> {
  // 1. get html (with fixture fallback for 402 blocks)
  const html = await fetchRecipeHtml(url);

  // 2. parse JSON-LD
  const { recipe, rawReviews: initialReviews } = parseHtmlToData(html, url);

  // 3. fetch reviews from api if they arent in the json-ld (which they usually arent)
  let reviews = initialReviews;
  if (reviews.length === 0) {
    const match = url.match(/\/recipe\/(\d+)/);
    if (match && match[1]) {
      console.log(`[scraper] fetching reviews from api for id ${match[1]}...`);
      reviews = await fetchReviews(match[1]);
    }
  }

  // 4. run rule engine to find tweaks
  const tweaks = generateTweaks(recipe, reviews);

  return {
    recipe,
    tweaks
  };
}