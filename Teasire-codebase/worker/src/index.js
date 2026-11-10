// Teasire payments worker (Cloudflare Workers).
//
// POST /bills             The checkout page sends the bag and the customer's details.
//                         Prices are worked out here from the site's own price list,
//                         a Billplz bill is created, and the page is sent to pay it.
// GET  /bills/:id         The checkout page asks whether a bill has been paid, after
//                         Billplz sends the customer back. Asks Billplz directly.
// POST /billplz/callback  Billplz tells us a bill was paid. Signed with the X Signature key.
// GET  /orders            Recent orders, for the shop. Needs `Authorization: Bearer <ADMIN_TOKEN>`.
//
// When an order is paid, the worker can also email the customer a confirmation
// and the shop a notice: see sendOrderEmails below.

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
const fail = (message, status = 400, headers) =>
  json({ error: message }, status, headers);

// Keep order records about 13 months, then let them expire.
const keepFor = 400 * 24 * 60 * 60;

export default {
  async fetch(request, env) {
    const url = new URL(request.url),
      siteOrigin = new URL(env.SITE_URL).origin,
      cors =
        request.headers.get("origin") === siteOrigin
          ? {
              "access-control-allow-origin": siteOrigin,
              "access-control-allow-methods": "GET, POST",
              "access-control-allow-headers": "content-type",
              vary: "origin",
            }
          : {};
    try {
      if (request.method === "OPTIONS")
        return new Response(null, { headers: cors });
      if (request.method === "POST" && url.pathname === "/bills") {
        if (!cors["access-control-allow-origin"])
          return fail(
            "Orders can only be placed from the Teasire website.",
            403,
          );
        return await createBill(request, env, url, cors);
      }
      const status = url.pathname.match(/^\/bills\/([A-Za-z0-9_-]{1,40})$/);
      if (request.method === "GET" && status)
        return await billStatus(status[1], env, cors);
      if (request.method === "POST" && url.pathname === "/billplz/callback")
        return await callback(request, env);
      if (request.method === "GET" && url.pathname === "/orders")
        return await listOrders(request, env);
      return fail("Not found", 404, cors);
    } catch (e) {
      console.error(e);
      return fail("Something went wrong. Please try again.", 500, cors);
    }
  },
};

// The site's price list, written by scripts/prepare-site.mjs from site.js.
async function prices(env) {
  const r = await fetch(env.SITE_URL + "/config/prices.json", {
    cf: { cacheTtl: 300 },
  });
  if (!r.ok) throw new Error("Price list unavailable: " + r.status);
  return r.json();
}

const cents = (rm) => Math.round(rm * 100);
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Check the order and price it. Returns { error } or the order to save.
export function priceOrder(body, list) {
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length || items.length > 30)
    return { error: "Your bag is empty." };
  const priced = [];
  for (const i of items) {
    const name = text(i?.name, 200);
    if (
      !name ||
      !Number.isInteger(i?.qty) ||
      i.qty < 10 ||
      i.qty > 1000 ||
      i.qty % 10
    )
      return { error: "Please check the quantities in your bag." };
    const per10 =
      list.teas.find((t) => t.name === name)?.price ?? list.customBlendPrice;
    priced.push({ name, qty: i.qty, price: (per10 * i.qty) / 10 });
  }
  const c = body.customer || {},
    customer = {
      name: text(c.name, 100),
      email: text(c.email, 150),
      phone: text(c.phone, 20).replace(/[^\d]/g, "").replace(/^0/, "60"),
      address: text(c.address, 300),
      location: text(c.location, 50),
      notes: text(c.notes, 1000),
    };
  if (!customer.name) return { error: "Please enter your name." };
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(customer.email))
    return { error: "Please enter a valid email address." };
  if (!/^\d{9,15}$/.test(customer.phone))
    return { error: "Please enter a valid phone number." };
  if (!customer.address)
    return { error: "Please enter your delivery address." };
  if (!(customer.location in list.deliveryFees))
    return { error: "Please choose a delivery location." };
  // Free delivery on orders of freeDeliveryFrom (RM) and above, to the
  // freeDeliveryLocations only; otherwise the location's fee.
  const tea = priced.reduce((n, i) => n + i.price, 0),
    free =
      tea >= list.freeDeliveryFrom &&
      (list.freeDeliveryLocations || []).includes(customer.location),
    delivery = free ? 0 : list.deliveryFees[customer.location];
  return { items: priced, customer, tea, delivery, total: tea + delivery };
}

// A short reference the customer and the shop can both quote, e.g. TS-261105-K7QM.
function orderRef(now = new Date()) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
    random = crypto.getRandomValues(new Uint8Array(4));
  return (
    "TS-" +
    now.toISOString().slice(2, 10).replaceAll("-", "") +
    "-" +
    [...random].map((b) => letters[b % letters.length]).join("")
  );
}

const billplz = (env, path, init = {}) =>
  fetch(env.BILLPLZ_API + "/api/v3" + path, {
    ...init,
    headers: {
      authorization: "Basic " + btoa(env.BILLPLZ_API_KEY + ":"),
      ...init.headers,
    },
  });

