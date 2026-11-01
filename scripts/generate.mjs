/**
 * Génère les pages du site à la racine du projet à partir de locales/*.json (aucun texte en dur ici) :
 *   index.html                       -> choix automatique de la langue
 *   <lang>/index.html                -> accueil
 *   <lang>/shop/index.html           -> boutique (commande WhatsApp, Stripe prêt mais désactivé)
 *   <lang>/gallery/index.html        -> galerie filtrable (photos et vidéos)
 *   <lang>/accessibility/index.html  -> accessibilité et confidentialité
 * Écrit aussi public/sitemap.xml, public/robots.txt et public/llms.txt.
 *
 *   npm run gen   (lancé automatiquement par npm run dev / npm run build)
 */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { MEDIA, GALLERY_VIDEOS, GALLERY_FILTERS, HERO, EVENTS, SERVICES, REQUEST_TYPES } from "../src/data/media.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const SITE_URL = (process.env.SITE_URL || "https://stav-gueta.vercel.app").replace(/\/$/, "");
const LANGS = ["he", "en", "fr", "es"];
const PAGES = ["home", "shop", "gallery", "accessibility"];
// Nom de marque affiché partout (logo, titres, données structurées). « SoGu Moments » est le nom
// qui figure sur son logo Instagram : à confirmer avec la cliente avant la mise en ligne définitive.
const BRAND = { latin: "STAV GUETA", he: "סתיו גואטה", alt: "SoGu Moments" };
const PHONE = "+972534323281";
const PHONE_DISPLAY = { he: "053-432-3281", en: "+972 53-432-3281", fr: "+972 53-432-3281", es: "+972 53-432-3281" };
const WA = "https://wa.me/972534323281";
const INSTAGRAM = "https://www.instagram.com/stav.gueta/";
const YEAR = 2026;
const SWATCH = { powder: "#D9B8B0", pearl: "#EDE6DD", cream: "#F1E6D2", taupe: "#A8968C", gold: "#C9A96A", white: "#FFFFFF", black: "#2A2A2A", babyblue: "#BFD6E6", fuchsia: "#C8407E", sage: "#A9B8A0" };

