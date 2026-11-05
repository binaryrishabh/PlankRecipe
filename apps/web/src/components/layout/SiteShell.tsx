import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';

// header + footer shared by the home page and the /r/<slug> recipe pages
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-cream-300/80 bg-cream-100/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-5 text-sm font-medium text-ink-600">
            <a href="/#how-title" className="hidden sm:inline hover:text-ink-900">How it works</a>
            <a href="/#faq-title" className="hover:text-ink-900">FAQ</a>
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
            <a href="/privacy" className="underline-offset-2 hover:text-ink-900 hover:underline">
              Privacy policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
