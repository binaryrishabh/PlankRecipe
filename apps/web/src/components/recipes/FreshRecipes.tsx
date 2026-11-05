import { useEffect, useState } from 'react';
import type { RecipeCard } from '@shared/interface/RecipePage.interface';
import { fetchRecipeCards } from '@/api/pages';
import { RecipeCardGrid } from './RecipeCardGrid';

// "Fresh from the kitchen": the newest analyzed recipes on the home page.
// Hides itself entirely if there's nothing to show or the API is down.
export function FreshRecipes() {
  const [cards, setCards] = useState<RecipeCard[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchRecipeCards(6)
      .then((c) => !cancelled && setCards(c))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="fresh-title" className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="fresh-title" className="font-display text-3xl font-semibold tracking-tight text-ink-900">
            Fresh from the kitchen
          </h2>
          <p className="mt-1 text-ink-600">Recipes cooks just looked at, and what everyone changes in them.</p>
        </div>
        <a href="/recipes" className="text-sm font-semibold text-ink-900 underline decoration-saffron-400 underline-offset-4 hover:decoration-ink-900">
          Browse all recipes →
        </a>
      </div>
      <RecipeCardGrid cards={cards} />
    </section>
  );
}
