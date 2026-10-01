// Kết nối trang quản trị với repo GitHub (xem README.md, mục "Tài khoản quản trị").
// login được tạo bằng tools/setup-login.html: đó là GitHub token đã mã hoá bằng tên + mật khẩu,
// không ai dùng được nếu không biết mật khẩu. Để trống login => chế độ demo.
window.SITE_CONFIG = {
  github: { owner: "sucalb", repo: "shakuhachishop", branch: "main" },
  login: {
    iterations: 310000,
    salt: "/x6ApdHWEwh2l8Ltv9BNPQ==",
    iv: "ukQXv2VoXkQYySal",
    data: "aG7A4GE7GjNRjILy4PznEPhi/8ydZVj18PN90DrrPpBxHl7J4A/B3q4CTEDvXQwAZ9lhUvjP8embiakTVtbc40fkkae4mI2NEA5ARgECibKZDddqIIwM/mpxfaryZod8ljhYlCZmb4UB5hIBkg==",
  },
};