const L = {};
for (const lang of LANGS) L[lang] = JSON.parse(await readFile(path.join(ROOT, "locales", `${lang}.json`), "utf8"));
const SIZES = JSON.parse(await readFile(path.join(ROOT, "src", "data", "media-sizes.json"), "utf8"));
const SHOP = JSON.parse(await readFile(path.join(ROOT, "data", "products.json"), "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const waLink = (text) => `${WA}?text=${encodeURIComponent(text)}`;
const pagePath = (lang, page) => `/${lang}/${page === "home" ? "" : `${page}/`}`;
const pad = (n) => String(n).padStart(2, "0");
const price = (t, p) => (p.price ? `${t.shop.from}${p.price.toLocaleString("en-US")} ${t.shop.currency}` : "");
const typeName = (t, k) => t.services.items[k]?.name ?? t.events.items[k].name;

const ICON = {
  whatsapp: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41"/></svg>`,
  instagram: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>`,
  arrow: `<svg class="icon icon--arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 12h16M14 6l6 6-6 6"/></svg>`,
  close: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 5l14 14M19 5L5 19"/></svg>`,
  burger: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 9h18M3 15h18"/></svg>`,
  play: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>`,
};
const BALLOON = `<svg class="balloon" viewBox="0 0 34 60" aria-hidden="true" focusable="false"><ellipse cx="17" cy="20" rx="15" ry="18" fill="currentColor"/><path d="M17 38l-2.4 3.6h4.8z" fill="currentColor"/><path d="M17 41.6c-3 6 3 9 0 16" fill="none" stroke="var(--gold)" stroke-width="1.2" stroke-linecap="round"/></svg>`;
const wordmark = (t) => `<span class="wordmark" translate="no"><span class="wordmark__main" lang="en">${BRAND.latin}</span><span class="wordmark__sub">${esc(t.brand.role)}</span></span>`;

/** <picture> AVIF + WebP avec srcset ; `key` = "<catégorie>/<fichier>". */
function picture(key, alt, { sizes = "100vw", eager = false, cls = "" } = {}) {
  const s = SIZES[key];
  if (!s) throw new Error(`Visuel introuvable : ${key} (lancer npm run media)`);
  const set = (ext) => s.widths.map((w) => `/media/${key}-${w}.${ext} ${w}w`).join(", ");
  const fallback = `/media/${key}-${s.widths[Math.min(1, s.widths.length - 1)]}.webp`;
  return `<picture${cls ? ` class="${cls}"` : ""}><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}"><img src="${fallback}" srcset="${set("webp")}" sizes="${sizes}" width="${s.w}" height="${s.h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const largest = (key) => `/media/${key}-${SIZES[key].widths.at(-1)}.webp`;
const fileOf = (key) => key.split("/")[1];

/** Vidéo muette en boucle (WebM puis MP4), lancée par le JavaScript (survol, écran ou hero). */
function video(name, label, { cls = "", lazy = true, attrs = "" } = {}) {
  const s = SIZES[`videos/${name}`];
  const src = (ext) => `${lazy ? "data-src" : "src"}="/media/videos/${name}.${ext}"`;
  return `<video class="${cls}" muted loop playsinline preload="none" poster="/media/videos/${name}.webp" width="${s.w}" height="${s.h}" aria-label="${esc(label)}" ${attrs}><source ${src("webm")} type="video/webm"><source ${src("mp4")} type="video/mp4"></video>`;
}

/** Bouton qui ouvre la visionneuse (photo ou vidéo). */
function zoomPhoto(t, key, opts) {
  const title = t.media[fileOf(key)];
  return `<button type="button" class="zoom" data-full="${largest(key)}" data-title="${esc(title)}" aria-label="${esc(fill(t.gallery.open, { title }))}">${picture(key, title, opts)}</button>`;
}
function zoomVideo(t, name) {
  const title = t.media[name];
  return `<button type="button" class="zoom zoom--video" data-video="/media/videos/${name}" data-title="${esc(title)}" aria-label="${esc(fill(t.gallery.open, { title }))}"><img src="/media/videos/${name}.webp" width="${SIZES[`videos/${name}`].w}" height="${SIZES[`videos/${name}`].h}" alt="${esc(title)}" loading="lazy" decoding="async"><span class="zoom__play">${ICON.play}<span>${esc(t.gallery.video)}</span></span></button>`;
}

function head(lang, page) {
  const t = L[lang];
  const titles = { home: t.meta.title, shop: t.meta.shopTitle, gallery: t.meta.galleryTitle, accessibility: t.meta.legalTitle };
  const descs = { home: t.meta.description, shop: t.meta.shopDescription, gallery: t.meta.galleryDescription, accessibility: t.meta.legalDescription };
  const url = SITE_URL + pagePath(lang, page);
  const fonts = lang === "he"
    ? "family=Assistant:wght@300;400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Frank+Ruhl+Libre:wght@300;400;500"
    : "family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500";
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${pagePath(l, page)}">`).join("\n    ");
  const graph = [{
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: "Stav Gueta",
    alternateName: [BRAND.he, `${BRAND.he} | עיצוב אירועים`, BRAND.alt],
    slogan: t.brand.slogan,
    description: t.meta.description,
    url: `${SITE_URL}${pagePath(lang, "home")}`,
    telephone: PHONE,
    image: `${SITE_URL}/og.jpg`,
    logo: `${SITE_URL}/icon-512.png`,
    priceRange: "₪₪",
    address: { "@type": "PostalAddress", addressLocality: "Ashkelon", addressCountry: "IL" },
    areaServed: [{ "@type": "City", name: "Ashkelon" }, { "@type": "Country", name: "Israel" }],
    sameAs: [INSTAGRAM],
    knowsLanguage: ["he", "en", "fr", "es"],
    makesOffer: SERVICES.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: t.services.items[s.key].name } })),
  }, { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "Stav Gueta", inLanguage: LANGS }];
  if (page === "shop") {
    graph.push({
      "@type": "ItemList",
      name: t.shop.pageTitle,
      itemListElement: SHOP.products.map((p, i) => ({
        "@type": "ListItem", position: i + 1,
        item: {
          "@type": "Product", name: t.shop.products[p.id].name, description: t.shop.products[p.id].text,
          ...(p.image ? { image: `${SITE_URL}${largest(p.image)}` } : {}),
          brand: { "@type": "Brand", name: "Stav Gueta" },
          ...(p.price ? { offers: { "@type": "Offer", price: p.price, priceCurrency: "ILS", availability: "https://schema.org/InStock", seller: { "@id": `${SITE_URL}/#business` } } } : {}),
        },
      })),
    });
  }
  const ld = page === "accessibility" ? "" : `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;
  const heroPreload = page === "home" ? `<link rel="preload" as="image" href="/media/videos/${HERO[0]}.webp" fetchpriority="high">` : "";
  return `<!doctype html>
