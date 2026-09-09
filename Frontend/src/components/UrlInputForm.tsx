import { useState, type FormEvent } from 'react';
import { useRecipeStore } from '@/store/recipeStore';

export function UrlInputForm() {
  const [url, setUrl] = useState('');
  const { loadBundle, loading } = useRecipeStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    loadBundle(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl flex gap-3">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.allrecipes.com/recipe/..."
        required
        disabled={loading}
        className="flex-1 px-5 py-3.5 text-base border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  );
}