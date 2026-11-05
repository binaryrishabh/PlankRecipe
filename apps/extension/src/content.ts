import { css } from "./styles";
import { SITE_URL, UTM } from "./config";
import type { Request, Reply } from "./messages";
import type { RecipePage } from "../../../packages/shared/interface/RecipePage.interface";

// Runs on recipe pages. On load it only *looks up* whether we already analyzed
// this recipe (our own database, no scraping). A new analysis starts only when
// the reader clicks the button. Everything renders in a shadow root, and all
// remote data goes in as text — never as HTML.

const SVG_NS = "http://www.w3.org/2000/svg";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { class?: string; text?: string; attrs?: Record<string, string> } = {},
  children: (Node | null | false)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [k, v] of Object.entries(props.attrs ?? {})) node.setAttribute(k, v);
  for (const c of children) if (c) node.appendChild(c);
  return node;
}

// the Cook's Diff mark: a plate with a green "+" and a red "−"
function logo(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-hidden", "true");
  const parts: [string, Record<string, string>][] = [
    ["rect", { width: "64", height: "64", rx: "16", fill: "#1C1917" }],
    ["circle", { cx: "32", cy: "32", r: "21", fill: "#FBF7F0" }],
    ["circle", { cx: "32", cy: "32", r: "16", fill: "none", stroke: "#E7DFD2", "stroke-width": "2" }],
    ["path", { d: "M24 25.5h10M29 20.5v10", stroke: "#15803D", "stroke-width": "4.5", "stroke-linecap": "round" }],
    ["path", { d: "M30 40h10", stroke: "#C2410C", "stroke-width": "4.5", "stroke-linecap": "round" }],
  ];
  for (const [tag, attrs] of parts) {
    const p = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, v);
    svg.appendChild(p);
  }
  return svg;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// constructable stylesheets aren't subject to the page's CSP style-src rules,
// unlike a <style> element; fall back to <style> only where they're missing
function attachStyles(root: ShadowRoot) {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    root.adoptedStyleSheets = [sheet];
  } catch {
    root.appendChild(el("style", { text: css }));
  }
}

function send(req: Request): Promise<Reply> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(req, (reply?: Reply) => {
        resolve(chrome.runtime.lastError || !reply ? { ok: false, reason: "error" } : reply);
      });
    } catch {
      resolve({ ok: false, reason: "error" }); // extension was reloaded/updated under us
    }
  });
}

function recipeUrl(): string {
  const path = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
  return `${location.origin}${path}`;
}

function renderPage(p: RecipePage): HTMLElement {
  const total = p.totals.changed + p.totals.added + p.totals.removed;
  const max = Math.max(1, ...p.mostChangedIngredients.map((s) => s.changed + s.removed));

  const ingredients = p.mostChangedIngredients.slice(0, 5).map((s) => {
    const n = s.changed + s.removed;
    const fill = el("i");
    fill.style.width = `${(n / max) * 100}%`; // CSSOM, so page CSP can't block it
    const bar = el("div", { class: "bar" }, [fill]);
    return el("li", { class: "ing" }, [
      el("div", { class: "ing-top" }, [el("p", { class: "flat", text: s.line }), el("span", { text: plural(n, "cook") })]),
      bar,
      s.examples.length > 0 && el("p", { class: "swaps flat", text: `Swaps: ${s.examples.slice(0, 2).join(" · ")}` }),
      s.removed > 0 && el("p", { class: "note", text: `${s.removed} left it out` }),
    ]);
  });

  const additions = p.commonAdditions
    .slice(0, 6)
    .map((a) => el("li", { class: "chip", text: `+ ${a.line}${a.count > 1 ? ` ×${a.count}` : ""}` }));

  return el("div", { class: "body" }, [
    el("h2", { text: `${p.cooksWithChanges} of ${p.tweakCount} cooks changed this recipe` }),
    el("div", { class: "stats" }, [
      el("div", { class: "stat" }, [el("b", { text: String(total) }), el("span", { text: "changes found" })]),
      el("div", { class: "stat" }, [el("b", { text: String(p.totals.notes) }), el("span", { text: "cooking tips" })]),
    ]),
    ingredients.length > 0 && el("section", {}, [el("h3", { text: "Most-changed ingredients" }), el("ol", {}, ingredients)]),
    additions.length > 0 && el("section", {}, [el("h3", { text: "What cooks add" }), el("ul", { class: "chips" }, additions)]),
    el("a", {
      class: "cta",
      text: "See every tweak side by side →",
      attrs: { href: `${SITE_URL}/r/${encodeURIComponent(p.slug)}?${UTM}`, target: "_blank", rel: "noopener" },
    }),
    el("p", { class: "note", text: "Cook's Diff is independent and not affiliated with this site." }),
  ]);
}

