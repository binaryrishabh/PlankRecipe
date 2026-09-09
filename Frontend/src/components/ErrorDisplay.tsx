import { useRecipeStore } from '@/store/recipeStore';

export function ErrorDisplay() {
  const { error, reset } = useRecipeStore();

  if (!error) return null;

  return (
    <div className="w-full max-w-2xl p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
      <div className="text-red-500 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <div className="flex-1">
        <p className="font-semibold text-red-800 text-sm">Something went wrong</p>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
      <button 
        onClick={reset}
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        Dismiss
      </button>
    </div>
  );
}