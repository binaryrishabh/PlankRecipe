interface SourceLinkProps {
  url: string;
}

// clickable pill that opens the origional allrecipes page in a new tab so the
// user never loses their place in our app. only renders for http(s) urls so a
// weird stored value can never turn into a javascript: link
export function SourceLink({ url }: SourceLinkProps) {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Open this recipe on AllRecipes in a new tab"
      className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 active:scale-[0.98] transition-all"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
      View original on AllRecipes
    </a>
  );
}