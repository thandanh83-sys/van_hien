/**
 * ==========================================================
 * VĂN ĐẠO - CONFIG MODULE (js/config.js)
 * Chức năng: Chứa Hằng số, Kho SVG, Dữ liệu toàn cục (APP_DATA)
 * và Trạng thái toàn cục (STATE).
 * ==========================================================
 */

// =====================================================================
// 1. KHO ICON SVG (Giữ nguyên 100% từ bản gốc)
// =====================================================================
export const SVG_ATTR = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;

export const ICONS = {
    pen:        `<svg ${SVG_ATTR} width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    clock:      `<svg ${SVG_ATTR} width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    scroll:     `<svg ${SVG_ATTR} width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    check:      `<svg ${SVG_ATTR} width="16" height="16" stroke="#10b981"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    question:   `<svg ${SVG_ATTR} width="18" height="18" style="color:var(--accent-gold); flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    arrowRight: `<svg ${SVG_ATTR} width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    chevron:    `<svg ${SVG_ATTR} width="20" height="20" class="chevron-icon"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    sparkle:    `<svg ${SVG_ATTR} width="18" height="18"><path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>`
};

// =====================================================================
// 2. CẤU HÌNH PHÂN TRANG
// =====================================================================
export const ITEMS_PER_PAGE = 20;
export const ENCY_ITEMS_PER_PAGE = 20;


// =====================================================================
// 3. DỮ LIỆU TOÀN CỤC (APP_DATA)
// Chứa toàn bộ dữ liệu load từ file JSON. 
// Dùng object để có thể gán lại giá trị từ file main.js mà không bị lỗi ES6.
// =====================================================================
export const APP_DATA = {
    THEORY_DATA: [],       // Dữ liệu Lý thuyết
    AUTHOR_DATA: [],       // Dữ liệu Tác giả
    WORKS_DATA: [],        // Dữ liệu Tác phẩm
    QUOTES_DATA: [],       // Dữ liệu Danh ngôn
    COMMENTARY_DATA: {},   // Dữ liệu Lời bình
    DICTIONARY_DATA: { symbols: {}, dienTich: {}, hanViet: {} }, // Từ điển
    CATEGORY_NAMES: {},    // Tên thể loại
    FORTUNE_CONFIG: {},    // Cấu hình vận khí (Bói thơ)
    FORTUNE_ADVICE: {},    // Lời khuyên vận khí
    THE_LOAI_DATA: []      // Dữ liệu Thể loại (từ điển thể loại)
};


// =====================================================================
// 4. TRẠNG THÁI TOÀN CỤC (STATE)
// Lưu trữ các trạng thái hiện tại của UI, bộ đệm tìm kiếm, v.v.
// =====================================================================
export const STATE = {
    // Trạng thái bộ lọc Văn Hiến
    currentMainCat: 'all',
    currentGenre: 'all',
    currentPage: 1,

    // Trạng thái Bách Khoa
    currentEncyGroup: 'triet-thuyet',
    currentEncyPage: 1,
    currentEncyDataForRender: [],

    // Trạng thái Danh ngôn
    currentQuoteIndex: -1,
    quoteIntervalId: null,

    // Chỉ mục tìm kiếm (Global Index)
    GLOBAL_INDEX: new Map(), 
    GLOBAL_INDEX_BY_KEY: new Map(), 
    GLOBAL_RECORDS: [] 
};
