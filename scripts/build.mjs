// Builds the published site into _site/ (run by .github/workflows/pages.yml on every push).
//
// Search engines read the raw HTML, so every page that matters is written out with its
// content, title, description and structured data already in place:
// - shakuhachi-<id>.html  one page per listing (Product + BreadcrumbList)
// - category-<id>.html    one page per collection with its listings (CollectionPage + ItemList)
// - catalogue.html        every listing
// - index.html            home title/description from admin, store details (OnlineStore + WebSite),
//                         collection cards linking to the category pages
// - sitemap.xml           all of the above (sample listings left out)
// Pages still load app.js, which re-renders the same markup and adds galleries, filters, etc.
import fs from "node:fs";
import path from "node:path";

const SITE = "https://shakuhachishop.com";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "_site");
const SKIP = new Set([".git", ".github", ".claude", "_site", "scripts", "node_modules", "admin-login.local.txt"]);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeImg = (u) => (/^(https:\/\/|assets\/|uploads\/)/.test(u || "") ? u : "");
const abs = (u) => (/^https:\/\//.test(u) ? u : `${SITE}/${u}`);
const paragraphs = (t) => String(t || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
const money = (n) => ((n || n === 0) && n !== "" ? "$" + Number(n).toLocaleString("en-US") : "Price on request");
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
const STATUS = { available: "Available", reserved: "On hold", sold: "Sold" };

// ---- Load content the same way the site does: data.js defaults + content.json overrides.
const { DEFAULTS, SEED_FLUTES, PITCH, JIARI_LENGTHS, SEO } = new Function(
  fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "; return { DEFAULTS, SEED_FLUTES, PITCH, JIARI_LENGTHS, SEO };"
)();
let content = {};
try { content = JSON.parse(fs.readFileSync(path.join(ROOT, "content.json"), "utf8")); } catch (e) {}
const flutes = (content.flutes || SEED_FLUTES)
  .filter((f) => /^[a-z0-9-]+$/.test(f.id || ""))
  .sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999));
const settings = { ...DEFAULTS, ...(content.settings || {}) };
// Saved lists predate new categories: insert missing ones at their default position.
const collections = ((saved, defaults) => {
  const byId = new Map(saved.map((c) => [c.id, c]));
  return [...defaults.map((d) => byId.get(d.id) || d), ...saved.filter((c) => !defaults.some((d) => d.id === c.id))];
})(settings.collections || [], DEFAULTS.collections);
const contact = { ...DEFAULTS.contact, ...(settings.contact || {}) };

const fluteFile = (f) => `shakuhachi-${f.id}.html`;
const categoryFile = (c) => `category-${c.id}.html`;
const inCollection = (c) => flutes.filter((f) => f.collection === c.id);
const forSale = (list) => list.filter((f) => f.status !== "sold").length;
const realForSale = (list) => forSale(list.filter((f) => !f.sample)); // counts shown to Google leave samples out

// ---- Copy the site.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const name of fs.readdirSync(ROOT)) {
  if (!SKIP.has(name)) fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

// Tell app.js it runs on the built site, so links use the static pages.
const MARK = '<meta name="prerendered" content="1">';
for (const f of fs.readdirSync(OUT).filter((n) => n.endsWith(".html"))) {
  const p = path.join(OUT, f);
  const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
  // After charset/viewport, so the charset stays within the first 1024 bytes.
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(VIEWPORT, `${VIEWPORT}  ${MARK}\n`));
}
const read = (name) => fs.readFileSync(path.join(OUT, name), "utf8");
const write = (name, html) => fs.writeFileSync(path.join(OUT, name), html);

// Replace a page's <title>/description with the given head block (canonical, social, JSON-LD).
function withHead(html, { title, description, url, image, type = "website", noindex = false, ld = [] }) {
  const head = `<title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">${noindex ? '\n  <meta name="robots" content="noindex">' : ""}
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${SEO.SITE_NAME}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(image || `${SITE}/assets/logo-share.jpg`)}">
  <meta name="twitter:card" content="summary_large_image">${ld.map((d) => `\n  ${jsonLd(d)}`).join("")}`;
  return html
    .replace(/<title>[\s\S]*?<\/title>\n\s*/, "")
    .replace(/  <meta name="description"[^>]*>\n/, "")
    .replace(/  <link rel="canonical"[^>]*>\n/, "")
    .replace(/  <meta property="og:[^>]*>\n/g, "")
    .replace(`${MARK}\n`, `${MARK}\n  ${head}\n`);
}

const breadcrumbs = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: url })),
});

