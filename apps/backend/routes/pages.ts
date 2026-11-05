import { Router } from "express";
import { prisma } from "../lib/prisma";
import { toRecipeBundle } from "../utils/mappers";
import { recipeSlug, idPrefixFromSlug } from "@shared/utils/slug";
import type { RecipeBundle } from "@shared/interface/RecipeBundle.interface";
import type {
  RecipePage,
  RecipePageListItem,
  IngredientChangeStat,
  AddedIngredientStat,
} from "@shared/interface/RecipePage.interface";

// Public, read-only data behind the shareable /r/<slug> pages and the sitemap.
// Only our own analysis goes out here (see RecipePage.interface.ts).

const router = Router();

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function buildRecipePage(bundle: RecipeBundle): RecipePage {
  const { recipe, tweaks } = bundle;
  const totals = { added: 0, removed: 0, changed: 0, notes: 0 };
  const byLine = new Map<string, IngredientChangeStat>();
  const additions = new Map<string, AddedIngredientStat>();
  let cooksWithChanges = 0;

  const pageTweaks = tweaks.map((t, i) => {
    let stepChanges = 0;
    let notes = 0;
    const ingredientChanges: RecipePage["tweaks"][number]["ingredientChanges"] = [];

    for (const d of t.diff) {
      if (d.type === "note") {
        notes++;
        totals.notes++;
        continue;
      }
      totals[d.type]++;
      if (d.section === "steps") {
        stepChanges++;
        continue;
      }
      ingredientChanges.push({ type: d.type, before: d.before, after: d.after });

      if ((d.type === "changed" || d.type === "removed") && d.before) {
        const stat = byLine.get(d.before) ?? { line: d.before, changed: 0, removed: 0, examples: [] };
        stat[d.type]++;
        if (d.type === "changed" && d.after && stat.examples.length < 3 && !stat.examples.includes(d.after)) {
          stat.examples.push(d.after);
        }
        byLine.set(d.before, stat);
      } else if (d.type === "added" && d.after) {
        const key = norm(d.after);
        const stat = additions.get(key) ?? { line: d.after, count: 0 };
        stat.count++;
        additions.set(key, stat);
      }
    }

    if (ingredientChanges.length > 0 || stepChanges > 0) cooksWithChanges++;
    return { n: i + 1, ingredientChanges, stepChanges, notes };
  });

  const mostChangedIngredients = [...byLine.values()]
    .sort((a, b) => b.changed + b.removed - (a.changed + a.removed))
    .slice(0, 10);
  const commonAdditions = [...additions.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  return {
    slug: recipeSlug(recipe.title, recipe.id),
    title: recipe.title,
    sourceUrl: recipe.url,
    sourceHost: hostOf(recipe.url),
    servings: recipe.servings,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    analyzedAt: recipe.createdAt,
    tweakCount: tweaks.length,
    cooksWithChanges,
    totals,
    mostChangedIngredients,
    commonAdditions,
    tweaks: pageTweaks,
  };
}

// GET /api/pages — every analyzed recipe with at least one tweak, for the sitemap
router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.recipe.findMany({
      where: { tweaks: { some: {} } },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { tweaks: true } },
        tweaks: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const items: RecipePageListItem[] = rows.map((r) => {
      const last = r.tweaks[0]?.createdAt ?? r.createdAt;
      return {
        slug: recipeSlug(r.title, r.id),
        title: r.title,
        tweakCount: r._count.tweaks,
        updatedAt: new Date(last).toISOString(),
      };
    });

    res.set("Cache-Control", "public, max-age=300");
    res.json(items);
  } catch (error: any) {
    console.error("[pages] list failed:", error);
    res.status(500).json({ success: false, message: "Could not list recipes" });
  }
});

// GET /api/pages/by-url?url=... — has this recipe been analyzed already?
// Only reads our own database (never scrapes), so the browser extension can
// show a tweak count on page load without any automated fetching.
// Must stay above "/:slug" or Express would treat "by-url" as a slug.
router.get("/by-url", async (req, res) => {
  const raw = typeof req.query.url === "string" ? req.query.url : "";
  let candidates: string[];
  try {
    const u = new URL(raw);
    const base = `${u.origin}${u.pathname}`.replace(/\/+$/, "");
    candidates = [base, `${base}/`];
  } catch {
    res.status(400).json({ success: false, message: "Invalid url" });
    return;
  }

  try {
    const row = await prisma.recipe.findFirst({
      where: { url: { in: candidates } },
      include: { tweaks: { orderBy: { sortOrder: "asc" } } },
    });

    if (!row || row.tweaks.length === 0) {
      res.status(404).json({ success: false, message: "Not analyzed yet" });
      return;
    }

    res.set("Cache-Control", "public, max-age=120");
    res.json(buildRecipePage(toRecipeBundle(row)));
  } catch (error: any) {
    console.error("[pages] by-url lookup failed:", error);
    res.status(500).json({ success: false, message: "Could not look up recipe" });
  }
});

// GET /api/pages/:slug — the public summary for one recipe
router.get("/:slug", async (req, res) => {
  const prefix = idPrefixFromSlug(req.params.slug);
  if (!prefix) {
    res.status(404).json({ success: false, message: "Recipe not found" });
    return;
  }

  try {
    const row = await prisma.recipe.findFirst({
      where: { id: { startsWith: prefix } },
      include: { tweaks: { orderBy: { sortOrder: "asc" } } },
    });

    if (!row || row.tweaks.length === 0) {
      res.status(404).json({ success: false, message: "Recipe not found" });
      return;
    }

    res.set("Cache-Control", "public, max-age=300");
    res.json(buildRecipePage(toRecipeBundle(row)));
  } catch (error: any) {
    console.error("[pages] lookup failed:", error);
    res.status(500).json({ success: false, message: "Could not load recipe" });
  }
});

export default router;
