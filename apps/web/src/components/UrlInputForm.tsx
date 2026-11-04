import { useState, type FormEvent } from 'react';
import { useRecipeStore } from '@/store/recipeStore';
import { UrlHintAnnotation } from './UrlHintAnnotation';

export function UrlInputForm() {
  const [url, setUrl] = useState('');
  const { loadBundle, loading } = useRecipeStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    loadBundle(url.trim());
  };

  return (
    // relative wrapper so the hand drawn note can hang off the top left
    <div className="relative w-full max-w-2xl">
      <UrlHintAnnotation />
      <form onSubmit={handleSubmit} className="w-full flex gap-3">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.allrecipes.com/recipe/..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  );
}