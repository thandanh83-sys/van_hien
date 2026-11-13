# VĂN ĐẠO — Đại Bách Khoa Toàn Thư

<div align="center">
  <img src="assets/web-app-manifest-192x192.png" alt="Văn Đạo Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(139, 184, 168, 0.3);" />
  <br/>
  <h3><i>"Văn học là nhân học."</i></h3>
  <p>Không gian khám phá văn học, thi pháp và tinh hoa tri thức nhân loại.<br/>Nơi ngôn từ được phân tách, và vẻ đẹp được tôn vinh.</p>
  
  ![Version](https://img.shields.io/badge/version-1.0.0_(Network_Edition)-8bb8a8?style=for-the-badge)
  ![PWA](https://img.shields.io/badge/PWA-Ready-557a6f?style=for-the-badge)
  ![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-Zero_Dependencies-d4c4a8?style=for-the-badge)
  ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-2c3e38?style=for-the-badge)
</div>

---

## I. TỔNG QUAN (OVERVIEW)

**VĂN ĐẠO** là một hệ thống tri thức tự vận hành, được thiết kế với triết lý **"Bạch Ngọc"** (Tĩnh tại, thanh tao, không phô trương).

Bước sang phiên bản **v1.0.0 (Network Edition)**, Văn Đạo không còn là một website tĩnh đơn thuần. Nó đã lột xác thành một **Mạng lưới tri thức phân tán (Distributed Knowledge Network)** với kiến trúc **"Máy Mẹ — Máy Con"**, cho phép định tuyến dữ liệu thông minh, giao tiếp thời gian thực và tích hợp AI nội bộ (Hỏi Đạo).

Toàn bộ hệ thống chạy 100% bằng Vanilla JavaScript, không framework, không thư viện ngoài, đảm bảo tốc độ tải trang tức thì và bảo mật tuyệt đối.

---

## II. KIẾN TRÚC HỆ THỐNG (8 TẦNG NGÔI ĐỀN)

1. **Tầng 1 — GitHub Actions (Người gác cổng):** 5 workflow tự động (Tách dữ liệu, điền nội dung, deploy, kiểm tra).
2. **Tầng 2 — Python Tools (Người thợ):** Script tách file Master thành hàng ngàn file JSON nhỏ.
3. **Tầng 3 — Data (Máu):** Tách biệt Index (nhẹ) và Detail (nặng). Chứa Manifests của mạng lưới.
4. **Tầng 4 — Network Layer (Hệ thần kinh):** Máy Mẹ (MotherNode) và Bus (BroadcastChannel) điều phối dữ liệu.
5. **Tầng 5 — HTML (Khung xương):** Cấu trúc PWA, Splash Screen, các View (Home, Văn Hiến, Bách Khoa, Thi Pháp).
6. **Tầng 6 — CSS (Da thịt):** Giao diện Bạch Ngọc, chia thành 5 file chuyên biệt.
7. **Tầng 7 — JavaScript (Bộ não):** Chia thành các module độc lập (AI Dispatcher, Router, Render...).
8. **Tầng 8 — Service Worker (Bộ nhớ):** Hybrid Caching, quản lý Offline (Tủ Sách Offline).

---

## III. CẤU TRÚC THƯ MỤC CHUẨN (BẮT BUỘC TUÂN THỦ)

Nếu cấu trúc này bị thay đổi, hệ thống sẽ sụp đổ (trắng trang). Hãy đối chiếu kỹ trước khi thêm/xóa file.

```text
vandao/
├── .github/workflows/     # Bot tự động (deploy, split, validate)
├── assets/                # Font, Hình nền, Icons (nen.jpg, khung.jpg...)
├── css/                   # TẦNG GIAO DIỆN
│   ├── variables.css      # Biến màu, font chữ (Design Tokens)
│   ├── base.css           # Reset CSS, Canvas nước/sương
│   ├── components.css     # Nút bấm, Toggle, Tooltip, Hỏi Đạo Result
│   ├── layouts.css        # Header, Modal, Settings, Mạng Lưới
│   └── reader.css         # Trang chủ, Đọc bài, Thi pháp, Tác giả liên quan
├── data/                  # TẦNG DỮ LIỆU
│   ├── manifests/         # Bản đồ mạng lưới (index.json + các node)
│   ├── tac-gia/           # Hàng trăm file JSON chi tiết tác giả
│   ├── tac-pham/          # Hàng trăm file JSON chi tiết tác phẩm
│   └── data-*.json        # Các file Index và từ điển (danh ngôn, lời bình...)
├── js/                    # TẦNG BỘ NÃO (ES6 Modules)
│   ├── network/           # HỆ THẦN KINH
│   │   ├── mother.js      # Máy Mẹ: Định tuyến, Manifest, Health check
│   │   ├── bus.js         # Bus: Giao tiếp Real-time (BroadcastChannel)
│   │   └── index.js       # Facade xuất Network Layer
│   ├── config.js          # Biến toàn cục, State
│   ├── utils.js           # Hàm tiện ích, xóa dấu tiếng Việt
│   ├── search.js          # Cỗ máy tìm kiếm (TF-IDF)
│   ├── render.js          # Hiển thị giao diện, Accordion, Related
│   ├── router.js          # Chuyển trang, Định tuyến sâu
│   ├── offline.js         # Quản lý tải dữ liệu Offline
│   ├── ai.js              # Trí tuệ nhân tạo & Intent Dispatcher
│   ├── ask-dao.js         # Giao diện Hỏi Đạo
│   ├── audit.js           # Bác sĩ chẩn đoán toàn diện
│   └── main.js            # File khởi chạy chính
├── tools/                 # Script Python (không chạy trên web)
├── index.html             # Khung xương HTML duy nhất
├── manifest.json          # Cấu hình PWA
├── sw.js                  # Service Worker (Bộ nhớ đệm)
└── requirements.txt       # Môi trường Python & Cẩm nang bảo trì