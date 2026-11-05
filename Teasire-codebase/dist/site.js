let businessPhone = "";
// Set once the DuitNow QR is ready to show on the checkout page.
let qrReady = false;
const $ = (s) => document.querySelector(s);
const page = document.body.dataset.page;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
// `price` is in RM for a pack of 10 individually packed teabags.
const teas = [
  {
    id: "green-tea-jasmine",
    name: "Green Tea Jasmine",
    zh: "茉莉绿茶",
    series: "flower",
    price: 25,
    image: "01_Green_Tea_Jasmine",
    notes: "Light · Floral · Fresh",
    ingredients: ["Green tea", "Jasmine"],
    description:
      "Fresh green tea meets the soft, unmistakable fragrance of jasmine. A light floral cup for your everyday pause.",
  },
  {
    id: "oolong-osmanthus",
    name: "Oolong Osmanthus",
    zh: "桂花乌龙",
    series: "flower",
    price: 25,
    image: "02_Oolong_Osmanthus",
    notes: "Golden · Floral · Mellow",
    ingredients: ["Oolong tea", "Osmanthus"],
    description:
      "A rounded oolong base with delicate golden osmanthus. Fragrant, mellow and easy to return to.",
  },
  {
    id: "oolong-rose",
    name: "Oolong Rose",
    zh: "玫瑰乌龙",
    series: "flower",
    price: 25,
    image: "03_Oolong_Rose",
    notes: "Rounded · Rosy · Aromatic",
    ingredients: ["Oolong tea", "Rose"],
    description:
      "The deeper character of oolong, softened by rose. An expressive floral blend for a slower moment.",
  },
  {
    id: "green-tea-rose",
    name: "Green Tea Rose",
    zh: "玫瑰绿茶",
    series: "flower",
    price: 25,
    image: "04_Green_Tea_Rose",
    notes: "Fresh · Rosy · Delicate",
    ingredients: ["Green tea", "Rose"],
    description:
      "Fresh tea notes and gentle rose fragrance come together in a delicate everyday cup.",
  },
  {
    id: "chrysanthemum-orange",
    name: "Chrysanthemum Orange",
    zh: "菊花香橙",
    series: "fruit",
    price: 25,
    image: "05_Chrysanthemum_Orange",
    notes: "Bright · Floral · Citrusy",
    ingredients: ["Chrysanthemum", "Orange"],
    description:
      "Soft chrysanthemum and bright orange make a sunny, fragrant pairing.",
  },
  {
    id: "oolong-orange",
    name: "Oolong Orange",
    zh: "香橙乌龙",
    series: "fruit",
    price: 25,
    image: "06_Oolong_Orange",
    notes: "Rounded · Citrus · Smooth",
    ingredients: ["Oolong tea", "Orange"],
    description:
      "Rounded oolong with the lively character of orange. A little brightness for your daily ritual.",
  },
  {
    id: "green-tea-orange",
    name: "Green Tea Orange",
    zh: "香橙绿茶",
    series: "fruit",
    price: 25,
    image: "07_Green_Tea_Orange",
    notes: "Crisp · Citrus · Fresh",
    ingredients: ["Green tea", "Orange"],
    description:
      "A fresh green tea base with a citrus finish. Bright, simple and full of everyday possibility.",
  },
  {
    id: "osmanthus-black-tea-red-dates",
    name: "Osmanthus Black Tea Red Dates",
    zh: "桂花红枣红茶",
    series: "fruit",
    price: 25,
    image: "08_Osmanthus_Black_Tea_Red_Dates",
    notes: "Warm · Floral · Rich",
    ingredients: ["Osmanthus", "Black tea", "Red dates"],
    description:
      "Black tea, golden osmanthus and red dates create a warm, fragrant blend with a richer character.",
  },
];
const productUrl = (id) => "tea-" + id + ".html";
// Price in RM for 10 teabags of a blend made in the Blend Studio.
const customBlendPrice = 25;
// Orders above this amount (RM) get free delivery, as the site's delivery notes say.
const freeDeliveryAbove = 150;
// Delivery fee in RM for each delivery location, for orders up to RM150.
// Draft values: change them to your real courier rates.
const deliveryFees = {
  "Peninsular Malaysia": 8,
  Sabah: 15,
  Sarawak: 15,
  Labuan: 15,
};
const rm = (amount) => "RM" + amount.toFixed(2);
// Price of a bag item: signature teas use their own price, custom blends the Blend Studio price.
const itemPrice = (item) =>
  ((teas.find((t) => t.name === item.name)?.price ?? customBlendPrice) *
    item.qty) /
  10;
const photo = (t) => "assets/clean/" + t.image + ".webp";
// Smaller copies of each photo: phones and small spots download far less,
// while large, sharp screens still get the full-size original.
const photoSet = (t) =>
  `assets/clean/${t.image}-480.webp 480w, assets/clean/${t.image}-800.webp 800w, ${photo(t)} 1086w`;
// How wide each kind of photo spot is on screen, so the browser picks the right copy.
const photoSizes = {
  card: "(max-width: 750px) 40vw, (max-width: 1100px) 26vw, 310px",
  large: "(max-width: 750px) 92vw, (max-width: 1100px) 45vw, 500px",
  thumb: "66px",
};
const photoAttrs = (t, spot) =>
  `src="${photo(t)}" srcset="${photoSet(t)}" sizes="${photoSizes[spot]}"`;
