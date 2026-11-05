# Cook's Diff extension: store listing kit

Everything the Chrome Web Store, Microsoft Edge Add-ons and Firefox Add-ons ask
for, ready to paste. Build the upload files first:

```bash
cd apps/extension && bun run pack
```

This creates `dist/cooks-diff-chrome-<version>.zip` (Chrome and Edge) and
`dist/cooks-diff-firefox-<version>.zip` (Firefox).

## Name
Cook's Diff — see how cooks changed the recipe

## Short description (max 132 characters)
On recipe pages, see what home cooks actually changed — read from the reviews and shown as a clear, color-coded diff.

## Detailed description
Hundreds of reviews, and the real recipe is buried in them: "I used half the sugar", "added a teaspoon of espresso powder", "skipped the walnuts". Cook's Diff reads them for you.

Open a recipe and click the Cook's Diff button in the corner:
• See how many cooks changed the recipe, and how
• The most-changed ingredients, with what cooks swapped in
• What cooks add that isn't in the original
• One click to every cook's version, highlighted line by line against the original

Free, no account, no ads. The extension only runs on recipe pages, and a new analysis only starts when you click.

Cook's Diff is an independent tool and isn't affiliated with any recipe site.

## Category
Chrome: Lifestyle (or "Shopping & Food" if offered) · Edge: Lifestyle · Firefox: Other

## Single purpose (Chrome)
Shows a summary of the changes home cooks describe in a recipe's reviews, on that recipe's page.

## Permission justifications (Chrome)
- **Host permission `https://allrecipes-backend.lapwork.in/*`**: the extension's own API. It checks whether the open recipe was analyzed before and, when the user clicks, requests the analysis. No other sites are contacted.
- **Content script on recipe pages**: needed to show the Cook's Diff button and panel on the recipe the user is reading. It doesn't read page content, form fields or cookies.
- No `tabs`, `storage`, `history`, `cookies` or other permissions are requested.

## Data usage disclosures (Chrome "Privacy practices" tab)
- Data collected: **Website content / web history: the URL of the recipe page being viewed**, sent to our API to look up and analyze that recipe. Nothing else.
- Not sold, not used for advertising, not used for creditworthiness or lending.
- Certify: "I do not sell or transfer user data to third parties, outside of the approved use cases."
- Remote code: **No** (all code ships in the package).

## Privacy policy URL
https://allrecipes.lapwork.in/privacy (update when the site moves to its new domain)

## Assets you need to add
- Store icon 128×128: `dist/chrome/icons/icon-128.png`
- At least 1 screenshot, **1280×800**: open a recipe with the extension loaded, click the button, and capture the window with the panel open.
- Optional small promo tile 440×280.

## Firefox notes
- Upload the **firefox** zip. The code is bundled but not minified, so no separate source upload is needed.
- Add-on id: `cooks-diff@lapwork.in`.
