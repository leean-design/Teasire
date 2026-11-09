# Teasire website

A multi-page static website built with HTML, CSS and browser JavaScript, hosted on GitHub Pages at https://leean-design.github.io/Teasire/.

## Main files

- `dist/site.js`: page content, tea catalogue, blend builder, cart and interactions.
- `dist/site.css`: base design and styles.
- `dist/enhancements.css`: accessibility, mobile and shopping improvements, and the page transitions.
- `dist/transitions.js`: the page transitions. Click a tea card and its photo and name fly into the tea's page; going back flies them into the card again. Moving along the menu, the line under it glides to the new item and the page sweeps in from that side; leaving the phone menu, the page rises in. Each new page's opening lines arrive one after another. It runs in Chrome, Edge and Safari; other browsers change page normally.
- `dist/*.html`: generated page documents, including individual tea pages.
- `dist/assets/`: all photos, the magpie logo, the two tea films (the pouring film and its poster at the top of the home page, and the osmanthus film and its still further down; both are silent), and DuitNow QR. Each tea photo in `assets/clean/` has smaller `-480` and `-800` copies that phones download instead of the full-size original.
- `dist/assets/ingredients/`: 400px close-ups of each Blend Studio ingredient, cut from the tea photos (each ingredient's `photo` in `dist/site.js`).
- `dist/config/payments.json`: turns online payment (Billplz) on or off and holds the payments worker's address. See "Online payments (Billplz)" below.
- `dist/config/prices.json`: generated from `site.js` by the preparation script. The payments worker charges from it.
- `worker/`: the small Cloudflare Worker that creates Billplz bills and records paid orders.
- `dist/config/business.json`: WhatsApp number, business details shown in the footer and on the Policies page, and manual DuitNow payment settings.
- `scripts/prepare-site.mjs`: refreshes initial HTML, sharing metadata and sitemap after content edits.
- `scripts/make-photo-sizes.py`: creates the smaller copies of any new tea photo.
- `scripts/prepare-story-film.py`: puts a new osmanthus film (and its still) on the home page.

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

Pages show the HTML this script saves, and the browser doesn't redraw them, so always run it after changing `site.js` (the deploy runs it automatically). The preparation script requires Node.js 22 or later. When changing domains, update the `origin` value in the script before regenerating pages.

Keep the code formatted so pull request diffs stay readable:

```sh
npx prettier@3 --write dist/site.js dist/transitions.js dist/site.css dist/enhancements.css scripts/prepare-site.mjs
```

The generated `dist/*.html`, `sitemap.xml` and `robots.txt` files are collapsed in pull request diffs (see `.gitattributes` at the repository root).

### Change prices

Prices are in RM per pack of 10 teabags, in `dist/site.js`:

- `price` on each tea in the `teas` list.
- `customBlendPrice` for blends made in the Blend Studio.
- `freeDeliveryFrom` (RM150) and `freeDeliveryLocations` (Peninsular Malaysia): orders of that amount and above, delivered there, get free delivery. The bag, the WhatsApp order and every page that mentions free delivery follow these two values.
- `deliveryFees`: the delivery fee for each location. The bag adds it to the total, and the Policies page lists it. The current fees (RM8 Peninsular Malaysia, RM15 Sabah, Sarawak and Labuan) are provisional until the courier's rates are confirmed.

The payments worker charges from `config/prices.json`, which the preparation script writes from these values. After changing any of them, publish the site, then deploy the payments worker again (Actions → "Deploy payments worker"), so online payments charge the same total as the bag.

### Business details and shop policies

- Business details live in `dist/config/business.json` under `business`: `registeredName`, `registrationNumber` (SSM), `email`, `address`, and full `https://` links for `instagram`, `facebook` and `tiktok`. Empty values are hidden. The footer of every page shows "Teasire is operated by" the registered name with its SSM number, then the WhatsApp number (`whatsappNumber`); the Contact section of the Policies page shows the WhatsApp number, email and address. The preparation script writes these into each page's HTML, so run it after changing the file.
- The delivery, returns, cancellation, terms and privacy text is in the `policies()` function in `dist/site.js`, with delivery fees in `deliveryFees` near the prices. The current text is a draft written as a placeholder: check every point matches how the shop runs.

### Online payments (Billplz)

Customers can pay by FPX online banking, card or eWallet through [Billplz](https://www.billplz.com). DuitNow QR and WhatsApp keep working alongside it. Online payment stays hidden until `enabled` is `true` in `dist/config/payments.json`.

How it works: the checkout page sends the bag and delivery details to the worker in `worker/`. The worker prices the order from `config/prices.json` (never from the browser), creates a Billplz bill with an order reference such as `TS-261105-K7QM`, and sends the customer to Billplz to pay. Billplz then tells the worker the bill is paid (the message is checked with the X Signature key) and brings the customer back to the checkout page, which shows the result, empties the bag and offers a WhatsApp message with the full order. Every order is kept in Cloudflare KV for about 13 months.

Easiest setup, no terminal: add the repository secrets listed at the top of `.github/workflows/deploy-payments.yml`, then go to Actions → "Deploy payments worker" → Run workflow. It creates the order store, deploys the worker, sets its secrets and shows the worker address in the run summary. Then do step 5 and step 6 below. A new Cloudflare account must first pick its `workers.dev` subdomain: open Workers & Pages in the Cloudflare dashboard once.

Or set it up from your own computer (Node.js 22 or later, run from `worker/`):

1. Open a Billplz account. Test first with a [Billplz sandbox](https://www.billplz-sandbox.com) account.
2. In Billplz, create a collection and copy its ID into `BILLPLZ_COLLECTION_ID` in `worker/wrangler.toml`. Under Settings → Keys & Integration, turn on X Signature.
3. Log in to Cloudflare and create the order store, then uncomment the `[[kv_namespaces]]` lines in `wrangler.toml` and paste the `id` it prints:
   ```sh
   npx wrangler@4 login
   npx wrangler@4 kv namespace create teasire-orders
   ```
4. Add the secrets (each command asks for the value):
   ```sh
   npx wrangler@4 secret put BILLPLZ_API_KEY
   npx wrangler@4 secret put BILLPLZ_X_SIGNATURE
   npx wrangler@4 secret put ADMIN_TOKEN
   ```
5. Deploy with `npm run deploy`. Put the `https://….workers.dev` address it prints in `apiUrl` in `dist/config/payments.json`, and set `enabled` to `true`.
6. Pay a test order with the sandbox. While `enabled` is `false`, online payment shows only to you: open `checkout.html?testpay=1` (it stays on until the tab is closed or you open `?testpay=0`). When it works, change `BILLPLZ_API` in `wrangler.toml` to `https://www.billplz.com`, replace the secrets and collection ID with the live ones, and deploy again.

To see recent orders with names, addresses and payment status:

```sh
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://YOUR-WORKER.workers.dev/orders
```

Paid bills also appear in the Billplz dashboard, with the order reference and delivery address on each one. If you move the site to another domain, update `SITE_URL` in `wrangler.toml` too. Once online payment is on, also update the two "Card checkout is not active yet" lines in `site.js` (the product page's "Delivery & payment" and the FAQ).

Run the worker's tests with `npm test` in `worker/`.

Testing tips: test payments only work from the published site (`https://leean-design.github.io/Teasire/checkout.html?testpay=1`), because the worker only takes orders from there, and from a network that can reach `*.workers.dev`. From a local preview, or with the worker's address blocked, the checkout says it couldn't reach the payment service and nothing is charged. In the Billplz sandbox, choose Simulator → Billplz → Proceed to pay, then "Successful payment" or "Failed payment".

### Add a new tea

1. Save its photo as `dist/assets/clean/09_Tea_Name.webp`, 1086 × 1448 pixels.
2. Create the smaller copies (needs Python with Pillow: `pip install Pillow`):

   ```sh
   python scripts/make-photo-sizes.py
   ```

3. Add the tea to the `teas` list in `dist/site.js`, and its `id` to any `moods` it suits (see "The tea wheel" below). Then run `node scripts/prepare-site.mjs` to create its page.

The preparation script stops with an error if a photo's smaller copies are missing, so a deploy never publishes broken images.

### The tea wheel (Discovery page)

On the Discovery page (`discover.html`), visitors choose a mood and spin a wheel of the teas that suit it. Wherever the wheel stops, 10 teabags of that tea go straight into the bag, and a card pops up with the tea's photo and description, Undo, and a link to the bag. "Surprise me" spins all the teas.

The moods are the `moods` list in `dist/site.js`: each has a `chip` (its button), a `name`, the `teas` on its wheel (by `id`) and the `line` shown under the buttons ("Rosy & expressive · 4 blends with rose"). A mood without `teas` holds every tea. Each slice shows the tea's photo, with its name on a white ring round the edge. A wheel with fewer than six teas shows each tea more than once, so it still looks full.

### Hidden pages

The Aroma Bags page (`aroma.html`) is hidden until the collection is confirmed. It is left out of the menus, the sitemap and search results, but its address still opens it, for previewing. To bring it back, add `["aroma.html", "Aroma Bags"]` to `navItems` in `dist/site.js`, take `aroma.html` off the `noindex` list in `scripts/prepare-site.mjs`, and run the script.

### The osmanthus film

On the home page, beside "Nothing to rush", osmanthus blossoms drift down into a glass of tea in a silent 9-second loop (`dist/assets/teasire-osmanthus-film.mp4`, about 0.7 MB, made with Runway from the osmanthus oolong photo). It plays while it is on screen and only downloads then; tapping it plays or pauses it. Until it plays, and for visitors who prefer less motion, a still of its first frame shows instead (`dist/assets/teasire-osmanthus-still.webp`, with a `-480` copy for phones), so the change from still to film can't be seen.

To use a new film, for example another one from Runway (portrait, with a still camera), run this with the path of the video (needs Python with Pillow: `pip install Pillow`, and ffmpeg):

```sh
python scripts/prepare-story-film.py path/to/video.mp4
```

It replaces the film and the still together. It makes the film loop smoothly by fading its last second into its first, crops it to 3:4, and compresses it for the web.

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
