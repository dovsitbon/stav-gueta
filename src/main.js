import Lenis from "lenis";

const root = document.documentElement;
const data = JSON.parse(document.getElementById("page-data").textContent);
const rtl = root.dir === "rtl";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get: (k, s = localStorage) => { try { return s.getItem(k); } catch { return null; } },
  set: (k, v, s = localStorage) => { try { s.setItem(k, v); } catch { /* navigation privée */ } },
  del: (k, s = localStorage) => { try { s.removeItem(k); } catch { /* idem */ } },
};
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const openWa = (text) => window.open(`${data.wa}?text=${encodeURIComponent(text)}`, "_blank", "noopener");

/* ---------- Défilement fluide ---------- */
const lenis = reduced ? null : new Lenis({ duration: 1.15, smoothWheel: true });
if (lenis) {
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
const headerOffset = () => -($("[data-header]")?.offsetHeight ?? 0) + 1;
function scrollToEl(el, immediate = false) {
  if (lenis) lenis.scrollTo(el, { offset: headerOffset(), immediate });
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + headerOffset(), behavior: immediate || reduced ? "auto" : "smooth" });
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href*="#"]');
  if (!a || a.origin !== location.origin || a.pathname !== location.pathname) return;
  const target = a.hash === "#top" ? document.body : document.getElementById(a.hash.slice(1));
  if (!target) return;
  e.preventDefault();
  closeMenu();
  if (target === document.body) lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  else scrollToEl(target);
  if (target.id === "main") target.focus?.();
  history.replaceState(null, "", a.hash);
});

/* ---------- En-tête : transparent sur le hero, plein ensuite ---------- */
const header = $("[data-header]");
const floatWa = $("[data-float]");
function onScroll() {
  const y = scrollY;
  header.classList.toggle("is-solid", data.page !== "home" || y > innerHeight * 0.6);
  floatWa?.classList.toggle("is-visible", data.page !== "home" || y > innerHeight * 0.8);
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Menu mobile ---------- */
const menu = $("#menu");
function closeMenu() { if (menu?.open) menu.close(); }
$("[data-menu-open]")?.addEventListener("click", () => menu.showModal());
$("[data-menu-close]")?.addEventListener("click", closeMenu);
menu?.addEventListener("close", () => $("[data-menu-open]")?.focus());

/* ---------- Langues : mémoriser le choix et garder la position ---------- */
function currentSection() {
  let best = null;
  for (const s of $$("main section[id], main")) if (s.getBoundingClientRect().top <= innerHeight * 0.35) best = s;
  if (!best) return null;
  const r = best.getBoundingClientRect();
  return { id: best.id, ratio: Math.min(1, Math.max(0, -r.top / Math.max(1, r.height))) };
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-lang]");
  if (!a) return;
  store.set("stav-lang", a.dataset.lang);
  const pos = currentSection();
  if (pos) store.set("stav-pos", JSON.stringify({ page: data.page, ...pos }), sessionStorage);
});
(function restorePosition() {
  const raw = store.get("stav-pos", sessionStorage);
  if (!raw) return;
  store.del("stav-pos", sessionStorage);
  try {
    const pos = JSON.parse(raw);
    const el = pos.page === data.page && document.getElementById(pos.id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY + el.offsetHeight * pos.ratio;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else scrollTo(0, top);
  } catch { /* position illisible : on reste en haut */ }
})();

/* Première visite : proposer la langue du navigateur si elle existe sur le site */
(function suggestLanguage() {
  if (store.get("stav-lang")) return;
  const supported = Object.keys(data.suggest);
  const wanted = (navigator.languages || [navigator.language]).map((l) => String(l).slice(0, 2).toLowerCase().replace("iw", "he")).find((l) => supported.includes(l));
  if (!wanted || wanted === data.lang) return;
  const box = $("[data-suggest]");
  const s = data.suggest[wanted];
  $("[data-suggest-text]", box).textContent = s.text;
  const go = $("[data-suggest-go]", box);
  Object.assign(go, { textContent: s.switch, href: s.href + location.search, lang: wanted });
  go.dataset.lang = wanted;
  const no = $("[data-suggest-no]", box);
  no.textContent = s.dismiss;
  no.lang = wanted;
  no.addEventListener("click", () => { store.set("stav-lang", data.lang); box.hidden = true; });
  setTimeout(() => { box.hidden = false; }, root.classList.contains("no-intro") ? 900 : 3600);
})();

/* ---------- Apparitions au scroll ---------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
}, { rootMargin: "0px 0px -8% 0px" });
$$("[data-reveal]").forEach((el) => io.observe(el));

/* ---------- Vidéos ---------- */
const play = (v) => {
  const lazy = $$("source[data-src]", v);
  for (const s of lazy) { s.src = s.dataset.src; s.removeAttribute("data-src"); }
  if (lazy.length) v.load();
  return v.play().catch(() => {});
};

/* Hero : trois reels côte à côte sur grand écran (les deux autres ne se chargent pas sur mobile) */
const heroVideos = $$("[data-hero] video");
const heroToggle = $("[data-video-toggle]");
const wide = matchMedia("(min-width: 900px)");
function heroActive() { return heroVideos.filter((v, i) => i === 0 || wide.matches); }
function setHeroPaused(paused) {
  if (!heroToggle) return;
  heroActive().forEach((v) => (paused ? v.pause() : play(v)));
  heroToggle.setAttribute("aria-pressed", String(paused));
  $("[data-video-label]", heroToggle).textContent = paused ? heroToggle.dataset.labelPlay : heroToggle.dataset.labelPause;
}
heroToggle?.addEventListener("click", () => setHeroPaused(!heroVideos[0].paused));
if (heroVideos.length) {
  if (reduced) { heroVideos[0].removeAttribute("autoplay"); setHeroPaused(true); }
  else {
    const startExtras = () => { if (wide.matches && heroToggle.getAttribute("aria-pressed") !== "true") heroActive().forEach(play); };
    addEventListener("load", startExtras, { once: true });
    wide.addEventListener("change", startExtras);
  }
}

/* Cartes d'événements : la vidéo se lance au survol (souris) ou quand la carte est à l'écran (tactile) */
const hoverVideos = $$("[data-hover-video]");
hoverVideos.forEach((v) => {
  const card = v.closest(".event");
  if (canHover) {
    card.addEventListener("mouseenter", () => { play(v); card.classList.add("is-playing"); });
    card.addEventListener("mouseleave", () => { v.pause(); card.classList.remove("is-playing"); });
  }
  card.addEventListener("focusin", () => { play(v); card.classList.add("is-playing"); });
  card.addEventListener("focusout", () => { v.pause(); card.classList.remove("is-playing"); });
});
if (!canHover && !reduced && hoverVideos.length) {
  const vio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const card = e.target.closest(".event");
      if (e.isIntersecting) { play(e.target); card.classList.add("is-playing"); } else { e.target.pause(); card.classList.remove("is-playing"); }
    }
  }, { threshold: 0.65 });
  hoverVideos.forEach((v) => vio.observe(v));
}

