import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const root = path.resolve(import.meta.dirname, ".."),
  dist = path.join(root, "dist");
const origin = "https://leean-design.github.io/Teasire";
// Page transitions (enhancements.css, transitions.js) need these in every head:
// - transitions.js, before the stylesheets so it never waits on them, to name
//   what moves on its own (a tea's flying photo, the opening lines) before the
//   first frame;
// - the page shows once its content is parsed, so those are there to name;
// - the switch that turns transitions on (from the stylesheet it would sometimes
//   load too late, and the browser would skip the transition);
// - Chrome fetches a page as soon as a link to it is pointed at or touched.
const transitionHead =
  '<script src="transitions.js"></script>' +
  '<link rel="expect" href="#main-content" blocking="render">' +
  "<style>@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }</style>" +
  '<script type="speculationrules">{"prefetch":[{"where":{"href_matches":"*.html"},"eagerness":"moderate"}]}</script>';
// Titles and descriptions read back from existing pages are already escaped; decode them so each run escapes them exactly once.
const unesc = (t) => {
  let prev;
  do {
    prev = t;
    t = t
      .replaceAll("&lt;", "<")
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&");
  } while (t !== prev);
  return t;
};
const source = fs.readFileSync(path.join(dist, "site.js"), "utf8");
// Everything above this marker in site.js defines the page content; run only that part here.
const marker = "/* prepare-site: page content ends here */";
const renderEnd = source.indexOf(marker);
if (renderEnd < 0)
  throw new Error("Could not find the marker `" + marker + "` in site.js");
const renderSource = source.slice(0, renderEnd);
const makeContext = (page, file, product) =>
  vm.createContext({
    document: { body: { dataset: { page, product } }, title: "" },
    location: { pathname: "/" + file, search: "" },
    localStorage: { getItem: () => null },
    matchMedia: () => ({ matches: true }),
    URLSearchParams,
  });
const inventory = makeContext("home", "index.html");
vm.runInContext(renderSource, inventory);
const teas = vm.runInContext("teas", inventory);
// Phones are served smaller copies of each photo; stop before publishing broken images.
const missing = teas.flatMap((t) =>
  ["-480", "-800", ""]
    .map((size) => `assets/clean/${t.image}${size}.webp`)
    .filter((file) => !fs.existsSync(path.join(dist, file))),
);
if (missing.length)
  throw new Error(
    "Missing photo files:\n  " +
      missing.join("\n  ") +
      "\nRun `python scripts/make-photo-sizes.py` to create the smaller copies.",
  );
// The payments worker prices orders from this file, so a changed bag can't change what is charged.
fs.writeFileSync(
  path.join(dist, "config", "prices.json"),
  JSON.stringify(
    {
      teas: teas.map((t) => ({ name: t.name, price: t.price })),
      customBlendPrice: vm.runInContext("customBlendPrice", inventory),
      freeDeliveryAbove: vm.runInContext("freeDeliveryAbove", inventory),
      deliveryFees: vm.runInContext("deliveryFees", inventory),
    },
    null,
    2,
  ) + "\n",
);
const productTemplate = fs.readFileSync(
  path.join(dist, "product.html"),
  "utf8",
);
for (const t of teas) {
  const f = "tea-" + t.id + ".html";
  if (!fs.existsSync(path.join(dist, f)))
    fs.writeFileSync(
      path.join(dist, f),
      productTemplate.replace(
        'data-page="product"',
        'data-page="product" data-product="' + t.id + '"',
      ),
    );
}
const urls = [];
let pageCount = 0;
for (const file of fs
  .readdirSync(dist)
  .filter((f) => f.endsWith(".html") && !f.startsWith("__"))) {
  const p = path.join(dist, file);
  let html = fs.readFileSync(p, "utf8");
  const page = html.match(/data-page="([^"]+)"/)?.[1] || "home";
  const product = html.match(/data-product="([^"]+)"/)?.[1];
  const ctx = makeContext(page, file, product);
  vm.runInContext(renderSource, ctx);
  const markup = vm.runInContext("pageMarkup()", ctx);
  const tea = teas.find((t) => t.id === product);
  const title = tea
    ? tea.name + " (" + tea.blend + ") — Teasire"
    : unesc(html.match(/<title>(.*?)<\/title>/s)[1]);
  const desc = tea
    ? tea.description + " Individually packed teabags, available in Malaysia."
    : unesc(
        html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "",
      ) ||
      "Discover Teasire botanical teas and create a personal daily ritual.";
  const esc = (t) =>
    t
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;");
  const image =
    origin +
    "/assets/clean/" +
    (tea?.image || "01_Green_Tea_Jasmine") +
    ".webp";
  const noindex = ["checkout.html", "product.html"].includes(file);
  let body = markup.replace(
    '<main id="main-content" tabindex="-1">',
    '<noscript><div class="no-script">Explore our <a href="flower-tea.html">flower teas</a> and <a href="fruit-tea.html">fruit teas</a>. Enable JavaScript for blending and your bag, or <a href="https://wa.me/60126769675">contact Teasire on WhatsApp</a>.</div></noscript><main id="main-content" tabindex="-1">',
  );
  const images = [...body.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/g)];
  for (const [tag, src] of images) {
    if (/width=/.test(tag)) continue;
    const attrs = src.includes("clean/")
      ? ' width="1086" height="1448" decoding="async"'
      : "";
    body = body.replace(tag, tag.replace(">", attrs + ">"));
  }
  // Meaningful initial HTML is served before the interactive script starts.
  html = `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#ffffff"><link rel="canonical" href="${origin}/${file}">${noindex ? '<meta name="robots" content="noindex,follow">' : ""}<meta property="og:type" content="website"><meta property="og:site_name" content="Teasire"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${origin}/${file}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/png" sizes="192x192" href="assets/teasire-icon-192.png">${transitionHead}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Montserrat:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="site.css"><link rel="stylesheet" href="enhancements.css"><script src="site.js" defer></script></head><body data-page="${page}"${product ? ' data-product="' + product + '"' : ""}${tea ? ' data-series="' + tea.series + '"' : ""}>${body}</body></html>\n`;
  fs.writeFileSync(p, html);
  pageCount++;
  if (!noindex) urls.push(origin + "/" + file);
}
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls.map((u) => "<url><loc>" + u + "</loc></url>").join("") +
    "</urlset>\n",
);
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  "User-agent: *\nAllow: /\nSitemap: " + origin + "/sitemap.xml\n",
);
console.log(
  `Prepared ${pageCount} pages with initial content, metadata and a sitemap.`,
);
