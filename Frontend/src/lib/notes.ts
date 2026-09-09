// the backend sticks a "Community tweak: " label on note annotations, but the
// interpretationNote field keeps the raw review text. if we dont strip that
// label before deduping, the exact same note can end up rendering twice.
const NOTE_PREFIX_REGEX = /^\s*community tweak:\s*/i;

export function normalizeNoteText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(NOTE_PREFIX_REGEX, '').trim();
}

// takes every raw note string we got, normalizes them and drops dupes + empties.
// also drops any note that just repeats the review text, because we already
// render that word for word in the "X said:" quote box above the recipe —
// showing it again as a blue banner is just noise
export function dedupeNotes(
  notes: Array<string | null | undefined>,
  reviewText?: string | null
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const normalizedReview = normalizeNoteText(reviewText);

  for (const note of notes) {
    const normalized = normalizeNoteText(note);
    if (normalized.length === 0) continue;

    // same text as the review quote up top? skip it, its redundant
    if (normalizedReview.length > 0 && normalized === normalizedReview) continue;

    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}