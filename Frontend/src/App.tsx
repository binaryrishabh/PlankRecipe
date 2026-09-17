import { UrlInputForm } from '@/components/UrlInputForm';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { RecipeResults } from '@/components/RecipeResults';
import { useRecipeStore } from '@/store/recipeStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RecentRecipes } from '@/components/RecentRecipes';
import { SiteIntro } from '@/components/SiteIntro';

// split into AppContent so the error boundary can actually catch hooks crashing
function AppContent() {
  const { loading } = useRecipeStore();
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex flex-col items-center pt-16 px-4 pb-12">
      <header className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-3">
          allrecipes <span className="text-blue-600">Tweaks</span>
        </h1>
        <p className="text-lg text-gray-600">
          Paste any AllRecipes link to instantly see community modifications and diff highlights.
        </p>
      </header>
      <main className="w-full flex flex-col items-center gap-6">
        <UrlInputForm />
        <RecentRecipes />
        {/* fills the blank space for first timers, hides itself once they interact */}
        <SiteIntro />
        <ErrorDisplay />
        {loading && (
          <div className="mt-12 flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium text-lg">Scraping and analyzing tweaks...</p>
            <p className="text-gray-400 text-sm">This may take a few seconds depending on AllRecipes.</p>
          </div>
        )}
        <RecipeResults />
      </main>
      <footer className="mt-auto pt-12 text-sm text-gray-400">
        allrecipes Tweaks &bull; Community tweaks, highlighted
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;