import { API_URL } from "./config";
import type { Request, Reply } from "./messages";
import type { RecipePage } from "../../../packages/shared/interface/RecipePage.interface";

// Network calls live here, not in the content script: the service worker has
// host permission for our API, so requests aren't subject to the recipe site's
// CORS rules and never carry the recipe site's cookies.

async function lookup(url: string): Promise<Reply> {
  const res = await fetch(`${API_URL}/api/pages/by-url?url=${encodeURIComponent(url)}`);
  if (res.status === 404) return { ok: false, reason: "not-analyzed" };
  if (!res.ok) return { ok: false, reason: "error" };
  return { ok: true, page: (await res.json()) as RecipePage };
}

async function analyze(url: string): Promise<Reply> {
  const res = await fetch(`${API_URL}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, reason: "rate-limited", message: body.message };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, reason: "error", message: body.message };
  }

  // the analysis is saved now; fetch our summary of it
  const after = await lookup(url);
  if (!after.ok && after.reason === "not-analyzed") return { ok: false, reason: "no-tweaks" };
  return after;
}

chrome.runtime.onMessage.addListener((msg: Request, _sender, sendResponse: (r: Reply) => void) => {
  const work = msg.type === "lookup" ? lookup(msg.url) : analyze(msg.url);
  work
    .catch((): Reply => ({ ok: false, reason: "error" }))
    .then(sendResponse);
  return true; // keep the channel open for the async reply
});
