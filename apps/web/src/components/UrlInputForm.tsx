import { useState, type FormEvent } from 'react';
import { useRecipeStore } from '@/store/recipeStore';

// handOff: on pages that don't show results themselves (browse, kitchen, …),
// send the link to the home page (/?url=…), which analyzes it on arrival
export function UrlInputForm({ handOff = false }: { handOff?: boolean }) {
  const [url, setUrl] = useState('');
  const { loadBundle, loading } = useRecipeStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!value) return;
    if (handOff) {
      window.location.assign(`/?url=${encodeURIComponent(value)}`);
      return;
    }
    loadBundle(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-2xl flex-col gap-2 rounded-2xl bg-cream-50 p-2 shadow-[0_12px_40px_-18px_rgba(28,25,23,0.35)] ring-1 ring-cream-300 focus-within:ring-2 focus-within:ring-ink-900 sm:flex-row"
    >
      <label htmlFor="recipe-url" className="sr-only">
        Recipe link
      </label>
      <input
        id="recipe-url"
        type="url"
        required
        inputMode="url"
        autoComplete="off"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a recipe link, e.g. allrecipes.com/recipe/…"
        className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-base text-ink-900 placeholder-ink-500/70 focus:outline-none"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-ink-900 px-6 py-3 font-semibold text-cream-50 transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Reading reviews…' : 'Show the tweaks'}
      </button>
    </form>
  );
}
