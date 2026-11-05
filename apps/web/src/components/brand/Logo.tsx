// Cook's Diff mark: a plate carrying a green "+" and a red "−", the two diff marks
// the whole product is about. Drawn inline so it stays crisp at any size.
export function LogoMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1C1917" />
      <circle cx="32" cy="32" r="21" fill="#FBF7F0" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="#E7DFD2" strokeWidth="2" />
      <path d="M24 25.5h10M29 20.5v10" stroke="#15803D" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M30 40h10" stroke="#C2410C" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <a href="/" className="flex items-center gap-2.5 group" aria-label="Cook's Diff home">
      <LogoMark />
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink-900">
        Cook&rsquo;s <span className="italic text-saffron-600">Diff</span>
      </span>
    </a>
  );
}
