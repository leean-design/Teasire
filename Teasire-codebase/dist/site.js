let businessPhone = "";
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
const teas = [
  {
    id: "green-tea-jasmine",
    name: "Green Tea Jasmine",
    zh: "茉莉绿茶",
    series: "flower",
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
    image: "08_Osmanthus_Black_Tea_Red_Dates",
    notes: "Warm · Floral · Rich",
    ingredients: ["Osmanthus", "Black tea", "Red dates"],
    description:
      "Black tea, golden osmanthus and red dates create a warm, fragrant blend with a richer character.",
  },
];
const productUrl = (id) => "tea-" + id + ".html";
const photo = (t) => "assets/clean/" + t.image + ".webp";
const links = [
  ["index.html", "Home"],
  ["flower-tea.html", "Flower Tea"],
  ["fruit-tea.html", "Fruit Tea"],
  ["blend-studio.html", "Blend Studio"],
  ["discover.html", "Discover"],
  ["about.html", "Our Story"],
];
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
  return `<a class="logo" href="index.html" aria-label="Teasire home"><img src="assets/teasire-magpie.png" alt="" width="103" height="63"><span>Teasire</span></a>`;
}
function signatureMenu(name = "Signature Blend", footer = false) {
  return `<details class="signature-menu ${footer ? "footer-signature" : ""}"><summary>${name}<span aria-hidden="true">⌄</span></summary><div class="signature-dropdown glass"><a href="flower-tea.html">Flower Tea <span>↗</span></a><a href="fruit-tea.html">Fruit Tea <span>↗</span></a></div></details>`;
}
function header() {
  return `<div class="progress" aria-hidden="true"></div><header class="site-header glass">${brand()}<nav class="site-nav" aria-label="Main navigation">${signatureMenu()}${navItems.map(([url, label]) => `<a href="${url}" ${location.pathname.endsWith(url) ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav><div class="header-tools"><a class="pill" href="checkout.html">Bag <span class="bag-count">0</span></a><button class="plain menu-btn" id="menu" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">☰</button></div></header><nav class="mobile-menu" id="mobile-menu" aria-label="Expanded navigation" inert><div class="mobile-menu-top"><span class="mobile-menu-label">Explore Teasire</span><button class="plain" id="menu-close" type="button" aria-label="Close navigation">Close ✕</button></div>${signatureMenu()}${navItems.map(([url, label]) => `<a href="${url}">${label}</a>`).join("")}</nav>`;
}
function footer() {
  return `<footer class="site-footer"><div class="footer-top"><div>${brand()}<p class="footer-mood">A small pause.<br>A cup that feels like you.</p></div><nav class="footer-links" aria-label="Footer navigation">${signatureMenu("Signature Blend", true)}${navItems.map(([url, label]) => `<a href="${url}">${label}</a>`).join("")}</nav></div><div class="footer-bottom"><span>Thoughtfully blended. Personally yours.</span><span>© 2026 Teasire · Malaysia</span></div></footer><button class="whatsapp-float" id="whatsapp-toggle" aria-label="WhatsApp enquiries" aria-expanded="false" aria-controls="whatsapp-panel"><svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 .8A15.1 15.1 0 0 0 2.9 23.5L.8 31.2l7.9-2.1A15.1 15.1 0 1 0 16 .8Zm0 27.6a12.4 12.4 0 0 1-6.3-1.7l-.5-.3-4.7 1.2 1.3-4.6-.3-.5a12.5 12.5 0 1 1 10.5 5.9Zm6.9-9.3c-.4-.2-2.2-1.1-2.5-1.2-.3-.1-.6-.2-.8.2-.2.4-.9 1.2-1.1 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.8-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.8-2-1.1-2.8-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4c.2.2 2.4 3.7 5.8 5.2.8.4 1.4.6 1.9.7.8.3 1.6.2 2.2.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.2-.3-.3-.7-.5Z"/></svg><span>WhatsApp</span></button><section class="whatsapp-panel glass hidden" id="whatsapp-panel" aria-labelledby="whatsapp-title"><button class="plain whatsapp-close" id="whatsapp-close" aria-label="Close WhatsApp enquiries">✕</button><h3 id="whatsapp-title">Let’s talk tea.</h3><p id="whatsapp-message">WhatsApp enquiries are coming soon. Our contact details are being updated.</p><a id="whatsapp-link" class="button full hidden" target="_blank" rel="noopener noreferrer">Open WhatsApp ↗</a><a class="link" href="checkout.html">Prepare an order request ↗</a></section><div class="toast" id="toast" role="status"></div>`;
}
function card(t) {
  return `<article class="product reveal"><a class="product-image" href="${productUrl(t.id)}"><img src="${photo(t)}" alt="${t.name} tea with its botanical ingredients" loading="lazy" decoding="async" width="1086" height="1448"></a><h3><a href="${productUrl(t.id)}">${t.name}</a></h3><p>${t.notes}</p><div class="product-foot"><span>10 teabags minimum · Quote on request</span><button class="add-button" data-add="${t.id}" aria-label="Add 10 ${t.name} teabags"><span aria-hidden="true">+</span> Add 10</button></div></article>`;
}
function intro(kicker, title, copy) {
  return `<div class="page-intro"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${copy}</p></div>`;
}
function cta() {
  return `<section class="cta"><span class="eyebrow">YOUR NOTES. YOUR MOOD. YOUR TEA.</span><h2>Make a little room<br>for your own ritual.</h2><a class="button" href="blend-studio.html">Create your blend <span>↗</span></a></section>`;
}
function brew() {
  return `<section class="tea-film-section" id="brew" aria-labelledby="tea-film-title"><div class="tea-film-layout"><div class="tea-film-copy"><span class="eyebrow">THE SIMPLE PLEASURE OF TEA</span><h2 id="tea-film-title">A moment<br>to savour.</h2><p>The gentle pour. The warmth of the light. The first unhurried sip.</p><p>A little invitation to let the day soften, and enjoy something made just for you.</p><a class="button secondary" href="blend-studio.html">Make your own ritual <span>↗</span></a><div class="tea-film-notes"><span>Tea leaves.</span><span>A little care.</span><span>Your own pace.</span></div></div><figure class="tea-film-frame"><div class="tea-film-media"><video id="tea-film" muted playsinline preload="metadata" poster="assets/teasire-pouring-poster.jpg" aria-label="Tea pouring gently over ice in a glass, in warm natural light"><source src="assets/teasire-pouring-film.mp4" type="video/mp4"><p>Your browser cannot play this film. <a href="assets/teasire-pouring-film.mp4">Watch the tea film</a>.</p></video><div class="tea-film-controls glass"><button id="film-play" type="button" aria-label="Play tea film"><span id="film-play-icon" aria-hidden="true">▶</span><span id="film-play-label">Play film</span></button><span class="film-control-divider" aria-hidden="true"></span><button id="film-sound" type="button" aria-label="Turn sound on" aria-pressed="false">Sound off</button></div></div><figcaption><span>A LITTLE STILLNESS, POURED.</span><span>TEASIRE</span></figcaption></figure></div></section>`;
}
function home() {
  return `<section class="hero"><div class="hero-labels"><span>A QUIETER KIND OF EVERYDAY</span><span>MALAYSIA · SMALL BATCHES</span></div><div class="liquid-orb orb-one"></div><div class="liquid-orb orb-two"></div><h1><span><b>A little tea.</b></span><span><b>A little stillness.</b></span></h1><div class="hero-visual"><img width="1086" height="1448" fetchpriority="high" decoding="async" id="hero-img" src="${photo(teas[0])}" alt="Green Tea Jasmine"><a class="glass" id="hero-link" href="${productUrl(teas[0].id)}"><span id="hero-label">Green Tea Jasmine</span><span>↗</span></a><div class="hero-gallery-controls"><button type="button" id="hero-prev" aria-label="Previous tea photograph">←</button><span id="hero-count" aria-live="polite">1 / 8</span><button type="button" id="hero-next" aria-label="Next tea photograph">→</button><button type="button" id="hero-pause" aria-label="Pause tea slideshow">Pause</button></div></div><div class="hero-copy"><p>Let the day soften, one cup at a time.<br>Familiar tea leaves, fragrant flowers, and a moment just for you.</p><div class="hero-actions"><a class="button" href="flower-tea.html">Explore our teas <span>↗</span></a><a class="button secondary" href="blend-studio.html">Create your own tea <span>↗</span></a></div></div><div class="hero-foot"><span>INDIVIDUALLY PACKED · START WITH 10</span><a href="#brew">SCROLL TO FEEL IT ↓</a></div></section><div class="marquee"><div class="marquee-track">${Array(2).fill("<span>YOUR NOTES. YOUR MOOD.</span><span>SMALL BATCH, HAND PACKED</span><span>A LITTLE RITUAL, ENTIRELY YOURS</span>").join("")}</div></div>${brew()}<section class="section"><div class="page-top"><div><span class="eyebrow">OUR COLLECTIONS</span><h2>Follow your senses.</h2></div><p>Fragrant flowers or sunlit fruit.<br>Two ways to find your next favourite cup.</p></div><div class="grid two"><a class="collection-tile" href="flower-tea.html"><img src="${photo(teas[2])}" alt="Rose oolong tea and rose petals" loading="lazy"><div class="glass"><h3>Flower Tea</h3><span>Explore ↗</span></div></a><a class="collection-tile" href="fruit-tea.html"><img src="${photo(teas[6])}" alt="Green tea with fresh orange" loading="lazy"><div class="glass"><h3>Fruit Tea</h3><span>Explore ↗</span></div></a></div></section><section class="section quiet-story"><div class="split"><img src="${photo(teas[1])}" alt="A warm cup of osmanthus oolong with flowers" loading="lazy"><div><span class="eyebrow">SLOW DOWN. STEEP SOMETHING GOOD.</span><h2>Nothing to rush.<br>Just a little ritual.</h2><p>A favourite cup, the fragrance of flowers, the warmth between your hands. Teasire is a small invitation to make room for yourself.</p><a class="link" href="about.html">Our story ↗</a></div></div></section>${cta()}`;
}
function collection(series) {
  const flower = series === "flower";
  return `<div class="page">${intro(flower ? "THE FLOWER TEA SERIES" : "THE FRUIT TEA SERIES", flower ? "A softer kind<br>of everyday." : "A little sunshine<br>in your cup.", flower ? "Delicate florals, familiar tea leaves and small moments to yourself. Explore our flower tea collection." : "Bright citrus, warming tea notes and a fresh perspective on your daily ritual.")}<div class="series-tabs" aria-label="Tea collections"><a href="flower-tea.html" class="${flower ? "active" : ""}" ${flower ? 'aria-current="page"' : ""}>Flower Tea <small>01</small></a><a href="fruit-tea.html" class="${flower ? "" : "active"}" ${flower ? "" : 'aria-current="page"'}>Fruit Tea <small>02</small></a></div><div class="grid">${teas
    .filter((t) => t.series === series)
    .map(card)
    .join(
      "",
    )}</div><p class="fine" style="margin-top:30px">Final pricing and ingredient availability are confirmed before ordering.</p>${flower ? '<div class="notice">Also on the original flower tea menu: Oolong Jasmine, Rose Pandan and Osmanthus Rose. Ask us on WhatsApp for availability and pricing for these blends.</div>' : ""}</div>${cta()}`;
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
  return `<div class="page"><a class="link" href="${t.series}-tea.html">← ${t.series === "flower" ? "Flower Tea" : "Fruit Tea"}</a><div class="product-layout" style="margin-top:30px"><div class="detail-image"><img src="${photo(t)}" alt="${t.name}"></div><div class="product-details"><span class="eyebrow">${t.series.toUpperCase()} TEA SERIES · ${t.zh}</span><h1>${t.name}</h1><p>${t.description}</p><span class="eyebrow" style="margin-top:30px">${t.notes}</span><div class="facts"><div>THE INGREDIENTS<br><br><strong>${t.ingredients.join(" + ")}</strong></div><div>YOUR DAILY RITUAL<br><br><strong>Individually packed teabags</strong></div></div><label class="field">Choose your quantity<select id="product-qty">${[10, 20, 30, 50, 100].map((n) => `<option value="${n}">${n} teabags</option>`).join("")}</select></label><button class="button full" id="product-add" data-id="${t.id}">Add to your bag ↗</button><p class="fine" style="margin-top:18px">Quote on request. Final price, availability and delivery confirmed before payment.</p><details open><summary>What’s in the blend?</summary><p>${t.ingredients.join(", ")}. Final ingredient details and balance will be confirmed before packing.</p></details><details><summary>Make it your own</summary><p>Prefer a different floral note? Explore the Blend Studio and create a personalised tea.</p><a class="link" href="blend-studio.html">Go to the Blend Studio ↗</a></details><details><summary>Delivery & payment</summary><p>Malaysia is our launch market. Free delivery on orders above RM150, with delivery details confirmed in your quote. Card checkout is not active yet.</p></details></div></div></div><section class="section"><div class="page-top"><h2>A different note?</h2><a class="link" href="${t.series}-tea.html">Explore the collection ↗</a></div><div class="grid">${teas
    .filter((x) => x.series === t.series && x.id !== t.id)
    .map(card)
    .join("")}</div></section>`;
}
const ingredients = [
  { id: "green", name: "Green tea", cost: 0.22, max: 100, base: true },
  { id: "black", name: "Black tea", cost: 0.18, max: 100, base: true },
  { id: "oolong", name: "Oolong tea", cost: 0.28, max: 100, base: true },
  { id: "jasmine", name: "Jasmine", cost: 0.48, max: 35 },
  { id: "rose", name: "Rose", cost: 0.5, max: 35 },
  { id: "chrysanthemum", name: "Chrysanthemum", cost: 0.36, max: 35 },
  { id: "osmanthus", name: "Osmanthus", cost: 0.65, max: 25 },
];
let blend = {
  mode: "guided",
  base: "green",
  main: "jasmine",
  side: "rose",
  qty: 10,
  name: "",
  percent: { green: 65, jasmine: 25, rose: 10 },
};
function calculate() {
  let p = {};
  if (blend.mode === "guided") {
    p[blend.base] = 70;
    p[blend.main] = (p[blend.main] || 0) + 20;
    if (blend.side !== "none") p[blend.side] = (p[blend.side] || 0) + 10;
    else p[blend.base] += 10;
  } else p = { ...blend.percent };
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
  const cost = Object.entries(p).reduce(
    (n, [id, v]) =>
      n + (((ingredients.find((i) => i.id === id)?.cost || 0) * v) / 100) * 2.5,
    0,
  );
  return {
    p,
    sum,
    errors,
    price: Math.round(((cost + 0.75) / 0.4) * blend.qty * 100) / 100,
  };
}
function builder() {
  return `<div class="page">${intro("THE TEASIRE BLEND STUDIO", "Your tea.<br>Your story.", "Choose your botanicals, name your creation and make everyday moments feel more personal.")}<div class="builder-layout"><div><div class="panel glass" id="builder-fields"></div><section class="panel glass saved-blends"><h3>Your saved blends</h3><div id="saved-blends"></div></section><div class="panel glass"><h3>Make it yours.</h3><label class="field">Name your blend<input id="blend-name" maxlength="50" placeholder="e.g. Sunday Garden"></label><label class="field">Quantity<select id="blend-qty">${[10, 20, 30, 50, 100].map((n) => `<option value="${n}">${n} teabags</option>`).join("")}</select></label></div></div><aside class="panel glass builder-summary"><span class="eyebrow">YOUR BLEND PREVIEW</span><h2>Your creation.</h2><div id="blend-summary"></div><div class="notice">This estimate uses illustrative ingredient costs. It is not a confirmed price. Recipes and ingredient limits require review before packing.</div><button class="button full" id="blend-save">Save this blend ♡</button><button class="button secondary full" id="blend-request" style="margin-top:12px">Add to bag for a quote ↗</button><p class="fine" style="margin:18px 0 0">Saved recipes remain in this browser.</p></aside></div></div>`;
}
function renderBuilder() {
  const options = (arr, key, current) =>
    `<div class="options">${arr.map((i) => `<button class="option ${current === i.id ? "selected" : ""}" aria-pressed="${current === i.id}" data-choice="${key}" data-value="${i.id}" ${key === "side" && blend.main === "osmanthus" && i.id === "osmanthus" ? 'disabled title="Osmanthus is already your main note"' : ""}>${i.name}</button>`).join("")}</div>`;
  $("#builder-fields").innerHTML = `<h3>01 / Choose your tea base</h3>${options(
    ingredients.filter((i) => i.base),
    "base",
    blend.base,
  )}<h3 style="margin-top:35px">02 / The main note</h3>${options(
    ingredients.filter((i) => !i.base),
    "main",
    blend.main,
  )}<h3 style="margin-top:35px">03 / A finishing note</h3>${options([...ingredients.filter((i) => !i.base), { id: "none", name: "No extra note" }], "side", blend.side)}`;
  $("#builder-fields")
    .querySelectorAll("[data-choice]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          blend[b.dataset.choice] = b.dataset.value;
          if (blend.main === "osmanthus" && blend.side === "osmanthus")
            blend.side = "none";
          renderBuilder();
          document
            .querySelector(
              '[data-choice="' +
                b.dataset.choice +
                '"][data-value="' +
                b.dataset.value +
                '"]',
            )
            ?.focus();
        }),
    );
  $("#builder-fields")
    .querySelectorAll("[data-percent]")
    .forEach(
      (i) =>
        (i.oninput = () => {
          blend.percent[i.dataset.percent] = Number(i.value);
          $("#percent-" + i.dataset.percent).textContent = i.value + "%";
          renderSummary();
        }),
    );
  renderSummary();
}
function renderSummary() {
  const c = calculate();
  $("#blend-summary").innerHTML =
    Object.entries(c.p)
      .filter(([, v]) => v > 0)
      .map(
        ([id, v]) =>
          `<div class="summary-row"><span>${ingredients.find((i) => i.id === id)?.name || id}</span><strong>${v}%</strong></div>`,
      )
      .join("") +
    `<div class="summary-row"><span>Total</span><strong>${c.sum}%</strong></div><div class="summary-row"><span>${blend.qty} teabags · Preview estimate</span><strong>RM${c.price.toFixed(2)}</strong></div>` +
    (c.errors.length ? `<p class="notice">${c.errors.join("<br>")}</p>` : "");
  $("#blend-save").disabled = !!c.errors.length;
  $("#blend-request").disabled = !!c.errors.length;
}
function pricing() {
  return `<div class="page">${intro("PREVIEW PRICING", "A note on pricing.", "Explore our illustrative signature prices. Final prices and pack specifications will be confirmed before ordering.")}<div class="panel glass"><table class="pricing-table"><thead><tr><th>Original preview listing</th><th>Preview price</th><th>Status</th></tr></thead><tbody><tr><td>Jasmine Dream</td><td>RM28.00</td><td>Pending confirmation</td></tr><tr><td>Rose Harmony</td><td>RM32.00</td><td>Pending confirmation</td></tr><tr><td>Peach Oolong</td><td>RM30.00</td><td>Pending confirmation</td></tr></tbody></table><p class="fine">These original preview listings are separate from the eight flower and fruit tea blends. Their prices have not been assigned to those blends.</p></div><div class="grid two" style="margin-top:35px"><div class="panel glass"><h3>Custom blending</h3><p>Dynamic estimates in the Blend Studio depend on your ingredient selection and quantity. Minimum quantity: 10 individually packed teabags.</p><a class="link" href="blend-studio.html">Explore the Blend Studio ↗</a></div><div class="panel glass"><h3>Delivery</h3><p>Free delivery on orders above RM150. Delivery zone, charges and final order pricing are confirmed before payment.</p><a class="link" href="checkout.html">Review your bag ↗</a></div></div></div>`;
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
        `<button class="quiz-option" data-quiz="${id}" aria-pressed="false"><strong>${title}</strong><p style="margin:8px 0 0;font-size:11px">${copy}</p></button>`,
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
  return `<div class="page">${intro(c[0], c[1], c[2])}<div class="split"><img src="${photo(teas[kind === "gifts" ? 2 : 0])}" alt="${kind === "gifts" ? "Rose tea for a thoughtful gift" : "Jasmine tea and botanical flowers"}"><div class="panel glass"><span class="eyebrow">COMING SOON</span><h2>${c[3]}</h2><p>${c[4]}</p><a class="button" href="blend-studio.html">Create a personal blend ↗</a></div></div></div>`;
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
  return `<div class="page">${intro("OUR STORY", "More than tea.<br>A little ritual.", "Teasire is a place to explore botanical tea your way. Choose your favourite notes, create a blend and make everyday moments feel more personal.")}<div class="split"><img src="${photo(teas[0])}" alt="A cup of jasmine green tea surrounded by flowers"><div><h2>Your tea.<br>Your story.</h2><p>Natural botanicals. Custom blends made for you. Small batches, hand packed.</p><p>From a ready-to-love recipe to a blend of your own, we keep the ritual simple. You choose. We blend and pack. You take a moment.</p><a class="button" href="blend-studio.html">Start blending ↗</a></div></div><section style="max-width:850px;margin:100px auto 0" id="faq"><span class="eyebrow">A FEW THINGS TO KNOW</span><h2>Before your first sip.</h2>${[
    [
      "How does custom blending work?",
      "Choose a tea base, a main botanical note and a finishing note, then give your blend a name. The final recipe, ingredient availability and price are reviewed before packing.",
    ],
    [
      "What is the minimum quantity?",
      "Custom orders start at 10 individually packed teabags.",
    ],
    [
      "How are the prices calculated?",
      "The preview prices and ingredient costs are illustrative. The Blend Studio preserves that estimate model. Final selling prices are confirmed with your order.",
    ],
    [
      "Do you deliver within Malaysia?",
      "Malaysia is our launch market. Delivery is free for orders above RM150; zones and any delivery charges are confirmed before payment.",
    ],
    [
      "Can I pay by card?",
      "Card checkout is not active yet. The checkout page prepares an order request. A payment provider and confirmed prices are required before online card payments can launch.",
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
  return `<div class="page">${intro("YOUR NEXT LITTLE RITUAL", "Make it yours.", "Review your tea selection and prepare your order request. We’ll confirm the blend, availability and final price before payment.")}<div class="checkout-layout"><div class="panel glass"><h2 style="font-size:25px">Your details</h2><form id="order-form"><div class="row"><label class="field">Full name *<input name="name" id="customer-name" autocomplete="name" maxlength="100" required></label><label class="field">Email address *<input name="email" id="customer-email" autocomplete="email" type="email" maxlength="150" required></label></div><label class="field">Delivery location<select id="customer-delivery"><option value="">Select a location</option><option>Peninsular Malaysia</option><option>Sabah</option><option>Sarawak</option><option>To be confirmed</option></select></label><label class="field">Anything you’d like us to know?<textarea id="customer-notes" maxlength="1000" rows="3" placeholder="Taste preferences or gifting requests…"></textarea></label><p class="fine">Your details stay on this page until you choose to open WhatsApp or copy your request.</p><button class="button" id="prepare" type="submit">Prepare order request ↗</button></form><div id="order-review" class="hidden" style="margin-top:30px"><h3>Your order request</h3><p class="fine">This is a draft. No request has been sent and no payment has been taken.</p><label class="field">Order details<textarea id="request-text" readonly rows="10"></textarea></label><div class="request-actions"><a id="send-request" class="button hidden" target="_blank" rel="noopener noreferrer">Open request in WhatsApp ↗</a><button class="button secondary" id="copy-request">Copy request</button></div><p class="fine">Review your message in WhatsApp and tap Send. We’ll confirm availability and your total before you pay.</p><p id="copy-status" role="status" class="fine" style="margin-top:15px"></p></div><div style="border-top:1px solid var(--border);padding-top:30px;margin-top:35px"><h3>Payment after confirmation</h3><ol class="order-steps"><li>Send your tea request on WhatsApp.</li><li>Receive your confirmed quote and delivery details.</li><li>Pay the confirmed amount, then share your receipt.</li></ol><details class="tng-payment"><summary><span class="tng-payment-name"><span class="tng-mark" aria-hidden="true">TNG</span><span>Touch ’n Go / DuitNow QR</span></span><span class="tng-status" id="tng-status">NOT ACTIVE YET</span></summary><div class="tng-content"><p class="fine" id="tng-description">Touch ’n Go eWallet payment is being set up. Please prepare your order request first; the final amount and payment details must be confirmed before paying.</p><div id="tng-ready" class="hidden"><p class="fine">Use your banking or eWallet app to scan the QR. On the same phone, save the QR and choose the image from your app’s scanner. Pay only your confirmed quote and check the recipient name before confirming.</p><p id="tng-merchant" class="fine"></p><img id="tng-qr" class="hidden" alt="DuitNow payment QR for LEE AN" width="827" height="1280"><a id="tng-download" class="button secondary full hidden" download="Teasire-DuitNow-QR.png">Save QR image ↓</a><a id="tng-open" class="button full hidden" target="_blank" rel="noopener noreferrer">Open payment link ↗</a><a id="tng-receipt" class="link hidden" target="_blank" rel="noopener noreferrer">Share your receipt on WhatsApp ↗</a><p class="fine">Payments are checked manually. Preparing a request or viewing this QR does not confirm payment.</p></div></div></details><details class="card-availability"><summary>Card payment availability</summary><div class="payment-option"><span>Credit / debit card</span><small>NOT ACTIVE YET</small></div><p class="fine">Secure hosted card checkout will be available once the payment provider and final prices are connected.</p><button class="button full" disabled>Continue to card payment ↗</button><p class="fine" style="margin-top:15px">No card details are collected on this page.</p></details></div></div><aside class="panel glass"><span class="eyebrow">IN YOUR BAG</span><h3>Your tea selection</h3><div id="checkout-items"></div><div id="checkout-totals"></div></aside></div></div>`;
}
function renderCart() {
  const items = $("#checkout-items");
  items.innerHTML = bag.length
    ? bag
        .map((i, index) => {
          const t = teas.find((t) => t.name === i.name);
          return `<article class="cart-item">${t ? `<img src="${photo(t)}" alt="${esc(i.name)}">` : '<div class="cart-placeholder">✳</div>'}<div><h3>${esc(i.name)}</h3><p>${i.qty} individually packed teabags</p><p>Quote required</p><div class="cart-actions"><button data-qty="${index}" data-delta="-10" aria-label="Reduce ${esc(i.name)} quantity" ${i.qty <= 10 ? "disabled" : ""}>−</button><span>${i.qty}</span><button data-qty="${index}" data-delta="10" aria-label="Increase ${esc(i.name)} quantity">+</button><button class="cart-remove" data-remove="${index}" aria-label="Remove ${esc(i.name)}">Remove</button></div></div></article>`;
        })
        .join("")
    : '<div class="empty"><p>Your bag is waiting for a little ritual.</p><a class="button" href="flower-tea.html">Explore teas ↗</a></div>';
  $("#checkout-totals").innerHTML = bag.length
    ? '<div class="summary-row"><span>Tea selection</span><span>Quote required</span></div><div class="summary-row"><span>Delivery</span><span>To be confirmed</span></div><div class="summary-row"><strong>Total (MYR)</strong><strong>Pending quote</strong></div><p class="fine" style="margin-top:20px">Free delivery on orders above RM150. Delivery zone, fees and any applicable taxes are confirmed with your quote.</p><a class="link" href="pricing.html">About preview pricing ↗</a>'
    : "";
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
};
document.body.innerHTML =
  '<a class="skip-link" href="#main-content">Skip to content</a>' +
  header() +
  `<main id="main-content" tabindex="-1">${(content[page] || home)()}</main>` +
  footer();
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
function toggleMenu(open) {
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
  } else menu.focus();
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
  renderSavedBlends();
  document.querySelectorAll("[data-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        blend.mode = b.dataset.mode;
        document.querySelectorAll("[data-mode]").forEach((t) => {
          const selected = t === b;
          t.classList.toggle("active", selected);
          t.setAttribute("aria-selected", selected);
        });
        renderBuilder();
      }),
  );
  $("#blend-name").oninput = (e) => (blend.name = e.target.value);
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
        price: c.price,
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
      estimate: c.price,
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
  $("#order-form").addEventListener("input", invalidateOrder);
  $("#order-form").addEventListener("change", invalidateOrder);
  $("#order-form").onsubmit = (e) => {
    e.preventDefault();
    if (!bag.length) return;
    const name = $("#customer-name").value.trim(),
      email = $("#customer-email").value.trim();
    if (!name || !email) return;
    const delivery = $("#customer-delivery").value,
      notes = $("#customer-notes").value.trim();
    $("#request-text").value =
      "Hello Teasire! I would like a quote for:\n\n" +
      bag.map((i) => i.name + " — " + i.qty + " teabags").join("\n") +
      "\n\nName: " +
      name +
      "\nEmail: " +
      email +
      (delivery ? "\nDelivery: " + delivery : "") +
      (notes ? "\nNotes: " + notes : "") +
      "\n\nPlease confirm availability, final pricing, delivery and payment options. Thank you!";
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
  document
    .querySelectorAll(".product,.split>*,.collection-tile,.cta>*")
    .forEach((el) => {
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add("will-reveal");
        observer.observe(el);
      }
    });
}
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
let heroSlide = 0,
  heroPaused = reduced.matches,
  heroTimer;
function showHero(index) {
  heroSlide = (index + teas.length) % teas.length;
  const t = teas[heroSlide],
    img = $("#hero-img");
  if (!img) return;
  img.src = photo(t);
  img.alt = t.name;
  $("#hero-label").textContent = t.name;
  $("#hero-link").href = productUrl(t.id);
  $("#hero-count").textContent = heroSlide + 1 + " / " + teas.length;
}
function setHeroPaused(paused) {
  heroPaused = paused;
  $("#hero-pause").textContent = paused ? "Play" : "Pause";
  $("#hero-pause").setAttribute(
    "aria-label",
    paused ? "Play tea slideshow" : "Pause tea slideshow",
  );
}
if (page === "home") {
  setHeroPaused(heroPaused);
  $("#hero-next").onclick = () => {
    setHeroPaused(true);
    showHero(heroSlide + 1);
  };
  $("#hero-prev").onclick = () => {
    setHeroPaused(true);
    showHero(heroSlide - 1);
  };
  $("#hero-pause").onclick = () => setHeroPaused(!heroPaused);
  heroTimer = setInterval(() => {
    const r = $(".hero-visual").getBoundingClientRect();
    if (
      !heroPaused &&
      !document.hidden &&
      !reduced.matches &&
      r.bottom > 0 &&
      r.top < innerHeight &&
      !$(".hero-visual").matches(":hover,:focus-within")
    )
      showHero(heroSlide + 1);
  }, 6500);
  reduced.addEventListener("change", (e) => {
    if (e.matches) setHeroPaused(true);
  });
}
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

// Play the continuous photographic film at its own pace, without scroll seeking.
const teaFilm = document.querySelector("#tea-film");
if (teaFilm) {
  let manuallyPaused = false,
    visible = false;
  const playButton = document.querySelector("#film-play"),
    soundButton = document.querySelector("#film-sound");
  function updateFilmControls() {
    const playing = !teaFilm.paused && !teaFilm.ended;
    document.querySelector("#film-play-icon").textContent = playing
      ? "Ⅱ"
      : "▶";
    document.querySelector("#film-play-label").textContent = playing
      ? "Pause film"
      : teaFilm.ended
        ? "Replay film"
        : "Play film";
    playButton.setAttribute(
      "aria-label",
      playing
        ? "Pause tea film"
        : teaFilm.ended
          ? "Replay tea film"
          : "Play tea film",
    );
  }
  async function playFilm() {
    try {
      await teaFilm.play();
    } catch {}
    updateFilmControls();
  }
  playButton.onclick = () => {
    if (teaFilm.paused) {
      manuallyPaused = false;
      playFilm();
    } else {
      manuallyPaused = true;
      teaFilm.pause();
    }
  };
  soundButton.onclick = () => {
    teaFilm.muted = !teaFilm.muted;
    soundButton.textContent = teaFilm.muted ? "Sound off" : "Sound on";
    soundButton.setAttribute("aria-pressed", String(!teaFilm.muted));
    soundButton.setAttribute(
      "aria-label",
      teaFilm.muted ? "Turn sound on" : "Turn sound off",
    );
  };
  teaFilm.addEventListener("play", updateFilmControls);
  teaFilm.addEventListener("pause", updateFilmControls);
  teaFilm.addEventListener("ended", updateFilmControls);
  teaFilm.addEventListener("error", () => {
    document.querySelector("#film-play-label").textContent = "Film unavailable";
    playButton.disabled = true;
    soundButton.disabled = true;
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
  updateFilmControls();
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
              )}</p><p>${item.qty} teabags</p><div class="saved-actions"><button type="button" class="button secondary" data-use-recipe="${index}">Add saved blend to bag</button><button type="button" class="plain" data-delete-recipe="${index}" aria-label="Remove saved blend ${esc(item.name)}">Remove</button></div></article>`,
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
            "Hello Teasire! I would like to share my payment receipt for my confirmed order.",
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
      document.querySelector("#tng-status").textContent =
        "AFTER QUOTE CONFIRMATION";
      document.querySelector("#tng-description").textContent =
        "Pay only after Teasire confirms your order total on WhatsApp.";
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
      if (ready)
        document.querySelector("#tng-ready").classList.remove("hidden");
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
addEventListener("storage", (e) => {
  if (e.key === "teasire-bag") {
    refreshBag();
    updateBag();
    if (page === "checkout") {
      renderCart();
      invalidateOrder();
    }
  }
  if (e.key === "teasire_saved" && page === "builder") renderSavedBlends();
});
