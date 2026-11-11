# VĂN ĐẠO — Đại Bách Khoa Toàn Thư

<div align="center">
  <img src="assets/web-app-manifest-192x192.png" alt="Văn Đạo Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(139, 184, 168, 0.3);" />
  <br/>
  <h3><i>"Văn học là nhân học."</i></h3>
  <p>Không gian khám phá văn học, thi pháp và tinh hoa tri thức nhân loại.<br/>Nơi ngôn từ được phân tách, và vẻ đẹp được tôn vinh.</p>
  
  ![Version](https://img.shields.io/badge/version-4.2_(Elegant_Minimalist)-8bb8a8?style=for-the-badge)
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
- **Giao diện Bạch Ngọc:** Tối giản, tĩnh tại, sử dụng hệ thống Typography (Alex Brush & Times New Roman) và bảng màu ngọc bích thanh tao. Không sử dụng Emoji, 100% icon SVG.
- **Boot Experience:** Màn hình chờ (Splash) 5 giây với hiệu ứng dải lụa uốn lượn, danh ngôn ngẫu nhiên và chuyển cảnh mượt mà (Silk Transition).
- **Hiệu ứng Canvas:** Sóng nước gợn nhẹ theo từng cú chạm (Water Canvas) và hạt sương bay lơ lửng (Dewdrops).
- **Responsive & PWA:** Hoạt động hoàn hảo trên Mobile lẫn Desktop, có thể cài đặt ra màn hình chính như một ứng dụng Native.

### 2. Kho Dữ liệu & Điều hướng (The Knowledge Web)
- **Global Index (O(1)):** Tra cứu hàng ngàn ID (Tác giả, Tác phẩm, Lý thuyết) với tốc độ ánh sáng.
- **Văn Hiến (Heritage):** Lọc 2 tầng (Loại hình & Thể loại), tìm kiếm, và phân trang. Thẻ tác phẩm hiển thị thông tin thời đại, chữ viết, tác giả.
- **Bách Khoa (Encyclopedia):** Hệ thống Accordion (Sổ tay) phân chia 3 nhóm chính: *Triết Thuyết* (Lý thuyết), *Kỳ Tài* (Tác giả), *Tinh Hoa* (Tác phẩm).
- **Tìm kiếm thông minh (VDSearchEngine):** Tự xây dựng Inverted Index + Thuật toán TF-IDF. Tìm kiếm không phân biệt dấu tiếng Việt, ưu tiên kết quả ở Tiêu đề và Tác giả.
- **Deep Navigation:** Từ một tác phẩm, có thể nhảy trực tiếp sang tác giả hoặc quyển lý thuyết liên quan thông qua ID.

### 3. Tính năng Mở rộng
- **Related Content (Tác phẩm liên quan):** Tự động gợi ý các tác phẩm cùng tác giả, cùng thể loại, hoặc có chung biểu tượng/điển tích.
- **Random Poem (Bói thơ):** Chọn ngẫu nhiên một tác phẩm và bay thẳng tới đó.
- **Timeline (Dòng thời gian):** Hệ thống hóa tác phẩm theo các thế kỷ (Thế kỷ X -> XXI), nhóm theo tác giả.
- **Symbol Highlighter:** Tự động phát hiện và highlight (kèm tooltip CSS mượt mà) các biểu tượng văn học (trăng, liễu, bến đò...), điển tích, và từ Hán Việt ngay trong nội dung tác phẩm.

### 4. Thi Pháp Học (Poetry Analyzer)
- Bóc tách cấu trúc bài thơ qua 4 tầng:
  - **Tầng 0 (Dữ kiện thô):** Phân tích thanh điệu Bằng/Trắc.
  - **Tầng 1 (Lý thuyết):** Nhận diện thể thơ (Lục bát, Thất ngôn tứ tuyệt...) và hệ thống vần (chân, lưng, liền, cách).
  - **Tầng 2 (Chiếu rọi):** Tìm kiếm biểu tượng, điển tích, Hán Việt.
  - **Tầng 3 (Mở ngỏ):** Gợi mở các câu hỏi chiêm nghiệm cho người đọc.

---

## III. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Dự án được thiết kế theo mô hình **"Bảy tầng ngôi đền"**, mỗi tầng đảm nhận một nhiệm vụ độc lập:

1. **Tầng 1 — GitHub Actions (Vô hình):** 4 workflow tự động (Tách dữ liệu tác phẩm, tách tác giả, điền nội dung thiếu, deploy). Sử dụng `concurrency` để chống xung đột.
2. **Tầng 2 — Python Tools (Luyện đan):** Script tách file Master thành hàng ngàn file JSON nhỏ, sắp xếp A-Z, và tự động xóa Master để dọn dẹp repo.
3. **Tầng 3 — Data (Máu):** Tách biệt Index (metadata nhẹ) và Detail (nội dung nặng). Hợp đồng ngầm: `id` trong Index = tên file JSON trong Detail.
4. **Tầng 4 — HTML (Khung xương):** Cấu trúc PWA, preload font/ảnh, chứa Splash Screen và các `view` ẩn/hiện.
5. **Tầng 5 — CSS (Da thịt):** Giao diện Bạch Ngọc, sử dụng CSS Variables, tối ưu GPU, `content-visibility` để render thông minh.
6. **Tầng 6 — JavaScript (Bộ não):** Kiến trúc Module 0-10. Quản lý State, Router bất đồng bộ (`ViewManager`), Quản lý bộ nhớ (`ContentManager`), và Event Delegation.
7. **Tầng 7 — Service Worker (Người gác cổng):** Hybrid Caching (Network First cho HTML, Stale-While-Revalidate cho JSON, Cache First cho Assets).

---

## IV. CẤU TRÚC THƯ MỤC (DIRECTORY STRUCTURE)

```text
vandao/
├── .github/
│   └── workflows/
│       ├── auto-fill.yml          # Bot điền nội dung thiếu
│       ├── auto-split-authors.yml # Bot tách dữ liệu tác giả
│       ├── auto-split.yml         # Bot tách dữ liệu tác phẩm
│       └── deploy.yml             # Bot xuất bản lên GitHub Pages
├── assets/
│   ├── fonts/                     # Font chữ cục bộ (Alex Brush)
│   ├── khung.jpg, nen.jpg         # Hình nền, khung vòm
│   ├── favicon.*, web-app-manifest-*.png # Icon PWA
├── data/
│   ├── tac-gia/                   # Hàng ngàn file JSON chi tiết tác giả
│   ├── tac-pham/                  # Hàng ngàn file JSON chi tiết tác phẩm
│   ├── data-danh-ngon.json        # Kho danh ngôn
│   ├── data-ly-thuyet.json        # Index lý thuyết
│   ├── data-tac-gia.json          # Index tác giả (Metadata)
│   └── data-tac-pham.json         # Index tác phẩm (Metadata)
├── tools/
│   ├── auto_fill_content.py       # Script điền nội dung mẫu
│   ├── split_authors.py           # Script tách tác giả
│   └── split_works.py             # Script tách tác phẩm
├── .nojekyll                      # Chặn GitHub Pages dùng Jekyll
├── index.html                     # Khung xương ứng dụng
├── style.css                      # Hệ thống thiết kế Bạch Ngọc
├── script.js                      # Toàn bộ logic (V4.2)
├── manifest.json                  # Cấu hình PWA
└── sw.js                          # Service Worker (Hybrid Cache)
