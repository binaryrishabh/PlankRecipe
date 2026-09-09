import { Router } from "express";
import { createRecipeSchema } from "../zod_schemas/recipes";
import { scrapeRecipe } from "../services/scraper";

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
    // scrape the page and build the bundle, hopefullly it doesnt crash
    const bundle = await scrapeRecipe(url);
    res.status(200).json(bundle);
  } catch (error: any) {
    console.error("[scraper] somthing went wrong:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to scrape recipe"
    });
  }
});

export default router;