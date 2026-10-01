// Lớp dữ liệu dùng chung cho website và trang quản trị.
//
// Nội dung (sáo + cài đặt trang) nằm trong file content.json của chính repo GitHub.
// - Website đọc content.json như một file tĩnh.
// - Trang quản trị đăng nhập bằng tên + mật khẩu; mật khẩu mở khoá một GitHub token
//   (đã mã hoá sẵn trong config.js), rồi ghi content.json và ảnh vào repo qua GitHub API.
//   GitHub Pages tự đăng lại web sau khoảng 1 phút.
// Khi config.js chưa có thông tin đăng nhập => chế độ demo (lưu tạm trong trình duyệt).
const Store = (() => {
  const cfg = window.SITE_CONFIG || {};
  const gh = cfg.github || {};
  const login = cfg.login || {};
  const live = Boolean(gh.owner && gh.repo && login.data);
  const BRANCH = gh.branch || "main";
  const CONTENT = "content.json";
  const TOKEN_KEY = "shaku.admin.token";
  const DEMO_FLUTES = "shaku.demo.flutes";
  const DEMO_SETTINGS = "shaku.demo.settings";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const bySort = (a, b) => (a.sort ?? 9999) - (b.sort ?? 9999);

  // ---------- Bộ nhớ demo ----------
  function demoRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return clone(fallback);
  }
  function demoWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw new Error("Bộ nhớ trình duyệt đã đầy (chế độ demo chỉ chứa được ít ảnh). Hãy xoá bớt ảnh.");
    }
  }

  // ---------- Base64 cho chữ UTF-8 và ảnh ----------
  const toB64 = (bytes) => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const fromB64 = (b64) => Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0));
  const encodeText = (str) => toB64(new TextEncoder().encode(str));
  const decodeText = (b64) => new TextDecoder().decode(fromB64(b64));

  // ---------- GitHub API ----------
  function token() {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  async function api(path, opts = {}, tok = token()) {
    const res = await fetch(`https://api.github.com/repos/${gh.owner}/${gh.repo}/${path}`, {
      ...opts,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tok}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (res.status === 401) {
      try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
      throw new Error("Phiên đăng nhập không còn hiệu lực (token hết hạn hoặc bị thu hồi). Hãy liên hệ người làm web.");
    }
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.json()).message; } catch (e) {}
      const err = new Error(`Không lưu được lên GitHub (${res.status}${msg ? ": " + msg : ""}).`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  // Bản content.json mới nhất kèm sha (cần sha để ghi đè).
  let doc = null;
  let sha = null;
  async function loadDoc() {
    try {
      const f = await api(`contents/${CONTENT}?ref=${BRANCH}&t=${Date.now()}`);
      sha = f.sha;
      doc = JSON.parse(decodeText(f.content));
    } catch (e) {
      if (e.status !== 404) throw e;
      sha = null;
      doc = {};
    }
    doc.flutes = doc.flutes || clone(SEED_FLUTES);
    doc.settings = doc.settings || {};
    return doc;
  }
  // Mỗi lần lưu: lấy bản mới nhất, sửa, ghi lại thành một commit.
  async function commitDoc(mutate, message) {
    await loadDoc();
    mutate(doc);
    const body = { message, content: encodeText(JSON.stringify(doc, null, 2) + "\n"), branch: BRANCH };
    if (sha) body.sha = sha;
    const r = await api(`contents/${CONTENT}`, { method: "PUT", body: JSON.stringify(body) });
    sha = r.content.sha;
  }

  // Website (và trang quản trị trước khi đăng nhập) đọc content.json như file tĩnh.
  async function readPublic() {
    try {
      const r = await fetch(`${CONTENT}?t=${Date.now()}`, { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch (e) {}
    return {};
  }
  async function readDoc() {
    if (live && token()) return doc || loadDoc();
    return readPublic();
  }

  // ---------- Sáo ----------
  async function listFlutes() {
    if (!live) return demoRead(DEMO_FLUTES, SEED_FLUTES).sort(bySort);
    const d = await readDoc();
    return clone(d.flutes || SEED_FLUTES).sort(bySort);
  }

  async function saveFlute(flute) {
    if (!live) {
      const all = demoRead(DEMO_FLUTES, SEED_FLUTES);
      const i = all.findIndex((f) => f.id === flute.id);
      if (i >= 0) all[i] = flute;
      else all.push(flute);
      return demoWrite(DEMO_FLUTES, all);
    }
    await commitDoc((d) => {
      const i = d.flutes.findIndex((f) => f.id === flute.id);
      if (i >= 0) d.flutes[i] = flute;
      else d.flutes.push(flute);
    }, `Lưu sáo: ${flute.name}`);
  }

  async function removeFlute(id) {
    if (!live) return demoWrite(DEMO_FLUTES, demoRead(DEMO_FLUTES, SEED_FLUTES).filter((f) => f.id !== id));
    await commitDoc((d) => { d.flutes = d.flutes.filter((f) => f.id !== id); }, `Xoá sáo: ${id}`);
  }

  // Lưu thứ tự hiển thị theo mảng id
  async function reorderFlutes(ids) {
    const apply = (list) => list.forEach((f) => (f.sort = ids.indexOf(f.id) + 1));
    if (!live) {
      const all = demoRead(DEMO_FLUTES, SEED_FLUTES);
      apply(all);
      return demoWrite(DEMO_FLUTES, all);
    }
    await commitDoc((d) => apply(d.flutes), "Sắp xếp lại sáo");
  }

  // ---------- Cài đặt trang (ảnh trang chủ, danh mục, đánh giá, liên hệ) ----------
  // Mục nào chưa lưu thì dùng giá trị mặc định trong data.js.
  async function settings() {
    const saved = live ? (await readDoc()).settings || {} : demoRead(DEMO_SETTINGS, {});
    const merged = { ...clone(DEFAULTS), ...clone(saved) };
    // Danh mục mới thêm vào data.js vẫn hiện dù danh sách đã lưu từ trước.
    if (saved.collections) {
      const have = new Set(saved.collections.map((c) => c.id));
      merged.collections = [...merged.collections, ...clone(DEFAULTS.collections).filter((c) => !have.has(c.id))];
    }
    return merged;
  }

  async function saveSetting(key, value) {
    if (!live) {
      const all = demoRead(DEMO_SETTINGS, {});
      all[key] = value;
      return demoWrite(DEMO_SETTINGS, all);
    }
    await commitDoc((d) => { d.settings[key] = value; }, `Cập nhật trang: ${key}`);
  }

  // ---------- Ảnh ----------
  // Ảnh vừa tải lên chỉ có trên web sau khi GitHub Pages đăng lại (~1 phút),
  // nên trang quản trị xem trước bằng bản trong máy.
  const previews = new Map();
  const preview = (url) => previews.get(url) || url;

  async function resize(file, maxSide) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function upload(file) {
    if (!file.type.startsWith("image/")) throw new Error(`"${file.name}" không phải file ảnh`);
    if (!live) {
      const canvas = await resize(file, 1200);
      return canvas.toDataURL("image/jpeg", 0.7);
    }
    const canvas = await resize(file, 1800);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    const path = `uploads/${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const content = toB64(new Uint8Array(await blob.arrayBuffer()));
    await api(`contents/${path}`, { method: "PUT", body: JSON.stringify({ message: `Tải ảnh ${file.name}`, content, branch: BRANCH }) });
    previews.set(path, URL.createObjectURL(blob));
    return path;
  }

  // ---------- Đăng nhập ----------
  // Tên + mật khẩu tạo ra khoá giải mã GitHub token đã mã hoá trong config.js.
  async function unlock(user, password) {
    const enc = new TextEncoder();
    const material = await crypto.subtle.importKey("raw", enc.encode(`${user.trim().toLowerCase()}\n${password}`), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: fromB64(login.salt), iterations: login.iterations || 310000, hash: "SHA-256" },
      material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(login.iv) }, key, fromB64(login.data));
    return new TextDecoder().decode(plain);
  }

  async function session() {
    if (!live) return { demo: true };
    return token() ? { user: true } : null;
  }

  async function signIn(user, password) {
    let tok;
    try {
      tok = await unlock(user, password);
    } catch (e) {
      throw new Error("Sai tên đăng nhập hoặc mật khẩu.");
    }
    const repo = await api("", {}, tok);
    if (!repo.permissions || !repo.permissions.push) throw new Error("Tài khoản này chưa có quyền ghi. Hãy liên hệ người làm web.");
    try { sessionStorage.setItem(TOKEN_KEY, tok); } catch (e) {}
    doc = null;
  }

  async function signOut() {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    doc = null;
    sha = null;
  }

  function resetDemo() {
    try {
      localStorage.removeItem(DEMO_FLUTES);
      localStorage.removeItem(DEMO_SETTINGS);
    } catch (e) {}
  }

  return {
    live, listFlutes, saveFlute, removeFlute, reorderFlutes,
    settings, saveSetting, upload, preview, session, signIn, signOut, resetDemo,
  };
})();
