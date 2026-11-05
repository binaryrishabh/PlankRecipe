import type { RecipeCard } from '@shared/interface/RecipePage.interface';
import { useKitchen } from '@/store/kitchenStore';

// tile grid linking to each recipe's /r/<slug> page. real <a> links, so both
// visitors and crawlers can follow them.
export function RecipeCardGrid({ cards }: { cards: RecipeCard[] }) {
  // select the stable array, derive afterwards (a fresh array per selector call
  // would make zustand re-render forever)
  const saved = useKitchen((s) => s.saved);
  const savedSlugs = saved.map((r) => r.slug);

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <li key={c.slug}>
          <a
            href={`/r/${c.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-cream-300 bg-cream-50 p-5 transition-all hover:-translate-y-0.5 hover:border-ink-500 hover:bg-white hover:shadow-[0_18px_40px_-24px_rgba(28,25,23,0.45)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl font-semibold leading-snug text-ink-900 group-hover:underline group-hover:decoration-saffron-400 group-hover:underline-offset-4">
                {c.title}
              </h3>
              {savedSlugs.includes(c.slug) && (
                <span className="shrink-0 rounded-full bg-saffron-100 px-2 py-0.5 text-[11px] font-semibold text-saffron-600">
                  Saved
                </span>
              )}
            </div>
            {c.teaser && <p className="mt-2 text-sm leading-relaxed text-ink-600">{c.teaser}</p>}
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs font-medium text-ink-500">
              <span className="rounded-full bg-ink-900 px-2.5 py-1 text-cream-50">
                {c.tweakCount} tweak{c.tweakCount === 1 ? '' : 's'}
              </span>
              <span>{c.changeCount} changes</span>
              <span aria-hidden="true">·</span>
              <span>{c.sourceHost}</span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