async function createBill(request, env, url, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400, cors);
  }
  const order = priceOrder(body, await prices(env));
  if (order.error) return fail(order.error, 400, cors);
  const ref = orderRef(),
    summary = order.items.map((i) => i.qty + " × " + i.name).join(", "),
    form = new URLSearchParams({
      collection_id: env.BILLPLZ_COLLECTION_ID,
      name: order.customer.name,
      email: order.customer.email,
      mobile: order.customer.phone,
      amount: String(cents(order.total)),
      description: ("Teasire " + ref + ": " + summary).slice(0, 200),
      callback_url: url.origin + "/billplz/callback",
      redirect_url: env.SITE_URL + "/checkout.html",
      reference_1_label: "Order",
      reference_1: ref,
      reference_2_label: "Deliver to",
      reference_2: (
        order.customer.location +
        ": " +
        order.customer.address
      ).slice(0, 120),
    });
  const r = await billplz(env, "/bills", { method: "POST", body: form });
  const bill = await r.json().catch(() => ({}));
  if (!r.ok || !bill.id || !bill.url) {
    console.error("Billplz refused the bill", r.status, JSON.stringify(bill));
    return fail(
      "Online payment is unavailable right now. Please pay by DuitNow QR.",
      502,
      cors,
    );
  }
  await env.ORDERS.put(
    "bill:" + bill.id,
    JSON.stringify({
      ref,
      billId: bill.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...order,
    }),
    { expirationTtl: keepFor },
  );
  return json(
    { ref, billId: bill.id, total: order.total, url: bill.url },
    200,
    cors,
  );
}

async function markPaid(env, id, paidAt) {
  const key = "bill:" + id,
    order = JSON.parse((await env.ORDERS.get(key)) || "null");
  if (!order) return null;
  const save = () =>
    env.ORDERS.put(key, JSON.stringify(order), { expirationTtl: keepFor });
  if (order.status !== "paid") {
    order.status = "paid";
    order.paidAt = paidAt || new Date().toISOString();
    // Saved before any email is tried, so an email problem never loses a payment.
    await save();
  }
  if (await sendOrderEmails(env, order)) await save();
  return order;
}

