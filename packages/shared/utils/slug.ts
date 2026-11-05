// Shareable recipe URLs look like /r/best-chocolate-chip-cookies-cc5dfb40:
// a readable title part for people and search engines, plus the first 8 hex
// characters of the recipe's id so lookups never depend on the title.

export function slugifyTitle(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return base || "recipe";
}

export function recipeSlug(title: string, id: string): string {
  const shortId = id.replace(/-/g, "").slice(0, 8).toLowerCase();
  return `${slugifyTitle(title)}-${shortId}`;
}

// returns the 8-char id prefix, or null when the slug isn't one of ours
export function idPrefixFromSlug(slug: string): string | null {
  const m = /-([0-9a-f]{8})$/i.exec(slug.trim());
  return m?.[1] ? m[1].toLowerCase() : null;
}
