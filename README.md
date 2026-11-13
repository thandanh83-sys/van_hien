# VĂN ĐẠO — Đại Bách Khoa Toàn Thư

<div align="center">
  <img src="assets/web-app-manifest-192x192.png" alt="Văn Đạo Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(139, 184, 168, 0.3);" />
  <br/>
  <h3><i>"Văn học là nhân học."</i></h3>
  <p>Không gian khám phá văn học, thi pháp và tinh hoa tri thức nhân loại.<br/>Nơi ngôn từ được phân tách, và vẻ đẹp được tôn vinh.</p>
  
  ![Version](https://img.shields.io/badge/version-2.0.0_(Knowledge_Network)-8bb8a8?style=for-the-badge)
  ![PWA](https://img.shields.io/badge/PWA-Ready-557a6f?style=for-the-badge)
  ![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-Zero_Dependencies-d4c4a8?style=for-the-badge)
  ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-2c3e38?style=for-the-badge)
</div>

---

## I. TỔNG QUAN (OVERVIEW)

**VĂN ĐẠO** là một hệ thống tri thức tự vận hành, được thiết kế với triết lý **"Bạch Ngọc"** (Tĩnh tại, thanh tao, không phô trương).

Bước sang phiên bản **v2.0.0 (Knowledge Network Edition)**, Văn Đạo đã tiến hóa từ một website tĩnh thành một **Mạng lưới Tri thức Thống nhất (Unified Knowledge Network)**. 

Điểm cốt lõi của kiến trúc mới là **DataHub** (Trái tim dữ liệu) và **ID-Centric** (Lấy ID làm ngôn ngữ chung). Mọi AI chuyên môn (Văn học, Thi pháp, Tri thức...) đều giao tiếp thông qua ID. Không AI nào tự ý tải file JSON lộn xộn. Hệ thống hoạt động **Offline-First 100%**, tự động fallback về RAM hoặc Cache khi mất mạng.

Toàn bộ hệ thống chạy 100% bằng Vanilla JavaScript, không framework, không thư viện ngoài, đảm bảo tốc độ tải trang tức thì và bảo mật tuyệt đối.

---

## II. KIẾN TRÚC HỆ THỐNG (8 TẦNG NGÔI ĐỀN)

1. **Tầng 1 — GitHub Actions (Người gác cổng):** 5 workflow tự động (Tách dữ liệu, điền nội dung, deploy, kiểm tra).
2. **Tầng 2 — Python Tools (Người thợ):** Script tách file Master thành hàng ngàn file JSON nhỏ.
3. **Tầng 3 — Data (Máu):** Tách biệt Index (nhẹ) và Detail (nặng). Chứa Manifests của mạng lưới.
4. **Tầng 4 — DataHub & Network (Hệ thần kinh):** 
   - **DataHub:** Trung tâm truy xuất dữ liệu duy nhất (Offline-First). Tự động quản lý Cache, Metadata và Đồ thị tri thức (Knowledge Graph).
   - **MotherNode & Bus:** Hỗ trợ kiểm tra sức khỏe mạng lưới và giao tiếp thời gian thực.
5. **Tầng 5 — HTML (Khung xương):** Cấu trúc PWA, Splash Screen, các View (Home, Văn Hiến, Bách Khoa, Thi Pháp).
6. **Tầng 6 — CSS (Da thịt):** Giao diện Bạch Ngọc, chia thành 5 file chuyên biệt.
7. **Tầng 7 — Multi-Agent AI (Bộ não):** Kiến trúc đa tác tử (Input AI -> Master AI -> Các Agents -> Output AI). Điều phối bởi `MasterAI`.
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
│   │   ├── data-hub.js    # [MỚI] TRÁI TIM DỮ LIỆU: Truy xuất, Cache, Graph
│   │   ├── mother.js      # Máy Mẹ: Định tuyến, Manifest, Health check
│   │   ├── bus.js         # Bus: Giao tiếp Real-time (BroadcastChannel)
│   │   └── index.js       # Facade xuất Network Layer
│   ├── ai/                # HỆ TRÍ TUỆ (Multi-Agent)
│   │   ├── core.js        # Hạ tầng dùng chung, Cache, DataHub connector
│   │   ├── input-ai.js    # Nhận diện câu hỏi (Semantic Parser)
│   │   ├── master.js      # Nhạc trưởng điều phối (Orchestrator)
│   │   ├── output-ai.js   # Định dạng câu trả lời (Thiền vị & Nho phong)
│   │   └── agents/        # CÁC CHUYÊN GIA
│   │       ├── knowledge.js   # [MỚI] Quản lý Mạng lưới (Tác giả, Tác phẩm)
│   │       ├── literature.js  # Tác phẩm, Tác giả, Tóm tắt
│   │       ├── poetics.js     # Từ điển, Biểu tượng, Điển tích
│   │       ├── analysis.js    # Phân tích văn bản, Tìm chủ đề
│   │       ├── fortune-ai.js  # Bói thơ (Vận khí, Nên/Tránh)
│   │       ├── praiser.js     # Tán thưởng (Góc nhìn đẹp)
│   │       └── critic.js      # Phê bình (Góc nhìn hạn chế)
│   ├── config.js          # Biến toàn cục, State
│   ├── utils.js           # Hàm tiện ích, xóa dấu tiếng Việt
│   ├── search.js          # Cỗ máy tìm kiếm (TF-IDF)
│   ├── render.js          # Hiển thị giao diện, Accordion, Related
│   ├── router.js          # Chuyển trang, Định tuyến sâu
│   ├── offline.js         # Quản lý tải dữ liệu Offline
│   ├── ai.js              # Facade AI (Cổng giao tiếp duy nhất)
│   ├── ask-dao.js         # Giao diện Hỏi Đạo
│   ├── audit.js           # Bác sĩ chẩn đoán toàn diện
│   └── main.js            # File khởi chạy chính
├── tools/                 # Script Python (không chạy trên web)
├── index.html             # Khung xương HTML duy nhất
├── manifest.json          # Cấu hình PWA
├── sw.js                  # Service Worker (Bộ nhớ đệm)
└── requirements.txt       # Môi trường Python & Cẩm nang bảo trì
