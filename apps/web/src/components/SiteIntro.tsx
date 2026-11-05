import { useRecipeStore } from '@/store/recipeStore';

const steps = [
  {
    n: '01',
    title: 'Paste a recipe link',
    body: 'The full recipe comes through — ingredients, steps, times and servings — even from pages that fight back.',
  },
  {
    n: '02',
    title: 'We read every review',
    body: 'An AI goes through all the reviews and pulls out exactly what each cook changed, added or skipped. No digging through fifty comments.',
  },
  {
    n: '03',
    title: 'Flip between versions',
    body: 'Each cook’s version becomes a tab. Switch to it and see the changes highlighted, line by line, on top of the original.',
  },
];

// "how it works" block for first-time visitors. it steps aside the moment they
// analyze a link or open a saved recipe (the store flips explainerDismissed in
// loadBundle, which both actions go through)
export function SiteIntro() {
  const { explainerDismissed } = useRecipeStore();
  if (explainerDismissed) return null;

  return (
    <section aria-labelledby="how-title" className="w-full max-w-5xl">
      <h2 id="how-title" className="font-display text-3xl font-semibold tracking-tight text-ink-900 mb-2">
        Reviews are where the real recipe lives
      </h2>
      <p className="max-w-2xl text-ink-600 leading-relaxed mb-8">
        Scroll past any popular recipe and you&rsquo;ll find hundreds of cooks confessing how they
        <em> actually</em> make it. Less sugar, double the garlic, skip the broiler. Cook&rsquo;s Diff
        reads all of it and turns every real change into a clean, color-coded diff.
      </p>

      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-2xl border border-cream-300 bg-cream-50 p-6">
            <span className="font-display text-sm font-semibold text-saffron-600">{s.n}</span>
            <h3 className="mt-2 text-lg font-semibold text-ink-900">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-ink-900 px-6 py-4 text-sm text-cream-100">
        <span className="font-semibold">Reading the colors:</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-green-500" /> added</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-red-500" /> removed</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-yellow-400" /> changed</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-blue-400" /> cook&rsquo;s note</span>
        <span className="ml-auto text-cream-300">Free · no account · nothing to install</span>
      </div>
    </section>
  );
}
