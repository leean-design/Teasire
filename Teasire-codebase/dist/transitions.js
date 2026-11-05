// Tea photo morph between pages: click a tea card and its photo and name fly
// into the tea's own page; on the way back they fly into the card again.
// Built on cross-document view transitions, switched on in each page's <head>.
// Browsers without them, and visitors who prefer less motion, simply change page.
// This file loads in the <head> so it is listening before a page's first frame.
(() => {
  const FLIGHT = "teasire-flight"; // the tea whose photo is flying to the next page
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

  // Also drops the flight's direction (data-morph on <html>).
  function clear() {
    document.querySelectorAll("[data-morph]").forEach((el) => {
      el.style.viewTransitionName = "";
      el.removeAttribute("data-morph");
    });
  }
  // Names carry the tea, so a photo only ever pairs with the same tea's photo.
  function mark(tea, photo, title) {
    if (!tea || !photo) return null;
    photo.style.viewTransitionName = "tea-photo-" + tea;
    photo.dataset.morph = "photo";
    if (title) {
      title.style.viewTransitionName = "tea-title-" + tea;
      title.dataset.morph = "title";
    }
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

  addEventListener(
    "click",
    (e) => {
      clicked = e.target.closest?.(".product a[href]") || null;
      clickedAt = performance.now();
    },
    true,
  );

  // Leaving: a clicked tea card sends its photo; a tea page sends its big photo.
  addEventListener("pageswap", (e) => {
    clear();
    let flight = null;
    if (e.viewTransition) {
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
    } catch {}
  });

  // Arriving: the tea's card catches the photo if it's on screen (going back);
  // otherwise a tea page catches it in its big photo.
  addEventListener("pagereveal", (e) => {
    clear();
    let flight = null;
    try {
      flight = sessionStorage.getItem(FLIGHT);
      sessionStorage.removeItem(FLIGHT);
    } catch {}
    if (!e.viewTransition) return;
    const own = document.body.dataset.product;
    const card = flight && flight !== own ? cardFor(flight) : null;
    if (card && onScreen(card)) {
      markCard(flight, card);
      card.classList.add("visible");
      document.documentElement.dataset.morph = "to-card";
    } else if (own && (!flight || flight === own)) markTeaPage();
    e.viewTransition.finished.then(clear, clear);
  });
})();
