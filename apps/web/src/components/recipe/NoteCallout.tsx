interface NoteCalloutProps {
  text: string;
}

// info box for "note" annotations, since those dont map to a real ingredient or step
export function NoteCallout({ text }: NoteCalloutProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-blue-500 mt-0.5 shrink-0" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-blue-800">Community note</p>
        <p className="text-sm text-blue-700 mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}