import { useEffect } from 'react';
import { SiteShell } from '@/components/layout/SiteShell';
import { UrlInputForm } from '@/components/UrlInputForm';
import { useKitchen } from '@/store/kitchenStore';

// /kitchen — the visitor's saved recipes, stored in this browser only
export function KitchenPage() {
  const saved = useKitchen((s) => s.saved);
  const remove = useKitchen((s) => s.remove);

  useEffect(() => {
    document.title = "My Kitchen | Cook's Diff";
  }, []);

  return (
    <SiteShell>
      <section className="paper-lines border-b border-cream-300">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 md:text-5xl">My Kitchen</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-600">
            Recipes you saved, with every cook&rsquo;s tweak one click away. Saved in this browser &mdash; no account needed.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
        {saved.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-cream-300 bg-cream-50 p-10 text-center">
            <p className="font-display text-2xl text-ink-900">Your kitchen is empty</p>
            <p className="mx-auto mt-2 max-w-md text-ink-600">
              Open any recipe and press <strong>Save to My Kitchen</strong>. It&rsquo;ll be waiting here next time you cook.
            </p>
            <a href="/recipes" className="mt-6 inline-block rounded-xl bg-ink-900 px-5 py-3 font-semibold text-cream-50 hover:bg-ink-700">
              Browse recipes
            </a>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {saved.map((r) => (
              <li key={r.slug} className="flex items-center justify-between gap-4 rounded-2xl border border-cream-300 bg-cream-50 p-4">
                <a href={`/r/${r.slug}`} className="min-w-0 flex-1 group">
                  <p className="truncate font-display text-xl font-semibold text-ink-900 group-hover:underline group-hover:decoration-saffron-400 group-hover:underline-offset-4">
                    {r.title}
                  </p>
                  <p className="text-sm text-ink-500">
                    {r.tweakCount} tweak{r.tweakCount === 1 ? '' : 's'} · saved {new Date(r.savedAt).toLocaleDateString()}
                  </p>
                </a>
                <button
                  type="button"
                  onClick={() => remove(r.slug)}
                  className="shrink-0 rounded-lg border border-cream-300 px-3 py-2 text-sm text-ink-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  aria-label={`Remove ${r.title} from My Kitchen`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <section className="rounded-3xl bg-ink-900 p-8 text-cream-100">
          <h2 className="font-display text-2xl font-semibold text-cream-50">Add a recipe</h2>
          <p className="mt-2 mb-5 text-cream-300">Paste a link, then save it to your kitchen.</p>
          <UrlInputForm handOff />
        </section>
      </div>
    </SiteShell>
  );
}
