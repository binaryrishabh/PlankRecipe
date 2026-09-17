import { useRecipeStore } from '@/store/recipeStore';

// the friendly "what is this place" block that fills the empty homepage.
// it shows up for anyone who hasnt interacted yet, and gets out of the way
// the moment they analyze a link or open a saved recipe — the store flips
// explainerDismissed inside loadBundle, which both actions go through
export function SiteIntro() {
  const { explainerDismissed } = useRecipeStore();
  if (explainerDismissed) return null;

  return (
    <section className="w-full max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">So, what is this place?</h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          Scroll to the bottom of any AllRecipes page and you'll find the good stuff:{' '}
          <span className="font-semibold text-gray-800">Featured Tweaks</span> — where home cooks
          confess how they actually make the recipe. Less sugar, double the garlic, skip the
          broiler. This site reads all of those reviews for you and turns every real modification
          into a clean, color coded diff on top of the original recipe.
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="font-semibold text-gray-800 text-sm mb-1">Paste any AllRecipes link</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              The full recipe gets fetched — ingredients, steps, prep and cook times, servings —
              even for pages that fight back.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="font-semibold text-gray-800 text-sm mb-1">Every tweak becomes a tab</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              An AI reads all the featured reviews and pulls out exactly what each cook changed,
              added or skipped — no digging through fifty comments.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="font-semibold text-gray-800 text-sm mb-1">Diffs you can read at a glance</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Added lines glow green, removed ones get struck in red, changes shine yellow, and
              general tips float up as blue notes.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 md:p-5">
          <p className="font-semibold text-blue-900 text-sm mb-2">What you get out of it</p>
          <ul className="text-sm text-blue-800 space-y-1.5 list-disc pl-5">
            <li>One click to flip between the original recipe and any community tweak</li>
            <li>GitHub-PR style highlights, so you see exactly what to do differently</li>
            <li>Everything you analyze is saved — revisit it instantly from the recent list up top</li>
            <li>A re-scrape button on each saved recipe for when new tweaks show up</li>
            <li>No account, no paywall. Paste a link and cook</li>
          </ul>
        </div>

        <p className="mt-5 text-xs text-gray-400 italic">
          Made for home cooks who read the reviews before they preheat the oven.
        </p>
      </div>
    </section>
  );
}