// Same markup as card() in app.js.
const card = (f) => {
  const cover = safeImg((f.images || [])[0]);
  const tag = f.status !== "available" ? `<span class="tag ${esc(f.status)}">${STATUS[f.status] || ""}</span>` : "";
  return `
    <a class="card" href="${fluteFile(f)}">
      <div class="ph">${cover ? `<img src="${esc(cover)}" alt="${esc(f.name)}" loading="lazy">` : ""}${tag}</div>
      <h3>${esc(f.name)}</h3>
      <p class="meta">${esc(f.length)} shaku${PITCH[f.length] ? ` · ${PITCH[f.length]}` : ""} · ${f.status === "sold" ? "Sold" : money(f.price)}</p>
    </a>`;
};
const itemList = (list) => ({
  "@type": "ItemList",
  itemListElement: list.map((f, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${fluteFile(f)}`, name: f.name })),
});

// ---- Listing pages.
const fluteTemplate = read("flute.html");
for (const f of flutes) {
  const c = collections.find((x) => x.id === f.collection);
  const imgs = (f.images || []).map(safeImg).filter(Boolean);
  const paras = paragraphs(f.description);
  const url = `${SITE}/${fluteFile(f)}`;
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: f.name,
    description: paras.join(" ") || undefined,
    image: imgs.map(abs),
    brand: f.maker && f.maker !== "Unknown" ? { "@type": "Brand", name: f.maker } : undefined,
    category: c ? c.title : undefined,
    url,
    offers: f.price || f.price === 0 ? {
      "@type": "Offer",
      price: String(f.price),
      priceCurrency: "USD",
      availability: f.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: { "@type": "Organization", name: SEO.SITE_NAME },
      url,
    } : undefined,
  };
  const crumbs = breadcrumbs([["Home", `${SITE}/`], ...(c ? [[c.title, `${SITE}/${categoryFile(c)}`]] : []), [f.name, url]]);

  const body = `
    <div class="gallery">
      <div class="stage">${imgs[0] ? `<img class="main" src="${esc(imgs[0])}" alt="${esc(f.name)}, photo 1">` : `<div class="main ph-empty">Photos coming soon</div>`}</div>
      ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `<button type="button" data-i="${i}"><img src="${esc(src)}" alt="${esc(f.name)}, photo ${i + 1}" loading="lazy"></button>`).join("")}</div>` : ""}
    </div>
    <div class="info">
      <p class="kicker">${c ? `<a href="${categoryFile(c)}">${esc(c.title)}</a>` : ""}</p>
      <h1 class="title">${esc(f.name)}</h1>
      <p class="price">${f.status === "sold" ? "Sold" : money(f.price)} <small>${f.status === "available" ? "plus shipping" : STATUS[f.status] || ""}</small></p>
      <dl class="specs">
        ${f.maker ? `<dt>Maker</dt><dd>${esc(f.maker)}</dd>` : ""}
        <dt>Length</dt><dd>${esc(f.length)} shaku${PITCH[f.length] ? ` (${PITCH[f.length]})` : ""}</dd>
        <dt>Status</dt><dd>${STATUS[f.status] || ""}</dd>
      </dl>
      <div class="desc">${paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    </div>`;

  write(fluteFile(f), withHead(fluteTemplate, {
    title: SEO.fluteTitle(f), description: SEO.fluteDescription(f), url, type: "product",
    image: imgs[0] && abs(imgs[0]), noindex: !!f.sample, ld: [product, crumbs],
  })
    .replace('<a class="back" href="catalogue.html">', `<a class="back" href="${c ? categoryFile(c) : "catalogue.html"}">`)
    .replace('<article class="flute" id="flute"><p class="loading">Loading…</p></article>',
      `<article class="flute" id="flute" data-id="${esc(f.id)}">${body}</article>`));
}

// ---- Catalogue and one page per collection.
const catalogueTemplate = read("catalogue.html");
function catalogueHtml(c) {
  const list = c ? inCollection(c) : flutes;
  const file = c ? categoryFile(c) : "catalogue.html";
  const url = `${SITE}/${file}`;
  const title = c ? SEO.collectionTitle(c) : `All Shakuhachi for Sale – ${SEO.SITE_NAME}`;
  const description = c ? SEO.collectionDescription(c, realForSale(list))
    : SEO.clamp(`Every Shakuhachi in the shop: Edo, jinashi, jiari, wood and Yuu, and bamboo for making. ${realForSale(list)} available now, each with photos and video.`);
  const page = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: c ? c.title : "All Shakuhachi",
    description,
    url,
    mainEntity: itemList(list.filter((f) => !f.sample)),
  };
  const crumbs = breadcrumbs([["Home", `${SITE}/`], [c ? c.title : "All Shakuhachi", url]]);
  const tabs = [`<a href="catalogue.html"${c ? "" : ' aria-current="page"'}>All</a>`,
    ...collections.map((x) => `<a href="${categoryFile(x)}"${c && x.id === c.id ? ' aria-current="page"' : ""}>${esc(x.title)}</a>`)].join("");
  const grid = list.length ? list.map(card).join("")
    : `<div class="empty"><p>Nothing here right now. New items are added regularly.</p><a class="btn" href="${esc(contact.messenger)}" target="_blank" rel="noopener">Tell us what you are looking for</a></div>`;

  return withHead(catalogueTemplate, { title, description, url, ld: [page, crumbs] })
    .replace('<main class="wrap page">', `<main class="wrap page"${c ? ` data-collection="${c.id}"` : ""}>`)
    .replace('<p class="kicker" id="cat-kicker">Catalogue</p>', `<p class="kicker" id="cat-kicker">${esc(c ? c.kicker : "Catalogue")}</p>`)
    .replace('<h1 class="title" id="cat-title">All Shakuhachi</h1>', `<h1 class="title" id="cat-title">${esc(c ? c.title : "All Shakuhachi")}</h1>`)
    .replace('<p class="sub" id="cat-text"></p>', `<p class="sub" id="cat-text">${esc(c ? c.text : "Every Shakuhachi currently in the shop.")}</p>`)
    .replace('<nav class="tabs" id="tabs" aria-label="Collections"></nav>', `<nav class="tabs" id="tabs" aria-label="Collections">${tabs}</nav>`)
    .replace('<div class="grid" id="grid"><p class="loading">Loading…</p></div>', `<div class="grid" id="grid">${grid}</div>`);
}
write("catalogue.html", catalogueHtml(null));
for (const c of collections) write(categoryFile(c), catalogueHtml(c));

