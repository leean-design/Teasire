import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import worker, {
  orderEmails,
  priceOrder,
  signature,
  signatureSource,
} from "../src/index.js";

const config = (name) =>
  JSON.parse(
    fs.readFileSync(
      new URL("../../dist/config/" + name + ".json", import.meta.url),
    ),
  );
const prices = config("prices"),
  business = config("business");
const site = "https://leean-design.github.io/Teasire";
// Tests follow whatever site.js charges, so a price change doesn't break them.
const tea = prices.teas[0].name,
  per10 = prices.teas[0].price,
  fee = prices.deliveryFees["Peninsular Malaysia"],
  oneBag = per10 + fee,
  cents = (rm) => String(Math.round(rm * 100));
const customer = {
  name: "Aina",
  email: "aina@example.com",
  phone: "012-345 6789",
  address: "1 Jalan Teh, Kuala Lumpur",
  location: "Peninsular Malaysia",
};

// `emails` turns order emails on: the worker's key and sender, and the site's switch.
function setup({
  emails = false,
  siteSwitch = emails,
  resendStatus = 200,
} = {}) {
  const store = new Map(),
    calls = [];
  const env = {
    SITE_URL: site,
    BILLPLZ_API: "https://www.billplz-sandbox.com",
    BILLPLZ_COLLECTION_ID: "col123",
    BILLPLZ_API_KEY: "key",
    BILLPLZ_X_SIGNATURE: "sigkey",
    ADMIN_TOKEN: "admin",
    ...(emails
      ? {
          RESEND_API_KEY: "resend-key",
          ORDER_EMAIL_FROM: "Teasire <orders@example.com>",
        }
      : {}),
    ORDERS: {
      get: async (k) => store.get(k) ?? null,
      put: async (k, v) => void store.set(k, v),
      list: async () => ({ keys: [...store.keys()].map((name) => ({ name })) }),
    },
  };
  let bill = { paid: false };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/config/prices.json"))
      return Response.json(prices);
    if (String(url).endsWith("/config/payments.json"))
      return Response.json({ ...config("payments"), orderEmails: siteSwitch });
    if (String(url).endsWith("/config/business.json"))
      return Response.json(business);
    if (String(url) === "https://api.resend.com/emails")
      return Response.json({ id: "email1" }, { status: resendStatus });
    if (String(url).endsWith("/api/v3/bills") && init.method === "POST")
      return Response.json({
        id: "abc123",
        url: "https://billplz/bills/abc123",
      });
    if (String(url).endsWith("/api/v3/bills/abc123"))
      return Response.json(bill);
    return new Response("?", { status: 404 });
  };
  return { env, store, calls, setBill: (b) => (bill = b) };
}
const post = (path, body, origin = "https://leean-design.github.io") =>
  new Request("https://pay.example.workers.dev" + path, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

test("prices come from the price list, not the browser", () => {
  const o = priceOrder(
    { items: [{ name: tea, qty: 20, price: 1 }], customer },
    prices,
  );
  assert.equal(o.tea, per10 * 2);
  assert.equal(o.delivery, fee);
  assert.equal(o.total, per10 * 2 + fee);
  assert.equal(o.customer.phone, "60123456789");
});
test("free delivery from the threshold, Peninsular Malaysia only", () => {
  // Packs of 10 bringing the tea total to the threshold or just above it.
  const packs = Math.ceil(prices.freeDeliveryFrom / per10),
    order = (location, list = prices) =>
      priceOrder(
        {
          items: [{ name: tea, qty: packs * 10 }],
          customer: { ...customer, location },
        },
        list,
      );
  assert.deepEqual(prices.freeDeliveryLocations, ["Peninsular Malaysia"]);
  assert.equal(order("Peninsular Malaysia").delivery, 0);
  assert.equal(order("Sabah").delivery, prices.deliveryFees.Sabah);
  assert.equal(order("Sarawak").delivery, prices.deliveryFees.Sarawak);
  assert.equal(order("Labuan").delivery, prices.deliveryFees.Labuan);
  // Exactly the threshold counts ("RM150 and above").
  const exact = { ...prices, freeDeliveryFrom: packs * per10 };
  assert.equal(order("Peninsular Malaysia", exact).delivery, 0);
  // Just under the threshold pays the fee.
  const under = { ...prices, freeDeliveryFrom: packs * per10 + 0.01 };
  assert.equal(order("Peninsular Malaysia", under).delivery, fee);
});
test("rejects bad quantities and missing details", () => {
  assert.ok(
    priceOrder({ items: [{ name: "x", qty: 15 }], customer }, prices).error,
  );
  assert.ok(priceOrder({ items: [], customer }, prices).error);
  assert.ok(
    priceOrder(
      {
        items: [{ name: "x", qty: 10 }],
        customer: { ...customer, address: "" },
      },
      prices,
    ).error,
  );
  assert.ok(
    priceOrder(
      {
        items: [{ name: "x", qty: 10 }],
        customer: { ...customer, location: "Mars" },
      },
      prices,
    ).error,
  );
});

test("creates a bill, takes the callback and reports paid", async () => {
  const { env, store, calls, setBill } = setup();
  const r = await worker.fetch(
    post("/bills", {
      items: [{ name: tea, qty: 10 }],
      customer,
    }),
    env,
  );
  assert.equal(r.status, 200);
  const bill = await r.json();
  assert.equal(bill.url, "https://billplz/bills/abc123");
  assert.equal(bill.total, oneBag);
  assert.match(bill.ref, /^TS-\d{6}-[A-Z2-9]{4}$/);
  const sent = new URLSearchParams(
    calls.find((c) => c.init.method === "POST").init.body,
  );
  assert.equal(sent.get("amount"), cents(oneBag));
  assert.equal(sent.get("redirect_url"), site + "/checkout.html");
  assert.equal(
    sent.get("callback_url"),
    "https://pay.example.workers.dev/billplz/callback",
  );

  // Unsigned callback is refused.
  const forged = {
    id: "abc123",
    paid: "true",
    paid_amount: cents(oneBag),
    x_signature: "nope",
  };
  let cb = await worker.fetch(
    new Request("https://pay.example.workers.dev/billplz/callback", {
      method: "POST",
      body: new URLSearchParams(forged),
    }),
    env,
  );
  assert.equal(cb.status, 401);
  assert.equal(JSON.parse(store.get("bill:abc123")).status, "pending");

  const fields = {
    id: "abc123",
    paid: "true",
    paid_amount: cents(oneBag),
    amount: cents(oneBag),
    paid_at: "2026-11-05 10:00:00 +0800",
  };
  fields.x_signature = await signature(fields, "sigkey");
  cb = await worker.fetch(
    new Request("https://pay.example.workers.dev/billplz/callback", {
      method: "POST",
      body: new URLSearchParams(fields),
    }),
    env,
  );
  assert.equal(cb.status, 200);
  assert.equal(JSON.parse(store.get("bill:abc123")).status, "paid");

  const s = await worker.fetch(
    new Request("https://pay.example.workers.dev/bills/abc123"),
    env,
  );
  assert.deepEqual(await s.json(), {
    ref: bill.ref,
    paid: true,
    total: oneBag,
    emailed: false,
  });
  // Order emails are off unless set up: nothing was sent anywhere.
  assert.ok(!calls.some((c) => c.url.includes("resend.com")));

  const unauth = await worker.fetch(
    new Request("https://pay.example.workers.dev/orders"),
    env,
  );
  assert.equal(unauth.status, 401);
  const list = await worker.fetch(
    new Request("https://pay.example.workers.dev/orders", {
      headers: { authorization: "Bearer admin" },
    }),
    env,
  );
  assert.equal((await list.json())[0].customer.address, customer.address);
  setBill({});
});

test("status checks Billplz when the callback hasn't arrived", async () => {
  const { env, store, setBill } = setup();
  const bill = await (
    await worker.fetch(
      post("/bills", {
        items: [{ name: tea, qty: 10 }],
        customer,
      }),
      env,
    )
  ).json();
  let s = await (
    await worker.fetch(new Request("https://x/bills/abc123"), env)
  ).json();
  assert.equal(s.paid, false);
  setBill({ paid: true, amount: 100 }); // wrong amount: not paid
  s = await (
    await worker.fetch(new Request("https://x/bills/abc123"), env)
  ).json();
  assert.equal(s.paid, false);
  setBill({ paid: true, amount: Number(cents(oneBag)), paid_at: "now" });
  s = await (
    await worker.fetch(new Request("https://x/bills/abc123"), env)
  ).json();
  assert.equal(s.paid, true);
  assert.equal(JSON.parse(store.get("bill:abc123")).status, "paid");
  assert.equal(s.ref, bill.ref);
});

// Places an order and has Billplz report it paid, as in the test above.
async function paidOrder(env, extra = {}) {
  const bill = await (
    await worker.fetch(
      post("/bills", {
        items: [{ name: tea, qty: 10 }],
        customer: { ...customer, ...extra },
      }),
      env,
    )
  ).json();
  const fields = {
    id: "abc123",
    paid: "true",
    paid_amount: cents(oneBag),
    paid_at: "2026-11-05 10:00:00 +0800",
  };
  fields.x_signature = await signature(fields, "sigkey");
  const callback = () =>
    worker.fetch(
      new Request("https://pay.example.workers.dev/billplz/callback", {
        method: "POST",
        body: new URLSearchParams(fields),
      }),
      env,
    );
  return { bill, callback };
}
const emailsSent = (calls) =>
  calls
    .filter((c) => c.url === "https://api.resend.com/emails")
    .map((c) => ({ ...JSON.parse(c.init.body), headers: c.init.headers }));

test("a paid order emails the customer and the shop, once each", async () => {
  const { env, store, calls } = setup({ emails: true });
  const { bill, callback } = await paidOrder(env, {
    notes: "Leave with <the guard> & call",
  });
  assert.equal(emailsSent(calls).length, 0); // nothing before payment
  assert.equal((await callback()).status, 200);
  const [toCustomer, toShop] = emailsSent(calls).sort((a) =>
    a.to[0] === customer.email ? -1 : 1,
  );
  assert.equal(emailsSent(calls).length, 2);
  assert.deepEqual(toCustomer.to, [customer.email]);
  assert.equal(toCustomer.from, "Teasire <orders@example.com>");
  assert.equal(toCustomer.reply_to, business.business.email);
  assert.match(toCustomer.subject, new RegExp(bill.ref));
  assert.match(toCustomer.text, new RegExp("10 × " + tea));
  assert.ok(toCustomer.text.includes("Total paid: RM" + oneBag.toFixed(2)));
  assert.ok(toCustomer.text.includes(customer.address));
  assert.ok(toCustomer.text.includes(business.business.registeredName));
  // What the customer typed can't add markup to the email.
  assert.ok(
    toCustomer.html.includes("Leave with &lt;the guard&gt; &amp; call"),
  );
  assert.ok(!toCustomer.html.includes("<the guard>"));
  assert.equal(toCustomer.headers.authorization, "Bearer resend-key");
  assert.equal(
    toCustomer.headers["idempotency-key"],
    "teasire-" + bill.ref + "-customer",
  );
  assert.deepEqual(toShop.to, [business.business.email]);
  assert.equal(toShop.reply_to, customer.email);
  assert.ok(toShop.text.includes("60123456789"));
  const saved = JSON.parse(store.get("bill:abc123"));
  assert.ok(saved.emails.customer && saved.emails.shop);

  // Billplz repeating its message, or the customer coming back, sends nothing more.
  await callback();
  const status = await (
    await worker.fetch(new Request("https://x/bills/abc123"), env)
  ).json();
  assert.equal(status.emailed, true);
  assert.equal(emailsSent(calls).length, 2);
});

test("no emails while the site's switch is off", async () => {
  const { env, store, calls } = setup({ emails: true, siteSwitch: false });
  const { callback } = await paidOrder(env);
  assert.equal((await callback()).status, 200);
  assert.equal(emailsSent(calls).length, 0);
  assert.equal(JSON.parse(store.get("bill:abc123")).status, "paid");
});

test("an email failure doesn't lose the payment, and is retried", async () => {
  const failing = setup({ emails: true, resendStatus: 500 });
  const { callback } = await paidOrder(failing.env);
  assert.equal((await callback()).status, 200);
  const saved = JSON.parse(failing.store.get("bill:abc123"));
  assert.equal(saved.status, "paid");
  assert.equal(saved.emails, undefined);
  // Next time Billplz repeats its message, the emails are tried again.
  await callback();
  assert.equal(emailsSent(failing.calls).length, 4);
});

test("order emails read well as plain text", () => {
  const { customer: mail } = orderEmails(
    {
      ref: "TS-261105-K7QM",
      billId: "abc123",
      paidAt: "2026-11-05 10:00:00 +0800",
      items: [{ name: tea, qty: 80, price: per10 * 8 }],
      customer: { ...customer, phone: "60123456789", notes: "" },
      tea: per10 * 8,
      delivery: 0,
      total: per10 * 8,
    },
    business,
  );
  assert.ok(mail.text.includes("Delivery (Peninsular Malaysia): Free"));
  assert.ok(!mail.text.includes("Your note"));
  assert.ok(!/undefined|null|\[object/.test(mail.text + mail.html));
});

test("only the website may create bills", async () => {
  const { env } = setup();
  const r = await worker.fetch(
    post(
      "/bills",
      { items: [{ name: tea, qty: 10 }], customer },
      "https://evil.example",
    ),
    env,
  );
  assert.equal(r.status, 403);
});

test("X Signature source string matches Billplz's documented example", () => {
  assert.equal(
    signatureSource({
      amount: "200",
      collection_id: "inbmmepb",
      due_at: "2020-12-31",
      email: "api@billplz.com",
      id: "W_79pJDk",
      mobile: "",
      name: "MICHAEL API V3",
      paid_amount: "0",
      paid_at: "",
      paid: "false",
      state: "due",
      url: "http://www.billplz.com/bills/W_79pJDk",
      x_signature: "ignored",
    }),
    "amount200|collection_idinbmmepb|due_at2020-12-31|emailapi@billplz.com|idW_79pJDk|mobile|nameMICHAEL API V3|paid_amount0|paid_at|paidfalse|statedue|urlhttp://www.billplz.com/bills/W_79pJDk",
  );
});
