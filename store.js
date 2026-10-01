// Lớp dữ liệu dùng chung cho website và trang quản trị.
// Có cấu hình Supabase => đọc/ghi database thật. Không có => chế độ demo (localStorage).
const Store = (() => {
  const cfg = window.SITE_CONFIG || {};
  const live = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const FLUTES = "flutes";
  const SETTINGS = "site_settings";
  const BUCKET = "flute-images";
  const DEMO_FLUTES = "shaku.demo.flutes";
  const DEMO_SETTINGS = "shaku.demo.settings";
  const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  const clone = (x) => JSON.parse(JSON.stringify(x));

  let clientPromise = null;
  function client() {
    if (!clientPromise) {
      clientPromise = new Promise((resolve, reject) => {
        if (window.supabase) return resolve(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey));
        const s = document.createElement("script");
        s.src = SDK_URL;
        s.onload = () => resolve(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey));
        s.onerror = () => reject(new Error("Không tải được thư viện Supabase"));
        document.head.appendChild(s);
      });
    }
    return clientPromise;
  }

  const bySort = (a, b) => (a.sort ?? 9999) - (b.sort ?? 9999);

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
      throw new Error("Bộ nhớ trình duyệt đã đầy (chế độ demo chỉ chứa được ít ảnh). Hãy xoá bớt ảnh hoặc kết nối Supabase.");
    }
  }

  // ---------- Sáo ----------
  async function listFlutes() {
    if (!live) return demoRead(DEMO_FLUTES, SEED_FLUTES).sort(bySort);
    const sb = await client();
    const { data, error } = await sb.from(FLUTES).select("*").order("sort", { ascending: true });
    if (error) throw error;
    return data;
  }

  async function saveFlute(flute) {
    if (!live) {
      const all = demoRead(DEMO_FLUTES, SEED_FLUTES);
      const i = all.findIndex((f) => f.id === flute.id);
      if (i >= 0) all[i] = flute;
      else all.push(flute);
      return demoWrite(DEMO_FLUTES, all);
    }
    const sb = await client();
    const { error } = await sb.from(FLUTES).upsert(flute);
    if (error) throw error;
  }

  async function removeFlute(id) {
    if (!live) return demoWrite(DEMO_FLUTES, demoRead(DEMO_FLUTES, SEED_FLUTES).filter((f) => f.id !== id));
    const sb = await client();
    const { error } = await sb.from(FLUTES).delete().eq("id", id);
    if (error) throw error;
  }

  // Lưu thứ tự hiển thị theo mảng id
  async function reorderFlutes(ids) {
    if (!live) {
      const all = demoRead(DEMO_FLUTES, SEED_FLUTES);
      all.forEach((f) => (f.sort = ids.indexOf(f.id) + 1));
      return demoWrite(DEMO_FLUTES, all);
    }
    const sb = await client();
    for (let i = 0; i < ids.length; i++) {
      const { error } = await sb.from(FLUTES).update({ sort: i + 1 }).eq("id", ids[i]);
      if (error) throw error;
    }
  }

  // ---------- Cài đặt trang (ảnh trang chủ, danh mục, đánh giá, liên hệ) ----------
  // Mỗi mục là một dòng key/value; mục nào chưa lưu thì dùng giá trị mặc định trong data.js.
  async function settings() {
    let saved = {};
    if (!live) saved = demoRead(DEMO_SETTINGS, {});
    else {
      const sb = await client();
      const { data, error } = await sb.from(SETTINGS).select("key,value");
      if (error) throw error;
      data.forEach((row) => (saved[row.key] = row.value));
    }
    return { ...clone(DEFAULTS), ...saved };
  }

  async function saveSetting(key, value) {
    if (!live) {
      const all = demoRead(DEMO_SETTINGS, {});
      all[key] = value;
      return demoWrite(DEMO_SETTINGS, all);
    }
    const sb = await client();
    const { error } = await sb.from(SETTINGS).upsert({ key, value });
    if (error) throw error;
  }

  // ---------- Ảnh ----------
  // Thu nhỏ ảnh trước khi tải lên để web nhẹ
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
    const canvas = await resize(file, 2200);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const sb = await client();
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // ---------- Đăng nhập ----------
  async function session() {
    if (!live) return { demo: true };
    const sb = await client();
    const { data } = await sb.auth.getSession();
    return data.session;
  }
  async function signIn(email, password) {
    const sb = await client();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }
  async function signOut() {
    if (!live) return;
    const sb = await client();
    await sb.auth.signOut();
  }
  function resetDemo() {
    try {
      localStorage.removeItem(DEMO_FLUTES);
      localStorage.removeItem(DEMO_SETTINGS);
    } catch (e) {}
  }

  return {
    live, listFlutes, saveFlute, removeFlute, reorderFlutes,
    settings, saveSetting, upload, session, signIn, signOut, resetDemo,
  };
})();
