# 🌐 VĂN ĐẠO NETWORK LAYER (v3.0.0)

Chào mừng bạn đến với **Hệ thần kinh trung ương** của Văn Đạo. Tài liệu này giải thích kiến trúc, triết lý và cách các module trong thư mục `js/network/` vận hành để kết nối toàn bộ hệ thống tri thức.

> **Triết lý cốt lõi:** "Một cửa ngõ, một đầu mối, một trái tim."
> Chúng ta đã loại bỏ hoàn toàn kiến trúc "Máy Mẹ - Máy Con" (v1.0) để chuyển sang **Mạng lưới Trí tuệ Thống nhất** với `DataHub` là trung tâm duy nhất.

---

## I. CẤU TRÚC THƯ MỤC

```text
js/network/
├── data-hub.js     # 🧠 TRÁI TIM DỮ LIỆU: Truy xuất, Cache, Knowledge Graph.
├── bus.js          # 🔗 HỆ THẦN KINH: Đường truyền tin nhắn (Pub/Sub, Cross-tab).
├── index.js        # 📦 TRẠM TRUNG CHUYỂN (Facade): Xuất tất cả cho main.js.
└── README.md       # 📖 Tài liệu bạn đang đọc.
