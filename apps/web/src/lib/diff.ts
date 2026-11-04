import type { DiffAnnotation } from '@shared/interface/DiffAnnotation.interface';
import { Diff } from '@shared/enums/Diff.enum';

// the visual state a single line of the recipe can end up in
export type RowStatus = 'unchanged' | 'added' | 'removed' | 'changed';

export interface DisplayRow {
  key: string;
  status: RowStatus;
  // main text we render. for "changed" this is the new (after) wording
  text: string;
  // only populated for changed/removed so we can strike through the original line
  before: string | null;
}

export interface SectionDiffModel {
  rows: DisplayRow[];
  notes: string[];
}

export function buildSectionDiff(
  original: string[] | undefined | null,
  annotations: DiffAnnotation[] | undefined | null
): SectionDiffModel {
  // defensive checks just in case the store sanitization missed alot of things
  const safeOriginal = Array.isArray(original) ? original : [];
  const safeAnnotations = Array.isArray(annotations) ? annotations : [];

  const notes = safeAnnotations
    .filter((a) => a.type === Diff.NOTE && a.after)
    .map((a) => a.after as string);

  // kept as a pool so a duplicated ingredient only gets matched one time
  const removedPool = safeAnnotations
    .filter((a) => a.type === Diff.REMOVED && a.before)
    .map((a) => a.before as string);

  const changedPairs = safeAnnotations
    .filter((a) => a.type === Diff.CHANGED && a.before && a.after)
    .map((a) => ({ before: a.before as string, after: a.after as string }));

  const addedItems = safeAnnotations
    .filter((a) => a.type === Diff.ADDED && a.after)
    .map((a) => a.after as string);

  const rows: DisplayRow[] = [];

  safeOriginal.forEach((item, index) => {
    // was this line removed?
    const removedAt = removedPool.indexOf(item);
    if (removedAt !== -1) {
      removedPool.splice(removedAt, 1);
      rows.push({ key: `removed-${index}`, status: 'removed', text: item, before: item });
      return;
    }

    // was it swapped for something else?
    const changedAt = changedPairs.findIndex((p) => p.before === item);
    if (changedAt !== -1) {
      const pair = changedPairs[changedAt];
      changedPairs.splice(changedAt, 1);
      if (pair) {
        rows.push({
          key: `changed-${index}`,
          status: 'changed',
          text: pair.after,
          before: pair.before,
        });
      }
      return;
    }

    // untouched line
    rows.push({ key: `same-${index}`, status: 'unchanged', text: item, before: null });
  });

  // added items always show up at the bottom
  addedItems.forEach((text, index) => {
    rows.push({ key: `added-${index}`, status: 'added', text, before: null });
  });

  return { rows, notes };
}