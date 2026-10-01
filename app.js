const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Only allow image sources we produce: uploaded https URLs, bundled assets, or demo-mode data URLs.
const safeImg = (u) => (/^(https:\/\/|assets\/|data:image\/(jpeg|png|webp);)/.test(u || "") ? esc(u) : "");
const safeUrl = (u) => (/^https:\/\//.test(u || "") ? esc(u) : "#");
const money = (n) => (n || n === 0) && n !== "" ? "$" + Number(n).toLocaleString("en-US") : "Price on request";
const params = new URLSearchParams(location.search);
const STATUS = { available: "Available", reserved: "On hold", sold: "Sold" };
const GHOST = { edo: "江戸", jinashi: "地無", jiari: "地有" };
const NAV_JP = { edo: "江戸", jinashi: "地無し", jiari: "地有り" };
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

// ---------- Shared header and footer ----------
function renderChrome() {
  const header = $("[data-header]");
  header.innerHTML = `
    <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><em>Menu</em></button>
    <a class="brand" href="index.html"><span class="seal">尺八</span><b>TranCao Shakuhachi</b></a>
    <a class="fb-mini" ${ext(S.contact.messenger)} aria-label="Message us on Facebook"><em>Message us</em>${FB_ICON}</a>
    <nav class="nav">
      <a href="catalogue.html">All flutes <span>尺八</span></a>
      ${S.collections.map((c) => `<a href="catalogue.html?c=${c.id}">${esc(c.title)} <span>${NAV_JP[c.id] || ""}</span></a>`).join("")}
      <a href="index.html#way">The way of the bamboo <span>一音成仏</span></a>
      <a href="index.html#reviews">Reviews <span>評</span></a>
      <a ${ext(S.contact.facebook)}>Facebook <span>連絡</span></a>
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
      <p class="foot-quote">一音成仏</p>
      <p>Enlightenment in a single sound</p>
      <a class="btn" ${ext(S.contact.messenger)}>${FB_ICON} Message us on Facebook</a>
      <div class="foot-bottom">
        <span class="brand-mini"><span class="seal">尺八</span> TranCao Shakuhachi</span>
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
    <a class="card reveal" href="flute.html?id=${encodeURIComponent(f.id)}">
      <div class="ph">${cover ? `<img src="${cover}" alt="${esc(f.name)}" loading="lazy">` : ""}${status}${video}${sample}</div>
      <h3>${esc(f.name)}</h3>
      <p class="meta">${esc(f.length)} shaku${pitchOf(f)} · ${f.status === "sold" ? "Sold" : money(f.price)}</p>
    </a>`;
}

// ---------- Home ----------
function renderHero() {
  const box = $("#slides");
  const imgs = S.hero.filter((h) => safeImg(h.src));
  box.innerHTML = imgs.map((h, i) =>
    `<img src="${safeImg(h.src)}" alt="" style="object-position:${esc(h.focus || "50% 50%")}" class="${i ? "" : "on"}">`).join("");
  if (imgs.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const slides = box.querySelectorAll("img");
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove("on");
    i = (i + 1) % slides.length;
    slides[i].classList.add("on");
  }, 6000);
}

function renderCollections() {
  $("#collections").innerHTML = S.collections.map((c, i) => {
    const count = FLUTES.filter((f) => f.collection === c.id && f.status !== "sold").length;
    const img = safeImg(c.image)
      ? `<img src="${safeImg(c.image)}" alt="${esc(c.title)}" loading="lazy">`
      : `<div class="ph-empty"><b>${GHOST[c.id] || ""}</b>Photos coming soon</div>`;
    const lengths = c.id === "jiari"
      ? `<p class="len-links">${JIARI_LENGTHS.map((g) => `<a href="catalogue.html?c=jiari&l=${g.id}">${g.title.replace(" Shakuhachi", "")}</a>`).join("")}</p>`
      : "";
    return `
      <section class="feature reveal ${i % 2 ? "flip" : ""}">
        <div class="feature-text">
          <span class="ghost" aria-hidden="true">${GHOST[c.id] || ""}</span>
          <p class="kicker">${esc(c.kicker)}</p>
          <h2 class="title">${esc(c.title)}</h2>
          <p>${esc(c.text)}</p>
          <p class="count">${count ? `${count} ${count === 1 ? "flute" : "flutes"} available` : "New flutes coming soon"}</p>
          ${lengths}
          <a class="btn" href="catalogue.html?c=${c.id}">${esc(c.cta)}</a>
        </div>
        <a class="feature-img" href="catalogue.html?c=${c.id}">${img}</a>
      </section>`;
  }).join("");
}

function renderScale() {
  const lengths = Object.keys(PITCH);
  const max = parseFloat(lengths[lengths.length - 1]);
  $("#scale").innerHTML = lengths.map((l) => `
    <li class="${l === "1.8" ? "std" : ""}">
      <i style="height:${(parseFloat(l) / max) * 180}px"></i>
      <b>${l}</b><small>${PITCH[l]}</small>
    </li>`).join("");
}

