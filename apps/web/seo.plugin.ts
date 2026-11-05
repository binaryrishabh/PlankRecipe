import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import path from "node:path";

type SiteContent = {
  name: string;
  tagline: string;
  description: string;
  faq: { q: string; a: string }[];
};

const site: SiteContent = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "src/content/site.json"), "utf8"),
);

// Builds the SEO/AEO surface from src/content/site.json so the visible page and
// what search / answer engines read never drift apart:
//  - fills the __SITE_*__ placeholders in index.html (meta, canonical, JSON-LD)
//  - emits robots.txt, sitemap.xml and llms.txt into the build output
// The public address comes from VITE_SITE_URL (set in Vercel), so moving to a new
// domain is an env change, not a code change.

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function seoPlugin(): Plugin {
  const siteUrl = (process.env.VITE_SITE_URL || "https://allrecipes.lapwork.in").replace(/\/+$/, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: site.name,
        url: `${siteUrl}/`,
        description: site.description,
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: site.name,
        url: `${siteUrl}/`,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Any",
        description: site.description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: site.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return {
    name: "cooks-diff-seo",
    transformIndexHtml(html) {
      return html
        .replaceAll("__SITE_URL__", siteUrl)
        .replaceAll("__SITE_DESCRIPTION__", escapeAttr(site.description))
        // "<" escaped so the JSON can never close the script tag early
        .replace("__SITE_JSONLD__", JSON.stringify(jsonLd).replace(/</g, "\\u003c"));
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      // sitemap.xml is served live by api/sitemap.ts so every analyzed recipe is listed
      this.emitFile({
        type: "asset",
        fileName: "llms.txt",
        source:
          `# ${site.name}\n\n> ${site.tagline}\n\n${site.description}\n\n` +
          `## How to use\n\n- Open ${siteUrl}/ and paste a recipe link.\n` +
          `- Switch between the original recipe and each community tweak; changes are highlighted line by line.\n` +
          `- Every analyzed recipe has a public summary at ${siteUrl}/r/<recipe-slug> with the most-changed ingredients and each cook's changes. All of them are listed in ${siteUrl}/sitemap.xml.\n\n` +
          `## FAQ\n\n` +
          site.faq.map((f) => `### ${f.q}\n\n${f.a}\n`).join("\n"),
      });
    },
  };
}
