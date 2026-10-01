-- Chạy file này 1 lần trong Supabase: Dashboard → SQL Editor → New query → dán vào → Run.

-- 1. Bảng sáo
create table if not exists public.flutes (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  name        text not null default '',
  maker       text not null default '',
  length      text not null default '',                 -- "1.8"
  collection  text not null default 'jiari' check (collection in ('edo', 'jinashi', 'jiari')),
  price       numeric,
  status      text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  images      jsonb not null default '[]'::jsonb,       -- ["https://...jpg", ...], ảnh đầu là ảnh bìa
  youtube     text not null default '',
  description text not null default '',
  sample      boolean not null default false,          -- sản phẩm mẫu để trang trí
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Cài đặt trang: ảnh và video trang chủ, danh mục, đánh giá, liên hệ (mỗi mục một dòng key/value)
create table if not exists public.site_settings (
  key        text primary key check (key in ('hero', 'listen', 'collections', 'reviewSummary', 'reviews', 'contact')),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists flutes_touch on public.flutes;
create trigger flutes_touch before update on public.flutes
  for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.site_settings;
create trigger settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- 3. Phân quyền: ai cũng xem được, chỉ tài khoản đã đăng nhập mới được sửa.
--    QUAN TRỌNG: tắt đăng ký tự do (Authentication → Sign In / Providers → tắt "Allow new users to sign up")
--    để chỉ tài khoản bạn tự tạo mới đăng nhập được.
alter table public.flutes enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "flutes_public_read" on public.flutes;
create policy "flutes_public_read" on public.flutes for select using (true);
drop policy if exists "flutes_admin_write" on public.flutes;
create policy "flutes_admin_write" on public.flutes for all to authenticated using (true) with check (true);

drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select using (true);
drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings for all to authenticated using (true) with check (true);

-- 4. Kho ảnh công khai
insert into storage.buckets (id, name, public)
values ('flute-images', 'flute-images', true)
on conflict (id) do nothing;

drop policy if exists "flute_images_admin_insert" on storage.objects;
create policy "flute_images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'flute-images');
drop policy if exists "flute_images_admin_update" on storage.objects;
create policy "flute_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'flute-images');
drop policy if exists "flute_images_admin_delete" on storage.objects;
create policy "flute_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'flute-images');
