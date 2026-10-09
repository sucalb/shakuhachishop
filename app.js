const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Only allow image sources we produce: uploaded https URLs, bundled assets, or demo-mode data URLs.
const safeImg = (u) => (/^(https:\/\/|assets\/|uploads\/|data:image\/(jpeg|png|webp);)/.test(u || "") ? esc(u) : "");
const safeUrl = (u) => (/^https:\/\//.test(u || "") ? esc(u) : "#");
const money = (n) => (n || n === 0) && n !== "" ? "$" + Number(n).toLocaleString("en-US") : "Price on request";
const params = new URLSearchParams(location.search);
// On the published site every Shakuhachi has its own static page (built by scripts/build.mjs).
const PRERENDERED = !!document.querySelector('meta[name="prerendered"]');
const fluteUrl = (f) => (PRERENDERED ? `shakuhachi-${f.id}.html` : `flute.html?id=${encodeURIComponent(f.id)}`);
const categoryUrl = (id) => (!id ? "catalogue.html" : PRERENDERED ? `category-${id}.html` : `catalogue.html?c=${id}`);
const lengthUrl = (l) => `${categoryUrl("jiari")}${PRERENDERED ? "?" : "&"}l=${l}`;
const STATUS = { available: "Available", reserved: "On hold", sold: "Sold" };
const pitchOf = (f) => (PITCH[f.length] ? ` · ${PITCH[f.length]}` : "");
const lengthGroup = (id) => JIARI_LENGTHS.find((g) => g.id === id);
const paragraphs = (t) => String(t || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);

// Accepts a full YouTube URL (watch, youtu.be, shorts, embed) or a bare video id.
function youtubeId(v) {
  if (!v) return "";
  const m = String(v).match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(v) ? v : "";
}

const FB_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.15.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.53-.04.91.25 1.88.38 2.91.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm6 7.46-2.94 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z"/></svg>`;

let S;       // site settings (contact, hero, collections, reviews)
let FLUTES;  // inventory

const ext = (url) => `href="${safeUrl(url)}" target="_blank" rel="noopener"`;
// Phone is optional: returns "" when not set, so nothing is shown.
const PHONE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>`;
function phoneLink(cls = "") {
  const p = (S.contact.phone || "").trim();
  const digits = p.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 8) return "";
  return `<a class="phone ${cls}" href="tel:${esc(digits)}">${PHONE_ICON}<span>${esc(p)}</span></a>`;
}

// ---------- Shared header and footer ----------
function renderChrome() {
  const header = $("[data-header]");
  header.innerHTML = `
    <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><em>Menu</em></button>
    <a class="brand" href="index.html"><img class="brand-logo" src="assets/logo-128.jpg" alt="" width="34" height="34"><b>Old Shakuhachi Shop</b></a>
    <a class="fb-mini" ${ext(S.contact.messenger)} aria-label="Message us on Facebook"><em>Message us</em>${FB_ICON}</a>
    <nav class="nav">
      <a href="catalogue.html">All Shakuhachi</a>
      ${S.collections.map((c) => `<a href="${categoryUrl(c.id)}">${esc(c.title)}</a>`).join("")}
      <a href="index.html#reviews">Reviews</a>
      <a ${ext(S.contact.facebook)}>Facebook</a>
    </nav>`;
  const burger = $(".burger", header);
  burger.addEventListener("click", () => {
    const open = header.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  header.addEventListener("click", (e) => {
    if (e.target.closest(".nav a")) header.classList.remove("open");
  });

  $("[data-footer]").innerHTML = `
    <div class="foot-inner on-dark">
      <p class="foot-title">Old Shakuhachi Shop</p>
      <p class="foot-sub">To buy a Shakuhachi or ask a question, send us a message${S.contact.phone ? " or call us" : ""}.</p>
      <a class="btn" ${ext(S.contact.messenger)}>${FB_ICON} Message us on Facebook</a>
      ${phoneLink("foot-phone")}
      <div class="foot-bottom">
        <span class="brand-mini"><img class="brand-logo" src="assets/logo-128.jpg" alt="" width="26" height="26"> Old Shakuhachi Shop</span>
        <nav class="foot-links">
          <a href="catalogue.html">Catalogue</a>
          <a ${ext(S.contact.facebook)}>Facebook page</a>
          <a ${ext(S.contact.reviews)}>Reviews</a>
        </nav>
        <span>© ${new Date().getFullYear()} shakuhachishop.com</span>
      </div>
    </div>`;
}

function card(f) {
  const status = f.status !== "available" ? `<span class="tag ${esc(f.status)}">${STATUS[f.status] || ""}</span>` : "";
  const video = youtubeId(f.youtube) ? `<span class="tag video">▶ Video</span>` : "";
  const sample = f.sample ? `<span class="tag sample">Sample</span>` : "";
  const cover = safeImg((f.images || [])[0]);
  return `
    <a class="card reveal" href="${esc(fluteUrl(f))}">
      <div class="ph">${cover ? `<img src="${cover}" alt="${esc(f.name)}" loading="lazy">` : ""}${status}${video}${sample}</div>
      <h3>${esc(f.name)}</h3>
      <p class="meta">${esc(f.length)} shaku${pitchOf(f)} · ${f.status === "sold" ? "Sold" : money(f.price)}</p>
    </a>`;
}

// ---------- Home ----------
function renderHero() {
  const box = $("#slides");
  const imgs = S.hero.filter((h) => safeImg(h.src));
  const first = box.querySelector("img");
  // The built page already carries the first photo (fetched with high priority); keep it if it matches.
  const keepFirst = first && imgs[0] && first.getAttribute("src") === imgs[0].src;
  box.innerHTML = imgs.map((h, i) =>
    `<img ${i ? "data-src" : "src"}="${safeImg(h.src)}" alt="" style="object-position:${esc(h.focus || "50% 50%")}" class="${i ? "" : "on"}"${i ? "" : ' fetchpriority="high"'}>`).join("");
  if (keepFirst) box.replaceChild(first, box.firstElementChild);
  if (imgs.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const slides = box.querySelectorAll("img");
  const load = (img) => { if (img && img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; } };
  setTimeout(() => load(slides[1]), 3000);
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove("on");
    i = (i + 1) % slides.length;
    load(slides[i]);
    slides[i].classList.add("on");
    load(slides[(i + 1) % slides.length]);
  }, 6000);
}

function renderCollections() {
  $("#collections").innerHTML = S.collections.map((c) => {
    const count = FLUTES.filter((f) => f.collection === c.id && f.status !== "sold").length;
    const img = safeImg(c.image)
      ? `<img src="${safeImg(c.image)}" alt="${esc(c.title)}" loading="lazy">`
      : `<div class="ph-empty">Photos coming soon</div>`;
    const lengths = c.id === "jiari"
      ? `<p class="len-links">${JIARI_LENGTHS.map((g) => `<a href="${lengthUrl(g.id)}">${g.title.replace(" Shakuhachi", "")}</a>`).join("")}</p>`
      : "";
    return `
      <article class="coll-card reveal">
        <a class="coll-img" href="${categoryUrl(c.id)}">${img}</a>
        <div class="coll-body">
          <p class="kicker">${esc(c.kicker)}</p>
          <h3><a href="${categoryUrl(c.id)}">${esc(c.title)}</a></h3>
          <p class="coll-text">${esc(c.text)}</p>
          <p class="count">${count ? `${count} ${c.id === "bamboo" ? "available" : "Shakuhachi available"}` : c.id === "bamboo" ? "New bamboo coming soon" : "New Shakuhachi coming soon"}</p>
          ${lengths}
          <a class="btn" href="${categoryUrl(c.id)}">${esc(c.cta)}</a>
        </div>
      </article>`;
  }).join("");
}

function renderScale() {
  const lengths = Object.keys(PITCH);
  const max = parseFloat(lengths[lengths.length - 1]);
  $("#scale").innerHTML = lengths.map((l) => `
    <li class="${l === "1.8" ? "std" : ""}">
      <img src="assets/flute-scale.jpg" alt="" loading="lazy" style="--h:${(parseFloat(l) / max).toFixed(3)}">
      <b>${l}</b><small>${PITCH[l]}</small>
    </li>`).join("");
}

const REVIEW_INTERVAL = 2000; // ms between automatic slides

function renderReviews() {
  const list = (S.reviews || []).filter((r) => r.text);
  const quotes = list.map((r, i) => `
    <figure class="review" aria-roledescription="slide" aria-label="${i + 1} of ${list.length}">
      <blockquote>${esc(r.text)}</blockquote>
      <button type="button" class="more-btn" hidden>Read more</button>
      <figcaption>${esc(r.name)}${r.date ? ` · ${esc(r.date)}` : ""}</figcaption>
    </figure>`).join("");
  const many = list.length > 1;
  const sum = S.reviewSummary || {};
  $("#reviews").innerHTML = `
    <p class="kicker">Reviews</p>
    <h2 class="title">What players say</h2>
    ${sum.count ? `<a class="score" ${ext(S.contact.reviews)}>
      <strong>${esc(sum.recommend)}</strong>
      <span>recommend us on Facebook<br>${esc(sum.count)} reviews</span>
    </a>` : ""}
    ${quotes ? `<div class="review-rail" aria-roledescription="carousel" aria-label="Reviews">
      ${many ? `<button type="button" class="nav-btn prev" aria-label="Previous review">‹</button>` : ""}
      <div class="review-track">${quotes}</div>
      ${many ? `<button type="button" class="nav-btn next" aria-label="Next review">›</button>` : ""}
    </div>
    ${many ? `<div class="dots">${list.map((_, i) => `<button type="button" aria-label="Review ${i + 1}" data-i="${i}"></button>`).join("")}</div>` : ""}` : ""}
    <a class="btn" ${ext(S.contact.reviews)}>Read all reviews on Facebook</a>`;

  const track = $("#reviews .review-track");
  if (!track) return;
  const cards = [...track.querySelectorAll(".review")];
  const dots = [...document.querySelectorAll("#reviews .dots button")];

  // Long reviews are clamped; show "Read more" only where text is actually cut.
  cards.forEach((card) => {
    const q = $("blockquote", card), more = $(".more-btn", card);
    if (q.scrollHeight > q.clientHeight + 4) more.hidden = false;
    more.onclick = () => {
      const open = card.classList.toggle("open");
      more.textContent = open ? "Show less" : "Read more";
    };
  });
  if (!many) return;

  const current = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = (i) => {
    const n = (i + cards.length) % cards.length;
    track.scrollTo({ left: n * track.clientWidth, behavior: "smooth" });
  };
  const markDot = () => dots.forEach((d, i) => d.classList.toggle("on", i === current()));
  track.addEventListener("scroll", () => requestAnimationFrame(markDot), { passive: true });
  markDot();

  $("#reviews .review-rail").addEventListener("click", (e) => {
    if (e.target.closest(".prev")) go(current() - 1);
    if (e.target.closest(".next")) go(current() + 1);
  });
  $("#reviews .dots").addEventListener("click", (e) => {
    const d = e.target.closest("button");
    if (d) go(Number(d.dataset.i));
  });

  // Auto-advance; pause while the reader is hovering, touching, focused, or has a review expanded.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rail = $("#reviews .review-rail");
  let paused = false;
  const pause = () => (paused = true);
  const resume = () => (paused = false);
  rail.addEventListener("mouseenter", pause);
  rail.addEventListener("mouseleave", resume);
  rail.addEventListener("focusin", pause);
  rail.addEventListener("focusout", resume);
  track.addEventListener("touchstart", pause, { passive: true });
  track.addEventListener("touchend", () => setTimeout(resume, 4000), { passive: true });
  setInterval(() => {
    if (paused || document.hidden || track.querySelector(".review.open")) return;
    const r = track.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return; // only while on screen
    go(current() + 1);
  }, REVIEW_INTERVAL);
}

function renderHome() {
  renderHero();
  renderCollections();
  renderScale();
  renderReviews();
}

// ---------- Catalogue ----------
function renderCatalogue() {
  const pageCollection = document.querySelector("main").dataset.collection || "";
  // Old links (catalogue.html?c=edo) go to the static category page on the published site.
  if (PRERENDERED && !pageCollection && params.get("c")) {
    location.replace(categoryUrl(params.get("c")) + (params.get("l") ? `?l=${params.get("l")}` : ""));
    return;
  }
  let current = pageCollection || params.get("c") || "";
  let length = params.get("l") || "";
  const tabs = [{ id: "", title: "All" }, ...S.collections];

  function sync() {
    const q = new URLSearchParams();
    if (current && !PRERENDERED) q.set("c", current);
    if (current === "jiari" && length) q.set("l", length);
    history.replaceState(null, "", q.toString() ? `?${q}` : location.pathname);
  }

  function draw() {
    const c = S.collections.find((x) => x.id === current);
    const g = current === "jiari" ? lengthGroup(length) : null;
    $("#cat-kicker").textContent = c ? c.kicker : "Catalogue";
    $("#cat-title").textContent = g ? g.title : c ? c.title : "All Shakuhachi";
    $("#cat-text").textContent = c ? c.text : "Every Shakuhachi currently in the shop.";
    document.title = g ? `${g.title} – ${SEO.SITE_NAME}` : c ? SEO.collectionTitle(c) : `All Shakuhachi for Sale – ${SEO.SITE_NAME}`;

    $("#tabs").innerHTML = tabs.map((t) =>
      `<a href="${PRERENDERED ? categoryUrl(t.id) : `?c=${t.id}`}" data-c="${t.id}" ${t.id === current ? 'aria-current="page"' : ""}>${esc(t.title)}</a>`).join("");

    const sub = $("#subtabs");
    sub.hidden = current !== "jiari";
    sub.innerHTML = [{ id: "", title: "All lengths" }, ...JIARI_LENGTHS].map((x) =>
      `<a href="${PRERENDERED ? `?l=${x.id}` : `?c=jiari&l=${x.id}`}" data-l="${x.id}" ${x.id === length ? 'aria-current="page"' : ""}>${esc(x.title.replace(" Shakuhachi", ""))}</a>`).join("");

    const list = FLUTES.filter((f) =>
      (!current || f.collection === current) && (!g || g.match(parseFloat(f.length))));
    $("#grid").innerHTML = list.length
      ? list.map(card).join("")
      : `<div class="empty"><p>Nothing here right now. New items are added regularly.</p><a class="btn" ${ext(S.contact.messenger)}>Tell us what you are looking for</a></div>`;
    observeReveals();
  }

  document.addEventListener("click", (e) => {
    // On the published site the collection tabs are real pages; only the Jiari length filter stays in-page.
    const a = e.target.closest(PRERENDERED ? "#subtabs a" : "#tabs a, #subtabs a");
    if (!a) return;
    e.preventDefault();
    if ("c" in a.dataset) { current = a.dataset.c; length = ""; }
    else length = a.dataset.l;
    sync();
    draw();
  });
  draw();
}

// ---------- Flute detail ----------
function renderFlute() {
  const el = $("#flute");
  const f = FLUTES.find((x) => x.id === (el.dataset.id || params.get("id")));
  if (!f) {
    el.innerHTML = `<div class="empty"><p>This Shakuhachi could not be found. It may have been sold.</p><a class="btn" href="catalogue.html">See all Shakuhachi</a></div>`;
    return;
  }
  const c = S.collections.find((x) => x.id === f.collection);
  document.title = SEO.fluteTitle(f);
  const imgs = (f.images || []).map(safeImg).filter(Boolean);
  const vid = youtubeId(f.youtube);
  const many = imgs.length > 1;
  el.innerHTML = `
    <div class="gallery">
      <div class="stage">
        ${imgs[0] ? `<img class="main" src="${imgs[0]}" alt="${esc(f.name)}, photo 1">` : `<div class="main ph-empty">Photos coming soon</div>`}
        ${many ? `<button type="button" class="nav-btn prev" aria-label="Previous photo">‹</button>
        <button type="button" class="nav-btn next" aria-label="Next photo">›</button>
        <span class="counter">1 / ${imgs.length}</span>` : ""}
        ${imgs[0] ? `<button type="button" class="zoom" aria-label="View full screen">⤢</button>` : ""}
      </div>
      ${many ? `<div class="thumbs">${imgs.map((src, i) => `<button type="button" data-i="${i}" class="${i ? "" : "on"}" aria-label="Photo ${i + 1}"><img src="${src}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
      <section class="video">
        <p class="kicker">Hear it played</p>
        ${vid
          ? `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="${esc(f.name)} video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
          : `<div class="yt yt-empty"><span>▶</span><p>Video coming soon</p></div>`}
      </section>
    </div>
    <div class="info">
      <p class="kicker">${c ? `<a href="${categoryUrl(c.id)}">${esc(c.title)}</a>` : ""}</p>
      <h1 class="title">${esc(f.name)}</h1>
      ${f.sample ? `<p class="sample-note">Sample listing, shown to illustrate the shop.</p>` : ""}
      <p class="price">${f.status === "sold" ? "Sold" : money(f.price)} <small>${f.status === "available" ? "plus shipping" : STATUS[f.status] || ""}</small></p>
      <dl class="specs">
        ${f.maker ? `<dt>Maker</dt><dd>${esc(f.maker)}</dd>` : ""}
        <dt>Length</dt><dd>${esc(f.length)} shaku${PITCH[f.length] ? ` (${PITCH[f.length]})` : ""}</dd>
        <dt>Status</dt><dd>${STATUS[f.status] || ""}</dd>
      </dl>
      <div class="desc">${paragraphs(f.description).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      ${f.status === "sold" ? "" : `
        <a class="btn fb" ${ext(S.contact.messenger)}>${FB_ICON} Message us to buy</a>
        ${phoneLink("info-phone")}
        <p class="small">Mention “${esc(f.name)}” in your message. Price, shipping and payment are arranged directly with us.</p>`}
    </div>`;

  if (imgs.length) setupGallery(el, imgs, f.name);
}

// Main photo with arrows, thumbnails, swipe, and a full-screen viewer.
function setupGallery(el, imgs, name) {
  let i = 0;
  const main = $(".main", el);
  const counter = $(".counter", el);
  const box = document.createElement("dialog");
  box.className = "lightbox";
  box.innerHTML = `
    <img alt="">
    <button type="button" class="lb-close" aria-label="Close">×</button>
    ${imgs.length > 1 ? `<button type="button" class="nav-btn prev" aria-label="Previous photo">‹</button><button type="button" class="nav-btn next" aria-label="Next photo">›</button>` : ""}
    <span class="counter"></span>`;
  document.body.appendChild(box);
  const big = $("img", box);

  function show(n) {
    i = (n + imgs.length) % imgs.length;
    main.src = imgs[i];
    main.alt = `${name}, photo ${i + 1}`;
    big.src = imgs[i];
    if (counter) counter.textContent = `${i + 1} / ${imgs.length}`;
    $(".counter", box).textContent = imgs.length > 1 ? `${i + 1} / ${imgs.length}` : "";
    el.querySelectorAll(".thumbs button").forEach((b) => b.classList.toggle("on", Number(b.dataset.i) === i));
    const on = $(".thumbs .on", el);
    if (on) on.scrollIntoView({ block: "nearest", inline: "nearest" });
    // Preload the neighbours so arrows feel instant.
    [i + 1, i - 1].forEach((k) => { new Image().src = imgs[(k + imgs.length) % imgs.length]; });
  }

  el.addEventListener("click", (e) => {
    const t = e.target.closest(".thumbs button");
    if (t) return show(Number(t.dataset.i));
    if (e.target.closest(".stage .prev")) return show(i - 1);
    if (e.target.closest(".stage .next")) return show(i + 1);
    if (e.target.closest(".zoom") || e.target === main) box.showModal();
  });
  box.addEventListener("click", (e) => {
    if (e.target.closest(".prev")) return show(i - 1);
    if (e.target.closest(".next")) return show(i + 1);
    if (e.target.closest(".lb-close") || e.target === box) box.close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });

  // Swipe left/right on touch screens.
  [main, big].forEach((target) => {
    let x0 = null;
    target.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    target.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    });
  });
  show(0);
}

// ---------- Fade-in on scroll ----------
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" })
  : null;
function observeReveals() {
  document.querySelectorAll(".reveal:not(.in)").forEach((el) =>
    revealObserver ? revealObserver.observe(el) : el.classList.add("in"));
}

(async function boot() {
  try {
    [S, FLUTES] = await Promise.all([Store.settings(), Store.listFlutes()]);
  } catch (err) {
    console.error(err);
    S = JSON.parse(JSON.stringify(DEFAULTS));
    FLUTES = SEED_FLUTES;
  }
  renderChrome();
  if ($("#collections")) renderHome();
  if ($("#grid") && !window.NOT_FOUND) renderCatalogue();
  if ($("#flute")) renderFlute();
  observeReveals();
})();
