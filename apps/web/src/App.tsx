import { useEffect } from 'react';
import { UrlInputForm } from '@/components/UrlInputForm';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { RecipeResults } from '@/components/RecipeResults';
import { useRecipeStore } from '@/store/recipeStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RecentRecipes } from '@/components/RecentRecipes';
import { SiteIntro } from '@/components/SiteIntro';
import { SiteShell } from '@/components/layout/SiteShell';
import { HeroDiffCard } from '@/components/landing/HeroDiffCard';
import { Faq } from '@/components/landing/Faq';
import { RecipePageView } from '@/pages/RecipePageView';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { RecipesPage } from '@/pages/RecipesPage';
import { KitchenPage } from '@/pages/KitchenPage';
import { ExtensionPage } from '@/pages/ExtensionPage';
import { FreshRecipes } from '@/components/recipes/FreshRecipes';
import { Analytics } from '@vercel/analytics/react';

function LoadingState() {
  return (
    <div role="status" className="mt-6 flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
      <p className="font-display text-xl text-ink-900">Reading every review&hellip;</p>
      <p className="text-sm text-ink-500">Fresh recipes take 10&ndash;20 seconds. Ones we&rsquo;ve seen before load instantly.</p>
    </div>
  );
}

function HomePage() {
  const { loading, explainerDismissed, loadBundle } = useRecipeStore();

  // /?url=<recipe link>: other pages hand links off here, and it doubles as a
  // shareable "analyze this recipe" link. Runs once on arrival.
  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get('url');
    if (url && /^https?:\/\//i.test(url)) void loadBundle(url);
  }, [loadBundle]);

  return (
    <SiteShell>
      {/* hero */}
      <section className="paper-lines">
        <div
          className={`mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 ${
            explainerDismissed ? 'py-10' : 'py-14 md:py-20 lg:grid-cols-[1.15fr_1fr]'
          }`}
        >
          <div className="flex flex-col items-start">
            {!explainerDismissed && (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                The reviews, already read for you
              </p>
            )}
            <h1
              className={`font-display font-semibold tracking-tight text-ink-900 ${
                explainerDismissed ? 'text-3xl md:text-4xl' : 'text-5xl leading-[1.05] md:text-6xl'
              }`}
            >
              See exactly how real cooks{' '}
              <span className="italic text-saffron-600">changed</span> the recipe.
            </h1>
            {!explainerDismissed && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
                Paste a recipe link. We read every review and show each cook&rsquo;s version as a
                clean diff &mdash; what they added, cut and swapped.
              </p>
            )}
            <div className="mt-8 w-full">
              <UrlInputForm />
            </div>
            <div className="mt-6 w-full">
              <RecentRecipes />
            </div>
          </div>
          {!explainerDismissed && (
            <div className="hidden justify-center lg:flex">
              <HeroDiffCard />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14 px-4 pb-20 sm:px-6">
        <ErrorDisplay />
        {loading && <LoadingState />}
        <RecipeResults />
        <FreshRecipes />
        <SiteIntro />
        <Faq />
      </div>
    </SiteShell>
  );
}

// tiny path switch: "/" is the tool, "/r/<slug>" a recipe's public page, plus a
// few static pages. Each extra path also needs a rewrite in vercel.json.
function Routes() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const match = /^\/r\/([^/]+)$/.exec(path);
  if (match?.[1]) return <RecipePageView slug={decodeURIComponent(match[1])} />;
  if (path === '/recipes') return <RecipesPage />;
  if (path === '/kitchen') return <KitchenPage />;
  if (path === '/extension') return <ExtensionPage />;
  if (path === '/privacy') return <PrivacyPage />;
  return <HomePage />;
}

function App() {
  return (
    <ErrorBoundary>
      <Routes />
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;