let bag = [];
try {
  const b = JSON.parse(localStorage.getItem("teasire-bag") || "[]");
  if (Array.isArray(b))
    bag = b.filter(
      (i) =>
        i &&
        typeof i.name === "string" &&
        Number.isInteger(i.qty) &&
        i.qty >= 10,
    );
} catch {}
function saveBag() {
  try {
    localStorage.setItem("teasire-bag", JSON.stringify(bag));
  } catch {}
  updateBag();
}
function updateBag() {
  document
    .querySelectorAll(".bag-count")
    .forEach((el) => (el.textContent = bag.reduce((n, i) => n + i.qty, 0)));
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 2500);
}
function addItem(name, qty = 10, extra = {}) {
  refreshBag();
  const item = bag.find((i) => i.name === name);
  if (item) item.qty += qty;
  else bag.push({ name, qty, ...extra });
  saveBag();
  toast("Added to your tea bag");
}
const navItems = [
  ["blend-studio.html", "Blend Studio"],
  ["about.html", "Our Story"],
  ["aroma.html", "Aroma Bags"],
  ["subscriptions.html", "Subscription"],
];
function brand() {
  return `<a class="logo" href="index.html" aria-label="Teasire home"><img src="assets/teasire-magpie-264.png" alt="" width="103" height="63"><span>Teasire</span></a>`;
}
// The line under the header's menu item for the page you're on. It's an element
// of its own so it can glide to the next page's item (transitions.js).
const navMarker = '<span class="nav-marker" aria-hidden="true"></span>';
function signatureMenu(
  name = "Signature Blend",
  footer = false,
  current = false,
) {
  return `<details class="signature-menu ${footer ? "footer-signature" : ""}${current ? "is-current" : ""}"><summary>${name}${current ? navMarker : ""}</summary><div class="signature-dropdown glass"><a href="flower-tea.html">Flower Tea <span>↗</span></a><a href="fruit-tea.html">Fruit Tea <span>↗</span></a></div></details>`;
}
function header() {
  // The series pages and each tea's own page sit under Signature Blend.
  const inSignature = ["flower", "fruit", "product"].includes(page);
  return `<div class="progress" aria-hidden="true"></div><header class="site-header glass">${brand()}<nav class="site-nav" aria-label="Main navigation">${signatureMenu("Signature Blend", false, inSignature)}${navItems.map(([url, label]) => (location.pathname.endsWith(url) ? `<a href="${url}" aria-current="page">${label}${navMarker}</a>` : `<a href="${url}">${label}</a>`)).join("")}</nav><div class="header-tools"><a class="pill" href="checkout.html">Bag <span class="bag-count">0</span></a><button class="plain menu-btn" id="menu" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">☰</button></div></header><nav class="mobile-menu" id="mobile-menu" aria-label="Expanded navigation" inert><div class="mobile-menu-top"><span class="mobile-menu-label">Explore Teasire</span><button class="plain" id="menu-close" type="button" aria-label="Close navigation">Close ✕</button></div>${signatureMenu()}${navItems.map(([url, label]) => `<a href="${url}">${label}</a>`).join("")}</nav>`;
}
function footer() {
  return `<footer class="site-footer"><div class="footer-top"><div>${brand()}<p class="footer-mood">A small pause.<br>A cup that feels like you.</p></div><nav class="footer-links" aria-label="Footer navigation">${signatureMenu("Signature Blend", true)}${navItems.map(([url, label]) => `<a href="${url}">${label}</a>`).join("")}</nav></div><div class="footer-legal"><span id="business-details"></span><nav class="footer-policies" aria-label="Shop policies"><a href="policies.html#delivery">Delivery</a><a href="policies.html#returns">Returns</a><a href="policies.html#terms">Terms</a><a href="policies.html#privacy">Privacy</a><span id="social-links"></span></nav></div><div class="footer-bottom"><span>Thoughtfully blended. Personally yours.</span><span>© 2026 Teasire · Malaysia</span></div></footer><button class="whatsapp-float" id="whatsapp-toggle" aria-label="WhatsApp enquiries" aria-expanded="false" aria-controls="whatsapp-panel"><svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 .8A15.1 15.1 0 0 0 2.9 23.5L.8 31.2l7.9-2.1A15.1 15.1 0 1 0 16 .8Zm0 27.6a12.4 12.4 0 0 1-6.3-1.7l-.5-.3-4.7 1.2 1.3-4.6-.3-.5a12.5 12.5 0 1 1 10.5 5.9Zm6.9-9.3c-.4-.2-2.2-1.1-2.5-1.2-.3-.1-.6-.2-.8.2-.2.4-.9 1.2-1.1 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.8-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.8-2-1.1-2.8-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4c.2.2 2.4 3.7 5.8 5.2.8.4 1.4.6 1.9.7.8.3 1.6.2 2.2.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.2-.3-.3-.7-.5Z"/></svg><span>WhatsApp</span></button><section class="whatsapp-panel glass hidden" id="whatsapp-panel" aria-labelledby="whatsapp-title"><button class="plain whatsapp-close" id="whatsapp-close" aria-label="Close WhatsApp enquiries">✕</button><h3 id="whatsapp-title">Let’s talk tea.</h3><p id="whatsapp-message">WhatsApp enquiries are coming soon. Our contact details are being updated.</p><a id="whatsapp-link" class="button full hidden" target="_blank" rel="noopener noreferrer">Open WhatsApp ↗</a><a class="link" href="checkout.html">Prepare an order request ↗</a></section><div class="toast" id="toast" role="status"></div>`;
}
function card(t) {
  return `<article class="product reveal"><a class="product-image" href="${productUrl(t.id)}"><img ${photoAttrs(t, "card")} alt="${t.name} tea with its botanical ingredients" loading="lazy" decoding="async" width="1086" height="1448"></a><h3><a href="${productUrl(t.id)}">${t.name}</a></h3><p>${t.notes}</p><div class="product-foot"><span class="card-price"><strong>${rm(t.price)}</strong><small>10 teabags</small></span><button class="add-button" data-add="${t.id}" aria-label="Add 10 ${t.name} teabags"><span aria-hidden="true">+</span> Add 10</button></div></article>`;
}
function intro(kicker, title, copy) {
  return `<div class="page-intro"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${copy}</p></div>`;
}
function cta() {
  return `<section class="cta"><span class="eyebrow">YOUR NOTES. YOUR MOOD. YOUR TEA.</span><h2>Make a little room<br>for your own ritual.</h2><a class="button" href="blend-studio.html">Create your blend <span>↗</span></a></section>`;
}
function home() {
  const series = (key, title) =>
    `<div class="shop-series"><div class="shop-series-head"><h3>${title}</h3><a class="link" href="${key}-tea.html">See the series ↗</a></div><div class="grid">${teas
      .filter((t) => t.series === key)
      .map(card)
      .join("")}</div></div>`;
  const prices = [...new Set(teas.map((t) => t.price))];
  return `<section class="film-hero" aria-labelledby="hero-title"><div class="film-hero-ambient" aria-hidden="true"></div><div class="film-hero-inner"><div class="film-hero-copy"><span class="eyebrow">MALAYSIA · SMALL BATCHES</span><h1 id="hero-title">A little tea.<br>A little stillness.</h1><p>The gentle pour. The warmth of the light. The first unhurried sip.</p><div class="film-hero-actions"><a class="button" href="#blends">Explore our teas <span>↗</span></a><a class="button secondary" href="blend-studio.html">Create your own tea <span>↗</span></a></div><span class="film-hero-note">INDIVIDUALLY PACKED · START WITH 10</span></div><figure class="film-hero-media"><video id="tea-film" muted playsinline preload="metadata" tabindex="0" poster="assets/teasire-pouring-poster.jpg" aria-label="Tea pouring gently over ice in a glass, in warm natural light. Select to play or pause."><source src="assets/teasire-pouring-film.mp4" type="video/mp4"></video></figure></div></section><div class="marquee"><div class="marquee-track">${Array(2).fill("<span>YOUR NOTES. YOUR MOOD.</span><span>SMALL BATCH, HAND PACKED</span><span>A LITTLE RITUAL, ENTIRELY YOURS</span>").join("")}</div></div><section class="section home-shop" id="blends" aria-labelledby="blends-title"><div class="page-top"><div><span class="eyebrow">SIGNATURE BLENDS</span><h2 id="blends-title">Find your next<br>favourite cup.</h2></div><p>${prices.length === 1 ? `Eight blends, each ${rm(prices[0])} for 10 individually packed teabags.` : "Eight blends in individually packed teabags."}</p></div>${series("flower", "Flower Tea")}${series("fruit", "Fruit Tea")}<aside class="quiz-nudge" aria-labelledby="quiz-nudge-title"><div><span class="eyebrow">NOT SURE WHERE TO START?</span><h3 id="quiz-nudge-title">Find your tea in one question.</h3><p>Tell us which notes you love, and we’ll match you with a blend.</p></div><a class="button" href="discover.html">Find your tea <span>↗</span></a></aside></section><section class="section quiet-story"><div class="split"><img ${photoAttrs(teas[1], "large")} alt="A warm cup of osmanthus oolong with flowers" loading="lazy"><div><span class="eyebrow">SLOW DOWN. STEEP SOMETHING GOOD.</span><h2>Nothing to rush.<br>Just a little ritual.</h2><p>A favourite cup, the fragrance of flowers, the warmth between your hands. Teasire is a small invitation to make room for yourself.</p><a class="link" href="about.html">Our story ↗</a></div></div></section>${cta()}`;
}
function collection(series) {
  const flower = series === "flower";
  return `<div class="page">${intro(flower ? "THE FLOWER TEA SERIES" : "THE FRUIT TEA SERIES", flower ? "A softer kind<br>of everyday." : "A little sunshine<br>in your cup.", flower ? "Delicate florals, familiar tea leaves and small moments to yourself. Explore our flower tea collection." : "Bright citrus, warming tea notes and a fresh perspective on your daily ritual.")}<div class="series-tabs" aria-label="Tea collections"><a href="flower-tea.html" class="${flower ? "active" : ""}" ${flower ? 'aria-current="page"' : ""}>Flower Tea <small>01</small></a><a href="fruit-tea.html" class="${flower ? "" : "active"}" ${flower ? "" : 'aria-current="page"'}>Fruit Tea <small>02</small></a></div><div class="grid">${teas
    .filter((t) => t.series === series)
    .map(card)
    .join(
      "",
    )}</div><p class="fine" style="margin-top:30px">Prices are for 10 individually packed teabags. Ingredient availability is confirmed before ordering.</p>${flower ? '<div class="notice">Also on the original flower tea menu: Oolong Jasmine, Rose Pandan and Osmanthus Rose. Ask us on WhatsApp for availability and pricing for these blends.</div>' : ""}</div>${cta()}`;
}
function product() {
  const t = teas.find(
    (t) =>
      t.id ===
      (new URLSearchParams(location.search).get("id") ||
        document.body.dataset.product),
  );
  if (!t)
    return `<div class="page">${intro("THE TEASIRE COLLECTION", "Find your cup.", "This blend could not be found. Explore our tea collections to find your next little ritual.")}<a class="button" href="flower-tea.html">Explore Flower Tea ↗</a></div>`;
  document.title = t.name + " — Teasire";
  return `<div class="page"><a class="link" href="${t.series}-tea.html">← ${t.series === "flower" ? "Flower Tea" : "Fruit Tea"}</a><div class="product-layout" style="margin-top:30px"><div class="detail-image"><img ${photoAttrs(t, "large")} alt="${t.name}"></div><div class="product-details"><span class="eyebrow">${t.series.toUpperCase()} TEA SERIES · ${t.zh}</span><h1>${t.name}</h1><p class="price-tag">${rm(t.price)} <span>per 10 teabags</span></p><p>${t.description}</p><span class="eyebrow" style="margin-top:30px">${t.notes}</span><div class="facts"><div>THE INGREDIENTS<br><br><strong>${t.ingredients.join(" + ")}</strong></div><div>YOUR DAILY RITUAL<br><br><strong>Individually packed teabags</strong></div></div><label class="field">Choose your quantity<select id="product-qty">${[10, 20, 30, 50, 100].map((n) => `<option value="${n}">${n} teabags · ${rm((t.price * n) / 10)}</option>`).join("")}</select></label><button class="button full" id="product-add" data-id="${t.id}">Add to your bag ↗</button><p class="fine" style="margin-top:18px">Delivery for your location is added in your bag.</p><details open><summary>What’s in the blend?</summary><p>${t.ingredients.join(", ")}. Final ingredient details and balance will be confirmed before packing.</p></details><details><summary>Make it your own</summary><p>Prefer a different floral note? Explore the Blend Studio and create a personalised tea.</p><a class="link" href="blend-studio.html">Go to the Blend Studio ↗</a></details><details><summary>Delivery & payment</summary><p>Malaysia is our launch market. Free delivery on orders above RM150; otherwise the delivery fee for your location is added in your bag. Card checkout is not active yet.</p><a class="link" href="policies.html#delivery">Delivery & returns ↗</a></details></div></div></div><section class="section"><div class="page-top"><h2>A different note?</h2><a class="link" href="${t.series}-tea.html">Explore the collection ↗</a></div><div class="grid">${teas
    .filter((x) => x.series === t.series && x.id !== t.id)
    .map(card)
    .join("")}</div></section>`;
}
// In the Blend Studio's live preview, `photo` is the ingredient's close-up and `color`
// its share of the label ribbon (and its dot in the summary).
const ingredients = [
  {
    id: "green",
    name: "Green tea",
    max: 100,
    base: true,
    color: "#7f9a4e",
    photo: "assets/ingredients/green.webp",
  },
  {
    id: "black",
    name: "Black tea",
    max: 100,
    base: true,
    color: "#4a3024",
    photo: "assets/ingredients/black.webp",
  },
  {
    id: "oolong",
    name: "Oolong tea",
    max: 100,
    base: true,
    color: "#8b5e2f",
    photo: "assets/ingredients/oolong.webp",
  },
  {
    id: "jasmine",
    name: "Jasmine",
    max: 35,
    color: "#ece5cf",
    photo: "assets/ingredients/jasmine.webp",
  },
  {
    id: "rose",
    name: "Rose",
    max: 35,
    color: "#c4506b",
    photo: "assets/ingredients/rose.webp",
  },
  {
    id: "chrysanthemum",
    name: "Chrysanthemum",
    max: 35,
    color: "#dcb33a",
    photo: "assets/ingredients/chrysanthemum.webp",
  },
  {
    id: "osmanthus",
    name: "Osmanthus",
    max: 25,
    color: "#e0912d",
    photo: "assets/ingredients/osmanthus.webp",
  },
];
let blend = {
  base: "green",
  main: "jasmine",
  side: "rose",
  qty: 10,
  name: "",
};
function calculate() {
  // Recipe: 70% tea base, 20% main note, 10% finishing note (or more base if none).
  const p = {};
  p[blend.base] = 70;
  p[blend.main] = (p[blend.main] || 0) + 20;
  if (blend.side !== "none") p[blend.side] = (p[blend.side] || 0) + 10;
  else p[blend.base] += 10;
  const sum = Object.values(p).reduce((a, b) => a + Number(b), 0),
    errors = [];
  if (sum !== 100) errors.push("Percentages must total 100%.");
  for (const [id, v] of Object.entries(p)) {
    const i = ingredients.find((i) => i.id === id);
    if (!i || v < 0 || v > i.max)
      errors.push("Check " + (i?.name || id) + " percentage.");
  }
  if (
    !Object.entries(p).some(
      ([id, v]) => ingredients.find((i) => i.id === id)?.base && v > 0,
    )
  )
    errors.push("Choose a tea base.");
  return {
    p,
    sum,
    errors,
    price: (customBlendPrice * blend.qty) / 10,
  };
}
// The blend's ingredients in jar order: the tea base first (bottom layer), then the notes.
function blendParts() {
  return Object.entries(calculate().p)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ ...ingredients.find((i) => i.id === id), v }));
}
function builder() {
  const parts = blendParts();
  const trio = [0, 1, 2]
    .map((slot) => {
      const part = parts[slot];
      return `<figure class="trio-item${part ? "" : " empty"}" style="--s:${part ? trioSize(part.v) : 0}"><div class="trio-photo">${part ? `<img class="on" src="${part.photo}" alt="" width="400" height="400" data-id="${part.id}">` : ""}</div><figcaption><span class="trio-share">${part ? part.v + "%" : ""}</span><span class="trio-name">${part ? part.name : ""}</span></figcaption></figure>`;
    })
    .join("");
  const ribbon = [0, 1, 2]
    .map((slot) => {
      const part = parts[slot];
      return `<span class="ribbon-part" style="--p:${part ? part.v : 0};--c:${part ? part.color : "transparent"}"><span class="ribbon-pour" data-pour></span></span>`;
    })
    .join("");
  return `<div class="page">${intro("THE TEASIRE BLEND STUDIO", "Your tea.<br>Your story.", "Choose your botanicals, name your creation and make everyday moments feel more personal.")}<div class="builder-layout studio"><div class="builder-steps"><div class="panel glass" id="builder-fields"></div><div class="panel glass"><h3>04 / Name your blend</h3><label class="field">Name your blend<input id="blend-name" maxlength="50" placeholder="e.g. Sunday Garden"></label><label class="field">Quantity<select id="blend-qty">${[10, 20, 30, 50, 100].map((n) => `<option value="${n}">${n} teabags · ${rm((customBlendPrice * n) / 10)}</option>`).join("")}</select></label></div><aside class="panel glass builder-summary"><span class="eyebrow">YOUR BLEND</span><h2>Your creation.</h2><div id="blend-summary"></div><div class="notice">Custom blends are ${rm(customBlendPrice)} per 10 teabags. We review every recipe before packing.</div><button class="button full" id="blend-save">Save this blend ♡</button><button class="button secondary full" id="blend-request" style="margin-top:12px">Add to your bag ↗</button><p class="fine" style="margin:18px 0 0">Saved recipes remain in this browser.</p></aside><section class="panel glass saved-blends"><h3>Your saved blends</h3><div id="saved-blends"></div></section></div><div class="blend-preview"><span class="eyebrow">YOUR BLEND, LIVE</span><div class="blend-trio" aria-hidden="true">${trio}</div><div class="blend-label"><div class="label-top"><img src="assets/teasire-magpie-264.png" alt="" width="36" height="22"><span class="label-brand">TEASIRE</span><span class="label-kicker">BLENDED FOR YOU</span></div><p class="label-name placeholder" id="label-name">Your blend</p><p class="label-recipe" id="label-recipe">${parts.map((x) => x.name).join(" · ")}</p><div class="label-ribbon" aria-hidden="true">${ribbon}</div><div class="label-foot"><span id="label-qty">${blend.qty} teabags</span><span>Custom blend</span></div></div></div></div></div>`;
}
// Update the live preview to match the current blend. Each ingredient's photo
// is sized by its share; a new ingredient's photo dissolves in, and a slot that
// appears grows with its own photo. The label ribbon's parts slide to their
// shares, and a part that changes ingredient slides its new colour in.
// Sizes and positions are fixed around the largest share, so nothing jumps.
const pours = new WeakMap();
const trioSize = (share) => Math.round(64 + share * 1.25);
function renderBlendPreview() {
  const parts = blendParts(),
    name = blend.name.trim();
  document.querySelectorAll(".trio-item").forEach((item, slot) => {
    const part = parts[slot],
      wasEmpty = item.classList.contains("empty");
    item.classList.toggle("empty", !part);
    item.style.setProperty("--s", part ? trioSize(part.v) : 0);
    if (!part) return;
    item.querySelector(".trio-share").textContent = part.v + "%";
    item.querySelector(".trio-name").textContent = part.name;
    showPhoto(item, part, wasEmpty);
  });
  document.querySelectorAll(".ribbon-part").forEach((seg, slot) => {
    const part = parts[slot],
      wasEmpty = Number(seg.style.getPropertyValue("--p")) === 0;
    seg.style.setProperty("--p", part ? part.v : 0);
    if (part) recolor(seg, part.color, "left", wasEmpty);
  });
  $("#label-name").textContent = name || "Your blend";
  $("#label-name").classList.toggle("placeholder", !name);
  $("#label-recipe").textContent = parts.map((x) => x.name).join(" · ");
  $("#label-qty").textContent = blend.qty + " teabags";
}
// Show an ingredient's photo in its circle. Each new photo fades in on top of
// whatever is showing (even mid-fade), then the photos underneath are removed.
// An empty circle, or a visitor who prefers reduced motion, switches instantly.
function showPhoto(item, part, instant) {
  const box = item.querySelector(".trio-photo");
  if (box.lastElementChild?.dataset.id === part.id) return;
  const img = new Image(400, 400);
  img.alt = "";
  img.dataset.id = part.id;
  img.src = part.photo;
  if (instant || reduced.matches) {
    img.className = "on";
    box.replaceChildren(img);
    return;
  }
  box.append(img);
  img
    .decode()
    .catch(() => {})
    .then(() => {
      if (box.lastElementChild !== img) return; // a newer photo took over
      requestAnimationFrame(() => img.classList.add("on"));
      img.addEventListener(
        "transitionend",
        () => {
          while (box.firstElementChild !== img) box.firstElementChild.remove();
        },
        { once: true },
      );
    });
}
// Change an element's colour (its --c): pour the new colour in, or switch
// instantly when asked or when the visitor prefers reduced motion.
function recolor(el, color, from, instant) {
  const running = pours.get(el),
    current = running ? running.color : el.style.getPropertyValue("--c").trim();
  if (current === color) return;
  if (instant || reduced.matches) {
    if (running) {
      running.anim.cancel();
      pours.delete(el);
    }
    el.style.setProperty("--c", color);
  } else pourInto(el, color, from);
}
function pourInto(el, color, from) {
  const pour = el.querySelector("[data-pour]"),
    running = pours.get(el);
  // A pour still running finishes instantly, so the next one starts from its colour.
  if (running) {
    running.anim.cancel();
    el.style.setProperty("--c", running.color);
  }
  pour.style.backgroundColor = color;
  const hidden = from === "left" ? "inset(0 100% 0 0)" : "inset(0 0 100% 0)";
  const anim = pour.animate(
    [{ clipPath: hidden }, { clipPath: "inset(0 0 0 0)" }],
    {
      duration: 650,
      easing: "cubic-bezier(0.3, 0.7, 0.2, 1)",
      fill: "forwards",
    },
  );
  pours.set(el, { anim, color });
  anim.onfinish = () => {
    if (pours.get(el)?.anim !== anim) return;
    el.style.setProperty("--c", color);
    anim.cancel();
    pour.style.backgroundColor = "";
    pours.delete(el);
  };
}
function renderBuilder() {
  const options = (arr, key) =>
    `<div class="options">${arr.map((i) => `<button class="option" type="button" aria-pressed="false" data-choice="${key}" data-value="${i.id}">${i.name}</button>`).join("")}</div>`;
  $("#builder-fields").innerHTML = `<h3>01 / Choose your tea base</h3>${options(
    ingredients.filter((i) => i.base),
    "base",
  )}<h3 style="margin-top:35px">02 / The main note</h3>${options(
    ingredients.filter((i) => !i.base),
    "main",
  )}<h3 style="margin-top:35px">03 / A finishing note</h3>${options([...ingredients.filter((i) => !i.base), { id: "none", name: "No extra note" }], "side")}`;
  $("#builder-fields").addEventListener("click", (e) => {
    const b = e.target.closest("[data-choice]");
    if (!b || b.disabled) return;
    blend[b.dataset.choice] = b.dataset.value;
    if (blend.main === "osmanthus" && blend.side === "osmanthus")
      blend.side = "none";
    updateChoices();
    renderSummary();
  });
  updateChoices();
  renderSummary();
}
// Mark the chosen options in place (no redrawing), so nothing flickers or jumps.
function updateChoices() {
  $("#builder-fields")
    .querySelectorAll("[data-choice]")
    .forEach((b) => {
      const chosen = blend[b.dataset.choice] === b.dataset.value,
        blocked =
          b.dataset.choice === "side" &&
          blend.main === "osmanthus" &&
          b.dataset.value === "osmanthus";
      b.classList.toggle("selected", chosen);
      b.setAttribute("aria-pressed", String(chosen));
      b.disabled = blocked;
      if (blocked) b.title = "Osmanthus is already your main note";
      else b.removeAttribute("title");
    });
}
function renderSummary() {
  const c = calculate();
  $("#blend-summary").innerHTML =
    Object.entries(c.p)
      .filter(([, v]) => v > 0)
      .map(
        ([id, v]) =>
          `<div class="summary-row"><span><i class="swatch" style="--c:${ingredients.find((i) => i.id === id)?.color || "transparent"}" aria-hidden="true"></i>${ingredients.find((i) => i.id === id)?.name || id}</span><strong>${v}%</strong></div>`,
      )
      .join("") +
    `<div class="summary-row"><span>Total</span><strong>${c.sum}%</strong></div><div class="summary-row"><span>${blend.qty} teabags</span><strong>${rm(c.price)}</strong></div>` +
    (c.errors.length ? `<p class="notice">${c.errors.join("<br>")}</p>` : "");
  $("#blend-save").disabled = !!c.errors.length;
  $("#blend-request").disabled = !!c.errors.length;
  renderBlendPreview();
}
function pricing() {
  return `<div class="page">${intro("PRICING", "Simple pricing.", "Every Teasire blend comes as individually packed teabags, starting from 10.")}<div class="panel glass"><table class="pricing-table"><thead><tr><th>Blend</th><th>Series</th><th>Price</th></tr></thead><tbody>${teas
    .map(
      (t) =>
        `<tr><td><a href="${productUrl(t.id)}">${t.name}</a></td><td>${t.series === "flower" ? "Flower Tea" : "Fruit Tea"}</td><td>${rm(t.price)} / 10 teabags</td></tr>`,
    )
    .join(
      "",
    )}<tr><td><a href="blend-studio.html">Your own blend</a></td><td>Blend Studio</td><td>${rm(customBlendPrice)} / 10 teabags</td></tr></tbody></table></div><div class="grid two" style="margin-top:35px"><div class="panel glass"><h3>Custom blending</h3><p>Choose your tea base and botanical notes in the Blend Studio. Custom blends start at 10 individually packed teabags.</p><a class="link" href="blend-studio.html">Explore the Blend Studio ↗</a></div><div class="panel glass"><h3>Delivery</h3><p>Free delivery on orders above RM150. Otherwise the fee for your location is added in your bag.</p><a class="link" href="checkout.html">Review your bag ↗</a></div></div></div>`;
}
function discover() {
  return `<div class="page">${intro("A LITTLE TEA DISCOVERY", "Find your kind<br>of cup.", "What sounds most like your perfect tea? Choose the notes you naturally gravitate towards.")}<div class="panel glass" style="max-width:760px"><h3>Follow your taste.</h3>${[
    [
      "floral",
      "Light, floral and gentle",
      "Jasmine or osmanthus, with a soft tea base.",
    ],
    [
      "rose",
      "Rosy, fragrant and expressive",
      "A floral cup with a little more character.",
    ],
    [
      "fruit",
      "Fruity, fresh and bright",
      "A lively citrus note for your daily pause.",
    ],
  ]
    .map(
      ([id, title, copy]) =>
        `<button class="quiz-option" data-quiz="${id}" aria-pressed="false"><strong>${title}</strong><p style="margin:8px 0 0">${copy}</p></button>`,
    )
    .join("")}<div id="quiz-result" aria-live="polite"></div></div></div>`;
}
function upcoming(kind) {
  const content = {
    aroma: [
      "BOTANICAL AROMAS",
      "A little atmosphere.<br>Entirely yours.",
      "Botanical aroma sachets for your everyday spaces. This collection is being prepared.",
      "Botanical scents for everyday",
      "A new way to enjoy the flowers and tea leaves you love. The aroma collection will be available once materials and packing details are finalised.",
    ],
    gifts: [
      "GIFTS & PERSONALIZATION",
      "A thoughtful<br>little gift.",
      "Personal gifts, blended with care. Make a daily ritual feel a little more personal.",
      "Small gestures. Personal touches.",
      "Gift options and personalization will be added when packaging is finalised. You can already save a named blend in the Blend Studio.",
    ],
  };
  const c = content[kind];
  return `<div class="page">${intro(c[0], c[1], c[2])}<div class="split"><img ${photoAttrs(teas[kind === "gifts" ? 2 : 0], "large")} alt="${kind === "gifts" ? "Rose tea for a thoughtful gift" : "Jasmine tea and botanical flowers"}"><div class="panel glass"><span class="eyebrow">COMING SOON</span><h2>${c[3]}</h2><p>${c[4]}</p><a class="button" href="blend-studio.html">Create a personal blend ↗</a></div></div></div>`;
}
// Shop policies. These are drafts written as placeholders: check every point
// matches how you actually run the shop before relying on them.
function policies() {
  return `<div class="page">${intro("SHOP POLICIES", "The small print.", "How ordering, delivery, returns and your details work at Teasire.")}<div class="policies">
<section class="policy" id="delivery"><h2>Delivery</h2>
<p>We deliver within Malaysia by tracked courier and send you the tracking number on WhatsApp.</p>
<ul>
<li>Signature teas are packed within 1–2 working days of payment. Custom blends are blended to order and packed within 3–5 working days.</li>
<li>After dispatch, delivery takes 2–4 working days in Peninsular Malaysia and 4–7 working days to Sabah, Sarawak and Labuan.</li>
</ul>
${Object.entries(deliveryFees)
  .map(
    ([zone, fee]) =>
      `<div class="summary-row"><span>${zone}</span><strong>${rm(fee)}</strong></div>`,
  )
  .join("")}
<div class="summary-row"><span>Orders above RM150</span><strong>Free</strong></div>
</section>
<section class="policy" id="returns"><h2>Returns & refunds</h2>
<ul>
<li><strong>Damaged, wrong or missing items:</strong> message us on WhatsApp within 7 days of delivery with a photo of the parcel and items. We’ll send a replacement or refund you in full, including delivery.</li>
<li><strong>Change of mind:</strong> tea is a food product, so we can’t take back opened packs. Unopened signature teas can be returned within 7 days of delivery. You pay the return postage, and we refund the tea once it arrives.</li>
<li><strong>Custom blends</strong> are made just for you, so they can’t be returned for a change of mind.</li>
<li>Refunds are paid by bank transfer or DuitNow within 7 working days of approval.</li>
</ul>
</section>
<section class="policy" id="cancellations"><h2>Cancellations</h2>
<ul>
<li>Before you pay, there’s nothing to cancel: just let us know.</li>
<li>After you pay, you can cancel for a full refund until your order is packed. Custom blends can’t be cancelled once blending has started.</li>
<li>Once your order has been sent, our returns policy applies.</li>
</ul>
</section>
<section class="policy" id="terms"><h2>Terms of sale</h2>
<ul>
<li>Prices are in Malaysian Ringgit (RM), per pack of 10 individually packed teabags. Delivery for your location is added in your bag unless your order is above RM150.</li>
<li>You order by sending your bag to us on WhatsApp and paying the total shown. We confirm your order once we have checked your payment. If anything is unavailable, we refund it in full.</li>
<li>We accept DuitNow QR, including Touch ’n Go eWallet. Please pay the exact total shown in your order.</li>
<li>Our teas are made from natural botanicals, so colour and flavour can vary slightly between batches. If an ingredient is unavailable, we’ll offer a substitute or a refund for that item.</li>
<li>Green, black and oolong teas contain caffeine. Our teas are not medicines. If you are pregnant, breastfeeding, taking medication or have allergies, check the ingredients and ask your doctor if unsure.</li>
<li>We may update these policies. The version on this page when you order applies to your order.</li>
</ul>
</section>
<section class="policy" id="privacy"><h2>Privacy</h2>
<ul>
<li>When you send an order, we receive what is in your WhatsApp message: your name, email, delivery details, notes and WhatsApp number. We use them only to confirm, deliver and support your order.</li>
<li>Your bag and saved blends are stored in your own browser. They aren’t sent to us unless you include them in a message.</li>
<li>We share your name, phone number and address only with our courier, to deliver your order. We never sell your details.</li>
<li>We keep order records only as long as needed for your order and our accounts.</li>
<li>This site doesn’t use tracking or advertising cookies. Fonts are loaded from Google Fonts, and WhatsApp messages are covered by WhatsApp’s own privacy policy.</li>
<li>To see, correct or delete your details, message us on WhatsApp.</li>
</ul>
</section>
<section class="policy" id="contact"><h2>Contact</h2>
<p id="policy-contact">Message us on WhatsApp using the button at the bottom of any page.</p>
<p class="fine" id="policy-business"></p>
</section>
</div></div>`;
}
function subscriptions() {
  return `<div class="page">${intro("GOOD TEA, ON REPEAT", "Your daily ritual.<br>On repeat.", "A little more tea, a lot more joy. Manual renewals are planned for launch.")}<div class="grid three">${[
    ["The Discovery Box", "A rotating selection of signature blends."],
    ["My Daily Ritual", "Repeat your favourite blend."],
    ["The Botanical Edit", "Seasonal botanical selections."],
  ]
    .map(
      ([name, copy]) =>
        `<article class="panel glass"><span class="eyebrow">COMING SOON</span><h3>${name}</h3><p>${copy}</p><a class="link" href="flower-tea.html">Explore the teas ↗</a></article>`,
    )
    .join(
      "",
    )}</div><p class="notice">Subscriptions do not currently accept payment or automatic billing. Final contents and pricing will be confirmed before launch.</p></div>`;
}
function about() {
  return `<div class="page">${intro("OUR STORY", "More than tea.<br>A little ritual.", "Teasire is a place to explore botanical tea your way. Choose your favourite notes, create a blend and make everyday moments feel more personal.")}<div class="split"><img ${photoAttrs(teas[0], "large")} alt="A cup of jasmine green tea surrounded by flowers"><div><h2>Your tea.<br>Your story.</h2><p>Natural botanicals. Custom blends made for you. Small batches, hand packed.</p><p>From a ready-to-love recipe to a blend of your own, we keep the ritual simple. You choose. We blend and pack. You take a moment.</p><a class="button" href="blend-studio.html">Start blending ↗</a></div></div><section style="max-width:850px;margin:100px auto 0" id="faq"><span class="eyebrow">A FEW THINGS TO KNOW</span><h2>Before your first sip.</h2>${[
    [
      "How does custom blending work?",
      "Choose a tea base, a main botanical note and a finishing note, then give your blend a name. We review the final recipe and ingredient availability before packing.",
    ],
    [
      "What is the minimum quantity?",
      "Custom orders start at 10 individually packed teabags.",
    ],
    [
      "How much does it cost?",
      'Every blend, including your own from the Blend Studio, is priced per 10 individually packed teabags. You’ll see the price on each tea and in your bag. <a class="link" href="pricing.html">See all prices ↗</a>',
    ],
    [
      "Do you deliver within Malaysia?",
      "Yes, anywhere in Malaysia. Delivery is free for orders above RM150; otherwise the fee for your location is added in your bag.",
    ],
    [
      "Can I pay by card?",
      "Card checkout is not active yet. Send your order on WhatsApp from the checkout page, then pay the total by DuitNow QR and send us the receipt.",
    ],
    [
      "Are subscriptions available?",
      "Subscription concepts are being prepared. Automatic renewals and billing are not active.",
    ],
  ]
    .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)
    .join("")}</section></div>`;
}
function checkout() {
  return `<div class="page">${intro("YOUR NEXT LITTLE RITUAL", "Make it yours.", "Review your tea selection, send your order on WhatsApp and pay by DuitNow QR. We’ll confirm once we’ve checked your payment.")}<div class="checkout-layout"><div class="panel glass"><h2 style="font-size:25px">Your details</h2><form id="order-form"><div class="row"><label class="field">Full name *<input name="name" id="customer-name" autocomplete="name" maxlength="100" required></label><label class="field">Email address *<input name="email" id="customer-email" autocomplete="email" type="email" maxlength="150" required></label></div><label class="field">Delivery location *<select id="customer-delivery" required><option value="">Select a location</option>${Object.keys(
    deliveryFees,
  )
    .map((zone) => `<option>${zone}</option>`)
    .join(
      "",
    )}</select></label><label class="field">Anything you’d like us to know?<textarea id="customer-notes" maxlength="1000" rows="3" placeholder="Taste preferences or gifting requests…"></textarea></label><p class="fine">Your details stay on this page until you choose to open WhatsApp or copy your request.</p><button class="button" id="prepare" type="submit">Prepare order request ↗</button></form><div id="order-review" class="hidden" style="margin-top:30px"><h3>Your order request</h3><p class="fine">This is a draft. No request has been sent and no payment has been taken.</p><label class="field">Order details<textarea id="request-text" readonly rows="10"></textarea></label><div class="request-actions"><a id="send-request" class="button hidden" target="_blank" rel="noopener noreferrer">Open request in WhatsApp ↗</a><button class="button secondary" id="copy-request">Copy request</button></div><p class="fine" id="next-step">Review your message in WhatsApp and tap Send.</p><p id="copy-status" role="status" class="fine" style="margin-top:15px"></p></div><div style="border-top:1px solid var(--border);padding-top:30px;margin-top:35px"><h3>How to pay</h3><ol class="order-steps"><li>Send your order on WhatsApp. Your total already includes delivery.</li><li>Pay the total with the DuitNow QR below, using Touch ’n Go or any banking app.</li><li>Send your receipt in the same WhatsApp chat. We’ll confirm and pack your order.</li></ol><details class="tng-payment"><summary><span class="tng-payment-name"><span class="tng-mark" aria-hidden="true">TNG</span><span>Touch ’n Go / DuitNow QR</span></span><span class="tng-status" id="tng-status">NOT ACTIVE YET</span></summary><div class="tng-content"><p class="fine" id="tng-description">Touch ’n Go eWallet payment is being set up. Please prepare your order request first; the final amount and payment details must be confirmed before paying.</p><div id="tng-ready" class="hidden"><p class="fine">Use your banking or eWallet app to scan the QR. On the same phone, save the QR and choose the image from your app’s scanner. Pay the exact total from your order and check the recipient name before confirming.</p><p id="tng-merchant" class="fine"></p><img id="tng-qr" class="hidden" alt="DuitNow payment QR for LEE AN" width="827" height="1280" loading="lazy"><a id="tng-download" class="button secondary full hidden" download="Teasire-DuitNow-QR.png">Save QR image ↓</a><a id="tng-open" class="button full hidden" target="_blank" rel="noopener noreferrer">Open payment link ↗</a><a id="tng-receipt" class="link hidden" target="_blank" rel="noopener noreferrer">Share your receipt on WhatsApp ↗</a><p class="fine">Payments are checked manually. Preparing a request or viewing this QR does not confirm payment.</p></div></div></details><details class="card-availability"><summary>Card payment availability</summary><div class="payment-option"><span>Credit / debit card</span><small>NOT ACTIVE YET</small></div><p class="fine">Secure hosted card checkout will be available once the payment provider and final prices are connected.</p><button class="button full" disabled>Continue to card payment ↗</button><p class="fine" style="margin-top:15px">No card details are collected on this page.</p></details></div></div><aside class="panel glass"><span class="eyebrow">IN YOUR BAG</span><h3>Your tea selection</h3><div id="checkout-items"></div><div id="checkout-totals"></div></aside></div></div>`;
}
// Tea total, delivery for the chosen location (free above RM150) and the total to pay.
// delivery and total are null until a location is chosen.
function orderTotals() {
  const tea = bag.reduce((n, i) => n + itemPrice(i), 0),
    location = $("#customer-delivery")?.value || "",
    delivery = tea > freeDeliveryAbove ? 0 : (deliveryFees[location] ?? null);
  return {
    tea,
    location,
    delivery,
    total: delivery === null ? null : tea + delivery,
  };
}
function renderTotals() {
  const { tea, delivery, total } = orderTotals();
  $("#checkout-totals").innerHTML = bag.length
    ? `<div class="summary-row"><span>Tea selection</span><span>${rm(tea)}</span></div><div class="summary-row"><span>Delivery</span><span>${delivery === null ? "Choose your location" : delivery === 0 ? "Free" : rm(delivery)}</span></div><div class="summary-row"><strong>Total (MYR)</strong><strong>${total === null ? rm(tea) + " + delivery" : rm(total)}</strong></div><p class="fine" style="margin-top:20px">Free delivery on orders above RM150.</p><a class="link" href="pricing.html">See all prices ↗</a><a class="link" href="policies.html#delivery" style="margin-left:18px">Delivery & returns ↗</a>`
    : "";
}
function renderCart() {
  const items = $("#checkout-items");
  items.innerHTML = bag.length
    ? bag
        .map((i, index) => {
          const t = teas.find((t) => t.name === i.name);
          return `<article class="cart-item">${t ? `<img ${photoAttrs(t, "thumb")} alt="${esc(i.name)}">` : '<div class="cart-placeholder">✳</div>'}<div><h3>${esc(i.name)}</h3><p>${i.qty} individually packed teabags</p><p>${rm(itemPrice(i))}</p><div class="cart-actions"><button data-qty="${index}" data-delta="-10" aria-label="Reduce ${esc(i.name)} quantity" ${i.qty <= 10 ? "disabled" : ""}>−</button><span>${i.qty}</span><button data-qty="${index}" data-delta="10" aria-label="Increase ${esc(i.name)} quantity">+</button><button class="cart-remove" data-remove="${index}" aria-label="Remove ${esc(i.name)}">Remove</button></div></div></article>`;
        })
        .join("")
    : '<div class="empty"><p>Your bag is waiting for a little ritual.</p><a class="button" href="flower-tea.html">Explore teas ↗</a></div>';
  renderTotals();
  $("#prepare").disabled = !bag.length;
  items.querySelectorAll("[data-qty]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = Number(b.dataset.qty),
          qty = bag[i].qty + Number(b.dataset.delta);
        if (qty < 10) {
          toast("Minimum quantity is 10 teabags");
          return;
        }
        bag[i].qty = qty;
        saveBag();
        renderCart();
        invalidateOrder();
      }),
  );
  items.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () => {
        bag.splice(Number(b.dataset.remove), 1);
        saveBag();
        renderCart();
        invalidateOrder();
      }),
  );
}
const content = {
  home,
  flower: () => collection("flower"),
  fruit: () => collection("fruit"),
  product,
  builder,
  pricing,
  discover,
  aroma: () => upcoming("aroma"),
  gifts: () => upcoming("gifts"),
  subscriptions,
  about,
  checkout,
  policies,
};
// A page's full markup: skip link, header, the page's content and footer.
function pageMarkup() {
  return (
    '<a class="skip-link" href="#main-content">Skip to content</a>' +
    header() +
    `<main id="main-content" tabindex="-1">${(content[page] || home)()}</main>` +
    footer()
  );
}
/* prepare-site: page content ends here */
// scripts/prepare-site.mjs saves this same markup into every page's HTML, so the
// browser only draws it when it's missing (a page that hasn't been rebuilt yet).
// Drawing it a second time would replace the page as it appears, which breaks
// the page transitions.
if (!document.getElementById("main-content"))
  document.body.innerHTML = pageMarkup();
