# Teasire website

A multi-page static website built with HTML, CSS and browser JavaScript, hosted on GitHub Pages at https://leean-design.github.io/Teasire/.

## Main files

- `dist/site.js`: page content, tea catalogue, blend builder, cart and interactions.
- `dist/site.css`: base design and styles.
- `dist/enhancements.css`: accessibility, mobile and shopping improvements.
- `dist/*.html`: generated page documents, including individual tea pages.
- `dist/assets/`: all photos, the magpie logo, tea video, poster and DuitNow QR. Each tea photo in `assets/clean/` has smaller `-480` and `-800` copies that phones download instead of the full-size original.
- `dist/config/business.json`: WhatsApp number, business details shown in the footer and on the Policies page, and manual DuitNow payment settings.
- `scripts/prepare-site.mjs`: refreshes initial HTML, sharing metadata and sitemap after content edits.
- `scripts/make-photo-sizes.py`: creates the smaller copies of any new tea photo.

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

### Change prices

Prices are in RM per pack of 10 teabags, in `dist/site.js`:

- `price` on each tea in the `teas` list.
- `customBlendPrice` for blends made in the Blend Studio.
- `freeDeliveryAbove` (RM150) decides when the bag shows free delivery. If you change it, also update the "above RM150" wording on the pages.
- `deliveryFees`: the delivery fee for each location. The bag adds it to the total, and the Policies page lists it.

### Business details and shop policies

- Business details live in `dist/config/business.json` under `business`: `registeredName`, `registrationNumber` (SSM), `email`, `address`, and full `https://` links for `instagram`, `facebook` and `tiktok`. Empty values are hidden, so nothing shows until it is filled in. The WhatsApp number is shown from `whatsappNumber`.
- The delivery, returns, cancellation, terms and privacy text is in the `policies()` function in `dist/site.js`, with delivery fees in `deliveryFees` near the prices. The current text is a draft written as a placeholder: check every point matches how the shop runs.

### Add a new tea

1. Save its photo as `dist/assets/clean/09_Tea_Name.webp`, 1086 × 1448 pixels.
2. Create the smaller copies (needs Python with Pillow: `pip install Pillow`):

   ```sh
   python scripts/make-photo-sizes.py
   ```

3. Add the tea to the `teas` list in `dist/site.js`, then run `node scripts/prepare-site.mjs` to create its page.

The preparation script stops with an error if a photo's smaller copies are missing, so a deploy never publishes broken images.

## Publish changes

Every change merged into `main` goes live automatically. The `Deploy website` workflow in `.github/workflows/deploy-pages.yml` runs the preparation script and publishes `dist/` to GitHub Pages, usually within a couple of minutes.

To make a change:

1. Create a branch, edit the files, and preview locally.
2. Commit, push the branch, and open a pull request into `main`.
3. Once the pull request is reviewed and merged, the site updates. Progress shows in the repository's **Actions** tab.

One-time setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Payments and data

Visitors send their order, with prices and a total, to Teasire on WhatsApp. DuitNow payments are checked manually after the order is confirmed. Card checkout and automatic billing are not connected. The cart and saved blends are held in the visitor's browser, not a server database.

## Audit improvements

Improved mobile navigation and keyboard focus; larger readable text and tap targets; direct WhatsApp order drafts; saved recipe reuse; cross-tab cart synchronization; same-phone QR download; slideshow controls; initial page HTML and product metadata. Existing photographs and video are preserved.
