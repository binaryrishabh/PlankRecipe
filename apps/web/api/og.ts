import { ImageResponse } from "@vercel/og";
import type { RecipePage } from "../../../packages/shared/interface/RecipePage.interface";

// Social preview images (1200x630). /api/og is the site card; /api/og?slug=<slug>
// is a recipe's card with its own numbers, so shared links show something worth
// clicking. Built from plain element objects (no JSX) to keep the function simple.

const API_URL = (process.env.VITE_API_URL || "https://allrecipes-backend.lapwork.in").replace(/\/+$/, "");

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string | null)[]): Node => ({
  type,
  props: { style: { display: "flex", ...style }, children: children.filter((c) => c !== null) },
});

const INK = "#1C1917";
const CREAM = "#FBF7F0";
const SAFFRON = "#B86E12";

function logo(size: number): Node {
  return h(
    "div",
    { width: size, height: size, borderRadius: size / 4, background: INK, alignItems: "center", justifyContent: "center" },
    h(
      "div",
      { width: size * 0.66, height: size * 0.66, borderRadius: size, background: CREAM, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: size * 0.06 },
      h("div", { color: "#15803D", fontSize: size * 0.34, fontWeight: 700, lineHeight: 1 }, "+"),
      h("div", { color: "#C2410C", fontSize: size * 0.34, fontWeight: 700, lineHeight: 1 }, "−"),
    ),
  );
}

function frame(...children: (Node | null)[]): Node {
  return h(
    "div",
    { width: "100%", height: "100%", background: CREAM, padding: 64, flexDirection: "column", justifyContent: "space-between", color: INK, fontFamily: "Geist" },
    ...children,
  );
}

function brandRow(): Node {
  return h(
    "div",
    { alignItems: "center", gap: 18 },
    logo(64),
    h("div", { fontSize: 36, fontWeight: 700 }, "Cook's "),
    h("div", { fontSize: 36, fontWeight: 700, color: SAFFRON, marginLeft: -10 }, "Diff"),
  );
}

function siteCard(): Node {
  return frame(
    brandRow(),
    h(
      "div",
      { flexDirection: "column", gap: 20 },
      h("div", { fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }, "See exactly how real cooks changed the recipe."),
      h("div", { fontSize: 32, color: "#57534E" }, "Every review, read for you — and shown as a diff."),
    ),
    h(
      "div",
      { gap: 16, fontSize: 26 },
      h("div", { background: "#DCFCE7", color: "#14532D", padding: "8px 18px", borderRadius: 12 }, "+ 1 tsp espresso powder"),
      h("div", { background: "#FEE2E2", color: "#7F1D1D", padding: "8px 18px", borderRadius: 12, textDecoration: "line-through" }, "1 cup walnuts"),
      h("div", { background: "#FEF9C3", color: "#713F12", padding: "8px 18px", borderRadius: 12 }, "¾ cup sugar"),
    ),
  );
}

function recipeCard(p: RecipePage): Node {
  const rows = p.mostChangedIngredients.slice(0, 3).map((s) =>
    h(
      "div",
      { justifyContent: "space-between", alignItems: "center", background: "#FFFDF9", border: "2px solid #E7DFD2", borderRadius: 16, padding: "14px 22px", fontSize: 28 },
      h("div", { maxWidth: 820, overflow: "hidden" }, s.line.length > 48 ? `${s.line.slice(0, 47)}…` : s.line),
      h("div", { color: SAFFRON, fontWeight: 700 }, `${s.changed + s.removed} cooks`),
    ),
  );
  const title = p.title.length > 52 ? `${p.title.slice(0, 51)}…` : p.title;
  return frame(
    brandRow(),
    h(
      "div",
      { flexDirection: "column", gap: 10 },
      h("div", { fontSize: 30, color: "#57534E" }, "How home cooks change"),
      h("div", { fontSize: title.length > 30 ? 60 : 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }, title),
      h("div", { fontSize: 30, color: SAFFRON, fontWeight: 700 }, `${p.cooksWithChanges} of ${p.tweakCount} cooks changed it`),
    ),
    rows.length ? h("div", { flexDirection: "column", gap: 10 }, ...rows) : null,
  );
}

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get("slug");
  let page: RecipePage | null = null;
  if (slug) {
    try {
      const res = await fetch(`${API_URL}/api/pages/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(9000) });
      if (res.ok) page = (await res.json()) as RecipePage;
    } catch {
      // fall back to the site card
    }
  }

  // ImageResponse renders element objects the same way it renders JSX
  const image = new ImageResponse((page ? recipeCard(page) : siteCard()) as never, { width: 1200, height: 630 });
  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return new Response(image.body, { status: image.status, headers });
}