// ---- Home page.
const logo = `${SITE}/assets/favicon-512.png`;
const store = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${SITE}/#store`,
  name: SEO.SITE_NAME,
  url: `${SITE}/`,
  logo,
  image: `${SITE}/assets/logo-share.jpg`,
  description: SEO.homeDescription(settings),
  sameAs: [contact.facebook].filter((u) => /^https:\/\//.test(u || "")),
  ...(contact.phone ? { telephone: contact.phone } : {}),
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    url: contact.messenger,
    ...(contact.phone ? { telephone: contact.phone } : {}),
    availableLanguage: ["English", "Vietnamese"],
  },
};
const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SEO.SITE_NAME,
  url: `${SITE}/`,
  publisher: { "@id": `${SITE}/#store` },
};
const heroFirst = (settings.hero || []).find((h) => safeImg(h.src));
const collectionCards = collections.map((c) => {
  const count = forSale(inCollection(c));
  const img = safeImg(c.image) ? `<img src="${esc(c.image)}" alt="${esc(c.title)}" loading="lazy">` : `<div class="ph-empty">Photos coming soon</div>`;
  const lengths = c.id === "jiari"
    ? `<p class="len-links">${JIARI_LENGTHS.map((g) => `<a href="${categoryFile(c)}?l=${g.id}">${esc(g.title.replace(" Shakuhachi", ""))}</a>`).join("")}</p>` : "";
  return `
      <article class="coll-card">
        <a class="coll-img" href="${categoryFile(c)}">${img}</a>
        <div class="coll-body">
          <p class="kicker">${esc(c.kicker)}</p>
          <h3><a href="${categoryFile(c)}">${esc(c.title)}</a></h3>
          <p class="coll-text">${esc(c.text)}</p>
          <p class="count">${count ? `${count} ${c.id === "bamboo" || c.id === "other" ? "available" : "Shakuhachi available"}` : c.id === "bamboo" ? "New bamboo coming soon" : c.id === "other" ? "New flutes coming soon" : "New Shakuhachi coming soon"}</p>
          ${lengths}
          <a class="btn" href="${categoryFile(c)}">${esc(c.cta)}</a>
        </div>
      </article>`;
}).join("");
write("index.html", withHead(read("index.html"), {
  title: SEO.homeTitle(settings), description: SEO.homeDescription(settings), url: `${SITE}/`, ld: [store, website],
})
  .replace('<div id="collections" class="coll-grid wrap"></div>', `<div id="collections" class="coll-grid wrap">${collectionCards}</div>`)
  // The first hero photo is the largest thing on screen: ship it in the HTML and fetch it first.
  .replace('<div class="slides" id="slides"></div>', heroFirst
    ? `<div class="slides" id="slides"><img src="${esc(heroFirst.src)}" alt="" style="object-position:${esc(heroFirst.focus || "50% 50%")}" class="on" fetchpriority="high"></div>`
    : '<div class="slides" id="slides"></div>')
  .replace(`${MARK}\n`, heroFirst ? `${MARK}\n  <link rel="preload" as="image" href="${esc(heroFirst.src)}" fetchpriority="high">\n` : `${MARK}\n`));