document.querySelectorAll('img[src*="assets/clean/"]').forEach((img) => {
  img.width = 1086;
  img.height = 1448;
  img.decoding = "async";
});
updateBag();
document.querySelectorAll("[data-add]").forEach(
  (b) =>
    (b.onclick = () => {
      const t = teas.find((t) => t.id === b.dataset.add);
      if (t) addItem(t.name);
    }),
);
if ($("#product-add"))
  $("#product-add").onclick = () => {
    const t = teas.find((t) => t.id === $("#product-add").dataset.id);
    if (t) addItem(t.name, Number($("#product-qty").value));
  };
const menu = $("#menu"),
  menuPanel = $("#mobile-menu");
function toggleMenu(open, refocus = true) {
  menuPanel.classList.toggle("open", open);
  menuPanel.inert = !open;
  menu.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-is-open", open);
  document.body.style.overflow = open ? "hidden" : "";
  for (const el of [
    $(".site-header"),
    $("main"),
    $(".site-footer"),
    $("#whatsapp-toggle"),
    $(".skip-link"),
  ])
    if (el) el.inert = open;
  if (open) {
    if (!$("#whatsapp-panel").classList.contains("hidden"))
      toggleWhatsApp(false);
    requestAnimationFrame(() => $("#menu-close").focus());
  } else if (refocus) menu.focus();
}
menu.onclick = () => toggleMenu(true);
$("#menu-close").onclick = () => toggleMenu(false);
menuPanel.addEventListener("transitionend", (e) => {
  if (
    e.target === menuPanel &&
    e.propertyName === "opacity" &&
    menuPanel.classList.contains("open")
  )
    $("#menu-close").focus();
});
document.addEventListener("keydown", (e) => {
  if (!menuPanel.classList.contains("open")) return;
  if (e.key === "Escape") toggleMenu(false);
  if (e.key === "Tab") {
    const all = [...menuPanel.querySelectorAll("button,a,summary")].filter(
      (el) => el.getClientRects().length && !el.disabled,
    );
    const index = all.indexOf(document.activeElement);
    if (e.shiftKey && index <= 0) {
      e.preventDefault();
      all.at(-1).focus();
    } else if (!e.shiftKey && (index < 0 || index === all.length - 1)) {
      e.preventDefault();
      all[0].focus();
    }
  }
});
matchMedia("(min-width: 751px)").addEventListener("change", (e) => {
  if (e.matches && menuPanel.classList.contains("open")) toggleMenu(false);
});
if (page === "builder") {
  renderBuilder();
  setTimeout(
    () => ingredients.forEach((i) => (new Image().src = i.photo)),
    1200,
  );
  renderSavedBlends();
  $("#blend-name").oninput = (e) => {
    blend.name = e.target.value;
    renderBlendPreview();
  };
  $("#blend-qty").onchange = (e) => {
    blend.qty = Number(e.target.value);
    renderSummary();
  };
  $("#blend-save").onclick = () => {
    const c = calculate();
    if (c.errors.length) return;
    try {
      let saved = JSON.parse(localStorage.getItem("teasire_saved") || "[]");
      if (!Array.isArray(saved)) saved = [];
      saved.push({
        name: blend.name || "My Tea Blend",
        qty: blend.qty,
        recipe: c.p,
        selection: { base: blend.base, main: blend.main, side: blend.side },
      });
      localStorage.setItem("teasire_saved", JSON.stringify(saved));
      renderSavedBlends();
      toast("Recipe saved. Find it under Your saved blends.");
    } catch {
      toast("Your browser could not save this recipe");
    }
  };
  $("#blend-request").onclick = () => {
    const c = calculate();
    if (c.errors.length) return;
    const description = Object.entries(c.p)
      .filter(([, v]) => v > 0)
      .map(
        ([id, v]) =>
          (ingredients.find((i) => i.id === id)?.name || id) + " " + v + "%",
      )
      .join(", ");
    addItem((blend.name || "My Tea Blend") + " — " + description, blend.qty, {
      recipe: c.p,
    });
  };
}
if (page === "discover") {
  document.querySelectorAll("[data-quiz]").forEach(
    (b) =>
      (b.onclick = () => {
        document
          .querySelectorAll("[data-quiz]")
          .forEach((t) => t.setAttribute("aria-pressed", t === b));
        const choice = b.dataset.quiz;
        const t = teas[choice === "rose" ? 2 : choice === "fruit" ? 6 : 0];
        $("#quiz-result").innerHTML =
          `<div class="notice"><span class="eyebrow">YOUR TASTE MATCH</span><h3>${t.name}</h3><p>${t.description}</p><a class="button" href="${productUrl(t.id)}">Meet your blend ↗</a><p class="fine" style="margin:15px 0 0">Taste-based suggestion only, not a health assessment.</p></div>`;
      }),
  );
}
if (page === "checkout") {
  renderCart();
  $("#customer-delivery").addEventListener("change", renderTotals);
  $("#order-form").addEventListener("input", invalidateOrder);
  $("#order-form").addEventListener("change", invalidateOrder);
  $("#order-form").onsubmit = (e) => {
    e.preventDefault();
    if (!bag.length) return;
    const name = $("#customer-name").value.trim(),
      email = $("#customer-email").value.trim(),
      notes = $("#customer-notes").value.trim(),
      totals = orderTotals();
    if (!name || !email || !totals.location || totals.total === null) return;
    $("#request-text").value =
      "Hello Teasire! I would like to order:\n\n" +
      bag
        .map((i) => i.name + " — " + i.qty + " teabags — " + rm(itemPrice(i)))
        .join("\n") +
      "\n\nTea: " +
      rm(totals.tea) +
      "\nDelivery to " +
      totals.location +
      ": " +
      (totals.delivery ? rm(totals.delivery) : "free") +
      "\nTotal: " +
      rm(totals.total) +
      "\n\nName: " +
      name +
      "\nEmail: " +
      email +
      (notes ? "\nNotes: " + notes : "") +
      (qrReady
        ? "\n\nI’ll pay " +
          rm(totals.total) +
          " by DuitNow QR and send the receipt here. Thank you!"
        : "\n\nPlease let me know how to pay. Thank you!");
    $("#next-step").textContent = qrReady
      ? "Review your message in WhatsApp and tap Send. Then pay " +
        rm(totals.total) +
        " with the DuitNow QR below and send your receipt in the same chat."
      : "Review your message in WhatsApp and tap Send.";
    if (qrReady) $(".tng-payment").open = true;
    updateOrderWhatsApp();
    $("#copy-status").textContent = "";
    $("#order-review").classList.remove("hidden");
    $("#order-review").scrollIntoView({
      behavior: reduced.matches ? "instant" : "smooth",
      block: "center",
    });
  };
  $("#copy-request").onclick = async () => {
    try {
      await navigator.clipboard.writeText($("#request-text").value);
      $("#copy-status").textContent =
        "Copied. You can now share your request with Teasire.";
    } catch {
      $("#request-text").select();
      $("#copy-status").textContent = "Select and copy the request above.";
    }
  };
}
if ("IntersectionObserver" in window && !reduced.matches) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.05 },
  );
  document.querySelectorAll(".product,.split>*,.cta>*").forEach((el) => {
    // A card catching a tea photo from the last page (transitions.js) stays put.
    if (el.querySelector("[data-vt]")) return;
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add("will-reveal");
      observer.observe(el);
    }
  });
}
// Start fetching a tea's big photo as soon as its card is pointed at, touched or
// focused, so it's ready when the photo flies into the tea's page.
const warmed = new Set();
function warmPhoto(e) {
  const href = e.target.closest?.(".product a[href]")?.getAttribute("href");
  const t = href && teas.find((tea) => productUrl(tea.id) === href);
  if (!t || warmed.has(t.id)) return;
  warmed.add(t.id);
  const img = new Image();
  img.sizes = photoSizes.large;
  img.srcset = photoSet(t);
  img.src = photo(t);
}
["pointerover", "touchstart", "focusin"].forEach((type) =>
  document.addEventListener(type, warmPhoto, { passive: true }),
);
document.querySelectorAll(".glass").forEach((el) =>
  el.addEventListener(
    "pointermove",
    (e) => {
      if (reduced.matches || e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      el.style.setProperty(
        "--gx",
        ((e.clientX - r.left) / r.width) * 100 + "%",
      );
      el.style.setProperty(
        "--gy",
        ((e.clientY - r.top) / r.height) * 100 + "%",
      );
    },
    { passive: true },
  ),
);
let frameQueued = false;
function frame() {
  frameQueued = false;
  const total = document.documentElement.scrollHeight - innerHeight;
  $(".progress").style.width = (total > 0 ? (scrollY / total) * 100 : 0) + "%";
}
function requestFrame() {
  if (!frameQueued) {
    frameQueued = true;
    requestAnimationFrame(frame);
  }
}
addEventListener("scroll", requestFrame, { passive: true });
addEventListener("resize", requestFrame);
reduced.addEventListener("change", requestFrame);
frame();

if (location.hash) {
  requestAnimationFrame(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: "instant" });
  });
}