function renderReviews() {
  const quotes = (S.reviews || []).filter((r) => r.text).map((r) => `
    <figure class="review">
      <blockquote>${esc(r.text)}</blockquote>
      <figcaption>${esc(r.name)}${r.date ? ` · ${esc(r.date)}` : ""}</figcaption>
    </figure>`).join("");
  const sum = S.reviewSummary || {};
  $("#reviews").innerHTML = `
    <p class="kicker">Reviews</p>
    <h2 class="title">What players say</h2>
    ${sum.count ? `<a class="score" ${ext(S.contact.reviews)}>
      <strong>${esc(sum.recommend)}</strong>
      <span>recommend us on Facebook<br>${esc(sum.count)} reviews</span>
    </a>` : ""}
    ${quotes ? `<div class="review-list">${quotes}</div>` : ""}
    <a class="btn" ${ext(S.contact.reviews)}>Read all reviews on Facebook</a>`;
}

function renderListen() {
  const el = $("#listen");
  const l = S.listen || {};
  const vid = youtubeId(l.youtube);
  if (!vid) return el.remove();
  el.innerHTML = `
    <p class="kicker">Listen</p>
    <h3>${esc(l.title)}</h3>
    ${l.caption ? `<p>${esc(l.caption)}</p>` : ""}
    <div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="${esc(l.title)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
}

function renderHome() {
  renderHero();
  renderListen();
  renderCollections();
  renderScale();
  renderReviews();
}

// ---------- Catalogue ----------
function renderCatalogue() {
  let current = params.get("c") || "";
  let length = params.get("l") || "";
  const tabs = [{ id: "", title: "All" }, ...S.collections];

  function sync() {
    const q = new URLSearchParams();
    if (current) q.set("c", current);
    if (current === "jiari" && length) q.set("l", length);
    history.replaceState(null, "", q.toString() ? `?${q}` : location.pathname);
  }

  function draw() {
    const c = S.collections.find((x) => x.id === current);
    const g = current === "jiari" ? lengthGroup(length) : null;
    $("#cat-kicker").textContent = c ? c.kicker : "Catalogue";
    $("#cat-title").textContent = g ? g.title : c ? c.title : "All Flutes";
    $("#cat-text").textContent = c ? c.text : "Every flute currently in the shop.";
    document.title = `${g ? g.title : c ? c.title : "Catalogue"} – TranCao Shakuhachi`;

    $("#tabs").innerHTML = tabs.map((t) =>
      `<a href="?c=${t.id}" data-c="${t.id}" ${t.id === current ? 'aria-current="page"' : ""}>${esc(t.title)}</a>`).join("");

    const sub = $("#subtabs");
    sub.hidden = current !== "jiari";
    sub.innerHTML = [{ id: "", title: "All lengths" }, ...JIARI_LENGTHS].map((x) =>
      `<a href="?c=jiari&l=${x.id}" data-l="${x.id}" ${x.id === length ? 'aria-current="page"' : ""}>${esc(x.title.replace(" Shakuhachi", ""))}</a>`).join("");

    const list = FLUTES.filter((f) =>
      (!current || f.collection === current) && (!g || g.match(parseFloat(f.length))));
    $("#grid").innerHTML = list.length
      ? list.map(card).join("")
      : `<div class="empty"><b>${GHOST[current] || "尺八"}</b><p>No flutes here right now. New ones are added regularly.</p><a class="btn" ${ext(S.contact.messenger)}>Tell us what you are looking for</a></div>`;
    observeReveals();
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("#tabs a, #subtabs a");
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
  const f = FLUTES.find((x) => x.id === params.get("id"));
  const el = $("#flute");
  if (!f) {
    el.innerHTML = `<div class="empty"><b>尺八</b><p>This flute could not be found. It may have been sold.</p><a class="btn" href="catalogue.html">See all flutes</a></div>`;
    return;
  }
  const c = S.collections.find((x) => x.id === f.collection);
  document.title = `${f.name} – TranCao Shakuhachi`;
  const imgs = (f.images || []).map(safeImg).filter(Boolean);
  const vid = youtubeId(f.youtube);
  const thumbs = imgs.length > 1
    ? `<div class="thumbs">${imgs.map((src, i) => `<img src="${src}" alt="" class="${i ? "" : "on"}">`).join("")}</div>`
    : "";
  el.innerHTML = `
    <div class="gallery">
      ${imgs[0] ? `<img class="main" src="${imgs[0]}" alt="${esc(f.name)}">` : `<div class="main ph-empty"><b>尺八</b></div>`}
      ${thumbs}
      <section class="video">
        <p class="kicker">Hear it played</p>
        ${vid
          ? `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="${esc(f.name)} video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
          : `<div class="yt yt-empty"><span>▶</span><p>Video coming soon</p></div>`}
      </section>
    </div>
    <div class="info">
      <p class="kicker">${c ? `<a href="catalogue.html?c=${c.id}">${esc(c.title)}</a>` : ""}</p>
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
        <p class="small">Mention “${esc(f.name)}” in your message. Price, shipping and payment are arranged directly with us.</p>`}
    </div>`;

  el.addEventListener("click", (e) => {
    const t = e.target.closest(".thumbs img");
    if (!t) return;
    $(".main", el).src = t.src;
    el.querySelectorAll(".thumbs img").forEach((img) => img.classList.toggle("on", img === t));
  });
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
  if ($("#grid")) renderCatalogue();
  if ($("#flute")) renderFlute();
  observeReveals();
})();
