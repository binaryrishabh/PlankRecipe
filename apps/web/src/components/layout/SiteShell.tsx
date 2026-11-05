import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { useKitchen } from '@/store/kitchenStore';

// header + footer shared by the home page and the /r/<slug> recipe pages
export function SiteShell({ children }: { children: ReactNode }) {
  const savedCount = useKitchen((s) => s.saved.length);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-cream-300/80 bg-cream-100/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-4 text-sm font-medium text-ink-600 sm:gap-6">
            <a href="/recipes" className="hover:text-ink-900">Recipes</a>
            <a href="/kitchen" className="inline-flex items-center gap-1.5 hover:text-ink-900">
              <span className="sm:hidden">Kitchen</span>
              <span className="hidden sm:inline">My Kitchen</span>
              {savedCount > 0 && (
                <span className="rounded-full bg-saffron-100 px-1.5 text-xs font-semibold text-saffron-600">{savedCount}</span>
              )}
            </a>
            <a href="/extension" className="hidden md:inline hover:text-ink-900">Extension</a>
            <a href="/#faq-title" className="hidden sm:inline hover:text-ink-900">FAQ</a>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-cream-300 bg-cream-200/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <div className="flex flex-col gap-1 sm:items-end">
            <p className="max-w-md sm:text-right">
              An independent tool. Not affiliated with any recipe site &mdash; every recipe links back to
              its original source.
            </p>
            <p className="flex gap-4">
              <a href="/recipes" className="underline-offset-2 hover:text-ink-900 hover:underline">Recipes</a>
              <a href="/extension" className="underline-offset-2 hover:text-ink-900 hover:underline">Browser extension</a>
              <a href="/privacy" className="underline-offset-2 hover:text-ink-900 hover:underline">Privacy policy</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
