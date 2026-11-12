# VĂN ĐẠO — Đại Bách Khoa Toàn Thư

<div align="center">
  <img src="assets/web-app-manifest-192x192.png" alt="Văn Đạo Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(139, 184, 168, 0.3);" />
  <br/>
  <h3><i>"Văn học là nhân học."</i></h3>
  <p>Không gian khám phá văn học, thi pháp và tinh hoa tri thức nhân loại.<br/>Nơi ngôn từ được phân tách, và vẻ đẹp được tôn vinh.</p>
  
  ![Version](https://img.shields.io/badge/version-4.8_(Fully_Restored)-8bb8a8?style=for-the-badge)
  ![PWA](https://img.shields.io/badge/PWA-Ready-557a6f?style=for-the-badge)
  ![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-Zero_Dependencies-d4c4a8?style=for-the-badge)
  ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-2c3e38?style=for-the-badge)
</div>

---

## I. TỔNG QUAN (OVERVIEW)

**VĂN ĐẠO** không chỉ là một ứng dụng web tra cứu văn học thông thường. Đây là một hệ thống tri thức tự vận hành, được thiết kế với triết lý **"Cân bằng động" (Dynamic Balance)** và kiến trúc **"Bạch Ngọc" (White Jade)**.

Dự án được xây dựng hoàn toàn bằng **Vanilla JavaScript** (không framework, không thư viện ngoài) để đạt hiệu năng tối đa. Dữ liệu được quản lý tự động qua hệ thống **CI/CD (GitHub Actions)** và các công cụ Python, biến hàng ngàn tác phẩm văn học thành một mạng lưới tri thức (Knowledge Network) liên kết chặt chẽ, có khả năng chạy offline 100% (PWA) và tối ưu hóa RAM cho thiết bị di động.

---

## II. TÍNH NĂNG CỐT LÕI (KEY FEATURES)

### 1. Trải nghiệm Người dùng (UX/UI)
- **Giao diện Bạch Ngọc:** Tối giản, tĩnh tại, hệ thống Typography (Alex Brush & Times New Roman). Không dùng Emoji, 100% icon SVG.
- **Boot Experience:** Màn hình chờ 5 giây với hiệu ứng dải lụa, danh ngôn ngẫu nhiên.
- **Hiệu ứng Canvas:** Sóng nước gợn nhẹ theo cú chạm và hạt sương bay lơ lửng.
- **Tooltip & Highlight:** Hệ thống Tooltip CSS thông minh (không đè chữ, tự động xuống dòng) và Highlight nền đặc (không bị lệch dấu tiếng Việt).
- **Responsive & PWA:** Hoạt động hoàn hảo trên Mobile lẫn Desktop, có thể cài đặt như App Native.

### 2. Kho Dữ liệu & Điều hướng (The Knowledge Web)
- **Global Index (O(1)):** Tra cứu hàng ngàn ID với tốc độ ánh sáng.
- **Văn Hiến (Heritage):** Lọc 2 tầng, tìm kiếm, phân trang. Thẻ tác phẩm hiển thị thời đại, chữ viết, tác giả.
- **Bách Khoa (Encyclopedia):** Hệ thống Accordion phân chia 3 nhóm: *Triết Thuyết*, *Kỳ Tài*, *Tinh Hoa*.
- **Tìm kiếm thông minh (VDSearchEngine):** Tự xây dựng Inverted Index + TF-IDF. Tìm không phân biệt dấu, ưu tiên Tiêu đề và Tác giả.
- **Tủ Sách Offline (Offline Library):** Tải toàn bộ dữ liệu JSON (hàng ngàn tác phẩm/tác giả) xuống bộ nhớ máy để đọc offline. Có thanh tiến trình, tạm dừng, tiếp tục, hủy và báo cáo dung lượng (MB) qua Storage API.

### 3. Tính năng Mở rộng
- **Related Content:** Gợi ý tác phẩm cùng tác giả, thể loại, hoặc chung biểu tượng.
- **Random Poem (Bói thơ):** Chọn ngẫu nhiên tác phẩm kèm lời bình vận khí.
- **Symbol Highlighter:** Tự động phát hiện và highlight các biểu tượng, điển tích, Hán Việt.

### 4. Thi Pháp Học (Poetry Analyzer)
- Bóc tách cấu trúc bài thơ qua 4 tầng: Thanh điệu (Bằng/Trắc) -> Thể thơ & Vần -> Biểu tượng -> Câu hỏi mở.

---

## III. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Dự án được thiết kế theo mô hình **"Bảy tầng ngôi đền"**:

1. **Tầng 1 — GitHub Actions:** Workflow tự động tách dữ liệu, điền nội dung thiếu và deploy.
2. **Tầng 2 — Python Tools:** Script tách file Master thành hàng ngàn file JSON nhỏ.
3. **Tầng 3 — Data:** Tách biệt Index (metadata nhẹ) và Detail (nội dung nặng).
4. **Tầng 4 — HTML:** Cấu trúc PWA, Splash Screen, các `view`.
5. **Tầng 5 — CSS:** Giao diện Bạch Ngọc, tối ưu GPU, `content-visibility`.
6. **Tầng 6 — JavaScript (v4.8):** Kiến trúc Module, Router bất đồng bộ, Quản lý bộ nhớ, và **OfflineLibrary**.
7. **Tầng 7 — Service Worker (v4.7.0):** Hybrid Caching (Network First cho HTML, Stale-While-Revalidate cho JSON/Assets) và hỗ trợ tải Batch Offline.

---

## IV. CẤU TRÚC THƯ MỤC (DIRECTORY STRUCTURE)

```text
vandao/
├── .github/workflows/     # 4 bot: auto-fill, split-authors, split-works, deploy
├── assets/                # Fonts, Hình nền, Icons PWA
├── data/
│   ├── tac-gia/           # File JSON chi tiết tác giả
│   ├── tac-pham/          # File JSON chi tiết tác phẩm
│   ├── data-danh-ngon.json
│   ├── data-ly-thuyet.json
│   ├── data-tac-gia.json  # Index tác giả
│   ├── data-tac-pham.json # Index tác phẩm
│   ├── data-tu-dien.json  # Từ điển biểu tượng
│   └── ... (các file JSON khác)
├── tools/                 # Script Python (split, auto_fill, validate)
├── .nojekyll
├── index.html             # Khung xương (v4.8)
├── style.css              # Giao diện (v4.7)
├── script.js              # Logic chính (v4.8)
├── manifest.json          # Cấu hình PWA
└── sw.js                  # Service Worker (v4.7.0)
