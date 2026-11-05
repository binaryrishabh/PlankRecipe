// static example of what a tweak looks like, so first-time visitors get the idea
// before they paste anything. generic sample lines, not taken from any recipe.
const lines: { kind: 'same' | 'add' | 'remove' | 'change'; text: string; was?: string }[] = [
  { kind: 'same', text: '2 ¼ cups all-purpose flour' },
  { kind: 'change', text: '¾ cup white sugar', was: '1 cup white sugar' },
  { kind: 'same', text: '1 cup butter, softened' },
  { kind: 'add', text: '1 tsp espresso powder' },
  { kind: 'remove', text: '1 cup chopped walnuts' },
  { kind: 'add', text: 'Flaky salt on top before baking' },
];

const styles = {
  same: 'text-ink-600',
  add: 'bg-green-50 text-green-900 border-l-[3px] border-green-600',
  remove: 'bg-red-50 text-red-800 line-through decoration-red-400 border-l-[3px] border-red-500',
  change: 'bg-yellow-50 text-yellow-900 border-l-[3px] border-yellow-500',
};

const marks = { same: ' ', add: '+', remove: '−', change: '~' };

export function HeroDiffCard() {
  return (
    <figure
      aria-label="Example: a cook's tweak shown as a diff"
      className="relative w-full max-w-md rotate-[1.2deg] rounded-2xl bg-cream-50 shadow-[0_24px_60px_-20px_rgba(28,25,23,0.35)] ring-1 ring-cream-300"
    >
      <div className="flex items-center justify-between border-b border-cream-300 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-saffron-100 font-display text-sm font-semibold text-saffron-600">
            M
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink-900">Maria&rsquo;s tweak</p>
            <p className="text-[11px] text-ink-500">“Less sweet, way more flavor.”</p>
          </div>
        </div>
        <span className="rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-semibold text-cream-100">
          4 changes
        </span>
      </div>
      <ul className="px-3 py-3 font-mono text-[13px] leading-6">
        {lines.map((l) => (
          <li key={l.text} className={`flex gap-3 rounded-md px-2 ${styles[l.kind]}`}>
            <span aria-hidden="true" className="w-3 shrink-0 text-center font-bold opacity-70">
              {marks[l.kind]}
            </span>
            <span>
              {l.text}
              {l.was && <span className="ml-2 text-[11px] text-yellow-800/70 no-underline">was {l.was}</span>}
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">
        Example tweak: sugar reduced, espresso powder and flaky salt added, walnuts removed.
      </figcaption>
    </figure>
  );
}
