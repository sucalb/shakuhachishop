-- Chạy SAU schema.sql, 1 lần: nạp các sản phẩm đang có trên web (cây Seien + 4 sản phẩm mẫu).
-- Sản phẩm mẫu (sample = true) xoá trong trang quản trị khi có sáo thật.
insert into public.flutes (id, name, maker, length, collection, price, status, images, youtube, description, sample, sort) values
  ($q$seien-19$q$, $q$1.9 Seien Shakuhachi$q$, $q$Seien$q$, $q$1.9$q$, $q$jiari$q$, 350, $q$available$q$, $q$["assets/seien.jpg"]$q$::jsonb, $q$$q$, $q$A 1.9 Seien shakuhachi for sale.
The utaguchi insert was missing when it came in, so it has been replaced with bull bone.
The sound is beautiful. Please watch the video for your reference.
Asking price is 350 USD plus shipping.$q$, false, 1),
  ($q$sample-edo-antique$q$, $q$Antique Edo Period Shakuhachi$q$, $q$Unknown$q$, $q$1.8$q$, $q$edo$q$, 1200, $q$available$q$, $q$["assets/edo-antique.jpg","assets/edo-antique-2.jpg","assets/edo-antique-3.jpg","assets/edo-antique-4.jpg"]$q$::jsonb, $q$https://www.youtube.com/watch?v=ksansOKZkDo$q$, $q$Sample listing. Replace with a real Shakuhachi from the shop.
An old Shakuhachi with a deep, warm patina and a metal band at the joint, shown on a display stand.
The video is a recording of the honkyoku Kyorei for reference.$q$, true, 2),
  ($q$sample-edo-komuso$q$, $q$Old Plain Shakuhachi$q$, $q$Unknown$q$, $q$1.8$q$, $q$edo$q$, 950, $q$sold$q$, $q$["assets/edo-met.jpg","assets/edo-met-2.jpg","assets/edo-met-3.jpg"]$q$::jsonb, $q$$q$, $q$Sample listing. Replace with a real Shakuhachi from the shop.
A plain old Shakuhachi with thread binding near the mouthpiece and a separate end cap.$q$, true, 3),
  ($q$sample-jinashi-18$q$, $q$1.8 Jinashi Shakuhachi$q$, $q$Unknown$q$, $q$1.8$q$, $q$jinashi$q$, 480, $q$available$q$, $q$["assets/jinashi.jpg","assets/jinashi-2.jpg","assets/jinashi-3.jpg"]$q$::jsonb, $q$https://www.youtube.com/watch?v=DOoWrAKQ_2Y$q$, $q$Sample listing. Replace with a real Shakuhachi from the shop.
Natural bore, light honey-coloured bamboo with root end and binding at the nodes.
The video is a recording of Shika no Tōne for reference.$q$, true, 4),
  ($q$sample-jinashi-24$q$, $q$2.4 Jinashi Shakuhachi$q$, $q$Unknown$q$, $q$2.4$q$, $q$jinashi$q$, 650, $q$reserved$q$, $q$["assets/jinashi-bound.jpg","assets/jinashi-bound-2.jpg","assets/jinashi-bound-3.jpg"]$q$::jsonb, $q$https://www.youtube.com/watch?v=4jzH55i5a4U$q$, $q$Sample listing. Replace with a real Shakuhachi from the shop.
A long, dark bamboo Shakuhachi with rattan binding along its length. Deep and slow to speak.$q$, true, 5)
on conflict (id) do nothing;
