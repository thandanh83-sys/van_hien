# VĂN ĐẠO — Đại Bách Khoa Toàn Thư

<div align="center">
  <img src="assets/web-app-manifest-192x192.png" alt="Văn Đạo Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(139, 184, 168, 0.3);" />
  <br/>
  <h3><i>"Văn học là nhân học."</i></h3>
  <p>Không gian khám phá văn học, thi pháp và tinh hoa tri thức nhân loại.<br/>Nơi ngôn từ được phân tách, và vẻ đẹp được tôn vinh.</p>
  
  ![Version](https://img.shields.io/badge/version-5.0.0_(Modular_Architecture)-8bb8a8?style=for-the-badge)
  ![PWA](https://img.shields.io/badge/PWA-Ready-557a6f?style=for-the-badge)
  ![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-Zero_Dependencies-d4c4a8?style=for-the-badge)
  ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-2c3e38?style=for-the-badge)
</div>

---

## I. TỔNG QUAN (OVERVIEW)

**VĂN ĐẠO** là một hệ thống tri thức tự vận hành, được thiết kế với triết lý **"Cân bằng động"** và kiến trúc **"Bạch Ngọc"**. 

Dự án đã được nâng cấp lên **Kiến trúc Module (ES6)** để tối ưu hóa hiệu năng, dễ dàng bảo trì và mở rộng. Toàn bộ hệ thống chạy 100% bằng Vanilla JavaScript, không framework, không thư viện ngoài.

---

## II. KIẾN TRÚC HỆ THỐNG (7 TẦNG NGÔI ĐỀN)

1. **Tầng 1 — GitHub Actions:** 4 workflow tự động (Tách dữ liệu, điền nội dung, deploy).
2. **Tầng 2 — Python Tools:** Script tách file Master thành hàng ngàn file JSON nhỏ.
3. **Tầng 3 — Data (Máu):** Tách biệt Index (nhẹ) và Detail (nặng).
4. **Tầng 4 — HTML (Khung xương):** Cấu trúc PWA, Splash Screen, các View.
5. **Tầng 5 — CSS (Da thịt):** Giao diện Bạch Ngọc, chia thành 5 file chuyên biệt.
6. **Tầng 6 — JavaScript (Bộ não):** Chia thành 8 module độc lập (AI, Router, Render...).
7. **Tầng 7 — Service Worker (Người gác cổng):** Hybrid Caching, quản lý Offline.

---

## III. CẤU TRÚC THƯ MỤC CHUẨN (BẮT BUỘC TUÂN THỦ)

Nếu cấu trúc này bị thay đổi, hệ thống sẽ sụp đổ (trắng trang). Hãy đối chiếu kỹ trước khi thêm/xóa file.

```text
vandao/
├── .github/workflows/     # Bot tự động (không sửa nếu không rành)
├── assets/                # Font, Hình nền, Icons (nen.jpg, khung.jpg...)
├── css/                   # TẦNG GIAO DIỆN
│   ├── variables.css      # Biến màu, font chữ (Sửa màu sắc toàn cục tại đây)
│   ├── base.css           # Reset CSS, Canvas nước/sương
│   ├── components.css     # Nút bấm, Tooltip, Highlight
│   ├── layouts.css        # Header, Modal, Banner cập nhật
│   └── reader.css         # Trang chủ, Đọc bài, Thi pháp
├── data/                  # TẦNG DỮ LIỆU
│   ├── tac-gia/           # Hàng ngàn file JSON chi tiết tác giả
│   ├── tac-pham/          # Hàng ngàn file JSON chi tiết tác phẩm
│   └── data-*.json        # Các file Index và từ điển
├── js/                    # TẦNG BỘ NÃO (ES6 Modules)
│   ├── config.js          # Biến toàn cục, State
│   ├── utils.js           # Hàm tiện ích, xóa dấu tiếng Việt
│   ├── search.js          # Cỗ máy tìm kiếm (TF-IDF)
│   ├── render.js          # Hiển thị giao diện, Accordion
│   ├── router.js          # Chuyển trang, Định tuyến sâu
│   ├── offline.js         # Quản lý tải dữ liệu Offline
│   ├── ai.js              # Hệ chuyên gia (Sinh lời bình/khuyên)
│   └── main.js            # File khởi chạy chính (Import tất cả)
├── tools/                 # Script Python (không chạy trên web)
├── index.html             # Khung xương HTML duy nhất
├── manifest.json          # Cấu hình PWA
├── sw.js                  # Service Worker (Bộ nhớ đệm)
└── requirements.txt       # Môi trường Python
