import { UrlInputForm } from '@/components/UrlInputForm';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { RecipeResults } from '@/components/RecipeResults';
import { useRecipeStore } from '@/store/recipeStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RecentRecipes } from '@/components/RecentRecipes';
import { SiteIntro } from '@/components/SiteIntro';
import { Logo } from '@/components/brand/Logo';
import { HeroDiffCard } from '@/components/landing/HeroDiffCard';
import { Faq } from '@/components/landing/Faq';
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

// split into AppContent so the error boundary can actually catch hooks crashing
function AppContent() {
  const { loading, explainerDismissed } = useRecipeStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-cream-300/80 bg-cream-100/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-5 text-sm font-medium text-ink-600">
            <a href="#how-title" className="hidden sm:inline hover:text-ink-900">How it works</a>
            <a href="#faq-title" className="hover:text-ink-900">FAQ</a>
          </div>
        </nav>
      </header>

      <main className="flex-1">
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
          <SiteIntro />
          <Faq />
        </div>
      </main>

      <footer className="border-t border-cream-300 bg-cream-200/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="max-w-md sm:text-right">
            An independent tool. Not affiliated with any recipe site &mdash; every recipe links back to
            its original source.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;
