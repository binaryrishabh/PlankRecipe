import { Router } from "express";
import { createRecipeSchema } from "../zod_schemas/recipes";
import { scrapeRecipe } from "../services/scraper";
import { prisma } from "../lib/prisma";
import { toRecipeBundle } from "../utils/mappers";

const router = Router();

// POST /api/recipes
router.post("/", async (req, res) => {
  const parseResult = createRecipeSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: parseResult.error.issues[0]?.message || "Invalid request body"
    });
    return;
  }

  const { url, refresh } = parseResult.data;

  try {
    // "persist so they can be revisited later" — if we already scraped this url
    // and got real tweaks, serve the saved bundle instantly instead of burning
    // time + gemini tokens on a re-scrape
    if (!refresh) {
      const existing = await prisma.recipe.findUnique({
        where: { url },
        include: { tweaks: { orderBy: { sortOrder: "asc" } } }
      });

      // only trust the cache when at least one tweak has a real diff. a run
      // that died halfway can leave behind note-only junk we want to redo
      const hasRealDiffs = existing?.tweaks.some((t) => {
        const diffs = Array.isArray(t.diff) ? (t.diff as any[]) : [];
        return diffs.some((d) => d && d.type !== "note");
      });

      if (existing && hasRealDiffs) {
        console.log(`[cache] serving "${existing.title}" straight from the db (${existing.tweaks.length} tweaks)`);
        res.status(200).json(toRecipeBundle(existing));
        return;
      }
    }

    // scrape the page and build the bundle, hopefully it doesnt crash
    const bundle = await scrapeRecipe(url);

    // persist to db so we can revisit later (assignemnt requirement)
    const savedRecipe = await prisma.recipe.upsert({
      where: { url: bundle.recipe.url },
      update: {
        title: bundle.recipe.title,
        imageUrl: bundle.recipe.imageUrl,
        description: bundle.recipe.description,
        servings: bundle.recipe.servings,
        prepTime: bundle.recipe.prepTime,
        cookTime: bundle.recipe.cookTime,
        ingredients: bundle.recipe.ingredients,
        steps: bundle.recipe.steps,
      },
      create: {
        url: bundle.recipe.url,
        title: bundle.recipe.title,
        imageUrl: bundle.recipe.imageUrl,
        description: bundle.recipe.description,
        servings: bundle.recipe.servings,
        prepTime: bundle.recipe.prepTime,
        cookTime: bundle.recipe.cookTime,
        ingredients: bundle.recipe.ingredients,
        steps: bundle.recipe.steps,
      }
    });

    // delete old tweaks if we are re-scraping, to avoid dupes
    await prisma.tweak.deleteMany({ where: { recipeId: savedRecipe.id } });

    // save new tweaks
    if (bundle.tweaks.length > 0) {
      await prisma.tweak.createMany({
        data: bundle.tweaks.map(t => ({
          recipeId: savedRecipe.id,
          author: t.author,
          date: t.date,
          text: t.text,
          sortOrder: t.sortOrder,
          // prisma gets super strict about json types and complains about missing index signatures
          // so we just cast to any to bypass the type checker here, its safe since its valid json
          modified: t.modified as any,
          diff: t.diff as any
        }))
      });
    }

    // fetch full bundle from db to return with correct IDs
    const dbRecipe = await prisma.recipe.findUnique({
      where: { url: bundle.recipe.url },
      include: {
        tweaks: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    if (!dbRecipe) {
      // basically never happens since the upsert above just wrote it, but just in case
      throw new Error("Recipe was saved but could not be read back from the db");
    }

    // map the flat prisma row into the shared RecipeBundle shape ({ recipe, tweaks })
    // the frontend looks for raw.recipe, so sending the flat row made it render "Untitled Recipe"
    res.status(200).json(toRecipeBundle(dbRecipe));
  } catch (error: any) {
    console.error("[scraper] somthing went wrong:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to scrape recipe"
    });
  }
});

// GET /api/recipes/history - to revisit later
router.get("/history", async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        tweaks: {
          orderBy: { sortOrder: "asc" }
        }
      }
    });
    // same mapping as above so history matches the RecipeBundle contract too
    res.status(200).json(recipes.map(toRecipeBundle));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;