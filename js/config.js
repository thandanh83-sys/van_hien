/**
 * ==========================================================
 * VĂN ĐẠO - CONFIG MODULE (js/config.js)
 * Chức năng: Chứa Hằng số, State toàn cục, Kho SVG (Không Emoji)
 * ==========================================================
 */

// 1. CẤU HÌNH HỆ THỐNG
export const CONFIG = {
    APP_NAME: 'Văn Đạo',
    VERSION: '4.7.0',
    SPLASH_DURATION: 6000, // 6 giây màn hình chờ
    ITEMS_PER_PAGE: 20,    // Phân trang
    DATA_PATHS: {
        TAC_GIA_INDEX: 'data/data-tac-gia.json',
        TAC_PHAM_INDEX: 'data/data-tac-pham.json',
        DANH_NGON: 'data/data-danh-ngon.json',
        TU_DIEN: 'data/data-tu-dien.json',
        LY_THUYET: 'data/data-ly-thuyet.json',
        LOI_BINH: 'data/data-loi-binh.json',
        THE_LOAI: 'data/data-the-loai.json',
        VAN_KHI: 'data/data-van-khi.json'
    }
};

// 2. TRẠNG THÁI TOÀN CỤC (GLOBAL STATE)
export const STATE = {
    currentView: 'home', // home, doc-bai, tac-gia, ly-thuyet
    currentWorkId: null,
    globalIndex: [],     // Chứa Index tổng hợp
    isOfflineMode: false,
    theme: 'bach-ngoc'
};

// 3. KHO SVG (TUYỆT ĐỐI KHÔNG DÙNG EMOJI THEO ĐÚNG YÊU CẦU)
// Bạn có thể copy các path SVG này vào file assets/icons.svg để dùng thẻ <use>
export const ICONS = {
    // Icon Trạng thái
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8bb8a8" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4c4a8" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a85858" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    
    // Icon Giao diện
    menu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2c3e38" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    settings: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2c3e38" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    trash: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a85858" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    download: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8bb8a8" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
};