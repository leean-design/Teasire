// Page transitions, built on cross-document view transitions (switched on in each
// page's <head>; the motion itself is in enhancements.css). Browsers without them,
// and visitors who prefer less motion, simply change page. This file loads in the
// <head> so it is listening before a page's first frame.
//  - Tea photo morph: click a tea card and its photo and name fly into the tea's
//    own page; on the way back they fly into the card again.
//  - Every other change "turns" the page (data-turn on <html>): moving along the
//    menu it sweeps in from the side you're heading to ("forward" or "back"),
//    leaving the phone menu it rises in ("menu"), and otherwise it fades up
//    ("rise"). Whatever the turn, the new page's opening lines arrive in turn.
(() => {
  const FLIGHT = "teasire-flight"; // the tea whose photo is flying to the next page
  const FROM = "teasire-from"; // where the last page sits in the menu, and if its phone menu was open
  // Pages in menu order, left to right (Home first, the bag last); a tea's own
  // page sits with its series.
  const ORDER = [
    "home",
    "flower",
    "fruit",
    "builder",
    "about",
    "discover",
    "subscriptions",
    "checkout",
  ];
  let clicked = null;
  let clickedAt = 0;

  const teaIn = (url) =>
    /(?:^|\/)tea-([\w-]+)\.html(?:[?#]|$)/.exec(url || "")?.[1];
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  const cardFor = (tea) =>
    document
      .querySelector(`.product a[href="tea-${tea}.html"]`)
      ?.closest(".product");
  const place = () => {
    const { page, series } = document.body.dataset;
    const i = ORDER.indexOf(series || page);
    return i < 0 ? null : i;
  };

  // Every name given here is tagged with data-vt, so clear() can take them all
  // back. It also drops the turn.
  function name(el, value, kind) {
    el.style.viewTransitionName = value;
    el.dataset.vt = kind;
  }
  function clear() {
    document.querySelectorAll("[data-vt]").forEach((el) => {
      el.style.viewTransitionName = "";
      el.removeAttribute("data-vt");
    });
    delete document.documentElement.dataset.turn;
  }
  // Names carry the tea, so a photo only ever pairs with the same tea's photo.
  function mark(tea, photo, title) {
    if (!tea || !photo) return null;
    name(photo, "tea-photo-" + tea, "photo");
    if (title) name(title, "tea-title-" + tea, "title");
    return tea;
  }
  const markCard = (tea, card) =>
    mark(
      tea,
      card.querySelector(".product-image img"),
      card.querySelector("h3"),
    );
  const markTeaPage = () =>
    mark(
      document.body.dataset.product,
      document.querySelector(".detail-image img"),
      document.querySelector(".product-details h1"),
    );
  // The new page's opening lines, named one by one so each can arrive in turn.
  function markIntro() {
    const intro = document.querySelector(".page-intro, .film-hero-copy");
    if (!intro || !onScreen(intro)) return;
    [...intro.children]
      .filter(onScreen)
      .slice(0, 5)
      .forEach((el, i) => name(el, "teasire-intro-" + (i + 1), "intro"));
  }

  addEventListener(
    "click",
    (e) => {
      clicked = e.target.closest?.(".product a[href]") || null;
      clickedAt = performance.now();
    },
    true,
  );

  // Leaving: a clicked tea card sends its photo; a tea page sends its big photo.
  // From the open phone menu nothing flies, and the header and WhatsApp button,
  // hidden under the menu, leave with it rather than float over it.
  addEventListener("pageswap", (e) => {
    clear();
    let flight = null;
    const menu = document.body.classList.contains("menu-is-open");
    if (e.viewTransition && menu)
      document
        .querySelectorAll(".site-header, .whatsapp-float")
        .forEach((el) => name(el, "none", "off"));
    else if (e.viewTransition) {
      const tea = teaIn(clicked?.getAttribute("href"));
      const card = clicked?.closest(".product");
      const to = e.activation?.entry?.url;
      if (
        tea &&
        card &&
        onScreen(card) &&
        performance.now() - clickedAt < 5000 &&
        e.activation?.navigationType !== "traverse" &&
        (!to || teaIn(to) === tea)
      )
        flight = markCard(tea, card);
      else flight = markTeaPage();
    }
    try {
      if (flight) sessionStorage.setItem(FLIGHT, flight);
      else sessionStorage.removeItem(FLIGHT);
      sessionStorage.setItem(FROM, JSON.stringify({ place: place(), menu }));
    } catch {}
  });

  // Arriving: the tea's card catches the photo if it's on screen (going back),
  // and a tea's page catches the photo sent from its card. Otherwise the page
  // turns, the way depending on where it sits in the menu against the last one.
  addEventListener("pagereveal", (e) => {
    clear();
    let flight = null;
    let from = null;
    try {
      flight = sessionStorage.getItem(FLIGHT);
      from = JSON.parse(sessionStorage.getItem(FROM));
      sessionStorage.removeItem(FLIGHT);
      sessionStorage.removeItem(FROM);
    } catch {}
    if (!e.viewTransition) return;
    const root = document.documentElement;
    const own = document.body.dataset.product;
    const card = flight && flight !== own ? cardFor(flight) : null;
    if (card && onScreen(card)) {
      markCard(flight, card);
      card.classList.add("visible");
      root.dataset.turn = "to-card";
    } else if (own && flight === own) markTeaPage();
    else {
      const here = place();
      const there = from?.place ?? null;
      root.dataset.turn = from?.menu
        ? "menu"
        : here === null || there === null || here === there
          ? "rise"
          : here > there
            ? "forward"
            : "back";
      markIntro();
    }
    e.viewTransition.finished.then(clear, clear);
  });
})();
