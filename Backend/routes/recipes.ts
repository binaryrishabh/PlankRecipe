import { Router } from "express";
import { createRecipeSchema } from "../zod_schemas/recipes";
import { scrapeRecipe } from "../services/scraper";
import { prisma } from "../lib/prisma";

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

  const { url } = parseResult.data;

  try {
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
    const fullBundle = await prisma.recipe.findUnique({
      where: { url: bundle.recipe.url },
      include: {
        tweaks: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    res.status(200).json(fullBundle);
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
      include: { tweaks: true }
    });
    res.status(200).json(recipes);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;