export enum Diff {
  ADDED = "added",
  REMOVED = "removed",
  CHANGED = "changed",
  NOTE = "note"
}

export type DiffType = (typeof Diff)[keyof typeof Diff];