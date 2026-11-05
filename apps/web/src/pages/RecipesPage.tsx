import { useEffect, useMemo, useState } from 'react';
import type { RecipeCard } from '@shared/interface/RecipePage.interface';
import { fetchRecipeCards } from '@/api/pages';
import { SiteShell } from '@/components/layout/SiteShell';
import { RecipeCardGrid } from '@/components/recipes/RecipeCardGrid';
import { UrlInputForm } from '@/components/UrlInputForm';

// /recipes — every analyzed recipe, searchable. The server also renders the
// list as plain links (api/browse.ts) so crawlers can reach every recipe page.
export function RecipesPage() {
  const [cards, setCards] = useState<RecipeCard[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    document.title = "Browse recipes and how cooks change them | Cook's Diff";
    fetchRecipeCards(200)
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!cards || !term) return cards ?? [];
    return cards.filter((c) => c.title.toLowerCase().includes(term) || c.teaser?.toLowerCase().includes(term));
  }, [cards, q]);

  return (
    <SiteShell>
      <section className="paper-lines border-b border-cream-300">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 md:text-5xl">
            Recipes, <span className="italic text-saffron-600">as cooks really make them</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-600">
            Every recipe here has had its reviews read and its tweaks pulled out. Pick one to see what cooks change most.
          </p>
          <label htmlFor="recipe-search" className="sr-only">Search recipes</label>
          <input
            id="recipe-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipes or ingredients — e.g. cookies, garlic"
            className="mt-6 w-full max-w-xl rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-ink-900 placeholder-ink-500/70 focus:outline-none focus:ring-2 focus:ring-ink-900"
          />
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
        {cards === null && (
          <div role="status" className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
        )}
        {cards !== null && shown.length > 0 && <RecipeCardGrid cards={shown} />}
        {cards !== null && shown.length === 0 && (
          <p className="text-ink-600">
            {q ? `Nothing matches “${q}” yet — paste its link below and it will be the first.` : 'No recipes yet — be the first.'}
          </p>
        )}

        <section className="rounded-3xl bg-ink-900 p-8 text-cream-100">
          <h2 className="font-display text-2xl font-semibold text-cream-50">Don&rsquo;t see your recipe?</h2>
          <p className="mt-2 mb-5 text-cream-300">Paste its link and we&rsquo;ll read every review for you.</p>
          <UrlInputForm handOff />
        </section>
      </div>
    </SiteShell>
  );
}
