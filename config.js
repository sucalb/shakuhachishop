// Kết nối trang quản trị với repo GitHub (xem README.md, mục "Tài khoản quản trị").
// login được tạo bằng tools/setup-login.html: đó là GitHub token đã mã hoá bằng tên + mật khẩu,
// không ai dùng được nếu không biết mật khẩu. Để trống login => chế độ demo.
window.SITE_CONFIG = {
  github: { owner: "sucalb", repo: "shakuhachishop", branch: "main" },
  login: null,
};
