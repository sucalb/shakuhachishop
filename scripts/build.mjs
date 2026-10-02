// Builds the published site into _site/ (run by .github/workflows/pages.yml on every push).
//
// - Copies the site as is.
// - Writes one static page per Shakuhachi (shakuhachi-<id>.html) with its name, price,
//   description, photos and schema.org Product data already in the HTML, so search engines
//   can read it without running JavaScript. The page still loads app.js for the gallery etc.
// - Writes sitemap.xml listing the home page, catalogue, collections and every real listing.
// - Marks built pages so app.js links to the static Shakuhachi pages.
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
const STATUS = { available: "Available", reserved: "On hold", sold: "Sold" };

// ---- Load content the same way the site does: data.js defaults + content.json overrides.
const { DEFAULTS, SEED_FLUTES, PITCH } = new Function(
  fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + "; return { DEFAULTS, SEED_FLUTES, PITCH };"
)();
let content = {};
try { content = JSON.parse(fs.readFileSync(path.join(ROOT, "content.json"), "utf8")); } catch (e) {}
const flutes = (content.flutes || SEED_FLUTES).filter((f) => /^[a-z0-9-]+$/.test(f.id || ""));
const settings = { ...DEFAULTS, ...(content.settings || {}) };
const savedIds = new Set((settings.collections || []).map((c) => c.id));
const collections = [...settings.collections, ...DEFAULTS.collections.filter((c) => !savedIds.has(c.id))];

// ---- Copy the site.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const name of fs.readdirSync(ROOT)) {
  if (!SKIP.has(name)) fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

// Tell app.js it runs on the built site, so product links use the static pages.
const MARK = '<meta name="prerendered" content="1">';
for (const f of fs.readdirSync(OUT).filter((n) => n.endsWith(".html"))) {
  const p = path.join(OUT, f);
  const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
  // After charset/viewport, so the charset stays within the first 1024 bytes.
  fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(VIEWPORT, `${VIEWPORT}  ${MARK}\n`));
}

// ---- One static page per Shakuhachi.
const template = fs.readFileSync(path.join(OUT, "flute.html"), "utf8");
const pageName = (f) => `shakuhachi-${f.id}.html`;

for (const f of flutes) {
  const c = collections.find((x) => x.id === f.collection);
  const imgs = (f.images || []).map(safeImg).filter(Boolean);
  const paras = paragraphs(f.description);
  const desc = (paras.join(" ") || `${f.name} for sale at Old Shakuhachi Shop.`).slice(0, 155);
  const price = f.status === "sold" ? "Sold" : f.price || f.price === 0 ? `$${Number(f.price).toLocaleString("en-US")}` : "Price on request";
  const url = `${SITE}/${pageName(f)}`;

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
      url,
    } : undefined,
  };

  const head = `<title>${esc(f.name)} – Old Shakuhachi Shop</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">${f.sample ? '\n  <meta name="robots" content="noindex">' : ""}
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Old Shakuhachi Shop">
  <meta property="og:title" content="${esc(f.name)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${esc(imgs[0] ? abs(imgs[0]) : `${SITE}/assets/logo-share.jpg`)}">
  <script type="application/ld+json">${JSON.stringify(product).replace(/</g, "\\u003c")}</script>`;

  // Same structure app.js renders, so the page looks right before and after JavaScript runs.
  const body = `
    <div class="gallery">
      <div class="stage">${imgs[0] ? `<img class="main" src="${esc(imgs[0])}" alt="${esc(f.name)}, photo 1">` : `<div class="main ph-empty">Photos coming soon</div>`}</div>
      ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `<button type="button" data-i="${i}"><img src="${esc(src)}" alt="${esc(f.name)}, photo ${i + 1}" loading="lazy"></button>`).join("")}</div>` : ""}
    </div>
    <div class="info">
      <p class="kicker">${c ? `<a href="catalogue.html?c=${esc(c.id)}">${esc(c.title)}</a>` : ""}</p>
      <h1 class="title">${esc(f.name)}</h1>
      <p class="price">${price} <small>${f.status === "available" ? "plus shipping" : STATUS[f.status] || ""}</small></p>
      <dl class="specs">
        ${f.maker ? `<dt>Maker</dt><dd>${esc(f.maker)}</dd>` : ""}
        <dt>Length</dt><dd>${esc(f.length)} shaku${PITCH[f.length] ? ` (${PITCH[f.length]})` : ""}</dd>
        <dt>Status</dt><dd>${STATUS[f.status] || ""}</dd>
      </dl>
      <div class="desc">${paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    </div>`;

  let html = template
    .replace(/<title>[\s\S]*?<\/title>\n\s*/, "")
    .replace(/  <meta name="description"[^>]*>\n/, "")
    .replace(`${MARK}\n`, `${MARK}\n  ${head}\n`)
    .replace('<article class="flute" id="flute"><p class="loading">Loading…</p></article>',
      `<article class="flute" id="flute" data-id="${esc(f.id)}">${body}</article>`);
  fs.writeFileSync(path.join(OUT, pageName(f)), html);
}

// ---- Sitemap (samples are left out; they are only decoration).
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `${SITE}/`,
  `${SITE}/catalogue.html`,
  ...collections.map((c) => `${SITE}/catalogue.html?c=${c.id}`),
  ...flutes.filter((f) => !f.sample).map((f) => `${SITE}/${pageName(f)}`),
];
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
  `\n</urlset>\n`);

console.log(`Built ${flutes.length} Shakuhachi pages, sitemap with ${urls.length} URLs.`);