function renderMessage(title: string, detail: string, retry?: () => void): HTMLElement {
  return el("div", { class: "body center" }, [
    el("h2", { text: title }),
    el("p", { class: "note", text: detail }),
    retry ? (() => {
      const b = el("button", { class: "cta retry", text: "Try again", attrs: { type: "button" } });
      b.addEventListener("click", retry);
      return b;
    })() : null,
  ]);
}

function mount() {
  if (document.getElementById("cooks-diff-root")) return;

  const host = el("div", { attrs: { id: "cooks-diff-root" } });
  const root = host.attachShadow({ mode: "open" });
  attachStyles(root);

  const wrap = el("div", { class: "wrap" });
  const label = el("span", { text: "See how cooks changed it" });
  const count = el("span", { class: "count", attrs: { hidden: "" } });
  const pill = el("button", { class: "pill", attrs: { type: "button", "aria-expanded": "false", "aria-controls": "cd-panel" } }, [logo(), label, count]);

  const close = el("button", { class: "close", text: "×", attrs: { type: "button", "aria-label": "Close Cook's Diff" } });
  const brand = el("div", { class: "brand" }, [logo(), el("span", { text: "Cook’s " }), el("em", { text: "Diff" })]);
  const content = el("div", { attrs: { "aria-live": "polite" } });
  const panel = el("section", { class: "panel", attrs: { id: "cd-panel", hidden: "", "aria-label": "Cook's Diff" } }, [
    el("div", { class: "head" }, [brand, close]),
    content,
  ]);

  wrap.append(panel, pill);
  root.appendChild(wrap);
  document.documentElement.appendChild(host);

  const url = recipeUrl();
  let known: RecipePage | null = null;
  let busy = false;

  const show = (node: HTMLElement) => content.replaceChildren(node);
  const setOpen = (open: boolean) => {
    if (open) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
    pill.setAttribute("aria-expanded", String(open));
  };

  async function runAnalysis() {
    if (busy) return;
    busy = true;
    show(el("div", { class: "body center" }, [
      el("div", { class: "spin", attrs: { role: "status" } }),
      el("h2", { text: "Reading every review…" }),
      el("p", { class: "note", text: "New recipes take 10–20 seconds. You can keep reading meanwhile." }),
    ]));
    const reply = await send({ type: "analyze", url });
    busy = false;
    if (reply.ok) {
      known = reply.page;
      count.textContent = plural(reply.page.tweakCount, "tweak");
      count.removeAttribute("hidden");
      label.textContent = "Cooks’ tweaks";
      show(renderPage(reply.page));
    } else if (reply.reason === "no-tweaks") {
      show(renderMessage("No tweaks found", "None of this recipe's reviews describe a concrete change yet."));
    } else if (reply.reason === "rate-limited") {
      show(renderMessage("Taking a short break", reply.message || "You've analyzed a lot of new recipes recently. Please try again later."));
    } else {
      show(renderMessage("Couldn't read the reviews", reply.message || "Something went wrong on our side.", runAnalysis));
    }
  }

  pill.addEventListener("click", () => {
    const opening = panel.hasAttribute("hidden");
    setOpen(opening);
    if (!opening) return;
    if (known) show(renderPage(known));
    else void runAnalysis();
  });
  close.addEventListener("click", () => {
    setOpen(false);
    pill.focus();
  });
  root.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape" && !panel.hasAttribute("hidden")) {
      setOpen(false);
      pill.focus();
    }
  });

  // cheap lookup on load: if someone already analyzed this recipe, show the count
  void send({ type: "lookup", url }).then((reply) => {
    if (reply.ok) {
      known = reply.page;
      label.textContent = "Cooks’ tweaks";
      count.textContent = plural(reply.page.tweakCount, "tweak");
      count.removeAttribute("hidden");
    }
  });
}

mount();
