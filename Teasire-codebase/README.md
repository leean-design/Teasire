# Teasire website

A multi-page static website built with HTML, CSS and browser JavaScript, hosted on GitHub Pages at https://leean-design.github.io/Teasire/.

## Main files

- `dist/site.js`: page content, tea catalogue, blend builder, cart and interactions.
- `dist/site.css`: base design and styles.
- `dist/enhancements.css`: accessibility, mobile and shopping improvements.
- `dist/*.html`: generated page documents, including individual tea pages.
- `dist/assets/`: all photos, the magpie logo, tea video, poster and DuitNow QR.
- `dist/config/business.json`: WhatsApp number and manual DuitNow payment settings.
- `scripts/prepare-site.mjs`: refreshes initial HTML, sharing metadata and sitemap after content edits.

## Preview locally

From this folder run:

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser. Python is required for this preview command; no dependency installation is needed.

## Edit content

Edit `dist/site.js` and the CSS files. After content edits, run:

```sh
node scripts/prepare-site.mjs
```

The preparation script requires Node.js 22 or later. When changing domains, update the `origin` value in the script before regenerating pages.

Keep the code formatted so pull request diffs stay readable:

```sh
npx prettier@3 --write dist/site.js dist/site.css dist/enhancements.css scripts/prepare-site.mjs
```

The generated `dist/*.html`, `sitemap.xml` and `robots.txt` files are collapsed in pull request diffs (see `.gitattributes` at the repository root).

## Publish changes

Every change merged into `main` goes live automatically. The `Deploy website` workflow in `.github/workflows/deploy-pages.yml` runs the preparation script and publishes `dist/` to GitHub Pages, usually within a couple of minutes.

To make a change:

1. Create a branch, edit the files, and preview locally.
2. Commit, push the branch, and open a pull request into `main`.
3. Once the pull request is reviewed and merged, the site updates. Progress shows in the repository's **Actions** tab.

One-time setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Payments and data

Orders are quote requests shared by the visitor through WhatsApp. DuitNow payments are manually checked after quote confirmation. Card checkout and automatic billing are not connected. The cart and saved blends are held in the visitor's browser, not a server database.

## Audit improvements

Improved mobile navigation and keyboard focus; larger readable text and tap targets; direct WhatsApp order drafts; saved recipe reuse; cross-tab cart synchronization; same-phone QR download; slideshow controls; initial page HTML and product metadata. Existing photographs and video are preserved.
