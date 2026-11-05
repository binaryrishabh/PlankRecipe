import { useEffect } from 'react';
import { SiteShell } from '@/components/layout/SiteShell';
import { LogoMark } from '@/components/brand/Logo';

// /extension — the browser extension's home. Store links go in STORES once the
// listings are approved; until then each shows "coming soon".
const STORES: { name: string; url: string | null }[] = [
  { name: 'Chrome', url: null },
  { name: 'Edge', url: null },
  { name: 'Firefox', url: null },
];

const points = [
  { t: 'Right on the recipe', b: 'A small Cook’s Diff button sits in the corner of recipe pages. Already-analyzed recipes show their tweak count instantly.' },
  { t: 'One click, every review read', b: 'See how many cooks changed the recipe, the most-changed ingredients and what they swapped in.' },
  { t: 'Private by design', b: 'No account, no tracking, no access to your browsing history. It only runs on recipe pages and only analyzes when you click.' },
];

export function ExtensionPage() {
  useEffect(() => {
    document.title = "Cook's Diff browser extension | See recipe tweaks while you browse";
  }, []);

  return (
    <SiteShell>
      <section className="paper-lines border-b border-cream-300">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-600">
              Browser extension
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink-900">
              The reviews, read for you &mdash; <span className="italic text-saffron-600">right on the recipe.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-600">
              Cook&rsquo;s Diff for Chrome, Edge and Firefox shows what home cooks changed while you&rsquo;re reading the recipe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {STORES.map((s) =>
                s.url ? (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-ink-900 px-5 py-3 font-semibold text-cream-50 hover:bg-ink-700">
                    Add to {s.name}
                  </a>
                ) : (
                  <span key={s.name} className="rounded-xl border border-cream-300 bg-cream-50 px-5 py-3 font-semibold text-ink-500">
                    {s.name} &middot; coming soon
                  </span>
                ),
              )}
            </div>
          </div>

          {/* illustrative mock of the in-page button + panel (not a real page) */}
          <div aria-hidden="true" className="hidden justify-center lg:flex">
            <div className="relative w-80">
              <div className="rounded-3xl border border-cream-300 bg-cream-50 p-5 shadow-[0_30px_70px_-25px_rgba(28,25,23,0.45)]">
                <div className="mb-3 flex items-center gap-2 font-display font-semibold"><LogoMark className="h-6 w-6" /> Cook&rsquo;s <em className="text-saffron-600">Diff</em></div>
                <p className="font-display text-xl font-semibold text-ink-900">14 of 16 cooks changed this recipe</p>
                {[['¾ cup white sugar', 6], ['1 tsp espresso powder', 4], ['Flaky salt on top', 3]].map(([l, n]) => (
                  <div key={l as string} className="mt-3 rounded-xl border border-cream-300 p-3">
                    <div className="flex justify-between text-sm font-semibold"><span>{l}</span><span className="font-normal text-ink-500">{n} cooks</span></div>
                    <div className="mt-2 h-1.5 rounded-full bg-cream-200"><div className="h-full rounded-full bg-saffron-400" style={{ width: `${(Number(n) / 6) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-6 right-0 flex items-center gap-2 rounded-full bg-ink-900 py-2 pl-2 pr-4 text-sm font-semibold text-cream-50 shadow-lg">
                <LogoMark className="h-7 w-7" /> Cooks&rsquo; tweaks <span className="rounded-full bg-saffron-400 px-2 py-0.5 text-xs text-ink-900">16</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <ul className="grid gap-4 md:grid-cols-3">
          {points.map((p) => (
            <li key={p.t} className="rounded-2xl border border-cream-300 bg-cream-50 p-6">
              <h2 className="text-lg font-semibold text-ink-900">{p.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.b}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink-500">
          Read exactly what the extension does in our <a href="/privacy" className="underline underline-offset-2 hover:text-ink-900">privacy policy</a>.
        </p>
      </div>
    </SiteShell>
  );
}
