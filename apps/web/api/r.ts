import type { RecipePage } from "../../../packages/shared/interface/RecipePage.interface";

// Serves /r/<slug> (rewritten here in vercel.json) as real HTML: page-specific
// title, description, canonical, social tags and JSON-LD, plus the summary itself
// rendered into #root. Crawlers and AI answer engines that don't run JavaScript
// see the full content; browsers then load the React app on top as usual.
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

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function describe(p: RecipePage): string {
  const top = p.mostChangedIngredients
    .slice(0, 2)
    .map((s) => `${s.line} (${plural(s.changed + s.removed, "cook")})`)
    .join(", ");
  const lead = `${p.cooksWithChanges} of ${p.tweakCount} reviewing cooks changed ${p.title}.`;
  return `${lead}${top ? ` Most changed: ${top}.` : ""} See every tweak as a line-by-line diff.`;
}

function renderBody(p: RecipePage): string {
  const meta = [p.prepTime && `Prep ${esc(p.prepTime)}`, p.cookTime && `Cook ${esc(p.cookTime)}`, p.servings && `Serves ${esc(p.servings)}`]
    .filter(Boolean)
    .join(" · ");

  const changed = p.mostChangedIngredients
    .map(
      (s) =>
        `<li><strong>${esc(s.line)}</strong> — ${plural(s.changed, "cook")} changed it${
          s.removed ? `, ${s.removed} left it out` : ""
        }${s.examples.length ? `. Swaps: ${s.examples.map(esc).join("; ")}` : ""}</li>`,
    )
    .join("");

  const added = p.commonAdditions
    .map((a) => `<li>${esc(a.line)}${a.count > 1 ? ` (${a.count} cooks)` : ""}</li>`)
    .join("");

  const tweaks = p.tweaks
    .filter((t) => t.ingredientChanges.length || t.stepChanges || t.notes)
    .map((t) => {
      const lines = t.ingredientChanges
        .map((c) =>
          c.type === "added"
            ? `<li>+ ${esc(c.after)}</li>`
            : c.type === "removed"
              ? `<li>− <s>${esc(c.before)}</s></li>`
              : `<li>~ ${esc(c.before)} → ${esc(c.after)}</li>`,
        )
        .join("");
      const extra = [t.stepChanges && plural(t.stepChanges, "method change"), t.notes && plural(t.notes, "tip")]
        .filter(Boolean)
        .join(", ");
      return `<li><h3>Cook ${t.n}</h3>${lines ? `<ul>${lines}</ul>` : ""}${extra ? `<p>${extra}</p>` : ""}</li>`;
    })
    .join("");

  return `
<main class="mx-auto max-w-4xl px-4 py-10">
  <nav><a href="/">Cook&#39;s Diff</a> › ${esc(p.title)}</nav>
  <h1>How home cooks change ${esc(p.title)}</h1>
  <p>${esc(describe(p))}</p>
  ${meta ? `<p>${meta}</p>` : ""}
  <p>${plural(p.totals.changed, "ingredient or step change")}, ${plural(p.totals.added, "addition")}, ${plural(p.totals.removed, "removal")} and ${plural(p.totals.notes, "tip")} across ${plural(p.tweakCount, "review")}.</p>
  ${changed ? `<h2>Most-changed ingredients</h2><ul>${changed}</ul>` : ""}
  ${added ? `<h2>What cooks add</h2><ul>${added}</ul>` : ""}
  ${tweaks ? `<h2>Every cook&#39;s tweak</h2><ol>${tweaks}</ol>` : ""}
  <p><a href="${esc(p.sourceUrl)}" rel="nofollow noopener">Read the original recipe on ${esc(p.sourceHost)}</a></p>
</main>`;
}

function setTag(html: string, re: RegExp, replacement: string): string {
  return re.test(html) ? html.replace(re, replacement) : html;
}

function withHead(shell: string, p: RecipePage | null, site: string, slug: string): string {
  const title = p
    ? `How cooks change ${p.title}: ${plural(p.tweakCount, "tweak")} | Cook's Diff`
    : "Recipe not found | Cook's Diff";
  const description = p ? describe(p) : "This recipe hasn't been analyzed yet. Paste its link on Cook's Diff to see every cook's tweak.";
  const url = `${site}/r/${p ? p.slug : slug}`;

  let html = shell;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`);
  html = setTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(url)}" />`);
  html = setTag(html, /<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="article" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(description)}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(url)}" />`);
  html = setTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(description)}" />`);
  if (p) {
    // this recipe's own preview card (api/og.ts) instead of the site card
    const image = `${site}/api/og?slug=${encodeURIComponent(p.slug)}`;
    html = setTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(image)}" />`);
    html = setTag(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${esc(image)}" />`);
  }

  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebPage",
            "@id": `${url}#page`,
            url,
            name: title,
            description,
            isPartOf: { "@id": `${site}/#website` },
            isBasedOn: p.sourceUrl,
            dateModified: p.analyzedAt,
            about: { "@type": "Thing", name: p.title },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Cook's Diff", item: `${site}/` },
              { "@type": "ListItem", position: 2, name: p.title, item: url },
            ],
          },
        ],
      }
    : null;

  html = setTag(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    jsonLd ? `<script type="application/ld+json">${scriptJson(jsonLd)}</script>` : "",
  );

  const extraHead =
    (p ? "" : `<meta name="robots" content="noindex" />`) +
    `<script>window.__RECIPE_PAGE__=${scriptJson(p)};</script>`;
  html = html.replace("</head>", `${extraHead}</head>`);

  if (p) {
    html = html.replace('<div id="root"></div>', `<div id="root">${renderBody(p)}</div>`);
    // the home page's no-JS fallback would add a second, generic <h1>
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, "");
  }
  return html;
}

export async function GET(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const site = (process.env.VITE_SITE_URL || reqUrl.origin).replace(/\/+$/, "");
  const slug = (reqUrl.searchParams.get("slug") || "").slice(0, 200);

  const [shellRes, pageRes] = await Promise.all([
    fetch(`${reqUrl.origin}/index.html`).catch(() => null),
    fetch(`${API_URL}/api/pages/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(8000) }).catch(() => null),
  ]);

  const page: RecipePage | null = pageRes && pageRes.ok ? ((await pageRes.json()) as RecipePage) : null;

  // old or mistyped title part: send people and crawlers to the one canonical URL
  if (page && page.slug !== slug) {
    return Response.redirect(`${site}/r/${page.slug}`, 301);
  }

  const shell =
    shellRes && shellRes.ok
      ? await shellRes.text()
      : `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title></title><meta name="description" content="" /><link rel="canonical" href="" /></head><body><div id="root"></div></body></html>`;

  // backend down (not a real 404): don't let crawlers drop the page
  const backendDown = !pageRes || pageRes.status >= 500;
  const status = page ? 200 : backendDown ? 503 : 404;

  return new Response(withHead(shell, page, site, slug), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": page
        ? "public, s-maxage=3600, stale-while-revalidate=86400"
        : "public, s-maxage=60",
    },
  });
}
