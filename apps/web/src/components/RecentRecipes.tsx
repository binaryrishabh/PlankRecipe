import { useEffect, useState } from 'react';
import { useRecipeStore } from '@/store/recipeStore';

// how many chips we show before collapsing the rest behind "Show all", so a
// long history never turns into a wall of pills
const COLLAPSED_COUNT = 2;

// the strip of previously analyzed recipes. backend caps the list at the
// newest 20 and we collapse the overflow, so it stays tidy no matter what
export function RecentRecipes() {
  const { history, loading, loadBundle, loadHistory } = useRecipeStore();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // pull the list once when the app opens
    loadHistory();
  }, [loadHistory]);

  if (history.length === 0) return null;

  const visible = showAll ? history : history.slice(0, COLLAPSED_COUNT);
  const hasHidden = history.length > COLLAPSED_COUNT;

  return (
    <div className="w-full max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2 px-1">
        Recently analyzed — click to revisit instantly
      </p>
      <div className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <div
            key={item.recipe.id}
            className="flex items-stretch rounded-full border border-cream-300 bg-cream-50 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => loadBundle(item.recipe.url)}
              disabled={loading}
              className="px-4 py-1.5 text-sm text-ink-700 hover:bg-white truncate max-w-55 text-left disabled:opacity-60"
              title={item.recipe.url}
            >
              {item.recipe.title}
            </button>
            <button
              onClick={() => loadBundle(item.recipe.url, { refresh: true })}
              disabled={loading}
              className="px-2.5 py-1.5 text-ink-500 hover:text-ink-900 hover:bg-white border-l border-cream-300 disabled:opacity-60"
              title="Re-read the reviews for fresh tweaks"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {hasHidden && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 text-xs font-medium text-ink-700 underline-offset-2 hover:underline px-1"
        >
          {showAll ? 'Show less' : `Show all ${history.length}`}
        </button>
      )}
    </div>
  );
}