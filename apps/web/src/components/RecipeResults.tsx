import { useState } from 'react';
import { useRecipeStore, shareUrlFor } from '@/store/recipeStore';
import { TweakSwitcher } from '@/components/tweaks/TweakSwitcher';
import { RecipeView } from '@/components/recipe/RecipeView';
import { DiffLegend } from '@/components/recipe/DiffLegend';
import { SourceLink } from '@/components/recipe/SourceLink';

function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    // native share sheet on phones, clipboard everywhere else
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "See how cooks changed this recipe — Cook's Diff" });
        return;
      } catch {
        // dismissed or unsupported: fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-cream-50 transition-colors hover:bg-ink-700"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v13" />
      </svg>
      {copied ? 'Link copied' : 'Share these tweaks'}
    </button>
  );
}

export function RecipeResults() {
  const { bundle, selectedTweakId, selectTweak, clearSelection } = useRecipeStore();

  if (!bundle) return null;

  // fallback to empty array just in case, tho store should have sanatized it already
  const tweaks = Array.isArray(bundle.tweaks) ? bundle.tweaks : [];
  const selectedTweak = tweaks.find((t) => t.id === selectedTweakId) ?? null;
  const hasTweaks = tweaks.length > 0;
  const shareUrl = shareUrlFor(bundle);
  const meta = [
    bundle.recipe.prepTime && `Prep ${bundle.recipe.prepTime}`,
    bundle.recipe.cookTime && `Cook ${bundle.recipe.cookTime}`,
    bundle.recipe.servings && `Serves ${bundle.recipe.servings}`,
  ].filter(Boolean);

  return (
    <div className="w-full max-w-5xl rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.3)] md:p-8">
      {/* recipe header */}
      <div className="mb-8 flex flex-col gap-6 border-b border-cream-300 pb-8 md:flex-row">
        {bundle.recipe.imageUrl && (
          <img
            src={bundle.recipe.imageUrl}
            alt={bundle.recipe.title}
            className="h-48 w-full rounded-2xl object-cover md:w-48"
          />
        )}
        <div className="flex-1">
          <h2 className="mb-2 font-display text-3xl font-semibold leading-tight text-ink-900">
            {bundle.recipe.title}
          </h2>
          {meta.length > 0 && <p className="mb-3 text-sm font-medium text-ink-500">{meta.join(' · ')}</p>}
          {bundle.recipe.description && (
            <p className="line-clamp-3 leading-relaxed text-ink-600">{bundle.recipe.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {shareUrl && <ShareButton url={shareUrl} />}
            <SourceLink url={bundle.recipe.url} />
          </div>
        </div>
      </div>

      {/* tweaks summary */}
      <div className="mb-6 rounded-2xl bg-ink-900 p-5 text-cream-100">
        <h3 className="mb-1 font-display text-xl font-semibold text-cream-50">
          Found {tweaks.length} cook&rsquo;s tweak{tweaks.length === 1 ? '' : 's'}
        </h3>
        <p className="text-sm text-cream-300">
          {hasTweaks
            ? 'Pick a tweak below to see how that cook changed the recipe. Every change is highlighted against the original.'
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

      {/* the cook's own words, for context when a tweak is picked */}
      {selectedTweak && (
        <blockquote className="mb-6 rounded-2xl border border-cream-300 bg-white/70 p-4">
          <p className="text-sm leading-relaxed text-ink-700">
            <span className="font-semibold text-ink-900">
              {selectedTweak.author ? selectedTweak.author : 'A home cook'} said:
            </span>{' '}
            &ldquo;{selectedTweak.text}&rdquo;
          </p>
        </blockquote>
      )}

      {/* color legend only matters when were looking at a modified version */}
      {selectedTweak && (
        <div className="mb-6">
          <DiffLegend />
        </div>
      )}

      {/* the recipe itself, original or modified */}
      <RecipeView recipe={bundle.recipe} tweak={selectedTweak} />
    </div>
  );
}