document.querySelectorAll(".signature-menu").forEach((menu) => {
  menu.addEventListener("toggle", () => {
    if (menu.open)
      document.querySelectorAll(".signature-menu").forEach((other) => {
        if (other !== menu) other.open = false;
      });
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
});
document.addEventListener("click", (e) => {
  document.querySelectorAll(".signature-menu[open]").forEach((menu) => {
    if (!menu.contains(e.target)) menu.open = false;
  });
});

// Home film: plays once while in view and holds on the finished glass.
// It starts with sound where the browser allows it. Most browsers only allow
// sound after the visitor's first tap, click or key press, so until then it
// plays silently and the sound comes on at that first interaction.
// Tapping the film (or Enter/Space when it has focus) plays or pauses it.
const teaFilm = document.querySelector("#tea-film");
if (teaFilm) {
  let manuallyPaused = false,
    visible = false;
  async function playFilm() {
    teaFilm.muted = false;
    try {
      await teaFilm.play();
    } catch {
      // Sound isn't allowed yet: play silently instead.
      teaFilm.muted = true;
      try {
        await teaFilm.play();
      } catch {}
    }
  }
  function soundOn(e) {
    if (e.target === teaFilm) return; // the film's own tap is handled below
    if (!teaFilm.muted || teaFilm.paused || teaFilm.ended) return;
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    teaFilm.muted = false;
    // A browser that still refuses sound pauses the film; keep it playing silently.
    setTimeout(() => {
      if (teaFilm.paused && !teaFilm.ended && !manuallyPaused) {
        teaFilm.muted = true;
        teaFilm.play().catch(() => {});
      }
    }, 100);
  }
  for (const type of ["click", "keydown", "touchend"])
    document.addEventListener(type, soundOn, { capture: true, passive: true });
  function tapFilm() {
    if (!teaFilm.paused && !teaFilm.ended && teaFilm.muted) {
      teaFilm.muted = false;
    } else if (teaFilm.paused || teaFilm.ended) {
      manuallyPaused = false;
      playFilm();
    } else {
      manuallyPaused = true;
      teaFilm.pause();
    }
  }
  teaFilm.addEventListener("click", tapFilm);
  teaFilm.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      tapFilm();
    }
  });
  const filmObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible = entry.isIntersecting;
        if (
          visible &&
          !document.hidden &&
          !reduced.matches &&
          !manuallyPaused &&
          !teaFilm.ended
        )
          playFilm();
        else if (!visible) teaFilm.pause();
      }
    },
    { threshold: 0.35 },
  );
  filmObserver.observe(teaFilm);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) teaFilm.pause();
    else if (visible && !reduced.matches && !manuallyPaused && !teaFilm.ended)
      playFilm();
  });
  reduced.addEventListener("change", () => {
    if (reduced.matches) teaFilm.pause();
    else if (visible && !manuallyPaused && !teaFilm.ended) playFilm();
  });
}

