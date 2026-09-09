// swapped from enum to const object so typescript stops complaining 
// about string literals not matching the enum type. this is a classic TS gotcha
export const Diff = {
  ADDED: "added",
  REMOVED: "removed",
  CHANGED: "changed",
  NOTE: "note"
} as const;

// this extracts the exact string values ("added" | "removed" | etc)
export type DiffType = typeof Diff[keyof typeof Diff];