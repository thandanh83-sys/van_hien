# 🌸 VĂN ĐẠO — ĐẠI BÁCH KHOA TOÀN THƯ

<div align="center">
  <img src="assets/web-app-manifest-192x192.png" alt="Văn Đạo Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(139, 184, 168, 0.3);" />
  <br/>
  <h3><i>"Không chấm điểm. Mỗi bài thơ đều có hồn, nét đẹp riêng."</i></h3>
  <p>Không gian khám phá văn học, thi pháp và tinh hoa tri thức nhân loại.<br/>Nơi ngôn từ được phân tách, và vẻ đẹp được tôn vinh.</p>
  
  ![Version](https://img.shields.io/badge/version-4.0.0_(Contemplative)-8bb8a8?style=for-the-badge)
  ![PWA](https://img.shields.io/badge/PWA-Ready-557a6f?style=for-the-badge)
  ![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-Zero_Dependencies-d4c4a8?style=for-the-badge)
  ![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-2c3e38?style=for-the-badge)
</div>

---

## I. TỔNG QUAN (OVERVIEW)

**VĂN ĐẠO** là một hệ thống tri thức tự vận hành, được thiết kế với triết lý **"Bạch Ngọc"** (Tĩnh tại, thanh tao, không phô trương).

Bước sang phiên bản **v4.0.0 (Contemplative Edition)**, Văn Đạo đã tiến hóa từ một website tĩnh thành một **Không gian Chiêm nghiệm Số**. Điểm cốt lõi của phiên bản này là triết lý:

> **"Không chấm điểm văn chương. Mỗi bài thơ đều có hồn, nét đẹp riêng."**

Khác với các hệ thống AI văn học truyền thống (chấm điểm, xếp hạng, so sánh hơn kém), Văn Đạo chỉ **chiêm nghiệm, gợi mở, tôn vinh**. Mọi AI Agents đều tuân thủ **Quy tắc vàng 12** — quy tắc tối thượng của hệ thống.

Toàn bộ hệ thống chạy 100% bằng Vanilla JavaScript, không framework, không thư viện ngoài, đảm bảo tốc độ tải trang tức thì và bảo mật tuyệt đối.

---

## II. TRIẾT LÝ CỐT LÕI (CORE PHILOSOPHY)

Văn Đạo 4.0.0 vận hành dựa trên 3 trụ cột:

### 1. Không Chấm Điểm (No Scoring)
- KHÔNG có trường `score`, `grade`, `rank`, `points` trong bất kỳ file JSON nào.
- KHÔNG có UI hiển thị điểm số (VD: "8.5/10", "Bài thơ đạt 85%").
- KHÔNG có hàm `calculateScore()`, `ratePoem()`, `gradeWork()` trong code.

### 2. Tôn Vinh Vẻ Đẹp (Celebrate Beauty)
- **Khúc Tán Thưởng** (thay PraiserAgent): Chỉ ra vẻ đẹp ĐÃ CÓ trong bài thơ.
- **Lời Gợi Mở** (thay CriticAgent): Mở ra chiều sâu CÓ THỂ CÓ — không phán xét.

### 3. Chiêm Nghiệm (Contemplation)
- **ContemplativeEngine**: Sinh câu hỏi để người đọc tự hỏi mình.
- **contemplative-prompts.json**: 11 chiều kích × 3 câu hỏi = 33 câu hỏi gợi mở.

---

## III. KIẾN TRÚC HỆ THỐNG (8 TẦNG NGÔI ĐỀN)

1. **Tầng 1 — GitHub Actions (Người gác cổng):** 5 workflow tự động (Tách dữ liệu, điền nội dung, deploy, kiểm tra).
2. **Tầng 2 — Python Tools (Người thợ):** Script tách file Master thành hàng ngàn file JSON nhỏ.
3. **Tầng 3 — Data (Máu):** Tách biệt Index (nhẹ) và Detail (nặng). Chứa Manifests của mạng lưới.
4. **Tầng 4 — DataHub & Network (Hệ thần kinh):**
   - **DataHub:** Trung tâm truy xuất dữ liệu duy nhất (Offline-First).
   - **VDBus:** Giao tiếp thời gian thực (BroadcastChannel).
5. **Tầng 5 — HTML (Khung xương):** Cấu trúc PWA, Splash Screen, các View.
6. **Tầng 6 — CSS (Da thịt):** Giao diện Bạch Ngọc, 5 file chuyên biệt.
7. **Tầng 7 — Multi-Agent AI (Bộ não):** Kiến trúc đa tác tử (11 agents).
8. **Tầng 8 — Service Worker (Bộ nhớ):** Hybrid Caching, quản lý Offline.

---

## IV. CẤU TRÚC THƯ MỤC CHUẨN (BẮT BUỘC TUÂN THỦ)

Nếu cấu trúc này bị thay đổi, hệ thống sẽ sụp đổ (trắng trang). Hãy đối chiếu kỹ trước khi thêm/xóa file.

```text
vandao/
├── .github/workflows/          # Bot tự động (deploy, split, validate)
├── assets/                      # Font, Hình nền, Icons
│   ├── fonts/AlexBrush-Regular.woff2
│   ├── khung.jpg
│   ├── nen.jpg
│   ├── favicon.svg / favicon.ico
│   ├── apple-touch-icon.png
│   └── web-app-manifest-{192,512}x{192,512}.png
│
├── css/                         # TẦNG GIAO DIỆN
│   ├── variables.css            # Design Tokens
│   ├── base.css                 # Reset CSS, Canvas nước/sương
│   ├── components.css           # Nút bấm, Tooltip, Hỏi Đạo (v5.0.0)
│   ├── layouts.css              # Header, Modal, Settings, Mạng Lưới
│   └── reader.css               # Trang chủ, Đọc bài, Thi pháp
│
├── data/                        # TẦNG DỮ LIỆU
│   ├── manifests/               # Bản đồ mạng lưới (index + static-assets)
│   ├── tac-gia/                 # Hàng trăm file JSON chi tiết tác giả
│   ├── tac-pham/                # Hàng trăm file JSON chi tiết tác phẩm
│   ├── tu-dien/                 # symbols.json, dien-tich.json, han-viet.json
│   ├── data-*.json              # Index & từ điển (danh ngôn, lời bình...)
│   └── contemplative-prompts.json  # [v4.0.0] 11 chiều kích × 3 câu hỏi
│
├── js/                          # TẦNG BỘ NÃO (ES6 Modules)
│   ├── network/                 # HỆ THẦN KINH
│   │   ├── data-hub.js          # 🧠 TRÁI TIM DỮ LIỆU
│   │   ├── bus.js               # 🔗 Giao tiếp Real-time
│   │   └── index.js             # Facade
│   │
│   ├── ai/                      # HỆ TRÍ TUỆ (Multi-Agent)
│   │   ├── core.js              # Cache, Fortune Levels, Dictionary
│   │   ├── input-ai.js          # Nhận diện câu hỏi (Semantic Parser)
│   │   ├── master.js            # Nhạc trưởng điều phối (v11.0.0)
│   │   ├── output-ai.js         # Định dạng câu trả lời (v7.0.0)
│   │   ├── identity.js          # Bản sắc (Ta - Bạn)
│   │   ├── dialogue-engine.js   # Intro, Follow-up, Outro
│   │   ├── literary-engine.js   # Phân tích 4 tầng thơ
│   │   ├── memory-engine.js     # Ký ức hội thoại
│   │   ├── smart-input-parser.js # Omnibox Routing
│   │   ├── nlp-tools.js         # Chuẩn hóa, teencode, stopwords
│   │   ├── math-utils.js        # Levenshtein, Dice, Jaccard, Cosine
│   │   ├── contemplative-engine.js  # [v4.0.0] Sinh câu hỏi chiêm nghiệm
│   │   ├── validators/
│   │   │   └── insight-validator.js  # [v4.0.0] Chống bịa, chống phán xét
│   │   ├── nlp/
│   │   │   ├── entity-extractor.js
│   │   │   ├── intent-definitions.js  # (v2.0.0 — open-depth)
│   │   │   └── language-signals.js    # (v2.0.0 — open)
│   │   └── agents/              # 🎭 11 CHUYÊN GIA
│   │       ├── index.js         # Auto-Registry (v8.0.0)
│   │       ├── literature.js
│   │       ├── poetics.js
│   │       ├── knowledge.js
│   │       ├── history.js
│   │       ├── analysis.js      # (v3.0.0)
│   │       ├── khuc-tan-thuong.js  # [v4.0.0] Thay PraiserAgent
│   │       ├── goi-mo.js        # [v4.0.0] Thay CriticAgent
│   │       ├── character.js
│   │       ├── comparison.js
│   │       ├── translation.js
│   │       └── fortune.js       # (v4.0.0)
│   │
│   ├── config.js                # APP_DATA, STATE, HELPERS (v4.1.0)
│   ├── utils.js                 # Hàm tiện ích
│   ├── search.js                # TF-IDF + Cosine Similarity
│   ├── render.js                # Hiển thị giao diện (v3.0.0)
│   ├── router.js                # Chuyển trang, Deep Navigation
│   ├── offline.js               # Tải dữ liệu Offline
│   ├── ask-dao.js               # Giao diện Hỏi Đạo
│   ├── audit.js                 # Bác sĩ chẩn đoán (v5.0.0)
│   ├── ai.js                    # Facade AI (v5.0.0)
│   └── main.js                  # Entry point (v7.0.0)
│
├── tools/                       # TẦNG PYTHON
│   ├── split_works.py
│   ├── split_authors.py
│   ├── auto_fill_content.py
│   ├── enrich_metadata.py
│   ├── minify_data.py
│   ├── update_manifests.py
│   └── validate_data.py
│
├── tests/                       # TẦNG KIỂM THỬ (Vitest)
│   ├── literary-engine.test.js
│   ├── insight-validator.test.js
│   ├── contemplative-engine.test.js
│   └── goi-mo-agent.test.js
│
├── index.html                   # 🏗️ TẦNG 5: KHUNG XƯƠNG
├── manifest.json                # 📱 Cấu hình PWA
├── sw.js                        # 💾 TẦNG 8: SERVICE WORKER
├── requirements.txt             # 📝 Cẩm nang bảo trì + 12 Quy tắc vàng
├── package.json                 # (Tùy chọn) Vitest config
└── README.md                    # 📖 Tài liệu bạn đang đọc
