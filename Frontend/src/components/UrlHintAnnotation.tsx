// the tilted hand written note + dotted arrow straight from the mockup.
// both pieces are absolute against the form wrapper (which is relative),
// so the arrow head always lands on the input's left edge, mid height,
// instead of floating somewhere below the box like the old version did
export function UrlHintAnnotation() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none hidden md:block absolute inset-0"
    >
      {/* tilted note, hangs above and left of the url box */}
      <p className="font-hand absolute -top-16 -left-12 w-28 -rotate-12 text-2xl font-semibold leading-snug text-gray-400">
        All recipes website link
      </p>
      {/* dotted curve, head touches the input's left edge at mid height */}
      <svg
        viewBox="0 0 80 60"
        fill="none"
        className="absolute -left-10 -top-1 w-14 text-gray-400"
      >
        {/* round caps + tiny dashes make it look like hand drawn dots */}
        <path
          d="M8 2 C 4 26, 12 44, 62 40"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="0.5 7"
        />
        {/* arrow head, two short strokes so it stays sketchy */}
        <path
          d="M62 40 L 50 32 M62 40 L 49 45"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}