// One of the site's own settings files, e.g. config/business.json; null if unreadable.
async function siteConfig(env, name) {
  try {
    const r = await fetch(env.SITE_URL + "/config/" + name + ".json", {
      cf: { cacheTtl: 300 },
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

const rm = (amount) => "RM" + amount.toFixed(2);
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// The two emails for a paid order: a confirmation for the customer and a
// notice for the shop. Each is plain text plus the same content as simple HTML.
export function orderEmails(order, shop) {
  const c = order.customer,
    details = shop.business || {},
    whatsapp = shop.whatsappNumber ? "+" + shop.whatsappNumber : "",
    lines = [
      ...order.items.map((i) => [i.qty + " × " + i.name, rm(i.price)]),
      ["Tea", rm(order.tea)],
      [
        "Delivery (" + c.location + ")",
        order.delivery ? rm(order.delivery) : "Free",
      ],
      ["Total paid", rm(order.total)],
    ],
    address = [c.name, "+" + c.phone, c.address, c.location],
    operator = details.registeredName
      ? "Teasire is operated by " +
        details.registeredName +
        (details.registrationNumber
          ? " (SSM: " + details.registrationNumber + ")"
          : "") +
        "."
      : "",
    contact = [
      whatsapp && "WhatsApp " + whatsapp,
      details.email && "email " + details.email,
    ]
      .filter(Boolean)
      .join(" or ");
  // `paragraphs` are strings, or arrays of lines that belong together.
  const build = (paragraphs) => {
    const blocks = paragraphs.filter((b) => (Array.isArray(b) ? b.length : b));
    return {
      text: blocks
        .map((b) =>
          Array.isArray(b)
            ? b.map((l) => (Array.isArray(l) ? l.join(": ") : l)).join("\n")
            : b,
        )
        .join("\n\n"),
      html:
        '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2a24;max-width:560px">' +
        blocks
          .map((b) =>
            Array.isArray(b) && Array.isArray(b[0])
              ? '<table style="border-collapse:collapse;width:100%">' +
                b
                  .map(
                    ([label, value]) =>
                      `<tr><td style="padding:4px 12px 4px 0">${esc(label)}</td><td style="padding:4px 0;text-align:right;white-space:nowrap">${esc(value)}</td></tr>`,
                  )
                  .join("") +
                "</table>"
              : "<p>" +
                (Array.isArray(b) ? b : [b]).map(esc).join("<br>") +
                "</p>",
          )
          .join("") +
        "</div>",
    };
  };
  return {
    customer: {
      to: c.email,
      replyTo: details.email,
      subject: "Your Teasire order " + order.ref + " is confirmed",
      ...build([
        "Hi " + c.name + ",",
        "Thank you for your order. We’ve received your payment of " +
          rm(order.total) +
          " and will pack it soon. We’ll send your tracking number on WhatsApp.",
        "Order " + order.ref,
        lines,
        ["Delivering to:", ...address],
        c.notes && ["Your note:", c.notes],
        contact && "Questions about your order? Reach us on " + contact + ".",
        operator,
      ]),
    },
    shop: {
      to: details.email,
      replyTo: c.email,
      subject: "New paid order " + order.ref + " · " + rm(order.total),
      ...build([
        "A new order has been paid online.",
        "Order " + order.ref + " · paid " + order.paidAt,
        lines,
        ["Deliver to:", ...address],
        ["Customer email:", c.email],
        c.notes && ["Customer’s note:", c.notes],
        "Billplz bill: " + order.billId,
      ]),
    },
  };
}

// Emails a paid order's confirmation to the customer and a notice to the shop,
// through Resend (resend.com). Nothing is sent unless all of these are in place:
//   - the RESEND_API_KEY secret and the ORDER_EMAIL_FROM setting on this worker;
//   - "orderEmails": true in the site's config/payments.json, which also shows
//     the privacy notice's line about these emails, so the two can't drift apart.
// Which emails went out is kept on the order (`emails`), so each is sent once.
// Returns true if that record changed.
async function sendOrderEmails(env, order) {
  const sent = order.emails || {};
  if (!env.RESEND_API_KEY || !env.ORDER_EMAIL_FROM) return false;
  if (sent.customer && sent.shop) return false;
  const [settings, shop] = await Promise.all([
    siteConfig(env, "payments"),
    siteConfig(env, "business"),
  ]);
  if (settings?.orderEmails !== true || !shop) return false;
  let changed = false;
  await Promise.all(
    Object.entries(orderEmails(order, shop)).map(async ([kind, mail]) => {
      if (sent[kind] || !mail.to) return;
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(8000),
          headers: {
            authorization: "Bearer " + env.RESEND_API_KEY,
            "content-type": "application/json",
            // If Billplz's message and the customer's return arrive together,
            // Resend still sends each email only once.
            "idempotency-key": "teasire-" + order.ref + "-" + kind,
          },
          body: JSON.stringify({
            from: env.ORDER_EMAIL_FROM,
            to: [mail.to],
            ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          }),
        });
        if (!r.ok) throw new Error("Resend answered " + r.status);
        sent[kind] = new Date().toISOString();
        changed = true;
      } catch (e) {
        // No addresses or order details in the log.
        console.error("Order email not sent", order.ref, kind, e.message);
      }
    }),
  );
  if (changed) order.emails = sent;
  return changed;
}

// Only what the thank-you screen needs: no names, addresses or contact details.
async function billStatus(id, env, cors) {
  let order = JSON.parse((await env.ORDERS.get("bill:" + id)) || "null");
  if (!order) return fail("Order not found.", 404, cors);
  if (order.status !== "paid") {
    const r = await billplz(env, "/bills/" + id),
      bill = await r.json().catch(() => ({}));
    if (r.ok && bill.paid === true && bill.amount === cents(order.total))
      order = (await markPaid(env, id, bill.paid_at)) || order;
  }
  return json(
    {
      ref: order.ref,
      paid: order.status === "paid",
      total: order.total,
      // Whether our own confirmation email went out, so the page can say so.
      emailed: Boolean(order.emails?.customer),
    },
    200,
    cors,
  );
}

// Billplz X Signature: every field except x_signature as "keyvalue", sorted
// case-insensitively, joined with "|", then HMAC-SHA256 with the X Signature key.
export const signatureSource = (fields) =>
  Object.entries(fields)
    .filter(([k]) => k !== "x_signature")
    .map(([k, v]) => k + v)
    .sort((a, b) =>
      a.toLowerCase() < b.toLowerCase()
        ? -1
        : a.toLowerCase() > b.toLowerCase()
          ? 1
          : 0,
    )
    .join("|");
export async function signature(fields, key) {
  const source = signatureSource(fields);
  const hmac = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    hmac,
    new TextEncoder().encode(source),
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sameText(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function callback(request, env) {
  const fields = Object.fromEntries(await request.formData());
  if (
    !sameText(
      await signature(fields, env.BILLPLZ_X_SIGNATURE),
      fields.x_signature,
    )
  )
    return fail("Bad signature", 401);
  if (fields.paid === "true") {
    const order = JSON.parse(
      (await env.ORDERS.get("bill:" + fields.id)) || "null",
    );
    if (
      order &&
      Number(fields.paid_amount ?? fields.amount) === cents(order.total)
    )
      await markPaid(env, fields.id, fields.paid_at);
    else
      console.error(
        "Paid bill does not match an order",
        fields.id,
        fields.paid_amount,
      );
  }
  return new Response("OK");
}

async function listOrders(request, env) {
  if (
    !env.ADMIN_TOKEN ||
    !sameText(
      request.headers.get("authorization") || "",
      "Bearer " + env.ADMIN_TOKEN,
    )
  )
    return fail("Unauthorized", 401);
  const { keys } = await env.ORDERS.list({ prefix: "bill:", limit: 100 }),
    orders = (await Promise.all(keys.map((k) => env.ORDERS.get(k.name))))
      .filter(Boolean)
      .map((o) => JSON.parse(o))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json(orders);
}
