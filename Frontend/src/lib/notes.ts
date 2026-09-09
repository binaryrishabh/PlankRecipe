// the backend sticks a "Community tweak: " label on note annotations, but the
// interpretationNote field keeps the raw review text. if we dont strip that
// label before deduping, the exact same note ends up rendering twice.
const NOTE_PREFIX_REGEX = /^\s*community tweak:\s*/i;

export function normalizeNoteText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(NOTE_PREFIX_REGEX, '').trim();
}

// takes every raw note string we got, normalizes them and drops dupes + empties.
// order is preserved so the first mention wins, which keeps the ui stable
export function dedupeNotes(notes: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const note of notes) {
    const normalized = normalizeNoteText(note);
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}