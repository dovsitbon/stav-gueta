/**
 * Paiement en ligne (Stripe Checkout), inactif tant que data/products.json a "stripeEnabled": false.
 * Pour l'activer : passer stripeEnabled à true et définir STRIPE_SECRET_KEY dans les variables Vercel.
 * Les prix viennent toujours de data/products.json (jamais du navigateur). Une solution israélienne
 * (Cardcom, Tranzila, Meshulam, Grow) peut remplacer ce fichier sans toucher au reste du site.
 */
import products from "../data/products.json" with { type: "json" };
import he from "../locales/he.json" with { type: "json" };
import en from "../locales/en.json" with { type: "json" };
import fr from "../locales/fr.json" with { type: "json" };
import es from "../locales/es.json" with { type: "json" };

const L = { he, en, fr, es };
const STRIPE_LOCALE = { he: "auto", en: "en", fr: "fr", es: "es" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!products.settings.stripeEnabled || !key) return res.status(503).json({ error: "disabled" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const lang = L[body.lang] ? body.lang : "he";
  const product = products.products.find((p) => p.id === body.product && p.price);
  const qty = Math.floor(Number(body.quantity));
  if (!product || !(qty > 0 && qty <= (product.maxQuantity || 1))) return res.status(400).json({ error: "item" });

  const params = new URLSearchParams({
    mode: "payment",
    locale: STRIPE_LOCALE[lang],
    success_url: `${origin(req)}/${lang}/shop/?paid=1`,
    cancel_url: `${origin(req)}/${lang}/shop/?cancelled=1`,
    "phone_number_collection[enabled]": "true",
    "line_items[0][quantity]": String(qty),
    "line_items[0][price_data][currency]": "ils",
    "line_items[0][price_data][unit_amount]": String(Math.round(product.price * 100)),
    "line_items[0][price_data][product_data][name]": L[lang].shop.products[product.id].name,
  });
  const meta = { colors: body.colors, mode: body.mode, address: body.address, date: body.date, slot: body.slot, message: body.message, name: body.name, phone: body.phone };
  for (const [k, v] of Object.entries(meta)) if (v) params.append(`metadata[${k}]`, String(v).slice(0, 480));

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const data = await r.json();
  if (!r.ok) return res.status(502).json({ error: data.error?.message || "stripe" });
  return res.status(200).json({ url: data.url });
}

function origin(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${req.headers["x-forwarded-proto"] || "https"}://${host}`;
}
