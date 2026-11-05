import { useEffect, useState } from 'react';
import type { RecipePage } from '@shared/interface/RecipePage.interface';
import { fetchRecipePage } from '@/api/pages';
import { useRecipeStore } from '@/store/recipeStore';
import { SiteShell } from '@/components/layout/SiteShell';
import { RecipeResults } from '@/components/RecipeResults';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { UrlInputForm } from '@/components/UrlInputForm';

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function lead(p: RecipePage): string {
  const top = p.mostChangedIngredients
    .slice(0, 2)
    .map((s) => `${s.line} (${plural(s.changed + s.removed, 'cook')})`)
    .join(', ');
  return `${p.cooksWithChanges} of ${p.tweakCount} reviewing cooks changed this recipe.${
    top ? ` The most-changed ingredients: ${top}.` : ''
  }`;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-cream-300 bg-cream-50 px-5 py-4">
      <p className="font-display text-3xl font-semibold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

function ChangeLine({ c }: { c: RecipePage['tweaks'][number]['ingredientChanges'][number] }) {
  if (c.type === 'added') {
    return (
      <li className="flex gap-2 rounded-md border-l-[3px] border-green-600 bg-green-50 px-2 py-0.5 text-green-900">
        <span aria-hidden="true" className="font-bold">+</span>
        <span>{c.after}</span>
      </li>
    );
  }
  if (c.type === 'removed') {
    return (
      <li className="flex gap-2 rounded-md border-l-[3px] border-red-500 bg-red-50 px-2 py-0.5 text-red-800">
        <span aria-hidden="true" className="font-bold">−</span>
        <span className="line-through decoration-red-400">{c.before}</span>
      </li>
    );
  }
  return (
    <li className="flex gap-2 rounded-md border-l-[3px] border-yellow-500 bg-yellow-50 px-2 py-0.5 text-yellow-900">
      <span aria-hidden="true" className="font-bold">~</span>
      <span>
        {c.after} <span className="text-yellow-800/70">(was {c.before})</span>
      </span>
    </li>
  );
}

function Summary({ p }: { p: RecipePage }) {
  const { bundle, loading, loadBundle } = useRecipeStore();
  // any loaded bundle is shown here: this recipe's full comparison, or a recipe
  // with no tweaks yet (which has no page of its own to move to)
  const showingFull = bundle !== null;
  const maxChanged = Math.max(1, ...p.mostChangedIngredients.map((s) => s.changed + s.removed));
  const meta = [p.prepTime && `Prep ${p.prepTime}`, p.cookTime && `Cook ${p.cookTime}`, p.servings && `Serves ${p.servings}`].filter(Boolean);
  const tweaksWithChanges = p.tweaks.filter((t) => t.ingredientChanges.length || t.stepChanges || t.notes);

  return (
    <>
      <section className="paper-lines border-b border-cream-300">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-500">
            <a href="/" className="hover:text-ink-900">Cook&rsquo;s Diff</a>
            <span className="mx-2">›</span>
            <span className="text-ink-700">{p.title}</span>
          </nav>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900 md:text-5xl">
            How home cooks change <span className="italic text-saffron-600">{p.title}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-600">{lead(p)}</p>
          {meta.length > 0 && <p className="mt-2 text-sm text-ink-500">{meta.join(' · ')}</p>}

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value={p.tweakCount} label="reviews read" />
            <Stat value={p.cooksWithChanges} label="cooks made changes" />
            <Stat value={p.totals.changed + p.totals.added + p.totals.removed} label="changes found" />
            <Stat value={p.totals.notes} label="cooking tips" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!showingFull && (
              <button
                type="button"
                disabled={loading}
                onClick={() => loadBundle(p.sourceUrl)}
                className="rounded-xl bg-ink-900 px-6 py-3 font-semibold text-cream-50 transition-colors hover:bg-ink-700 disabled:opacity-60"
              >
                {loading ? 'Loading the comparison…' : 'Open the full side-by-side comparison'}
              </button>
            )}
            <a
              href={p.sourceUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="rounded-xl border border-cream-300 bg-cream-50 px-5 py-3 font-semibold text-ink-900 hover:border-ink-500 hover:bg-white"
            >
              Original recipe on {p.sourceHost}
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-12 sm:px-6">
        <ErrorDisplay />
        {showingFull && <RecipeResults />}

        {p.mostChangedIngredients.length > 0 && (
          <section aria-labelledby="most-changed">
            <h2 id="most-changed" className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              Most-changed ingredients
            </h2>
            <p className="mt-1 mb-6 text-ink-600">Which lines of the original recipe cooks touch most, and what they swap in.</p>
            <ol className="flex flex-col gap-3">
              {p.mostChangedIngredients.map((s) => {
                const total = s.changed + s.removed;
                return (
                  <li key={s.line} className="rounded-2xl border border-cream-300 bg-cream-50 p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-semibold text-ink-900">{s.line}</p>
                      <p className="shrink-0 text-sm text-ink-500">{plural(total, 'cook')}</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200" aria-hidden="true">
                      <div className="h-full rounded-full bg-saffron-400" style={{ width: `${(total / maxChanged) * 100}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-ink-600">
                      {s.changed > 0 && <>{plural(s.changed, 'cook')} changed it</>}
                      {s.changed > 0 && s.removed > 0 && ', '}
                      {s.removed > 0 && <>{s.removed} left it out</>}
                    </p>
                    {s.examples.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {s.examples.map((e) => (
                          <li key={e} className="rounded-full border border-yellow-300 bg-yellow-50 px-3 py-0.5 text-xs text-yellow-900">
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {p.commonAdditions.length > 0 && (
          <section aria-labelledby="additions">
            <h2 id="additions" className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              What cooks add
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {p.commonAdditions.map((a) => (
                <li key={a.line} className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-sm text-green-900">
                  + {a.line}
                  {a.count > 1 && <span className="ml-1 text-green-700">×{a.count}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {tweaksWithChanges.length > 0 && (
          <section aria-labelledby="every-tweak">
            <h2 id="every-tweak" className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              Every cook&rsquo;s tweak
            </h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {tweaksWithChanges.map((t) => (
                <li key={t.n} className="rounded-2xl border border-cream-300 bg-cream-50 p-5">
                  <h3 className="font-semibold text-ink-900">Cook {t.n}</h3>
                  {t.ingredientChanges.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1 font-mono text-[13px] leading-6">
                      {t.ingredientChanges.map((c, i) => (
                        <ChangeLine key={i} c={c} />
                      ))}
                    </ul>
                  )}
                  {(t.stepChanges > 0 || t.notes > 0) && (
                    <p className="mt-3 text-sm text-ink-500">
                      {[t.stepChanges > 0 && plural(t.stepChanges, 'method change'), t.notes > 0 && plural(t.notes, 'tip')]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="rounded-3xl bg-ink-900 p-8 text-cream-100">
          <h2 className="font-display text-2xl font-semibold text-cream-50">Got another recipe?</h2>
          <p className="mt-2 mb-5 text-cream-300">Paste its link and see how cooks changed it.</p>
          <UrlInputForm />
        </section>
      </div>
    </>
  );
}

export function RecipePageView({ slug }: { slug: string }) {
  const [page, setPage] = useState<RecipePage | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchRecipePage(slug)
      .then((p) => {
        if (cancelled) return;
        setPage(p);
        document.title = `How cooks change ${p.title}: ${plural(p.tweakCount, 'tweak')} | Cook's Diff`;
      })
      .catch(() => !cancelled && setPage(null));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <SiteShell>
      {page === undefined && (
        <div role="status" className="mx-auto mt-24 h-12 w-12 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
      )}
      {page === null && (
        <section className="mx-auto flex max-w-2xl flex-col items-start px-4 py-20 sm:px-6">
          <h1 className="font-display text-4xl font-semibold text-ink-900">We haven&rsquo;t read this one yet</h1>
          <p className="mt-3 mb-8 text-ink-600">Paste the recipe&rsquo;s link and we&rsquo;ll go through every review.</p>
          <UrlInputForm />
        </section>
      )}
      {page && <Summary p={page} />}
    </SiteShell>
  );
}
