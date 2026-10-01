(() => {
  const app = document.getElementById("app");
  const tabsEl = document.getElementById("tabs");
  const state = { tab: "flutes", flutes: [], settings: null, filter: "", editing: null, dirty: false };

  const COLLECTION_NAMES = { edo: "Edo Shakuhachi", jinashi: "Jinashi Shakuhachi", jiari: "Jiari Shakuhachi", wood: "Wood and Yuu Shakuhachi", bamboo: "Bamboo for Shakuhachi making" };
  const STATUS_VI = { available: "Còn hàng", reserved: "Đang giữ", sold: "Đã bán" };
  const STATUS_NEXT = { available: "reserved", reserved: "sold", sold: "available" };
  const FOCUS = [["50% 50%", "Giữa"], ["50% 20%", "Phía trên"], ["50% 80%", "Phía dưới"]];

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeImg = (u) => {
    const src = Store.preview(u || "");
    return /^(https:\/\/|assets\/|uploads\/|blob:|data:image\/(jpeg|png|webp);)/.test(src) ? esc(src) : "";
  };
  const SAVED = Store.live ? "Đã lưu. Web sẽ cập nhật sau khoảng 1 phút." : "Đã lưu";
  const slugify = (s) =>
    String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  const ytId = (v) => {
    const m = String(v || "").match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([\w-]{11})/);
    return m ? m[1] : /^[\w-]{11}$/.test(v || "") ? v : "";
  };
  const normLength = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n.toFixed(1) : "";
  };

  function toast(msg, isError) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = `toast show${isError ? " error" : ""}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (el.className = "toast"), isError ? 6000 : 2500);
  }
  const fail = (err) => { console.error(err); toast(err.message || String(err), true); };

  function confirmLeave() {
    return !state.dirty || confirm("Có thay đổi chưa lưu. Bỏ qua và chuyển trang?");
  }
  window.addEventListener("beforeunload", (e) => { if (state.dirty) e.preventDefault(); });
  app.addEventListener("input", () => (state.dirty = true));

  // Image upload helper: wires a dropzone, calls onAdd(url) for each uploaded image.
  function wireDropzone(dz, onAdd, multiple = true) {
    const input = dz.querySelector("input");
    const add = async (files) => {
      const list = [...files].slice(0, multiple ? 50 : 1);
      if (!list.length) return;
      dz.classList.add("busy");
      let n = 0;
      for (const f of list) {
        dz.dataset.progress = `Đang tải ảnh ${++n}/${list.length}…`;
        try { onAdd(await Store.upload(f)); state.dirty = true; } catch (err) { fail(err); }
      }
      dz.classList.remove("busy");
    };
    input.addEventListener("change", () => { add(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
    dz.addEventListener("drop", (e) => add(e.dataTransfer.files));
  }
  const dropzone = (id, label, multiple = true) =>
    `<label class="dropzone" id="${id}"><input type="file" accept="image/*" ${multiple ? "multiple" : ""}><strong>Kéo thả ảnh vào đây</strong> hoặc bấm để chọn${multiple ? " (chọn được nhiều ảnh)" : ""}${label ? `<br><small>${label}</small>` : ""}</label>`;

  // Sortable image grid used by flutes and hero photos.
  function renderImageGrid(box, items, { getSrc, extra, coverLabel, onChange }) {
    box.innerHTML = items.map((it, i) => `
      <figure class="img-item" data-i="${i}">
        ${safeImg(getSrc(it)) ? `<img src="${safeImg(getSrc(it))}" alt="">` : ""}
        ${i === 0 && coverLabel ? `<span class="cover-tag">${coverLabel}</span>` : ""}
        <figcaption>
          <button type="button" data-img="left" ${i === 0 ? "disabled" : ""} aria-label="Sang trái">←</button>
          ${extra ? extra(it, i) : ""}
          <button type="button" data-img="right" ${i === items.length - 1 ? "disabled" : ""} aria-label="Sang phải">→</button>
          <button type="button" data-img="remove" class="del" aria-label="Xoá ảnh">✕</button>
        </figcaption>
      </figure>`).join("");
    box.onclick = (e) => {
      const b = e.target.closest("[data-img]");
      if (!b) return;
      const i = Number(b.closest(".img-item").dataset.i);
      const swap = (x, y) => ([items[x], items[y]] = [items[y], items[x]]);
      if (b.dataset.img === "left") swap(i, i - 1);
      if (b.dataset.img === "right") swap(i, i + 1);
      if (b.dataset.img === "remove") items.splice(i, 1);
      state.dirty = true;
      onChange();
    };
  }

  // ---------- Đăng nhập ----------
  function renderLogin() {
    tabsEl.hidden = true;
    app.innerHTML = `
      <form class="login" id="loginForm">
        <h1>Đăng nhập</h1>
        <p class="muted">Dùng tên đăng nhập và mật khẩu quản trị đã được cấp.</p>
        <label>Tên đăng nhập<input name="user" required autocomplete="username" autocapitalize="off" spellcheck="false"></label>
        <label>Mật khẩu<input type="password" name="password" required autocomplete="current-password"></label>
        <button class="btn primary" type="submit">Đăng nhập</button>
      </form>`;
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const btn = e.target.querySelector("button");
      btn.disabled = true;
      try {
        await Store.signIn(f.get("user"), f.get("password"));
        await boot();
      } catch (err) {
        fail(err);
      } finally {
        btn.disabled = false;
      }
    });
  }

  // ---------- Tabs ----------
  function showTab(tab) {
    if (!confirmLeave()) return;
    state.dirty = false;
    state.tab = tab;
    tabsEl.querySelectorAll("button").forEach((b) => b.toggleAttribute("aria-current", b.dataset.tab === tab));
    ({ flutes: renderFluteList, hero: renderHero, collections: renderCollections, reviews: renderReviews, contact: renderContact })[tab]();
    window.scrollTo(0, 0);
  }
  tabsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) showTab(b.dataset.tab);
  });

  // ---------- Sáo: danh sách ----------
  async function loadFlutes() {
    state.flutes = await Store.listFlutes();
    renderFluteList();
  }

  function renderFluteList() {
    const shown = state.flutes.filter((f) => !state.filter || f.collection === state.filter);
    const rows = shown.map((f) => {
      const cover = safeImg((f.images || [])[0]);
      const i = state.flutes.indexOf(f);
      return `<li class="row" data-id="${esc(f.id)}">
        <div class="thumb">${cover ? `<img src="${cover}" alt="">` : ""}</div>
        <div class="row-main">
          <strong>${esc(f.name || "(chưa có tên)")}${f.sample ? ` <span class="muted">(mẫu – xoá khi có sáo thật)</span>` : ""}</strong>
          <span class="muted">${esc([COLLECTION_NAMES[f.collection], f.length && `${f.length} shaku`, f.price && `$${f.price}`, `${(f.images || []).length} ảnh`, ytId(f.youtube) && "có video"].filter(Boolean).join(" · "))}</span>
        </div>
        <button type="button" class="status ${esc(f.status)}" data-act="status" title="Bấm để đổi trạng thái">${STATUS_VI[f.status] || f.status}</button>
        <div class="row-actions">
          <button type="button" class="icon" data-act="up" ${i === 0 ? "disabled" : ""} aria-label="Lên">↑</button>
          <button type="button" class="icon" data-act="down" ${i === state.flutes.length - 1 ? "disabled" : ""} aria-label="Xuống">↓</button>
          <button type="button" class="btn" data-act="edit">Sửa</button>
          <button type="button" class="btn danger-ghost" data-act="delete">Xoá</button>
        </div>
      </li>`;
    }).join("");
    const chips = [["", "Tất cả"], ...Object.entries(COLLECTION_NAMES)].map(([id, name]) =>
      `<button type="button" class="chip" data-filter="${id}" aria-pressed="${state.filter === id}">${name} (${id ? state.flutes.filter((f) => f.collection === id).length : state.flutes.length})</button>`).join("");

    app.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Sáo</h1>
          <p class="muted">Thứ tự ở đây là thứ tự hiển thị trên website. Bấm vào nhãn trạng thái để đổi nhanh Còn hàng → Đang giữ → Đã bán.</p>
        </div>
        <button type="button" class="btn primary" id="addBtn">+ Thêm sáo</button>
      </div>
      <div class="filter-row">${chips}</div>
      ${shown.length ? `<ul class="list" id="list">${rows}</ul>` : `<div class="empty">Chưa có sáo nào trong mục này. Bấm “Thêm sáo” để đăng.
        ${Store.live && !state.flutes.length ? `<p style="margin-top:12px"><button type="button" class="btn" id="seedBtn">Nhập ${SEED_FLUTES.length} sáo đang có trên web cũ</button></p>` : ""}</div>`}`;

    const seedBtn = document.getElementById("seedBtn");
    if (seedBtn) seedBtn.onclick = async () => {
      seedBtn.disabled = true;
      try {
        for (const f of SEED_FLUTES) await Store.saveFlute(f);
        toast("Đã nhập");
        await loadFlutes();
      } catch (err) { fail(err); seedBtn.disabled = false; }
    };

    document.getElementById("addBtn").onclick = () => openFluteEditor(null);
    app.querySelector(".filter-row").onclick = (e) => {
      const c = e.target.closest("[data-filter]");
      if (!c) return;
      state.filter = c.dataset.filter;
      renderFluteList();
    };
    const list = document.getElementById("list");
    if (!list) return;
    list.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const id = btn.closest(".row").dataset.id;
      const idx = state.flutes.findIndex((f) => f.id === id);
      const f = state.flutes[idx];
      try {
        if (btn.dataset.act === "edit") return openFluteEditor(f);
        if (btn.dataset.act === "status") {
          const status = STATUS_NEXT[f.status] || "available";
          await Store.saveFlute({ ...f, status });
          f.status = status;
          toast(`“${f.name}”: ${STATUS_VI[status]}`);
          return renderFluteList();
        }
        if (btn.dataset.act === "delete") {
          if (!confirm(`Xoá “${f.name}”? Không thể hoàn tác.\n\nNếu sáo đã bán, nên đổi trạng thái thành “Đã bán” thay vì xoá.`)) return;
          await Store.removeFlute(id);
          toast(Store.live ? "Đã xoá. Web sẽ cập nhật sau khoảng 1 phút." : "Đã xoá");
          return loadFlutes();
        }
        const to = btn.dataset.act === "up" ? idx - 1 : idx + 1;
        const ids = state.flutes.map((x) => x.id);
        [ids[idx], ids[to]] = [ids[to], ids[idx]];
        await Store.reorderFlutes(ids);
        await loadFlutes();
      } catch (err) { fail(err); }
    });
  }

  // ---------- Sáo: thêm / sửa ----------
  function openFluteEditor(f) {
    const isNew = !f;
    const d = f ? JSON.parse(JSON.stringify(f))
      : { id: "", name: "", maker: "", length: "1.8", collection: state.filter || "jiari", price: "", status: "available", images: [], youtube: "", description: "" };
    state.editing = { isNew, data: d };
    state.dirty = false;

    app.innerHTML = `
      <form class="editor" id="editor" novalidate>
        <div class="page-head sticky">
          <div>
            <button type="button" class="back" id="backBtn">← Danh sách sáo</button>
            <h1>${isNew ? "Thêm sáo" : esc(d.name || "Sửa sáo")}</h1>
          </div>
          <div class="head-actions">
            ${!isNew ? `<a class="btn" href="flute.html?id=${encodeURIComponent(d.id)}" target="_blank" rel="noopener">Xem trên web ↗</a>` : ""}
            <button type="submit" class="btn primary" id="saveBtn">Lưu</button>
          </div>
        </div>

        <section class="panel">
          <h2>Hình ảnh</h2>
          <p class="muted">Đăng được nhiều ảnh, nên 5–10 ảnh: toàn thân sáo, đầu thổi (utaguchi), các lỗ bấm, phần gốc, chữ khắc, chỗ đã sửa. Ảnh đầu tiên là ảnh bìa; dùng mũi tên để đổi thứ tự. Ảnh được tự thu nhỏ khi tải lên.</p>
          <div class="images" id="images"></div>
          ${dropzone("dropzone")}
        </section>

        <section class="panel">
          <h2>Thông tin sáo</h2>
          <p class="muted">Website hiển thị tiếng Anh, nên tên và mô tả nên viết bằng tiếng Anh.</p>
          <label>Tên sáo *<input name="name" value="${esc(d.name)}" placeholder="VD: 1.8 Kinko Shakuhachi by Miura Ryuho" required></label>
          <div class="grid">
            <label>Danh mục
              <select name="collection">${Object.entries(COLLECTION_NAMES).map(([id, n]) => `<option value="${id}" ${d.collection === id ? "selected" : ""}>${n}</option>`).join("")}</select>
            </label>
            <label>Độ dài (shaku) *
              <input name="shaku" inputmode="decimal" value="${esc(d.length)}" placeholder="VD: 1.8">
              <small class="muted">Sáo Jiari tự vào đúng mục độ dài trên web.</small>
            </label>
            <label>Thợ làm<input name="maker" value="${esc(d.maker)}" placeholder="VD: Seien"></label>
            <label>Giá (USD)<input name="price" type="number" min="0" step="1" value="${esc(d.price)}" placeholder="VD: 350"></label>
            <label>Trạng thái
              <select name="status">${Object.entries(STATUS_VI).map(([k, v]) => `<option value="${k}" ${d.status === k ? "selected" : ""}>${v}</option>`).join("")}</select>
            </label>
          </div>
        </section>

        <section class="panel">
          <h2>Video YouTube</h2>
          <label>Link video<input name="youtube" value="${esc(d.youtube)}" placeholder="https://www.youtube.com/watch?v=… hoặc https://youtu.be/…"></label>
          <div class="yt-preview" id="ytPreview"></div>
        </section>

        <section class="panel">
          <h2>Mô tả</h2>
          <label>Mỗi đoạn xuống một dòng
            <textarea name="description" rows="7" placeholder="Tình trạng, âm thanh, đã sửa gì, giá đã gồm ship chưa…">${esc(d.description)}</textarea>
          </label>
        </section>
      </form>`;

    const form = document.getElementById("editor");
    const drawImages = () => renderImageGrid(document.getElementById("images"), d.images,
      { getSrc: (u) => u, coverLabel: "Ảnh bìa", onChange: drawImages });
    drawImages();
    wireDropzone(document.getElementById("dropzone"), (url) => { d.images.push(url); drawImages(); });

    const preview = () => {
      const id = ytId(form.elements.youtube.value.trim());
      document.getElementById("ytPreview").innerHTML = id
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Xem trước video" allowfullscreen></iframe>`
        : form.elements.youtube.value.trim() ? "Link chưa đúng, hãy dán link YouTube của video" : "Chưa có video";
    };
    form.elements.youtube.addEventListener("change", preview);
    form.elements.youtube.addEventListener("paste", () => setTimeout(preview));
    preview();

    document.getElementById("backBtn").onclick = () => {
      if (!confirmLeave()) return;
      state.dirty = false;
      renderFluteList();
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); saveFlute(form); });
    window.scrollTo(0, 0);
  }

  async function saveFlute(form) {
    const { isNew, data } = state.editing;
    const v = (n) => form.elements[n].value.trim();
    const flute = {
      ...data,
      name: v("name"),
      maker: v("maker"),
      collection: v("collection"),
      length: normLength(v("shaku")),
      price: v("price") ? Number(v("price")) : null,
      status: v("status"),
      youtube: v("youtube"),
      description: form.elements.description.value.trim(),
      images: data.images,
    };
    if (!flute.name) return toast("Vui lòng nhập tên sáo.", true), form.elements.name.focus();
    if (!flute.length) return toast("Vui lòng nhập độ dài, ví dụ 1.8", true), form.elements.shaku.focus();
    if (flute.youtube && !ytId(flute.youtube)) return toast("Link YouTube chưa đúng.", true), form.elements.youtube.focus();
    if (isNew) {
      const base = slugify(flute.name) || "flute";
      let id = base, n = 2;
      while (state.flutes.some((x) => x.id === id)) id = `${base}-${n++}`;
      flute.id = id;
      flute.sort = 0; // new flutes go to the top
    }

    const btn = document.getElementById("saveBtn");
    btn.disabled = true;
    btn.textContent = "Đang lưu…";
    try {
      await Store.saveFlute(flute);
      if (isNew) await Store.reorderFlutes([flute.id, ...state.flutes.map((x) => x.id)]);
      state.dirty = false;
      toast(SAVED);
      await loadFlutes();
    } catch (err) {
      fail(err);
      btn.disabled = false;
      btn.textContent = "Lưu";
    }
  }

  // ---------- Cài đặt: lưu chung ----------
  async function saveSetting(key, value, btn) {
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Đang lưu…";
    try {
      await Store.saveSetting(key, value);
      state.settings[key] = value;
      state.dirty = false;
      toast(SAVED);
    } catch (err) { fail(err); }
    btn.disabled = false;
    btn.textContent = label;
  }
  const saveBar = (id) => `<div class="save-bar"><a class="btn" href="index.html" target="_blank" rel="noopener">Xem trang chủ ↗</a><button type="button" class="btn primary" id="${id}">Lưu thay đổi</button></div>`;

  // ---------- Ảnh trang chủ ----------
  function renderHero() {
    const hero = JSON.parse(JSON.stringify(state.settings.hero || []));
    app.innerHTML = `
      <div class="page-head"><div>
        <h1>Ảnh trang chủ</h1>
        <p class="muted">Ảnh lớn toàn màn hình khi khách vừa vào web. Có nhiều ảnh thì sẽ tự chuyển qua lại. Nên dùng ảnh ngang, đẹp, rõ nét; chữ 尺八 sẽ hiện đè ở giữa ảnh.</p>
      </div></div>
      <section class="panel">
        <div class="images" id="heroImages"></div>
        ${dropzone("heroDrop", "“Vùng giữ” chọn phần ảnh luôn được nhìn thấy khi màn hình bị cắt (điện thoại).")}
      </section>
      ${saveBar("saveHero")}`;
    const draw = () => renderImageGrid(document.getElementById("heroImages"), hero, {
      getSrc: (h) => h.src,
      coverLabel: "Ảnh đầu",
      extra: (h, i) => `<select data-focus="${i}" aria-label="Vùng giữ">${FOCUS.map(([v, l]) => `<option value="${v}" ${h.focus === v ? "selected" : ""}>${l}</option>`).join("")}</select>`,
      onChange: draw,
    });
    draw();
    document.getElementById("heroImages").addEventListener("change", (e) => {
      const s = e.target.closest("[data-focus]");
      if (s) hero[Number(s.dataset.focus)].focus = s.value;
    });
    wireDropzone(document.getElementById("heroDrop"), (src) => { hero.push({ src, focus: "50% 50%" }); draw(); });
    document.getElementById("saveHero").onclick = (e) => {
      if (!hero.length) return toast("Cần ít nhất 1 ảnh.", true);
      saveSetting("hero", hero, e.target);
    };
  }

  // ---------- Danh mục ----------
  function renderCollections() {
    const cols = JSON.parse(JSON.stringify(state.settings.collections));
    app.innerHTML = `
      <div class="page-head"><div>
        <h1>Danh mục</h1>
        <p class="muted">Các mục lớn trên trang chủ. Có thể đổi chữ và ảnh đại diện; tên mục nên giữ bằng tiếng Anh.</p>
      </div></div>
      ${cols.map((c, i) => `
        <section class="panel coll" data-i="${i}">
          <div class="coll-img">
            <div class="pic">${safeImg(c.image) ? `<img src="${safeImg(c.image)}" alt="">` : "Chưa có ảnh"}</div>
            ${dropzone(`collDrop${i}`, "", false)}
            ${c.image ? `<button type="button" class="btn danger-ghost" data-remove-img="${i}">Bỏ ảnh</button>` : ""}
          </div>
          <div class="grid" style="grid-template-columns:1fr">
            <label>Dòng nhỏ phía trên<input data-k="kicker" value="${esc(c.kicker)}"></label>
            <label>Tên mục<input data-k="title" value="${esc(c.title)}"></label>
            <label>Mô tả<textarea data-k="text" rows="3">${esc(c.text)}</textarea></label>
            <label>Chữ trên nút<input data-k="cta" value="${esc(c.cta)}"></label>
          </div>
        </section>`).join("")}
      ${saveBar("saveCols")}`;

    app.querySelectorAll(".coll").forEach((sec) => {
      const i = Number(sec.dataset.i);
      wireDropzone(sec.querySelector(".dropzone"), (url) => {
        cols[i].image = url;
        sec.querySelector(".pic").innerHTML = `<img src="${safeImg(url)}" alt="">`;
      }, false);
    });
    app.querySelectorAll("[data-remove-img]").forEach((b) => (b.onclick = () => {
      cols[Number(b.dataset.removeImg)].image = "";
      b.closest(".coll").querySelector(".pic").textContent = "Chưa có ảnh";
      b.remove();
      state.dirty = true;
    }));
    document.getElementById("saveCols").onclick = (e) => {
      app.querySelectorAll(".coll").forEach((sec) => {
        const c = cols[Number(sec.dataset.i)];
        sec.querySelectorAll("[data-k]").forEach((inp) => (c[inp.dataset.k] = inp.value.trim()));
      });
      if (cols.some((c) => !c.title)) return toast("Tên mục không được để trống.", true);
      saveSetting("collections", cols, e.target);
    };
  }

  // ---------- Đánh giá ----------
  function renderReviews() {
    const sum = { ...(state.settings.reviewSummary || {}) };
    const reviews = JSON.parse(JSON.stringify(state.settings.reviews || []));
    const contact = state.settings.contact || {};
    app.innerHTML = `
      <div class="page-head"><div>
        <h1>Đánh giá</h1>
        <p class="muted">Hiện ở cuối trang chủ, kèm nút dẫn sang <a href="${esc(contact.reviews)}" target="_blank" rel="noopener">trang đánh giá trên Facebook</a>. Facebook không tự gửi đánh giá sang web: khi page có đánh giá mới, bấm “Thêm đánh giá mới” và dán vào; trên web mỗi đánh giá là một thẻ nằm ngang xếp từ trên xuống, đánh giá dài có nút “Read more”.</p>
      </div></div>
      <section class="panel">
        <h2>Tổng quan (lấy từ tab Đánh giá trên Facebook)</h2>
        <div class="grid">
          <label>Tỉ lệ đề xuất<input id="recommend" value="${esc(sum.recommend)}" placeholder="VD: 100%"></label>
          <label>Số đánh giá<input id="count" type="number" min="0" value="${esc(sum.count)}" placeholder="VD: 14"></label>
        </div>
      </section>
      <section class="panel">
        <h2>Đánh giá hiển thị trên web</h2>
        <div><button type="button" class="btn" id="addReview">+ Thêm đánh giá mới (hiện trên cùng)</button></div>
        <div id="reviewList" style="display:grid;gap:14px"></div>
      </section>
      ${saveBar("saveReviews")}`;

    const list = document.getElementById("reviewList");
    const collect = () => list.querySelectorAll(".review-edit").forEach((row) => {
      const r = reviews[Number(row.dataset.i)];
      row.querySelectorAll("[data-k]").forEach((inp) => (r[inp.dataset.k] = inp.value.trim()));
    });
    const draw = () => {
      list.innerHTML = reviews.length ? reviews.map((r, i) => `
        <div class="review-edit" data-i="${i}">
          <input data-k="name" value="${esc(r.name)}" placeholder="Tên khách">
          <input data-k="date" value="${esc(r.date)}" placeholder="Thời gian, VD: December 2025">
          <textarea data-k="text" rows="3" placeholder="Nội dung đánh giá">${esc(r.text)}</textarea>
          <div class="row-actions">
            <button type="button" class="icon" data-r="up" ${i === 0 ? "disabled" : ""} aria-label="Lên">↑</button>
            <button type="button" class="icon" data-r="down" ${i === reviews.length - 1 ? "disabled" : ""} aria-label="Xuống">↓</button>
            <button type="button" class="icon" data-r="remove" aria-label="Xoá" style="color:var(--danger)">✕</button>
          </div>
        </div>`).join("") : `<p class="muted">Chưa có đánh giá nào. Web vẫn hiện tỉ lệ đề xuất và nút xem trên Facebook.</p>`;
    };
    draw();
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-r]");
      if (!b) return;
      collect();
      const i = Number(b.closest(".review-edit").dataset.i);
      if (b.dataset.r === "remove") reviews.splice(i, 1);
      else {
        const j = b.dataset.r === "up" ? i - 1 : i + 1;
        [reviews[i], reviews[j]] = [reviews[j], reviews[i]];
      }
      state.dirty = true;
      draw();
    });
    document.getElementById("addReview").onclick = () => {
      collect();
      reviews.unshift({ name: "", date: "", text: "" });
      draw();
      list.querySelector(".review-edit input").focus();
    };
    document.getElementById("saveReviews").onclick = async (e) => {
      collect();
      const btn = e.target;
      const summary = { recommend: document.getElementById("recommend").value.trim(), count: Number(document.getElementById("count").value) || 0 };
      await saveSetting("reviewSummary", summary, btn);
      await saveSetting("reviews", reviews.filter((r) => r.text), btn);
      renderReviews();
    };
  }

  // ---------- Liên hệ ----------
  function renderContact() {
    const c = state.settings.contact || {};
    app.innerHTML = `
      <div class="page-head"><div>
        <h1>Liên hệ</h1>
        <p class="muted">Khách mua bằng cách nhắn tin qua Facebook. Các nút “Message us” trên web dùng link Messenger bên dưới.</p>
      </div></div>
      <section class="panel">
        <label>Trang Facebook<input id="facebook" value="${esc(c.facebook)}" placeholder="https://www.facebook.com/…"></label>
        <label>Link Messenger
          <input id="messenger" value="${esc(c.messenger)}" placeholder="https://m.me/…">
          <small class="muted">Dạng https://m.me/tên-trang. Bấm thử: <a href="${esc(c.messenger)}" target="_blank" rel="noopener">mở Messenger ↗</a></small>
        </label>
        <label>Trang đánh giá trên Facebook<input id="reviewsUrl" value="${esc(c.reviews)}" placeholder="https://www.facebook.com/…/reviews"></label>
      </section>
      ${saveBar("saveContact")}`;
    document.getElementById("saveContact").onclick = (e) => {
      const value = {
        facebook: document.getElementById("facebook").value.trim(),
        messenger: document.getElementById("messenger").value.trim(),
        reviews: document.getElementById("reviewsUrl").value.trim(),
      };
      if (Object.values(value).some((u) => !/^https:\/\//.test(u))) return toast("Các link phải bắt đầu bằng https://", true);
      saveSetting("contact", value, e.target);
    };
  }

  // ---------- Khởi động ----------
  async function boot() {
    const badge = document.getElementById("modeBadge");
    badge.textContent = Store.live ? "Đang hoạt động" : "Chế độ demo";
    badge.classList.toggle("live", Store.live);
    document.getElementById("demoNote").hidden = Store.live;

    try {
      const session = await Store.session();
      if (!session) return renderLogin();
      document.getElementById("signOut").hidden = !Store.live;
      tabsEl.hidden = false;
      [state.settings, state.flutes] = await Promise.all([Store.settings(), Store.listFlutes()]);
      state.dirty = false;
      showTab(state.tab);
    } catch (err) {
      fail(err);
      app.innerHTML = `<div class="empty">Không kết nối được dữ liệu. Kiểm tra lại config.js.</div>`;
    }
  }

  document.getElementById("signOut").onclick = async () => {
    await Store.signOut();
    document.getElementById("signOut").hidden = true;
    renderLogin();
  };
  document.getElementById("resetDemo").onclick = async () => {
    if (!confirm("Xoá mọi thay đổi demo và quay về dữ liệu mẫu?")) return;
    Store.resetDemo();
    state.dirty = false;
    await boot();
    toast("Đã khôi phục dữ liệu mẫu");
  };

  boot();
})();
