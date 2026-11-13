# 🌐 VĂN ĐẠO NETWORK LAYER (v1.0.0)

Chào mừng bạn đến với hệ thống mạng lưới tri thức phân tán của Văn Đạo. Tài liệu này giải thích cấu trúc thư mục và cách các file giao tiếp với nhau.

## 📁 Cấu trúc thư mục

Thư mục này (`js/network/`) đóng vai trò là "Hệ thần kinh trung ương" của ứng dụng, kết nối các thành phần dữ liệu rời rạc lại với nhau.

```text
js/network/
├── mother.js       # 🧠 Máy Mẹ: Quản lý bản đồ định tuyến, load manifest, kiểm tra sức khỏe.
├── bus.js          # 🔗 VDBus: Đường truyền tin nhắn (Publish/Subscribe/Request).
├── index.js        # 📦 Trạm trung chuyển: Export tất cả ra ngoài cho main.js dễ dùng.
└── README.md       # 📖 Tài liệu bạn đang đọc.