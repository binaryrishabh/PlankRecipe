import { useEffect, useState } from 'react';
import { useRecipeStore } from '@/store/recipeStore';

// how many chips we show before collapsing the rest behind "Show all", so a
// long history never turns into a wall of pills
const COLLAPSED_COUNT = 2;

// the strip of previously analyzed recipes. covers the "persist so they can
// be revisited later" requirement. backend caps the list at the newest 20 and
// we collapse after 8, so it stays tidy no matter how much gets analyzed
export function RecentRecipes() {
  const { history, loading, loadBundle, loadHistory } = useRecipeStore();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // pull the list once when the app opens
    loadHistory();
  }, [loadHistory]);

  if (history.length === 0) return null;

  const visible = showAll ? history : history.slice(0, COLLAPSED_COUNT);

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Recently analyzed — click to revisit instantly
        </p>
        {history.length > COLLAPSED_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {showAll ? 'Show less' : `Show all ${history.length}`}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map((item) => (
          <div
            key={item.recipe.id}
            className="group flex items-stretch bg-white border border-gray-300 rounded-full overflow-hidden hover:border-blue-400 transition-colors"
            title={item.recipe.url}
          >
            {/* main area — opens the saved bundle instantly from the db */}
            <button
              type="button"
              disabled={loading}
              onClick={() => loadBundle(item.recipe.url)}
              className="flex items-center gap-2 pl-4 pr-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span className="max-w-48 truncate font-medium">{item.recipe.title}</span>
              <span className="text-xs text-gray-400 group-hover:text-blue-500">
                {item.tweaks.length} tweak{item.tweaks.length === 1 ? '' : 's'}
              </span>
            </button>

            {/* re-scrape — forces a fresh pull in case new tweaks showed up on
                allrecipes since we saved this one, so we never serve stale data */}
            <button
              type="button"
              disabled={loading}
              onClick={() => loadBundle(item.recipe.url, { refresh: true })}
              title="Re-scrape for fresh tweaks"
              className="px-2.5 border-l border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}