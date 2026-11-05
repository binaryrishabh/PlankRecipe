import type { RecipePage } from "../../../packages/shared/interface/RecipePage.interface";

// content script -> background
export type Request =
  | { type: "lookup"; url: string } // already analyzed? reads our database only
  | { type: "analyze"; url: string }; // user clicked: run (or reuse) the analysis

// background -> content script
export type Reply =
  | { ok: true; page: RecipePage }
  | { ok: false; reason: "not-analyzed" | "no-tweaks" | "rate-limited" | "error"; message?: string };
