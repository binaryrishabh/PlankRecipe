import type { RecipeCard } from "../../../packages/shared/interface/RecipePage.interface";

// Serves the app's static pages (/recipes, /extension, /kitchen, /privacy) with
// their own title, description and canonical instead of the home page's.
// /recipes also gets every analyzed recipe rendered into the HTML as plain links,
// so crawlers can reach all recipe pages from one place.
// Self-contained on purpose: Vercel functions get no Vite aliases.

const API_URL = (process.env.VITE_API_URL || "https://allrecipes-backend.lapwork.in").replace(/\/+$/, "");

const esc = (s: string | null | undefined) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

const PAGES: Record<string, { path: string; title: string; description: string; index: boolean }> = {
  recipes: {
    path: "/recipes",
    title: "Browse recipes and how home cooks change them | Cook's Diff",
    description:
      "Every recipe whose reviews Cook's Diff has read: see the most-changed ingredients and what home cooks add, swap and skip.",
    index: true,
  },
  extension: {
    path: "/extension",
    title: "Cook's Diff browser extension: see recipe tweaks while you browse",
    description:
      "A free extension for Chrome, Edge and Firefox that shows what home cooks changed in a recipe, right on the recipe page.",
    index: true,
  },
  privacy: {
    path: "/privacy",
    title: "Privacy policy | Cook's Diff",
    description: "What Cook's Diff and its browser extension collect (very little), and why.",
    index: true,
  },
  kitchen: {
    path: "/kitchen",
    title: "My Kitchen | Cook's Diff",
    description: "Recipes you saved on Cook's Diff, in this browser.",
    index: false, // personal, nothing to index
  },
};

function setTag(html: string, re: RegExp, replacement: string): string {
  return re.test(html) ? html.replace(re, replacement) : html;
}

function recipesBody(cards: RecipeCard[]): string {
  const items = cards
    .map(
      (c) =>
        `<li><a href="/r/${esc(c.slug)}">${esc(c.title)}</a>${c.teaser ? ` — ${esc(c.teaser)}` : ""} (${c.tweakCount} tweaks)</li>`,
    )
    .join("");
  return `<main class="mx-auto max-w-6xl px-4 py-12"><h1>Recipes, as cooks really make them</h1><p>Every recipe here has had its reviews read and its tweaks pulled out.</p><ul>${items}</ul></main>`;
}

export async function GET(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const site = (process.env.VITE_SITE_URL || reqUrl.origin).replace(/\/+$/, "");
  const key = reqUrl.searchParams.get("p") || "";
  const page = PAGES[key];
  if (!page) return new Response("Not found", { status: 404 });

  const [shellRes, cardsRes] = await Promise.all([
    fetch(`${reqUrl.origin}/index.html`).catch(() => null),
    key === "recipes"
      ? fetch(`${API_URL}/api/pages/cards?limit=200`, { signal: AbortSignal.timeout(8000) }).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!shellRes || !shellRes.ok) return Response.redirect(`${site}/`, 302);
  let html = await shellRes.text();
  const url = `${site}${page.path}`;

  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(page.description)}" />`);
  html = setTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(url)}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(page.title)}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(page.description)}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(url)}" />`);
  html = setTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(page.title)}" />`);
  html = setTag(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(page.description)}" />`);
  // the FAQ structured data belongs to the home page only
  html = setTag(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
  if (!page.index) html = html.replace("</head>", `<meta name="robots" content="noindex" /></head>`);

  if (key === "recipes" && cardsRes && cardsRes.ok) {
    const cards = (await cardsRes.json()) as RecipeCard[];
    html = html.replace("</head>", `<script>window.__RECIPE_CARDS__=${scriptJson(cards)};</script></head>`);
    html = html.replace('<div id="root"></div>', `<div id="root">${recipesBody(cards)}</div>`);
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, "");
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": key === "recipes" ? "public, s-maxage=600, stale-while-revalidate=86400" : "public, s-maxage=3600",
    },
  });
}
