import type { RecipePageListItem } from "../../../packages/shared/interface/RecipePage.interface";

// /sitemap.xml (rewritten here in vercel.json): the home page plus every
// analyzed recipe page, so new recipes get discovered without a redeploy.
// Self-contained on purpose: Vercel functions get no Vite aliases.

const API_URL = (process.env.VITE_API_URL || "https://allrecipes-backend.lapwork.in").replace(/\/+$/, "");

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(request: Request): Promise<Response> {
  const site = (process.env.VITE_SITE_URL || new URL(request.url).origin).replace(/\/+$/, "");

  let items: RecipePageListItem[] = [];
  try {
    const res = await fetch(`${API_URL}/api/pages`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) items = (await res.json()) as RecipePageListItem[];
  } catch {
    // backend unreachable: still serve a valid sitemap with the home page
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url><loc>${site}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...items.map(
      (i) =>
        `  <url><loc>${site}/r/${esc(i.slug)}</loc><lastmod>${i.updatedAt.slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
