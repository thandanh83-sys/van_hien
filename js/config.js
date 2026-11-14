/**
 * ==========================================================
 * VĂN ĐẠO — CONFIG MODULE
 * Vị trí: js/config.js
 * Version: 4.0.0 (Contemplative Config — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. MỘT NGUỒN CHÂN LÝ (Single Source of Truth):
 *    Toàn bộ hằng số, dữ liệu tĩnh, trạng thái động đều ở đây.
 *    Không nơi nào khác được phép tự khai báo biến toàn cục.
 *
 * 2. TÁCH BIỆT APP_DATA (tĩnh) VÀ STATE (động):
 *    - APP_DATA: nạp một lần từ JSON, không đổi trong suốt phiên.
 *    - STATE:    thay đổi khi người dùng tương tác.
 *
 * 3. LAZY-LOAD (tải khi cần):
 *    Từ điển (symbols, dien-tich, han-viet) chỉ tải khi thực sự
 *    cần — tiết kiệm băng thông, tăng tốc khởi động.
 *
 * 4. KHÔNG CHẤM ĐIỂM VĂN CHƯƠNG (v4.0.0):
 *    - KHÔNG có trường `scores`, `rubric`, `weights` trong APP_DATA.
 *    - CHỈ có `CONTEMPLATIVE_PROMPTS` — bộ câu hỏi chiêm nghiệm.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v3.0.0: Lazy-Load Dictionary & Global State.
 * - v4.0.0: Thêm CONTEMPLATIVE_PROMPTS. Bỏ hoàn toàn mọi trường
 *           liên quan đến điểm số. Giữ nguyên toàn bộ API cũ.
 *
 * ==========================================================
 */

// =====================================================================
// PHẦN 1: KHO ICON SVG (Dùng chung toàn app — không emoji)
// =====================================================================

export const SVG_ATTR = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;

