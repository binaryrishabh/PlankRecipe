import { mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { zipSync } from "fflate";

// Builds dist/chrome and dist/firefox (unpacked, loadable in the browser) and,
// with --zip, the store-ready zips. Code is bundled but not minified, so store
// reviewers can read it without a separate source upload.

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
const logoSvg = readFileSync(path.resolve(root, "../web/public/favicon.svg"), "utf8");

rmSync(dist, { recursive: true, force: true });

const targets = {
  chrome: manifest,
  // Firefox's MV3 uses background scripts instead of a service worker, and
  // needs a stable add-on id
  firefox: {
    ...manifest,
    background: { scripts: ["background.js"], type: "module" },
    browser_specific_settings: { gecko: { id: "cooks-diff@lapwork.in", strict_min_version: "121.0" } },
  },
};

for (const [name, mf] of Object.entries(targets)) {
  const out = path.join(dist, name);
  mkdirSync(path.join(out, "icons"), { recursive: true });

  const result = await Bun.build({
    entrypoints: [path.join(root, "src/background.ts"), path.join(root, "src/content.ts")],
    outdir: out,
    target: "browser",
    format: "iife", // content scripts can't be ES modules
    minify: false,
    naming: "[name].js",
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  for (const size of [16, 32, 48, 128]) {
    const png = new Resvg(logoSvg, { fitTo: { mode: "width", value: size } }).render().asPng();
    writeFileSync(path.join(out, "icons", `icon-${size}.png`), png);
  }

  writeFileSync(path.join(out, "manifest.json"), JSON.stringify(mf, null, 2));
  console.log(`built dist/${name}`);
}

if (process.argv.includes("--zip")) {
  const collect = (dir: string, prefix = ""): Record<string, Uint8Array> => {
    const files: Record<string, Uint8Array> = {};
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(full).isDirectory()) Object.assign(files, collect(full, rel));
      else files[rel] = new Uint8Array(readFileSync(full));
    }
    return files;
  };
  for (const name of Object.keys(targets)) {
    const zip = zipSync(collect(path.join(dist, name)), { level: 9 });
    const file = path.join(dist, `cooks-diff-${name}-${manifest.version}.zip`);
    writeFileSync(file, zip);
    console.log(`packed ${path.relative(root, file)} (${(zip.length / 1024).toFixed(1)} KB)`);
  }
}
