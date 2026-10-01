# Old Shakuhachi Shop – shakuhachishop.com

Web bán sáo shakuhachi, giao diện tiếng Anh, không có thanh toán: khách bấm **Message us** để nhắn tin qua Facebook. Web tĩnh (HTML/CSS/JS thuần, không cần build).

| File | Vai trò |
|---|---|
| `index.html` | Trang chủ: ảnh lớn, giới thiệu, 3 danh mục, bảng độ dài, đánh giá |
| `catalogue.html?c=jiari&l=1.8` | Danh sách sáo, lọc theo danh mục và (với Jiari) theo độ dài |
| `flute.html?id=...` | Chi tiết một cây sáo: ảnh, video YouTube, nút nhắn tin |
| `admin.html` | Trang quản trị cho chủ shop (tiếng Việt) |
| `data.js` | Nội dung mặc định (khi `content.json` chưa có mục đó) + nhóm độ dài Jiari + bảng cao độ |
| `config.js` | Repo GitHub + tài khoản quản trị (đã mã hoá) |
| `store.js` | Đọc `content.json`; trang quản trị ghi vào repo qua GitHub API (hoặc chế độ demo) |
| `content.json` | Sáo + cài đặt trang mà khách sửa trong trang quản trị |
| `tools/setup-login.html` | Tạo tên + mật khẩu quản trị cho khách |

## Chạy thử trên máy

```bash
python3 -m http.server 5180
```

Mở http://localhost:5180 (website) và http://localhost:5180/admin.html (quản trị).

Khi `config.js` còn trống, web chạy **chế độ demo**: thay đổi trong trang quản trị chỉ lưu trên trình duyệt đang dùng.

## Trang quản trị làm được gì

- **Sáo**: thêm / sửa / xoá, tải nhiều ảnh, dán link YouTube, chọn danh mục, độ dài, giá, trạng thái (Còn hàng / Đang giữ / Đã bán), sắp xếp thứ tự.
- **Ảnh trang chủ**: tải ảnh lớn cho màn hình đầu, nhiều ảnh thì tự chuyển.
- **Danh mục**: sửa chữ và ảnh đại diện của Edo / Jinashi / Jiari.
- **Đánh giá**: tỉ lệ đề xuất, số đánh giá, chép các đánh giá hay từ Facebook.
- **Liên hệ**: link trang Facebook, Messenger, trang đánh giá.

## Tài khoản quản trị

Không dùng dịch vụ ngoài. Nội dung nằm trong `content.json` của repo này, ảnh tải lên nằm trong `uploads/`.
Trang quản trị đăng nhập bằng tên + mật khẩu; mật khẩu mở khoá một GitHub token đã mã hoá sẵn trong `config.js`,
rồi ghi thẳng vào repo. Mỗi lần **Lưu** là một commit; GitHub Pages đăng lại web sau khoảng 1 phút.

Cài lần đầu (hoặc đổi mật khẩu):

1. Tạo token: github.com → Settings → Developer settings → **Fine-grained tokens** → Generate new token.
   - Repository access: **Only select repositories** → `shakuhachishop`
   - Permissions → Repository → **Contents: Read and write**
   - Expiration: 1 năm (ghi lịch để gia hạn; hết hạn thì khách không lưu được, web vẫn chạy bình thường).
2. Mở `https://shakuhachishop.com/tools/setup-login.html`, nhập tên đăng nhập, mật khẩu (≥ 10 ký tự) cho khách và token.
3. Chép đoạn kết quả vào `config.js` (thay `login: null,`), commit và push.
4. Gửi khách link `https://shakuhachishop.com/admin.html` + tên đăng nhập + mật khẩu.

Đổi mật khẩu: làm lại bước 2–3. Thu hồi quyền ngay lập tức: xoá token trên GitHub.

`config.js` công khai nhưng an toàn: token chỉ giải mã được khi biết đúng tên + mật khẩu, và token chỉ có quyền ghi vào đúng repo này.
Mật khẩu nên dài (≥ 10 ký tự, không phải chữ đơn giản) vì ai cũng tải được `config.js` để thử đoán.

## Tên miền shakuhachishop.com

Web chạy trên **GitHub Pages** (nhánh `main`, file `CNAME`), https do GitHub tự cấp và gia hạn. Mỗi lần push lên `main`, khoảng 1 phút sau web tự cập nhật.

DNS quản lý ở Nhân Hòa (customer.nhanhoa.com → Quản lý dịch vụ → Tên miền → DNS Record):

| Loại | Tên | Giá trị |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | sucalb.github.io |

Hosting HostGator (WordPress cũ) không còn được dùng.

## Ảnh và video mẫu

Bốn sản phẩm có nhãn **Sample** chỉ để trang trí; khi có sáo thật, xoá trong trang quản trị.

| File | Nguồn | Giấy phép |
|---|---|---|
| `assets/hero.jpg`, `assets/seien.jpg`, `assets/logo.png` | shakuhachishop.com (của khách) | |
| `assets/edo-antique.jpg`, `assets/jinashi.jpg` | Ảnh do người làm web cung cấp, chưa rõ nguồn: nên thay bằng ảnh của khách | ? |
| `assets/komuso.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Komuso_(monk)_of_Japan_-_shakuhachi_players_-_MIM_PHX_(2014-02-09_13.28.31_by_ksblack99).jpg) | Public domain |
| `assets/edo-met.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shakuhachi_MET_142073.jpg), The Met | CC0 |
| `assets/jinashi-bound.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Shakuhachi_thumbhole.jpg) | Public domain |

Video YouTube trong sản phẩm mẫu (Kyorei, Shika no Tōne, Tsukiyo no Kenshi) là các bản biểu diễn của Christopher Yohmei Blasdel và Riley Lee Music, không phải tiếng của sáo đang bán.