const waToggle = document.querySelector("#whatsapp-toggle"),
  waPanel = document.querySelector("#whatsapp-panel");
function toggleWhatsApp(open) {
  waPanel.classList.toggle("hidden", !open);
  waToggle.setAttribute("aria-expanded", String(open));
  if (open) document.querySelector("#whatsapp-close").focus();
  else waToggle.focus();
}
waToggle.onclick = () => toggleWhatsApp(waPanel.classList.contains("hidden"));
document.querySelector("#whatsapp-close").onclick = () => toggleWhatsApp(false);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !waPanel.classList.contains("hidden"))
    toggleWhatsApp(false);
});

function updateOrderWhatsApp() {
  const link = $("#send-request");
  if (!link) return;
  const text = $("#request-text").value;
  if (!businessPhone || !text) {
    link.classList.add("hidden");
    return;
  }
  link.href =
    "https://wa.me/" + businessPhone + "?text=" + encodeURIComponent(text);
  link.classList.remove("hidden");
}
// Show the business details from config/business.json; empty values stay hidden.
function renderBusinessDetails(config, phone) {
  const details = config.business || {},
    get = (key) =>
      typeof details[key] === "string" ? details[key].trim() : "",
    name = get("registeredName"),
    registration = get("registrationNumber"),
    address = get("address"),
    email = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(get("email"))
      ? get("email")
      : "",
    phoneText = phone
      ? phone
          .replace(/^60(1\d)(\d{3,4})(\d{4})$/, "+60 $1-$2 $3")
          .replace(/^(\d+)$/, "+$1")
      : "";
  $("#business-details").textContent = [
    name,
    registration && "SSM " + registration,
    phoneText && "WhatsApp " + phoneText,
    email,
  ]
    .filter(Boolean)
    .join(" · ");
  $("#social-links").innerHTML = [
    ["Instagram", get("instagram")],
    ["Facebook", get("facebook")],
    ["TikTok", get("tiktok")],
  ]
    .filter(([, url]) => {
      try {
        return new URL(url).protocol === "https:";
      } catch {
        return false;
      }
    })
    .map(
      ([label, url]) =>
        `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`,
    )
    .join("");
  const contact = $("#policy-contact");
  if (contact && phoneText)
    contact.innerHTML = `Message us on WhatsApp at <a class="link" href="https://wa.me/${phone}" target="_blank" rel="noopener noreferrer">${phoneText}</a>${email ? ` or email <a class="link" href="mailto:${esc(email)}">${esc(email)}</a>` : ""}.`;
  const who = $("#policy-business");
  if (who)
    who.textContent =
      name || registration || address
        ? [name || "Teasire", registration && "SSM " + registration, address]
            .filter(Boolean)
            .join(" · ")
        : "";
}
function invalidateOrder() {
  if (!$("#order-review")) return;
  $("#order-review").classList.add("hidden");
  $("#request-text").value = "";
  $("#send-request").removeAttribute("href");
  $("#send-request").classList.add("hidden");
  $("#copy-status").textContent = "";
}
function savedBlends() {
  try {
    const list = JSON.parse(localStorage.getItem("teasire_saved") || "[]");
    return Array.isArray(list)
      ? list.filter(
          (i) =>
            i &&
            typeof i.name === "string" &&
            Number.isInteger(i.qty) &&
            i.qty >= 10 &&
            i.recipe &&
            Object.entries(i.recipe).every(
              ([id, v]) =>
                ingredients.some((x) => x.id === id) &&
                typeof v === "number" &&
                v >= 0 &&
                v <= 100,
            ) &&
            Object.values(i.recipe).reduce((a, b) => a + b, 0) === 100,
        )
      : [];
  } catch {
    return [];
  }
}
function renderSavedBlends() {
  const holder = $("#saved-blends");
  if (!holder) return;
  const list = savedBlends();
  holder.innerHTML = list.length
    ? list
        .map(
          (item, index) =>
            `<article class="saved-recipe"><h4>${esc(item.name)}</h4><p>${Object.entries(
              item.recipe,
            )
              .filter(([, v]) => v > 0)
              .map(
                ([id, v]) =>
                  esc(ingredients.find((x) => x.id === id).name) +
                  " " +
                  v +
                  "%",
              )
              .join(
                " · ",
              )}</p><p>${item.qty} teabags · ${rm((customBlendPrice * item.qty) / 10)}</p><div class="saved-actions"><button type="button" class="button secondary" data-use-recipe="${index}">Add saved blend to bag</button><button type="button" class="plain" data-delete-recipe="${index}" aria-label="Remove saved blend ${esc(item.name)}">Remove</button></div></article>`,
        )
        .join("")
    : '<p class="fine">Your saved recipes will appear here. Create a blend and choose “Save this blend” to keep it for next time.</p>';
  holder.querySelectorAll("[data-use-recipe]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = list[Number(b.dataset.useRecipe)];
        const description = Object.entries(i.recipe)
          .filter(([, v]) => v > 0)
          .map(
            ([id, v]) =>
              ingredients.find((x) => x.id === id).name + " " + v + "%",
          )
          .join(", ");
        addItem(i.name + " — " + description, i.qty, { recipe: i.recipe });
      }),
  );
  holder.querySelectorAll("[data-delete-recipe]").forEach(
    (b) =>
      (b.onclick = () => {
        list.splice(Number(b.dataset.deleteRecipe), 1);
        try {
          localStorage.setItem("teasire_saved", JSON.stringify(list));
          renderSavedBlends();
          toast("Saved recipe removed");
        } catch {
          toast("This browser could not update saved recipes");
        }
      }),
  );
}