<html lang="${lang}" dir="${t.lang.dir}" data-page="${page}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${esc(titles[page])}</title>
    <meta name="description" content="${esc(descs[page])}">
    <link rel="canonical" href="${url}">
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${pagePath("he", page)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Stav Gueta">
    <meta property="og:title" content="${esc(titles[page])}">
    <meta property="og:description" content="${esc(descs[page])}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${SITE_URL}/og.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="${t.lang.ogLocale}">
    ${LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${L[l].lang.ogLocale}">`).join("\n    ")}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#FAF6F1">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap">
    ${heroPreload}
    <script>
      document.documentElement.classList.add("js");
      try {
        if (sessionStorage.getItem("stav-intro") || sessionStorage.getItem("stav-pos") || matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("no-intro");
      } catch (e) { document.documentElement.classList.add("no-intro"); }
    </script>
    <link rel="stylesheet" href="/src/styles/main.css">
    ${ld}
  </head>`;
}

function langSwitch(lang, page, cls) {
  return `<ul class="langs ${cls}" aria-label="${esc(L[lang].nav.lang)}">${LANGS.map((l) =>
    `<li><a href="${pagePath(l, page)}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === lang ? ' aria-current="true"' : ""}><span aria-hidden="true">${L[l].lang.short}</span><span class="sr">${L[l].lang.name}</span></a></li>`).join("")}</ul>`;
}

function header(lang, page) {
  const t = L[lang];
  const home = pagePath(lang, "home");
  const anchor = (id) => (page === "home" ? `#${id}` : `${home}#${id}`);
  const links = [
    [anchor("top"), t.nav.home],
    [anchor("events"), t.nav.designs],
    [anchor("services"), t.nav.balloonsFlowers],
    [pagePath(lang, "shop"), t.nav.shop, page === "shop"],
    [pagePath(lang, "gallery"), t.nav.gallery, page === "gallery"],
    [anchor("about"), t.nav.about],
    [anchor("contact"), t.nav.contact],
  ];
  const items = links.map(([href, label, current]) => `<li><a href="${href}"${current ? ' aria-current="page"' : ""}>${esc(label)}</a></li>`).join("");
  return `
  <a class="skip" href="#main">${esc(t.nav.skip)}</a>
  <header class="header${page === "home" ? " header--over" : ""}" data-header>
    <div class="header__inner">
      <a class="brand" href="${home}" aria-label="${esc(t.nav.logo)}">${BALLOON}${wordmark(t)}</a>
      <nav class="nav" aria-label="${esc(t.nav.menu)}"><ul>${items}</ul></nav>
      <div class="header__end">
        ${langSwitch(lang, page, "langs--header")}
        <a class="btn btn--small btn--line header__wa" href="${waLink(t.wa.default)}" target="_blank" rel="noopener">${ICON.whatsapp}<span>${esc(t.nav.whatsapp)}</span></a>
        <button class="burger" type="button" aria-haspopup="dialog" aria-controls="menu" data-menu-open>${ICON.burger}<span class="sr">${esc(t.nav.menu)}</span></button>
      </div>
    </div>
  </header>
  <dialog class="menu" id="menu" aria-label="${esc(t.nav.menu)}">
    <div class="menu__top">
      <span class="brand">${BALLOON}${wordmark(t)}</span>
      <button type="button" class="icon-btn" data-menu-close>${ICON.close}<span class="sr">${esc(t.nav.close)}</span></button>
    </div>
    <nav aria-label="${esc(t.nav.menu)}"><ol class="menu__links">${items}</ol></nav>
    <div class="menu__foot">
      ${langSwitch(lang, page, "langs--menu")}
      <a class="btn btn--dark" href="${waLink(t.wa.default)}" target="_blank" rel="noopener">${ICON.whatsapp}<span>${esc(t.float)}</span></a>
    </div>
  </dialog>`;
}

function footer(lang, page) {
  const t = L[lang];
  const home = pagePath(lang, "home");
  return `
  <footer class="footer">
    <div class="wrap footer__grid">
      <div class="footer__brand">
        <a class="brand brand--footer" href="${home}" aria-label="${esc(t.nav.logo)}">${BALLOON}${wordmark(t)}</a>
        <p class="footer__slogan">${esc(t.brand.slogan)}</p>
        <p class="caps">${esc(t.brand.area)}</p>
      </div>
      <nav class="footer__col" aria-label="${esc(t.footer.navTitle)}">
        <h2 class="caps">${esc(t.footer.navTitle)}</h2>
        <ul>
          <li><a href="${home}#events">${esc(t.nav.designs)}</a></li>
          <li><a href="${home}#services">${esc(t.nav.balloonsFlowers)}</a></li>
          <li><a href="${pagePath(lang, "shop")}">${esc(t.nav.shop)}</a></li>
          <li><a href="${pagePath(lang, "gallery")}">${esc(t.nav.gallery)}</a></li>
          <li><a href="${home}#about">${esc(t.nav.about)}</a></li>
        </ul>
      </nav>
      <div class="footer__col">
        <h2 class="caps">${esc(t.footer.contactTitle)}</h2>
        <ul>
          <li><a href="${waLink(t.wa.default)}" target="_blank" rel="noopener">${esc(t.nav.whatsapp)}</a></li>
          <li><a href="tel:${PHONE}" dir="ltr">${PHONE_DISPLAY[lang]}</a></li>
          <li><a href="${INSTAGRAM}" target="_blank" rel="noopener" dir="ltr">@stav.gueta</a></li>
        </ul>
      </div>
      <div class="footer__col">
        ${langSwitch(lang, page, "langs--footer")}
      </div>
    </div>
    <div class="wrap footer__base">
      <p>© ${YEAR} Stav Gueta · ${esc(t.footer.rights)}</p>
      <a href="${pagePath(lang, "accessibility")}">${esc(t.footer.legal)}</a>
    </div>
  </footer>
  <a class="float-wa" href="${waLink(t.wa.default)}" target="_blank" rel="noopener" data-float>${ICON.whatsapp}<span class="sr">${esc(t.float)}</span></a>
  <div class="suggest" data-suggest hidden><p data-suggest-text></p><a class="suggest__go" data-suggest-go href="#"></a><button type="button" class="suggest__no" data-suggest-no></button></div>`;
}

/** Données que le JavaScript doit connaître (WhatsApp, boutique, visionneuse, suggestion de langue). */
function pageData(lang, page) {
  const t = L[lang];
  const data = {
    lang,
    page,
    wa: WA,
    t: {
      event: t.wa.event, order: t.wa.order, empty: t.wa.empty, required: t.request.required, count: t.gallery.count,
      form: t.shop.form, currency: t.shop.currency, pickup: t.shop.form.pickup, delivery: t.shop.form.delivery,
    },
    suggest: Object.fromEntries(LANGS.map((l) => [l, { ...L[l].suggest, href: pagePath(l, page) }])),
  };
  if (page === "shop") {
    data.shop = {
      settings: SHOP.settings,
      products: Object.fromEntries(SHOP.products.map((p) => [p.id, { price: p.price, max: p.maxQuantity, name: t.shop.products[p.id].name, colors: p.colors }])),
      palette: t.shop.palette,
    };
  }
  return `<script type="application/json" id="page-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function lightbox(t) {
  return `
  <dialog class="lightbox" data-lightbox aria-label="${esc(t.gallery.title)}">
    <figure class="lightbox__figure"><img alt="" data-lb-img><video muted loop playsinline controls data-lb-video hidden></video><figcaption><span data-lb-title></span><span class="lightbox__count" data-lb-count></span></figcaption></figure>
    <button type="button" class="icon-btn lightbox__close" data-lb-close>${ICON.close}<span class="sr">${esc(t.gallery.close)}</span></button>
    <button type="button" class="icon-btn lightbox__prev" data-lb-prev>${ICON.arrow}<span class="sr">${esc(t.gallery.prev)}</span></button>
    <button type="button" class="icon-btn lightbox__next" data-lb-next>${ICON.arrow}<span class="sr">${esc(t.gallery.next)}</span></button>
  </dialog>`;
}

function sectionHead(num, eyebrow, title, text, id, extra = "") {
  return `<header class="section-head" data-reveal>
        <p class="eyebrow"><span class="num">${num}</span>${esc(eyebrow)}</p>
        <h2 id="${id}-title">${esc(title)}</h2>
        ${text ? `<p class="lede">${esc(text)}</p>` : ""}
        ${extra}
      </header>`;
}

function placeholder(n, note) {
  return `<div class="placeholder" aria-hidden="true"><span class="placeholder__num">${n}</span>${BALLOON}<span class="placeholder__note">${esc(note)}</span></div>`;
}

/** Galerie : photos et vidéos mêlées. */
function galleryItems(t, limit) {
  const items = [];
  MEDIA.forEach((m, i) => {
    items.push({ kind: "photo", key: `${m.cat}/${m.file}`, filter: m.filter });
    for (const v of GALLERY_VIDEOS.filter((g) => g.after === i)) items.push({ kind: "video", name: v.file, filter: v.filter });
  });
  return (limit ? items.slice(0, limit) : items);
}
function galleryList(t, items, sizes) {
  return items.map((it) => `<li class="masonry__item" data-cat="${it.filter}"><figure>${it.kind === "photo"
    ? `${zoomPhoto(t, it.key, { sizes })}<figcaption>${esc(t.media[fileOf(it.key)])}</figcaption>`
    : `${zoomVideo(t, it.name)}<figcaption>${esc(t.media[it.name])}</figcaption>`}</figure></li>`).join("\n        ");
}

function intro(t) {
  const petals = Array.from({ length: 7 }, (_, i) => `<span class="petal" style="--i:${i}" aria-hidden="true"></span>`).join("");
  return `<div class="intro" data-intro>
    <div class="intro__stage" aria-hidden="true">
      <span class="intro__balloon">${BALLOON}</span>
      <span class="intro__logo">${wordmark(t)}</span>
      <p class="intro__slogan" data-intro-slogan>${esc(t.brand.slogan)}</p>
      <div class="intro__petals">${petals}</div>
    </div>
    <button type="button" class="intro__skip" data-intro-skip>${esc(t.intro.skip)}</button>
  </div>`;
}

function home(lang) {
  const t = L[lang];
  const featured = SHOP.products.find((p) => p.featured) ?? SHOP.products[0];
  const others = SHOP.products.filter((p) => p !== featured);
  const shopLink = (p) => `${pagePath(lang, "shop")}?p=${p.id}`;
  return `${head(lang, "home")}
<body>
  ${intro(t)}
  ${header(lang, "home")}
  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero__videos" data-hero>
        ${HERO.map((name, i) => `<div class="hero__panel hero__panel--${i + 1}">${video(name, i === 0 ? t.hero.videoLabel : "", { cls: "hero__video", lazy: i > 0, attrs: `${i === 0 ? "autoplay" : 'aria-hidden="true" data-hero-extra'}` })}</div>`).join("\n        ")}
      </div>
      <div class="hero__content">
        <p class="eyebrow hero__kicker">${esc(t.hero.kicker)}</p>
        <h1 id="hero-title" class="hero__title">${esc(t.hero.title)}</h1>
        <p class="hero__text">${esc(t.hero.text)}</p>
        <div class="actions">
          <a class="btn btn--light" href="#contact">${esc(t.hero.ctaPlan)}</a>
          <a class="btn btn--ghost" href="${pagePath(lang, "shop")}">${esc(t.hero.ctaShop)}${ICON.arrow}</a>
        </div>
      </div>
      <button type="button" class="video-toggle" data-video-toggle aria-pressed="false" data-label-pause="${esc(t.hero.pause)}" data-label-play="${esc(t.hero.play)}"><span class="video-toggle__icon" aria-hidden="true"></span><span class="sr" data-video-label>${esc(t.hero.pause)}</span></button>
    </section>

    <section class="trust" aria-label="${esc(t.nav.designs)}">
      <!-- À confirmer avec la cliente : « installation sur place » et la zone « Ashkelon et environs » (bio Instagram). -->
      <ul class="wrap trust__list">${t.trust.map((item, i) => `<li data-reveal style="--i:${i}">${esc(item)}</li>`).join("")}</ul>
    </section>

    <section class="section events" id="events" aria-labelledby="events-title">
      <div class="wrap">
        ${sectionHead("01", t.events.eyebrow, t.events.title, t.events.text, "events", `<p class="hint caps" data-hover-hint>${esc(t.events.hint)}</p>`)}
        <ul class="events__grid">
          ${EVENTS.map((e, i) => {
            const item = t.events.items[e.key];
            const visual = e.photo
              ? `<div class="event__media">${picture(e.photo, t.media[fileOf(e.photo)], { sizes: i === 0 ? "(min-width: 960px) 40vw, 92vw" : "(min-width: 960px) 28vw, 92vw" })}${e.video ? video(e.video, t.media[e.video], { cls: "event__video", attrs: "data-hover-video" }) : ""}</div>`
              : `<!-- photo à ajouter : ${e.key} (bar / bat mitsva) -->`;
            return `<li class="event event--${e.key}${e.photo ? "" : " event--text"}" data-reveal style="--i:${i}">
            ${visual}
            <div class="event__body">
              <p class="num">${pad(i + 1)}</p>
              <h3 class="event__title">${esc(item.name)}</h3>
              <p class="event__text">${esc(item.text)}</p>
              <a class="link-arrow" href="${e.photo ? `${pagePath(lang, "gallery")}?f=${e.filter}` : waLink(fill(t.wa.service, { service: item.name }))}"${e.photo ? "" : ' target="_blank" rel="noopener"'}>${esc(e.photo ? t.events.more : t.services.ask)}${ICON.arrow}</a>
            </div>
          </li>`;
          }).join("\n          ")}
        </ul>
      </div>
    </section>

    <section class="section services" id="services" aria-labelledby="services-title">
      <div class="wrap services__grid">
        <div class="services__intro">
          ${sectionHead("02", t.services.eyebrow, t.services.title, t.services.text, "services")}
          <div class="services__preview" aria-hidden="true" data-preview>
            ${SERVICES.map((s, i) => s.photo
              ? `<div class="services__frame" data-preview-item="${i}"${i === 0 ? ' data-active=""' : ""}>${picture(s.photo, "", { sizes: "(min-width: 960px) 30vw, 1px" })}</div>`
              : `<div class="services__frame" data-preview-item="${i}"><!-- photo à ajouter : ${s.key} -->${placeholder(pad(i + 1), t.services.soon)}</div>`).join("\n            ")}
          </div>
        </div>
        <ol class="services__list">
          ${SERVICES.map((s, i) => {
            const item = t.services.items[s.key];
            return `<li class="service" data-preview-index="${i}" data-reveal>
            <span class="num">${pad(i + 1)}</span>
            <div class="service__body">
              <h3 class="service__title">${esc(item.name)}</h3>
              <p class="service__text">${esc(item.text)}</p>
              <a class="link-arrow" href="${waLink(fill(t.wa.service, { service: item.name }))}" target="_blank" rel="noopener">${esc(t.services.ask)}<span class="sr">: ${esc(item.name)}</span>${ICON.arrow}</a>
            </div>
            <div class="service__thumb">${s.photo ? picture(s.photo, t.media[fileOf(s.photo)], { sizes: "96px" }) : `<!-- photo à ajouter : ${s.key} -->${placeholder("", "")}`}</div>
          </li>`;
          }).join("\n          ")}
        </ol>
      </div>
    </section>

    <section class="section shop-preview" id="shop" aria-labelledby="shop-title">
      <div class="wrap">
        ${sectionHead("03", t.shop.eyebrow, t.shop.title, t.shop.text, "shop", `<a class="link-arrow" href="${pagePath(lang, "shop")}">${esc(t.shop.all)}${ICON.arrow}</a>`)}
        <div class="bestsellers">
          <article class="feature" data-reveal>
            <a class="feature__media" href="${shopLink(featured)}" tabindex="-1" aria-hidden="true">${picture(featured.image, t.media[fileOf(featured.image)], { sizes: "(min-width: 960px) 46vw, 92vw" })}</a>
            <div class="feature__body">
              <p class="feature__num">01</p>
              <h3 class="feature__title">${esc(t.shop.products[featured.id].name)}</h3>
              <p>${esc(t.shop.products[featured.id].text)}</p>
              <p class="price">${price(t, featured)}<span class="price__note">${esc(t.shop.priceNote)}</span></p>
              <a class="btn btn--dark" href="${shopLink(featured)}">${esc(t.shop.order)}</a>
            </div>
          </article>
          <ol class="minis">
            ${others.map((p, i) => `<li class="mini" data-reveal style="--i:${i}">
              <a href="${shopLink(p)}">
                <span class="mini__thumb">${p.image ? picture(p.image, "", { sizes: "120px" }) : `<!-- photo à ajouter : ${p.id} -->${placeholder("", "")}`}</span>
                <span class="num">${pad(i + 2)}</span>
                <span class="mini__name">${esc(t.shop.products[p.id].name)}</span>
                <span class="mini__price">${price(t, p)}</span>
              </a>
            </li>`).join("\n            ")}
          </ol>
        </div>
      </div>
    </section>

    <section class="section works" aria-labelledby="works-title">
      <div class="wrap">
        ${sectionHead("04", t.gallery.eyebrow, t.gallery.title, t.gallery.intro, "works", `<a class="link-arrow" href="${pagePath(lang, "gallery")}">${esc(t.gallery.more)}${ICON.arrow}</a>`)}
        <ul class="masonry" data-gallery>
        ${galleryList(t, galleryItems(t, 10), "(min-width: 960px) 30vw, 46vw")}
        </ul>
      </div>
    </section>

    <section class="section steps" aria-labelledby="steps-title">
      <div class="wrap">
        ${sectionHead("05", t.steps.eyebrow, t.steps.title, "", "steps")}
        <ol class="steps__list">
          ${t.steps.items.map((s, i) => `<li class="step" data-reveal style="--i:${i}"><span class="step__num">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join("\n          ")}
        </ol>
      </div>
    </section>

    <section class="section about" id="about" aria-labelledby="about-title">
      <div class="wrap about__grid">
        <div class="about__photos">
          <figure class="about__portrait" data-reveal>
            <!-- photo à ajouter : portrait de Stav (photo de profil, avec son accord) -->
            ${placeholder("", t.about.photoNote)}
          </figure>
          <figure class="about__work" data-reveal>${picture("about/installation-anniversaire", t.media["installation-anniversaire"], { sizes: "(min-width: 960px) 22vw, 50vw" })}</figure>
        </div>
        <div class="about__text">
          ${sectionHead("06", t.about.eyebrow, t.about.title, "", "about")}
          <p data-reveal>${esc(t.about.p1)}</p>
          <p data-reveal>${esc(t.about.p2)}</p>
          <p class="about__quote" data-reveal>${esc(t.about.p3)}</p>
          <p class="caps about__abroad" data-reveal>${esc(t.about.abroad)}</p>
          <p class="about__sign" data-reveal translate="no">Stav</p>
        </div>
      </div>
    </section>

    <section class="section reviews" aria-labelledby="reviews-title">
      <div class="wrap reviews__inner">
        ${sectionHead("07", t.reviews.eyebrow, t.reviews.title, t.reviews.text, "reviews", `<a class="link-arrow" href="${INSTAGRAM}" target="_blank" rel="noopener">${esc(t.reviews.cta)}${ICON.arrow}</a>`)}
        <!-- À REMPLIR avec de vrais avis clients (story à la une « אתם » : prénom, événement, texte, avec accord) -->
        <!-- À REMPLIR avec de vrais avis clients -->
        <!-- À REMPLIR avec de vrais avis clients -->
      </div>
    </section>

    <section class="section contact" id="contact" aria-labelledby="contact-title">
      <div class="wrap contact__grid">
        <div>
          ${sectionHead("08", t.request.eyebrow, t.request.title, t.request.text, "contact")}
          <a class="btn btn--dark btn--large" href="${waLink(t.wa.default)}" target="_blank" rel="noopener" data-reveal>${ICON.whatsapp}<span>${esc(t.request.whatsapp)}</span></a>
          <dl class="contact__list" data-reveal>
            <div><dt class="caps">${esc(t.request.phoneLabel)}</dt><dd><a href="tel:${PHONE}" dir="ltr">${PHONE_DISPLAY[lang]}</a></dd></div>
            <div><dt class="caps">${esc(t.request.instagramLabel)}</dt><dd><a href="${INSTAGRAM}" target="_blank" rel="noopener" dir="ltr">@stav.gueta</a></dd></div>
            <div><dt class="caps">${esc(t.request.areaLabel)}</dt><dd>${esc(t.brand.area)}</dd></div>
          </dl>
        </div>
        <form class="form" data-event-form novalidate data-reveal>
          <h3 class="form__title">${esc(t.request.formTitle)}</h3>
          <label class="field"><span>${esc(t.request.type)}</span>
            <select name="type" required><option value="">${esc(t.request.typePlaceholder)}</option>${REQUEST_TYPES.map((k) => `<option>${esc(typeName(t, k))}</option>`).join("")}</select>
          </label>
          <div class="form__row">
            <label class="field"><span>${esc(t.request.date)}</span><input name="date" type="date"></label>
            <label class="field"><span>${esc(t.request.guests)}</span><input name="guests" type="number" min="1" max="2000" inputmode="numeric"></label>
          </div>
          <label class="field"><span>${esc(t.request.place)}</span><input name="place" maxlength="120" autocomplete="address-level2"></label>
          <label class="field"><span>${esc(t.request.theme)}</span><input name="theme" maxlength="160" placeholder="${esc(t.request.themePlaceholder)}"></label>
          <label class="field"><span>${esc(t.request.message)}</span><textarea name="message" rows="3" maxlength="1000"></textarea></label>
          <label class="field"><span>${esc(t.request.name)}</span><input name="name" autocomplete="name" required maxlength="80"></label>
          <p class="form__error" role="alert" data-form-error></p>
          <button class="btn btn--dark" type="submit">${ICON.whatsapp}<span>${esc(t.request.submit)}</span></button>
          <p class="form__note">${esc(t.request.note)}</p>
        </form>
      </div>
    </section>
  </main>
  ${footer(lang, "home")}
  ${lightbox(t)}
  ${pageData(lang, "home")}
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`;
}

function shop(lang) {
  const t = L[lang];
  const f = t.shop.form;
  const slots = SHOP.settings.slots;
  return `${head(lang, "shop")}
<body>
  ${header(lang, "shop")}
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-head">
        <a class="link-arrow link-arrow--back" href="${pagePath(lang, "home")}">${ICON.arrow}${esc(t.gallery.back)}</a>
        <h1>${esc(t.shop.pageTitle)}</h1>
        <p class="lede">${esc(t.shop.pageIntro)}</p>
        <p class="caps page-head__meta">${esc(fill(t.shop.minLead, { hours: SHOP.settings.minLeadHours }))} · ${esc(t.brand.area)}</p>
      </header>
      <!-- Prix d'exemple À REMPLIR avec la cliente : data/products.json -->
      <ul class="products">
        ${SHOP.products.map((p, i) => {
          const item = t.shop.products[p.id];
          return `<li class="product" id="${p.id}" data-reveal style="--i:${i % 3}">
          <div class="product__media">${p.image ? picture(p.image, t.media[fileOf(p.image)], { sizes: "(min-width: 1100px) 30vw, (min-width: 700px) 46vw, 92vw" }) : `<!-- photo à ajouter : ${p.id} -->${placeholder(pad(i + 1), t.services.soon)}`}</div>
          <div class="product__body">
            <p class="num">${pad(i + 1)}</p>
            <h2 class="product__title">${esc(item.name)}</h2>
            <p class="product__text">${esc(item.text)}</p>
            <ul class="swatches" aria-label="${esc(f.colors)}">${p.colors.map((c) => `<li style="--c:${SWATCH[c]}" title="${esc(t.shop.palette[c])}"><span class="sr">${esc(t.shop.palette[c])}</span></li>`).join("")}</ul>
            <p class="price">${price(t, p)}<span class="price__note">${esc(t.shop.priceNote)}</span></p>
            <button type="button" class="btn btn--dark" data-order="${p.id}">${esc(t.shop.order)}<span class="sr">: ${esc(item.name)}</span></button>
          </div>
        </li>`;
        }).join("\n        ")}
      </ul>
    </div>
  </main>
  <dialog class="order" data-order-dialog aria-labelledby="order-title">
    <form class="form order__form" data-order-form novalidate>
      <div class="order__head">
        <p class="caps">${esc(f.title)}</p>
        <h2 id="order-title" data-order-name></h2>
        <button type="button" class="icon-btn" data-order-close>${ICON.close}<span class="sr">${esc(t.gallery.close)}</span></button>
      </div>
      <input type="hidden" name="product">
      <fieldset class="field field--colors">
        <legend>${esc(f.colors)} <span class="field__hint">${esc(f.colorsHint)}</span></legend>
        <div class="swatch-picks" data-colors>
          ${Object.keys(SWATCH).map((c) => `<label class="swatch-pick" data-color="${c}"><input type="checkbox" name="colors" value="${c}"><span class="swatch-pick__dot" style="--c:${SWATCH[c]}"></span><span>${esc(t.shop.palette[c])}</span></label>`).join("")}
        </div>
      </fieldset>
      <div class="form__row">
        <label class="field"><span>${esc(f.quantity)}</span><input name="quantity" type="number" min="1" value="1" inputmode="numeric" required></label>
        <fieldset class="field">
          <legend>${esc(f.mode)}</legend>
          <label class="radio"><input type="radio" name="mode" value="pickup" checked><span>${esc(f.pickup)}</span></label>
          <label class="radio"><input type="radio" name="mode" value="delivery"><span>${esc(f.delivery)}</span></label>
        </fieldset>
      </div>
      <label class="field" data-address hidden><span>${esc(f.address)}</span><input name="address" autocomplete="street-address" maxlength="160"><small>${esc(f.deliveryNote)}</small></label>
      <div class="form__row">
        <label class="field"><span>${esc(f.date)}</span><input name="date" type="date" required></label>
        <label class="field"><span>${esc(f.slot)}</span><select name="slot">${slots.map((s) => `<option dir="ltr">${s}</option>`).join("")}</select></label>
      </div>
      <label class="field"><span>${esc(f.message)}</span><input name="message" maxlength="120" placeholder="${esc(f.messagePlaceholder)}"></label>
      <div class="form__row">
        <label class="field"><span>${esc(f.name)}</span><input name="name" autocomplete="name" required maxlength="80"></label>
        <label class="field"><span>${esc(f.phone)}</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" required maxlength="30" dir="ltr"></label>
      </div>
      <p class="order__total"><span class="caps">${esc(f.total)}</span><strong data-order-total></strong></p>
      <p class="form__error" role="alert" data-form-error></p>
      <div class="actions">
        <button class="btn btn--dark" type="submit" value="wa">${ICON.whatsapp}<span>${esc(f.submitWa)}</span></button>
        ${SHOP.settings.stripeEnabled ? `<button class="btn btn--line" type="submit" value="pay" data-pay>${esc(f.submitPay)}</button>` : ""}
      </div>
      <p class="form__note">${esc(f.note)}</p>
    </form>
  </dialog>
  ${footer(lang, "shop")}
  ${pageData(lang, "shop")}
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`;
}

function gallery(lang) {
  const t = L[lang];
  const items = galleryItems(t);
  return `${head(lang, "gallery")}
<body>
  ${header(lang, "gallery")}
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-head">
        <a class="link-arrow link-arrow--back" href="${pagePath(lang, "home")}">${ICON.arrow}${esc(t.gallery.back)}</a>
        <h1>${esc(t.gallery.title)}</h1>
        <p class="lede">${esc(t.gallery.intro)}</p>
      </header>
      <div class="filters" role="group" aria-label="${esc(t.gallery.filtersLabel)}">
        ${GALLERY_FILTERS.map((f) => `<button type="button" class="filter" data-filter="${f}" aria-pressed="${f === "all"}">${esc(t.gallery.filters[f])}<span class="filter__n">${f === "all" ? items.length : items.filter((m) => m.filter === f).length}</span></button>`).join("")}
      </div>
      <ul class="masonry masonry--gallery" data-gallery>
        ${galleryList(t, items, "(min-width: 1200px) 24vw, (min-width: 700px) 32vw, 46vw")}
        <!-- photo à ajouter : bar / bat mitsva, chiffres géants, Tou BeAv, Monténégro, bouquet de mariée -->
      </ul>
    </div>
  </main>
  ${footer(lang, "gallery")}
  ${lightbox(t)}
  ${pageData(lang, "gallery")}
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`;
}

function accessibility(lang) {
  const t = L[lang];
  return `${head(lang, "accessibility")}
<body>
  ${header(lang, "accessibility")}
  <main id="main" class="page">
    <div class="wrap prose">
      <header class="page-head">
        <a class="link-arrow link-arrow--back" href="${pagePath(lang, "home")}">${ICON.arrow}${esc(t.gallery.back)}</a>
        <h1>${esc(t.legal.title)}</h1>
      </header>
      <h2>${esc(t.legal.a11yTitle)}</h2>
      ${t.legal.a11y.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      <!-- À COMPLÉTER : nom et coordonnées du référent accessibilité (obligatoire en Israël) -->
      <h2>${esc(t.legal.privacyTitle)}</h2>
      ${t.legal.privacy.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      <p class="caps">${esc(t.legal.updated)}</p>
    </div>
  </main>
  ${footer(lang, "accessibility")}
  ${pageData(lang, "accessibility")}
  <script type="module" src="/src/main.js"></script>
</body>
</html>
`;
}

/** Racine : envoie vers la langue mémorisée, sinon celle du navigateur, sinon l'hébreu. */
const rootPage = `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Stav Gueta | ${esc(L.he.brand.role)}</title>
    <meta name="robots" content="noindex, follow">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    ${LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}/">`).join("\n    ")}
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/he/">
    <script>
      (function () {
        var langs = ${JSON.stringify(LANGS)}, lang = null;
        try { lang = localStorage.getItem("stav-lang"); } catch (e) {}
        if (langs.indexOf(lang) < 0) {
          var nav = (navigator.languages || [navigator.language || ""]).map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
          for (var i = 0; i < nav.length && !lang; i++) { var c = nav[i] === "iw" ? "he" : nav[i]; if (langs.indexOf(c) >= 0) lang = c; }
        }
        location.replace("/" + (langs.indexOf(lang) >= 0 ? lang : "he") + "/" + location.search + location.hash);
      })();
    </script>
    <meta http-equiv="refresh" content="2; url=/he/">
  </head>
  <body>
    <p>${LANGS.map((l) => `<a href="/${l}/" hreflang="${l}" lang="${l}">${L[l].lang.name}</a>`).join(" · ")}</p>
  </body>
</html>
`;

const RENDER = { home, shop, gallery, accessibility };
for (const lang of LANGS) await rm(path.join(ROOT, lang), { recursive: true, force: true });
await writeFile(path.join(ROOT, "index.html"), rootPage);
for (const lang of LANGS) {
  for (const page of PAGES) {
    const dir = path.join(ROOT, lang, page === "home" ? "" : page);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), RENDER[page](lang));
  }
}

const urls = LANGS.flatMap((lang) => PAGES.map((page) => ({ lang, page })));
await writeFile(path.join(ROOT, "public", "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(({ lang, page }) => `  <url>
    <loc>${SITE_URL}${pagePath(lang, page)}</loc>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${pagePath(l, page)}"/>`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${pagePath("he", page)}"/>
  </url>`).join("\n")}
</urlset>
`);
await writeFile(path.join(ROOT, "public", "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

const he = L.he, en = L.en;
await writeFile(path.join(ROOT, "public", "llms.txt"), `# Stav Gueta (${BRAND.he}), event design in Ashkelon, Israel

> ${en.meta.description}

Tagline: "${he.brand.slogan}" (${en.brand.slogan}). Area: ${en.brand.area}. Also designed an event in Montenegro.

## Services
${SERVICES.map((s) => `- ${en.services.items[s.key].name} (${he.services.items[s.key].name}): ${en.services.items[s.key].text}`).join("\n")}

## Shop (sample prices in ILS, to be confirmed)
${SHOP.products.map((p) => `- ${en.shop.products[p.id].name}: ${p.price ? `from ${p.price} ILS` : "on request"}. ${en.shop.products[p.id].text}`).join("\n")}

## How it works
${en.steps.items.map((s, i) => `${i + 1}. ${s.title}: ${s.text}`).join("\n")}

## Contact
- WhatsApp / phone: +972 53-432-3281 (${WA})
- Instagram: ${INSTAGRAM}

## Pages
${LANGS.map((l) => `- ${L[l].lang.name}: ${SITE_URL}/${l}/ · ${SITE_URL}/${l}/shop/ · ${SITE_URL}/${l}/gallery/`).join("\n")}
`);

console.log(`${LANGS.length * PAGES.length + 1} pages générées`);
