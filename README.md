# TranCao Shakuhachi – shakuhachishop.com

Web bán sáo shakuhachi, giao diện tiếng Anh, không có thanh toán: khách bấm **Message us** để nhắn tin qua Facebook. Web tĩnh (HTML/CSS/JS thuần, không cần build).

| File | Vai trò |
|---|---|
| `index.html` | Trang chủ: ảnh lớn, giới thiệu, văn hoá shakuhachi, 3 danh mục, bảng độ dài, đánh giá |
| `catalogue.html?c=jiari&l=1.8` | Danh sách sáo, lọc theo danh mục và (với Jiari) theo độ dài |
| `flute.html?id=...` | Chi tiết một cây sáo: ảnh, video YouTube, nút nhắn tin |
| `admin.html` | Trang quản trị cho chủ shop (tiếng Việt) |
| `data.js` | Nội dung mặc định + nhóm độ dài Jiari + bảng cao độ |
| `config.js` | Khoá kết nối Supabase |
| `store.js` | Đọc/ghi dữ liệu (Supabase hoặc chế độ demo) |
| `supabase/schema.sql` | Tạo bảng, phân quyền và kho ảnh trên Supabase |

## Chạy thử trên máy

```bash
python3 -m http.server 5180
```

Mở http://localhost:5180 (website) và http://localhost:5180/admin.html (quản trị).

Khi `config.js` còn trống, web chạy **chế độ demo**: thay đổi trong trang quản trị chỉ lưu trên trình duyệt đang dùng.

## Trang quản trị làm được gì

- **Sáo**: thêm / sửa / xoá, tải nhiều ảnh, dán link YouTube, chọn danh mục, độ dài, giá, trạng thái (Còn hàng / Đang giữ / Đã bán), sắp xếp thứ tự.
- **Trang chủ**: tải ảnh lớn cho màn hình đầu (nhiều ảnh thì tự chuyển), đổi video giới thiệu.
- **Danh mục**: sửa chữ và ảnh đại diện của Edo / Jinashi / Jiari.
- **Đánh giá**: tỉ lệ đề xuất, số đánh giá, chép các đánh giá hay từ Facebook.
- **Liên hệ**: link trang Facebook, Messenger, trang đánh giá.

## Kết nối Supabase (để khách tự đăng)

1. Tạo project miễn phí tại https://supabase.com, nên dùng email của khách để khách giữ quyền sở hữu.
2. **SQL Editor** → dán toàn bộ `supabase/schema.sql` → **Run**.
3. **Authentication → Users → Add user**: tạo tài khoản quản trị cho khách (email + mật khẩu).
4. **Authentication → Sign In / Providers**: tắt **Allow new users to sign up**. Nếu không tắt, người lạ có thể tự đăng ký rồi sửa dữ liệu.
5. **Project Settings → API**: chép `Project URL` và `anon public key` vào `config.js`.
6. Mở `admin.html`, đăng nhập. Lần đầu web dùng nội dung mặc định trong `data.js`; bấm **Lưu** ở từng mục để ghi vào Supabase. Ở mục **Sáo** bấm **Nhập sáo đang có trên web cũ** để đưa cây Seien vào.

`anon key` được phép để công khai. Quyền ghi dữ liệu đã giới hạn cho tài khoản đăng nhập bằng Row Level Security trong `schema.sql`.

Lưu ý: gói miễn phí của Supabase tạm dừng project nếu không có truy cập nào trong 7 ngày; khi đó vào dashboard bấm **Restore**. Web có khách ghé thường xuyên thì không bị.

## Đưa lên shakuhachishop.com

Tên miền đăng ký ở Nhân Hòa, đang trỏ về hosting HostGator. Hai cách:

- **Dùng HostGator đang có**: vào cPanel → File Manager → `public_html`, sao lưu rồi xoá WordPress cũ, upload toàn bộ thư mục này. Không cần đổi DNS.
- **Dùng hosting tĩnh miễn phí** (Netlify / Cloudflare Pages): upload thư mục, thêm tên miền, rồi sửa bản ghi A / CNAME ở Nhân Hòa theo hướng dẫn của nơi đó.

## Ảnh và video mẫu

Bốn sản phẩm có nhãn **Sample** chỉ để trang trí; khi có sáo thật, xoá trong trang quản trị.

| File | Nguồn | Giấy phép |
|---|---|---|
| `assets/hero.jpg`, `assets/seien.jpg`, `assets/logo.png` | shakuhachishop.com (của khách) | |
| `assets/edo-antique.jpg`, `assets/jinashi.jpg` | Ảnh do người làm web cung cấp, chưa rõ nguồn: nên thay bằng ảnh của khách | ? |
| `assets/komuso.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Komuso_(monk)_of_Japan_-_shakuhachi_players_-_MIM_PHX_(2014-02-09_13.28.31_by_ksblack99).jpg) | Public domain |
| `assets/kuniyoshi.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shakuhachi_player.jpg), Utagawa Kuniyoshi | Public domain |
| `assets/edo-met.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shakuhachi_MET_142073.jpg), The Met | CC0 |
| `assets/jinashi-bound.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shakuhachi_thumbhole.jpg) | Public domain |

Video YouTube nhúng (Kyorei, Shika no Tōne, Tsukiyo no Kenshi) là các bản biểu diễn của Christopher Yohmei Blasdel và Riley Lee Music, không phải tiếng của sáo đang bán.
