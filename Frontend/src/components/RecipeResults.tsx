import { useRecipeStore } from '@/store/recipeStore';
import { TweakSwitcher } from '@/components/tweaks/TweakSwitcher';
import { RecipeView } from '@/components/recipe/RecipeView';
import { DiffLegend } from '@/components/recipe/DiffLegend';

export function RecipeResults() {
  const { bundle, selectedTweakId, selectTweak, clearSelection } = useRecipeStore();

  if (!bundle) return null;

  // fallback to empty array just in case, tho store should have sanatized it already
  const tweaks = Array.isArray(bundle.tweaks) ? bundle.tweaks : [];
  const selectedTweak = tweaks.find((t) => t.id === selectedTweakId) ?? null;
  const hasTweaks = tweaks.length > 0;

  return (
    <div className="w-full max-w-5xl mt-6 p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
      {/* recipe header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 border-b border-gray-100 pb-8">
        {bundle.recipe.imageUrl && (
          <img
            src={bundle.recipe.imageUrl}
            alt={bundle.recipe.title}
            className="w-full md:w-48 h-48 object-cover rounded-xl shadow-md"
          />
        )}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {bundle.recipe.title}
          </h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4 font-medium">
            {bundle.recipe.prepTime && (
              <span className="flex items-center gap-1">⏱️ Prep: {bundle.recipe.prepTime}</span>
            )}
            {bundle.recipe.cookTime && (
              <span className="flex items-center gap-1">🍳 Cook: {bundle.recipe.cookTime}</span>
            )}
            {bundle.recipe.servings && (
              <span className="flex items-center gap-1">🍽️ Servings: {bundle.recipe.servings}</span>
            )}
          </div>
          {bundle.recipe.description && (
            <p className="text-gray-600 line-clamp-3 leading-relaxed">{bundle.recipe.description}</p>
          )}
        </div>
      </div>

      {/* tweaks summary */}
      <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl mb-6">
        <h3 className="font-bold text-blue-900 text-lg mb-1 flex items-center gap-2">
          <span>🎉</span> Found {tweaks.length} Featured Tweak
          {tweaks.length === 1 ? '' : 's'}!
        </h3>
        <p className="text-blue-800 text-sm">
          {hasTweaks
            ? 'Pick a tweak below to see how that reviewer changed the recipe. The differences light up like a code diff.'
            : 'No community tweaks were found for this one, so here is the original recipe.'}
        </p>
      </div>

      {/* switcher tabs */}
      <div className="mb-6">
        <TweakSwitcher
          tweaks={tweaks}
          selectedTweakId={selectedTweakId}
          onSelect={selectTweak}
          onViewOriginal={clearSelection}
        />
      </div>

      {/* show the actual review text for context when a tweak is picked */}
      {selectedTweak && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-gray-900">
              {selectedTweak.author ? selectedTweak.author : 'A home cook'} said:
            </span>{' '}
            “{selectedTweak.text}”
          </p>
        </div>
      )}

      {/* color legend only matters when were looking at a modified version */}
      {selectedTweak && (
        <div className="mb-6">
          <DiffLegend />
        </div>
      )}

      {/* the recipe itself, original or modified */}
      <RecipeView recipe={bundle.recipe} tweak={selectedTweak} />

      {/* raw json for debugging */}
      <details className="text-sm border-t border-gray-100 pt-6 mt-8">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium select-none">
          Inspect Raw JSON Bundle (Debug)
        </summary>
        <pre className="mt-4 p-4 bg-gray-900 text-green-400 text-xs overflow-auto rounded-lg max-h-96 font-mono">
          {JSON.stringify(bundle, null, 2)}
        </pre>
      </details>
    </div>
  );
}