/* ---------- Prestations : l'image d'aperçu suit la ligne survolée ---------- */
const preview = $("[data-preview]");
if (preview) {
  const frames = $$("[data-preview-item]", preview);
  const show = (i) => frames.forEach((f) => f.toggleAttribute("data-active", f.dataset.previewItem === String(i)));
  $$("[data-preview-index]").forEach((row) => {
    row.addEventListener("mouseenter", () => show(row.dataset.previewIndex));
    row.addEventListener("focusin", () => show(row.dataset.previewIndex));
  });
}

/* ---------- Visionneuse (photos et vidéos) ---------- */
const lb = $("[data-lightbox]");
if (lb) {
  const img = $("[data-lb-img]", lb);
  const vid = $("[data-lb-video]", lb);
  let list = [];
  let index = 0;
  const show = (i) => {
    index = (i + list.length) % list.length;
    const b = list[index];
    const isVideo = Boolean(b.dataset.video);
    img.hidden = isVideo;
    vid.hidden = !isVideo;
    vid.pause();
    if (isVideo) {
      vid.replaceChildren(...["webm", "mp4"].map((ext) => Object.assign(document.createElement("source"), { src: `${b.dataset.video}.${ext}`, type: `video/${ext}` })));
      vid.poster = `${b.dataset.video}.webp`;
      vid.setAttribute("aria-label", b.dataset.title);
      vid.load();
      if (!reduced) vid.play().catch(() => {});
      img.removeAttribute("src");
    } else {
      img.src = b.dataset.full;
      img.alt = b.dataset.title;
    }
    $("[data-lb-title]", lb).textContent = b.dataset.title;
    $("[data-lb-count]", lb).textContent = fill(data.t.count, { n: index + 1, total: list.length });
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".zoom");
    if (!b) return;
    list = $$(".zoom", b.closest("[data-gallery]")).filter((x) => !x.closest("[hidden]"));
    show(list.indexOf(b));
    lenis?.stop();
    lb.showModal();
    lb._opener = b;
  });
  lb.addEventListener("close", () => { lenis?.start(); vid.pause(); vid.replaceChildren(); img.removeAttribute("src"); lb._opener?.focus(); });
  $("[data-lb-close]", lb).addEventListener("click", () => lb.close());
  $("[data-lb-prev]", lb).addEventListener("click", () => show(index - 1));
  $("[data-lb-next]", lb).addEventListener("click", () => show(index + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(index + (rtl ? -1 : 1));
    if (e.key === "ArrowLeft") show(index + (rtl ? 1 : -1));
  });
  let x0 = null;
  lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + ((dx < 0) !== rtl ? 1 : -1));
    x0 = null;
  });
}

