import { useKitchen } from '@/store/kitchenStore';

export function SaveButton({ slug, title, tweakCount }: { slug: string; title: string; tweakCount: number }) {
  const saved = useKitchen((s) => s.saved.some((r) => r.slug === slug));
  const toggle = useKitchen((s) => s.toggle);

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggle({ slug, title, tweakCount })}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
        saved
          ? 'border-saffron-500 bg-saffron-100 text-saffron-600 hover:bg-saffron-100/70'
          : 'border-cream-300 bg-cream-50 text-ink-900 hover:border-ink-500 hover:bg-white'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {saved ? 'Saved to My Kitchen' : 'Save to My Kitchen'}
    </button>
  );
}
