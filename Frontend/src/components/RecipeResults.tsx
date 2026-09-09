import { useRecipeStore } from '@/store/recipeStore';

export function RecipeResults() {
  const { bundle } = useRecipeStore();

  if (!bundle) return null;

  return (
    <div className="w-full max-w-5xl mt-6 p-8 bg-white rounded-2xl shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 border-b border-gray-100 pb-8">
        {bundle.recipe.imageUrl && (
          <img 
            src={bundle.recipe.imageUrl} 
            alt={bundle.recipe.title}
            className="w-full md:w-56 h-56 object-cover rounded-xl shadow-lg"
          />
        )}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{bundle.recipe.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4 font-medium">
            {bundle.recipe.prepTime && <span className="flex items-center gap-1">⏱️ Prep: {bundle.recipe.prepTime}</span>}
            {bundle.recipe.cookTime && <span className="flex items-center gap-1">🍳 Cook: {bundle.recipe.cookTime}</span>}
            {bundle.recipe.servings && <span className="flex items-center gap-1">🍽️ Servings: {bundle.recipe.servings}</span>}
          </div>
          {bundle.recipe.description && (
            <p className="text-gray-600 line-clamp-3 leading-relaxed">
              {bundle.recipe.description}
            </p>
          )}
        </div>
      </div>

      {/* Tweaks Success Banner */}
      <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl mb-8">
        <h3 className="font-bold text-blue-900 text-lg mb-1 flex items-center gap-2">
          <span>🎉</span> Found {bundle.tweaks.length} Featured Tweaks!
        </h3>
        <p className="text-blue-800 text-sm">
          Select a community tweak below to see the modified recipe and diff highlights. (Diff UI coming in Phase 3).
        </p>
      </div>

      {/* Tweaks Grid (Placeholder for Phase 3 interaction) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {bundle.tweaks.map((tweak, idx) => (
          <button 
            key={tweak.id}
            className="text-left p-5 bg-gray-50 hover:bg-white hover:shadow-md border border-gray-200 hover:border-blue-300 rounded-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Tweak #{idx + 1}</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-medium">
                {tweak.modified.ingredients.length} items
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-3">
              "{tweak.text || 'No review text available.'}"
            </p>
            {tweak.author && (
              <p className="text-xs text-gray-400 font-medium mt-auto">— {tweak.author}</p>
            )}
          </button>
        ))}
      </div>
      
      {/* Raw JSON Fallback */}
      <details className="text-sm border-t border-gray-100 pt-6">
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