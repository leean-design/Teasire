# Teasire website

A multi-page static website built with HTML, CSS and browser JavaScript. Hosted through ChatGPT Sites.

## Main files

- `dist/site.js`: page content, tea catalogue, blend builder, cart and interactions.
- `dist/site.css`: base design and styles.
- `dist/enhancements.css`: accessibility, mobile and shopping improvements.
- `dist/*.html`: generated page documents, including individual tea pages.
- `dist/assets/`: all photos, the magpie logo, tea video, poster and DuitNow QR.
- `dist/config/business.json`: WhatsApp number and manual DuitNow payment settings.
- `scripts/prepare-site.mjs`: refreshes initial HTML, sharing metadata and sitemap after content edits.
- `.openai/hosting.json`: Sites project identity and static hosting directory.

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

## Payments and data

Orders are quote requests shared by the visitor through WhatsApp. DuitNow payments are manually checked after quote confirmation. Card checkout and automatic billing are not connected. The cart and saved blends are held in the visitor's browser, not a server database.

## Audit improvements

Improved mobile navigation and keyboard focus; larger readable text and tap targets; direct WhatsApp order drafts; saved recipe reuse; cross-tab cart synchronization; same-phone QR download; slideshow controls; initial page HTML and product metadata. Existing photographs and video are preserved.