/* ---------- Filtres de la galerie (gardés dans l'URL : ?f=evjf) ---------- */
const filters = $$("[data-filter]");
function applyFilter(f, push) {
  const btn = filters.find((b) => b.dataset.filter === f) ?? filters[0];
  if (!btn) return;
  filters.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  $$("[data-cat]").forEach((li) => { li.hidden = btn.dataset.filter !== "all" && li.dataset.cat !== btn.dataset.filter; });
  lenis?.resize();
  if (push) {
    const url = new URL(location.href);
    btn.dataset.filter === "all" ? url.searchParams.delete("f") : url.searchParams.set("f", btn.dataset.filter);
    history.replaceState(null, "", url);
  }
}
filters.forEach((btn) => btn.addEventListener("click", () => applyFilter(btn.dataset.filter, true)));
if (filters.length) applyFilter(new URLSearchParams(location.search).get("f") ?? "all", false);

/* ---------- Demande d'événement : ouvre WhatsApp avec le message ---------- */
const eventForm = $("[data-event-form]");
eventForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = (n) => eventForm.elements[n].value.trim();
  const error = $("[data-form-error]", eventForm);
  const missing = ["type", "name"].filter((n) => !v(n));
  ["type", "name"].forEach((n) => eventForm.elements[n].setAttribute("aria-invalid", String(missing.includes(n))));
  if (missing.length) {
    error.textContent = data.t.required;
    eventForm.elements[missing[0]].focus();
    return;
  }
  error.textContent = "";
  const or = (x) => x || data.t.empty;
  openWa(fill(data.t.event, {
    name: v("name"), type: v("type"), date: or(formatDate(v("date"))), place: or(v("place")), guests: or(v("guests")), theme: or(v("theme")), message: v("message"),
  }).trim());
});

