import site from '@/content/site.json';

// visible FAQ — the same entries are published as FAQPage structured data at build
// time (see seo.plugin.ts), which search engines require to match the page
export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="w-full max-w-3xl">
      <h2 id="faq-title" className="font-display text-3xl font-semibold tracking-tight text-ink-900 mb-6">
        Questions cooks ask
      </h2>
      <div className="divide-y divide-cream-300 rounded-2xl border border-cream-300 bg-cream-50">
        {site.faq.map((item) => (
          <details key={item.q} className="group px-5 py-4 open:bg-white/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-900">
              <h3 className="text-base">{item.q}</h3>
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-cream-300 text-ink-500 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