fetch("config/business.json")
  .then((r) => {
    if (!r.ok) throw new Error("Config unavailable");
    return r.json();
  })
  .then((config) => {
    const phone = String(config.whatsappNumber || "").replace(/[+\s()-]/g, "");
    renderBusinessDetails(
      config,
      /^[1-9][0-9]{7,14}$/.test(phone) ? phone : "",
    );
    if (/^[1-9][0-9]{7,14}$/.test(phone)) {
      document.querySelector("#whatsapp-message").textContent =
        "Ask us about your tea blend, gifting ideas or order.";
      const link = document.querySelector("#whatsapp-link");
      link.href =
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(
          "Hello Teasire! I would like to ask about your teas.",
        );
      link.classList.remove("hidden");
      businessPhone = phone;
      updateOrderWhatsApp();
      const receipt = $("#tng-receipt");
      if (receipt) {
        receipt.href =
          "https://wa.me/" +
          phone +
          "?text=" +
          encodeURIComponent(
            "Hello Teasire! Here is my payment receipt for my order.",
          );
        receipt.classList.remove("hidden");
      }
    }
    const tng = config.touchNGo || {};
    if (
      page === "checkout" &&
      tng.enabled &&
      tng.merchantName &&
      (tng.qrImage || tng.paymentLink)
    ) {
      document.querySelector("#tng-status").textContent = "PAY WHEN YOU ORDER";
      document.querySelector("#tng-description").textContent =
        "Pay the total from your order, then send your receipt in the same WhatsApp chat.";
      document.querySelector("#tng-merchant").textContent =
        "Payment recipient: " + tng.merchantName;
      let ready = false;
      if (
        typeof tng.qrImage === "string" &&
        /^assets\/[a-zA-Z0-9_./-]+$/.test(tng.qrImage) &&
        !tng.qrImage.includes("..")
      ) {
        const qr = document.querySelector("#tng-qr");
        qr.src = tng.qrImage;
        qr.classList.remove("hidden");
        const download = $("#tng-download");
        download.href = tng.qrImage;
        download.classList.remove("hidden");
        ready = true;
      }
      if (typeof tng.paymentLink === "string") {
        try {
          const url = new URL(tng.paymentLink);
          if (
            url.protocol === "https:" &&
            ["payment.tngdigital.com.my", "pay.tngdigital.com.my"].includes(
              url.hostname,
            )
          ) {
            const link = document.querySelector("#tng-open");
            link.href = url.href;
            link.classList.remove("hidden");
            ready = true;
          }
        } catch {}
      }
      if (ready) {
        document.querySelector("#tng-ready").classList.remove("hidden");
        qrReady = true;
      }
    }
  })
  .catch(() => {});

