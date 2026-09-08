import type { DiffType } from "../enums/Diff.enum";

export interface DiffAnnotation {
  section: "ingredients" | "steps";
  index: number;
  type: DiffType;
  before: String | null;
  after: String | null;
}