const LOCALE = { he: "he-IL", en: "en-GB", fr: "fr-FR", es: "es-ES" }[data.lang];
const money = (n) => `${new Intl.NumberFormat(LOCALE).format(n)} ${data.t.currency}`;
function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00Z`));
}

/* ---------- Boutique : commande (WhatsApp, ou Stripe si activé) ---------- */
if (data.shop) shopOrders(data.shop);

function shopOrders(shop) {
  const dialog = $("[data-order-dialog]");
  const form = $("[data-order-form]");
  const f = data.t.form;
  const els = form.elements;
  const error = $("[data-form-error]", form);
  const total = $("[data-order-total]", form);
  let product = null;

  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const earliest = () => new Date(Date.now() + shop.settings.minLeadHours * 3600e3);
  function dateProblem(iso) {
    if (!iso) return null;
    const day = new Date(`${iso}T23:59`);
    if (day < earliest()) return fill(f.dateTooSoon, { hours: shop.settings.minLeadHours });
    if (shop.settings.blockedDates.includes(iso) || shop.settings.closedWeekdays.includes(new Date(`${iso}T12:00`).getDay())) return f.dateBlocked;
    return null;
  }
  function updateTotal() {
    const qty = Math.max(1, Math.min(product.max, Number(els.quantity.value) || 1));
    total.textContent = product.price ? money(product.price * qty) : "-";
    return qty;
  }
  function limitColors() {
    const checked = $$('input[name="colors"]:checked', form);
    $$('input[name="colors"]', form).forEach((c) => { c.disabled = !c.checked && checked.length >= 3; });
  }
  function open(id, opener) {
    product = shop.products[id];
    if (!product) return;
    form.reset();
    error.textContent = "";
    els.product.value = id;
    $("[data-order-name]", dialog).textContent = product.name;
    $$("[data-color]", form).forEach((l) => { l.hidden = !product.colors.includes(l.dataset.color); });
    els.quantity.max = String(product.max);
    els.date.min = isoDay(earliest());
    $("[data-address]", form).hidden = true;
    limitColors();
    updateTotal();
    lenis?.stop();
    dialog.showModal();
    dialog._opener = opener;
  }

  $$("[data-order]").forEach((b) => b.addEventListener("click", () => open(b.dataset.order, b)));
  $("[data-order-close]", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { lenis?.start(); dialog._opener?.focus(); });
  form.addEventListener("change", (e) => {
    if (e.target.name === "colors") limitColors();
    if (e.target.name === "mode") $("[data-address]", form).hidden = els.mode.value !== "delivery";
    if (e.target.name === "date") error.textContent = dateProblem(els.date.value) ?? "";
  });
  els.quantity.addEventListener("input", updateTotal);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const qty = updateTotal();
    const v = (n) => els[n].value.trim();
    const delivery = els.mode.value === "delivery";
    const required = { date: f.date, name: f.name, phone: f.phone, ...(delivery ? { address: f.address } : {}) };
    const missing = Object.keys(required).filter((n) => !v(n));
    Object.keys(required).forEach((n) => els[n].setAttribute("aria-invalid", String(missing.includes(n))));
    if (missing.length) {
      error.textContent = fill(f.required, { fields: missing.map((n) => required[n]).join(", ") });
      els[missing[0]].focus();
      return;
    }
    const problem = dateProblem(v("date"));
    if (problem) { error.textContent = problem; els.date.focus(); return; }
    error.textContent = "";
    const colors = $$('input[name="colors"]:checked', form).map((c) => shop.palette[c.value]);
    const mode = delivery ? `${data.t.delivery}: ${v("address")}` : data.t.pickup;

    if (e.submitter?.value === "pay") {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang: data.lang, product: v("product"), quantity: qty, colors: colors.join(", "), mode: els.mode.value, address: v("address"), date: v("date"), slot: v("slot"), message: v("message"), name: v("name"), phone: v("phone") }),
        });
        const out = await res.json();
        if (!res.ok || !out.url) throw new Error(out.error || "checkout");
        location.href = out.url;
      } catch {
        error.textContent = f.payError;
      }
      return;
    }
    openWa(fill(data.t.order, {
      product: product.name, quantity: qty, colors: colors.join(", ") || data.t.empty, mode,
      date: formatDate(v("date")), slot: v("slot"), message: v("message") || data.t.empty, total: total.textContent, name: v("name"), phone: v("phone"),
    }));
  });

  const wanted = new URLSearchParams(location.search).get("p");
  if (wanted) {
    const card = document.getElementById(wanted);
    if (card) scrollToEl(card, true);
    open(wanted, $(`[data-order="${wanted}"]`));
  }
}

/* ---------- Accueil : intro du ballon et parallaxe (GSAP chargé à la demande) ---------- */
if (data.page === "home") homeMotion();

async function homeMotion() {
  const intro = $("[data-intro]");
  const wantsIntro = intro && !root.classList.contains("no-intro");
  if (!wantsIntro) intro?.remove();
  if (wantsIntro) lenis?.stop();
  if (wantsIntro || !reduced) {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);
    if (wantsIntro) runIntro(gsap, intro);
    if (!reduced) parallax(gsap);
  }
}

/* Fond crème, un ballon perle monte et révèle le logo, la signature s'écrit, quelques pétales, puis le hero. */
function runIntro(gsap, intro) {
  store.set("stav-intro", "1", sessionStorage);
  const slogan = $("[data-intro-slogan]", intro);
  // Lettre par lettre ; l'ordre du DOM suit le sens de lecture (RTL en hébreu).
  const chars = [...slogan.textContent].map((c) => Object.assign(document.createElement("span"), { className: "ch", textContent: c }));
  slogan.replaceChildren(...chars);
  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete: () => { intro.remove(); lenis?.start(); },
  });
  tl.fromTo(".intro__balloon", { y: "62vh", rotate: -4 }, { y: "-6vh", rotate: 3, duration: 1.05, ease: "power1.out" })
    .from(".intro__logo", { opacity: 0, y: 8, duration: 0.5 }, "-=0.35")
    .to(".intro__balloon", { y: "-70vh", opacity: 0, rotate: -2, duration: 0.9, ease: "power1.in" }, "-=0.15")
    .to(chars, { opacity: 1, duration: 0.04, stagger: Math.min(0.03, 0.7 / chars.length), ease: "none" }, "<")
    .add(() => intro.classList.add("is-petals"), "<0.1")
    .to(".intro__stage", { opacity: 0, duration: 0.35, ease: "power1.in" }, "+=0.2")
    .to(intro, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, "-=0.05")
    .to(".intro__skip", { opacity: 0, duration: 0.2 }, "<")
    .from(".hero__video", { scale: 1.06, duration: 1.3 }, "<")
    .from(".hero__content > *", { opacity: 0, y: 14, stagger: 0.07, duration: 0.7 }, "<0.25");
  $("[data-intro-skip]", intro).addEventListener("click", () => tl.progress(1));
}

function parallax(gsap) {
  $$(".event--hafrasha .event__media, .about__work picture, .feature__media picture").forEach((el) => {
    gsap.fromTo(el, { yPercent: -3 }, {
      yPercent: 3, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}
