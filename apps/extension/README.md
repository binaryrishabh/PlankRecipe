# Cook's Diff browser extension

Manifest V3 extension for Chrome, Edge and Firefox. On recipe pages it shows a
Cook's Diff button. On load it only looks up our own database to see whether the
recipe was analyzed (and shows the tweak count). A new analysis starts only when
the reader clicks. The panel shows the most-changed ingredients, what cooks add,
and a link to the recipe's full page on the website.

## Build

```bash
bun run build   # dist/chrome and dist/firefox, unpacked
bun run pack    # same, plus store-ready zips in dist/
```

Icons are rendered from `apps/web/public/favicon.svg`. API and site addresses
live in `src/config.ts` and must match `host_permissions` in `manifest.json`.

## Try it locally
- **Chrome / Edge:** open `chrome://extensions` (or `edge://extensions`), turn on
  Developer mode, choose **Load unpacked** and pick `dist/chrome`.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, choose
  **Load Temporary Add-on** and pick `dist/firefox/manifest.json`.

## Layout
- `src/content.ts`: the button and panel, rendered in a shadow root (remote data is only ever inserted as text)
- `src/background.ts`: all network calls (host permission, so no CORS and no recipe-site cookies)
- `src/styles.ts`: panel styles, applied as a constructable stylesheet so page CSP can't block them
- `STORE_LISTING.md`: copy for the store listings