// Keep an open tab from replacing newer selections made in another tab.
function refreshBag() {
  try {
    const current = JSON.parse(localStorage.getItem("teasire-bag") || "[]");
    if (Array.isArray(current))
      bag = current.filter(
        (i) =>
          i &&
          typeof i.name === "string" &&
          Number.isInteger(i.qty) &&
          i.qty >= 10,
      );
  } catch {}
}
// Redraw what shows the bag if it changed since this page last looked.
function syncBag() {
  const before = JSON.stringify(bag);
  refreshBag();
  if (JSON.stringify(bag) === before) return;
  updateBag();
  if (page === "checkout") {
    renderCart();
    invalidateOrder();
  }
}
addEventListener("storage", (e) => {
  if (e.key === "teasire-bag") syncBag();
  if (e.key === "teasire_saved" && page === "builder") renderSavedBlends();
});
// Going back can show a page exactly as it was left: with the bag as it was
// then, and with the menu that led away still open. Close menus at once, before
// the page transition shows the page.
addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  syncBag();
  document
    .querySelectorAll(".signature-menu[open]")
    .forEach((m) => (m.open = false));
  if (menuPanel.classList.contains("open")) {
    menuPanel.style.transition = "none";
    toggleMenu(false, false);
    void menuPanel.offsetWidth;
    menuPanel.style.transition = "";
  }
});