export const ICONS = {
    // ---- Icon cơ bản ----
    pen:        `<svg ${SVG_ATTR} width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    clock:      `<svg ${SVG_ATTR} width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    scroll:     `<svg ${SVG_ATTR} width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    check:      `<svg ${SVG_ATTR} width="16" height="16" stroke="#10b981"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    question:   `<svg ${SVG_ATTR} width="18" height="18" style="color:var(--accent-gold); flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    arrowRight: `<svg ${SVG_ATTR} width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    chevron:    `<svg ${SVG_ATTR} width="20" height="20" class="chevron-icon"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    sparkle:    `<svg ${SVG_ATTR} width="18" height="18"><path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>`,

    // ---- [MỚI v4.0.0] Icon cho chiêm nghiệm ----
    leaf:       `<svg ${SVG_ATTR} width="16" height="16"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>`,
    fleuron:    `<svg ${SVG_ATTR} width="14" height="14" style="color:var(--accent-gold);"><path d="M12 2C9 5 6 8 6 12s3 7 6 10c3-3 6-6 6-10s-3-7-6-10z"></path><path d="M12 2v20"></path></svg>`
};

// =====================================================================
// PHẦN 2: CẤU HÌNH PHÂN TRANG
// =====================================================================

export const ITEMS_PER_PAGE = 20;
export const ENCY_ITEMS_PER_PAGE = 20;

// =====================================================================
// PHẦN 3: DỮ LIỆU TOÀN CỤC (APP_DATA) — Tĩnh, nạp 1 lần từ JSON
// =====================================================================

/**
 * APP_DATA — Toàn bộ dữ liệu tĩnh nạp từ JSON.
 *
 * Được gán lại trong loadAllData() của main.js.
 * KHÔNG chứa trường điểm số (no scores, no rubric, no weights).
 */
export const APP_DATA = {
    // ---- Nhóm Lý thuyết & Tác giả ----
    THEORY_DATA: [],       // 18 quyển lý thuyết (Quyển 0 → XVII)
    AUTHOR_DATA: [],       // 78 tác giả (Kỳ Tài)

    // ---- Nhóm Tác phẩm ----
    WORKS_DATA: [],        // 95 tác phẩm (Tinh Hoa)

    // ---- Nhóm Danh ngôn & Lời bình ----
    QUOTES_DATA: [],       // 70+ danh ngôn văn học
    COMMENTARY_DATA: {},   // Lời bình theo 6 mức vận khí (data-loi-binh.json)

    // ---- Nhóm Từ điển (lazy-load) ----
    DICTIONARY_DATA: {
        symbols: {},       // Biểu tượng, tu từ, từ gợi hình/âm
        dienTich: {},      // Điển tích (Sân Lai, Ngưu Lang...)
        hanViet: {}        // Từ Hán Việt trong thi ca
    },

    // ---- Nhóm Thể loại ----
    CATEGORY_NAMES: {},    // 15 thể loại chính (key-value)
    THE_LOAI_DATA: [],     // 19 thể loại từ điển (có mô tả chi tiết)

    // ---- Nhóm Vận khí ----
    FORTUNE_CONFIG: {},    // Cấu hình 6 mức vận khí
    FORTUNE_ADVICE: {},    // Lời khuyên Nên/Tránh

    // =================================================================
    // [MỚI v4.0.0] BỘ CÂU HỎI CHIÊM NGHIỆM
    // =================================================================
    /**
     * CONTEMPLATIVE_PROMPTS — Bộ câu hỏi chiêm nghiệm.
     *
     * Thay thế hoàn toàn rubric chấm điểm.
     * Mỗi chiều kích có 2-3 câu hỏi gợi mở, KHÔNG có điểm số.
     *
     * Cấu trúc:
     * {
     *   "hinh_tuong": {
     *     "name": "Hình tượng",
     *     "questions": ["...", "..."]
     *   },
     *   ...
     * }
     *
     * Nguồn: data/contemplative-prompts.json
     */
    CONTEMPLATIVE_PROMPTS: {}
};

// =====================================================================
// PHẦN 4: TRẠNG THÁI TOÀN CỤC (STATE) — Động, thay đổi khi tương tác
// =====================================================================

/**
 * STATE — Trạng thái động của UI và Chỉ mục toàn cục.
 */
export const STATE = {
    // ---- Trạng thái Giao diện Văn Hiến (Tác phẩm) ----
    currentMainCat: 'all',
    currentGenre: 'all',
    currentPage: 1,

    // ---- Trạng thái Giao diện Bách Khoa ----
    currentEncyGroup: 'triet-thuyet',
    currentEncyPage: 1,
    currentEncyDataForRender: [],

    // ---- Trạng thái Tìm kiếm / Hỏi Đạo ----
    searchMode: 'lookup', // 'lookup' (Tra cứu UI) | 'ask' (Hỏi Đạo AI)

    // ---- Trạng thái Danh ngôn ----
    currentQuoteIndex: -1,
    quoteIntervalId: null,

    // =================================================================
    // CHỈ MỤC TOÀN CỤC (GLOBAL INDEX)
    // Được xây dựng trong main.js → buildGlobalIndex()
    // Sử dụng bởi DataHub & Search Engine
    // =================================================================

    /**
     * Map: { "id": { key, id, group, type, data } }
     */
    GLOBAL_INDEX: new Map(),

    /**
     * Map: { "group:id": { key, id, group, type, data } }
     */
    GLOBAL_INDEX_BY_KEY: new Map(),

    /**
     * Mảng chứa tất cả các record (dùng để build Inverted Index)
     */
    GLOBAL_RECORDS: []
};

// =====================================================================
// PHẦN 5: LAZY-LOAD TỪ ĐIỂN (TỐI ƯU HÓA BỘ NHỚ)
// =====================================================================

/**
 * Tự động tải 3 file từ điển (symbols, dien-tich, han-viet) khi cần thiết.
 * Chỉ tải 1 lần duy nhất, sau đó lưu vào APP_DATA.DICTIONARY_DATA.
 *
 * @returns {Promise<Object>} APP_DATA.DICTIONARY_DATA
 */
export async function lazyLoadDictionary() {
    // Nếu đã tải rồi (có dữ liệu) thì bỏ qua
    if (APP_DATA.DICTIONARY_DATA.symbols && Object.keys(APP_DATA.DICTIONARY_DATA.symbols).length > 0) {
        return APP_DATA.DICTIONARY_DATA;
    }

    try {
        const [symbols, dienTich, hanViet] = await Promise.all([
            fetch('./data/tu-dien/symbols.json').then(r => r.json()).catch(() => ({})),
            fetch('./data/tu-dien/dien-tich.json').then(r => r.json()).catch(() => ({})),
            fetch('./data/tu-dien/han-viet.json').then(r => r.json()).catch(() => ({}))
        ]);

        // Gộp tất cả vào APP_DATA.DICTIONARY_DATA
        APP_DATA.DICTIONARY_DATA = {
            ...APP_DATA.DICTIONARY_DATA,
            ...symbols,
            ...dienTich,
            ...hanViet
        };

        console.log("[DICT] Đã tải xong từ điển (Lazy Load).");
        return APP_DATA.DICTIONARY_DATA;
    } catch (e) {
        console.warn(`[DICT] Lỗi tải từ điển:`, e);
        return APP_DATA.DICTIONARY_DATA;
    }
}

// =====================================================================
// PHẦN 6: HELPER CHO CONTEMPLATIVE PROMPTS
// =====================================================================

/**
 * Lấy câu hỏi chiêm nghiệm ngẫu nhiên cho một chiều kích.
 *
 * @param {string} dimension - Key chiều kích (VD: 'hinh_tuong')
 * @returns {string|null} Câu hỏi hoặc null nếu không có
 */
export function getRandomContemplativeQuestion(dimension) {
    const prompts = APP_DATA.CONTEMPLATIVE_PROMPTS || {};
    const dim = prompts[dimension];
    if (!dim || !Array.isArray(dim.questions) || dim.questions.length === 0) {
        return null;
    }
    return dim.questions[Math.floor(Math.random() * dim.questions.length)];
}

/**
 * Kiểm tra xem Contemplative Prompts đã sẵn sàng chưa.
 *
 * @returns {boolean}
 */
export function isContemplativeReady() {
    return !!(APP_DATA.CONTEMPLATIVE_PROMPTS
        && Object.keys(APP_DATA.CONTEMPLATIVE_PROMPTS).length > 0);
}

// =====================================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// =====================================================================
/**
 * SAU KHI DÙNG config.js v4.0.0:
 *
 * 1. Thêm file data/contemplative-prompts.json (theo MASTER PLAN 1.1)
 *
 * 2. Cập nhật main.js để nạp file này trong loadAllData() (Tầng 2):
 *    safeFetch('./data/contemplative-prompts.json', {})
 *    → APP_DATA.CONTEMPLATIVE_PROMPTS
 *
 * 3. (Tùy chọn) Cập nhật core.js để export getRandomContemplativeQuestion
 *    nếu muốn dùng ở nhiều nơi.
 *
 * 4. KHÔNG thêm trường score/rubric/weight vào APP_DATA.
 *    Đó là tư duy của Prompt Evaluator, không phải Văn Đạo.
 */