// ---- Old WordPress addresses still in Google: send them to the matching new page.
// GitHub Pages has no server redirects, so each one is a tiny page with an instant refresh
// (Google treats a 0-second refresh as a permanent redirect) plus a canonical link.
const OLD_URLS = {
  "shop": "catalogue.html",
  "shop/1-9-seien-shakuhachi": "shakuhachi-seien-19.html",
  "product-category/1-3-shakuhachi": "category-jiari.html",
  "product-category/1-4-shakuhachi": "category-jiari.html",
  "product-category/1-5-shakuhachi": "category-jiari.html",
  "product-category/1-9-shakuhachi": "category-jiari.html",
};
for (const [from, to] of Object.entries(OLD_URLS)) {
  if (!fs.existsSync(path.join(OUT, to))) continue;
  const depth = "../".repeat(from.split("/").length);
  fs.mkdirSync(path.join(OUT, from), { recursive: true });
  fs.writeFileSync(path.join(OUT, from, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Moved – ${SEO.SITE_NAME}</title>
<link rel="canonical" href="${SITE}/${to}">
<meta http-equiv="refresh" content="0; url=${depth}${to}">
</head><body><p>This page has moved to <a href="${depth}${to}">${SITE}/${to}</a>.</p>
<script>location.replace(${JSON.stringify(depth + to)} + location.hash);</script></body></html>
`);
}

// ---- 404 page: anything else that no longer exists (old cart, checkout, demo products…).
write("404.html", withHead(catalogueTemplate, {
  title: `Page not found – ${SEO.SITE_NAME}`,
  description: "This page does not exist. Browse every Shakuhachi in the shop instead.",
  url: `${SITE}/catalogue.html`, noindex: true,
})
  // 404 pages are served at any depth (/shop/polo/…), so resolve every relative link from the root.
  .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <base href="/">')
  .replace('<p class="kicker" id="cat-kicker">Catalogue</p>', '<p class="kicker" id="cat-kicker">Page not found</p>')
  .replace('<h1 class="title" id="cat-title">All Shakuhachi</h1>', '<h1 class="title" id="cat-title">This page has moved</h1>')
  .replace('<p class="sub" id="cat-text"></p>', '<p class="sub" id="cat-text">The shop has a new website. Every Shakuhachi currently for sale is listed below.</p>')
  .replace('<div class="grid" id="grid"><p class="loading">Loading…</p></div>', `<div class="grid" id="grid">${flutes.filter((f) => !f.sample).map(card).join("").replace(/href="shakuhachi-/g, 'href="/shakuhachi-').replace(/src="(assets|uploads)\//g, 'src="/$1/')}</div>`)
  .replace('<nav class="tabs" id="tabs" aria-label="Collections"></nav>', `<nav class="tabs" id="tabs" aria-label="Collections"><a href="catalogue.html">All</a>${collections.map((x) => `<a href="${categoryFile(x)}">${esc(x.title)}</a>`).join("")}</nav>`)
  // Keep app.js from re-rendering this page as a catalogue.
  .replace(/(\s*)(<script src="app\.js)/, '$1<script>window.NOT_FOUND = true;</script>$1$2'));

// ---- Sitemap (samples are left out; they are only decoration).
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `${SITE}/`,
  `${SITE}/catalogue.html`,
  ...collections.map((c) => `${SITE}/${categoryFile(c)}`),
  ...flutes.filter((f) => !f.sample).map((f) => `${SITE}/${fluteFile(f)}`),
];
write("sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
  `\n</urlset>\n`);

console.log(`Built ${flutes.length} listing pages, ${collections.length} category pages, sitemap with ${urls.length} URLs.`);
