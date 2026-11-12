/**
 * ==========================================================
 * VĂN ĐẠO - MAIN ENTRY POINT (js/main.js)
 * Kiến trúc: Bạch Ngọc (Tinh gọn - Bất đồng bộ - Module hóa)
 * Chức năng: Khởi tạo ứng dụng, kết nối các module, quản lý Splash
 * ==========================================================
 */

// 1. IMPORT CÁC MODULE CON (Đảm bảo bạn đã tạo các file này trong thư mục js/)
import { STATE, ICONS, CONFIG } from './config.js';
import { initRouter, navigateTo } from './router.js';
import { initSearch } from './search.js';
import { renderWorkDetail, renderHomeView } from './render.js';
import { loadSingleItem, checkStorageSize } from './offline.js';
import { initPerformance } from './performance.js';

// 2. KHAI BÁO CÁC PHẦN TỬ DOM TOÀN CỤC
const DOM = {
    body: document.body,
    splash: document.getElementById('splash-screen'),
    app: document.getElementById('app'),
    btnSettings: document.getElementById('btn-settings'),
    btnMenu: document.getElementById('btn-menu'),
    modalSettings: document.getElementById('settings-modal')
};

/**
 * ==========================================
 * KHỐI 1: QUẢN LÝ SPLASH SCREEN (MÀN HÌNH CHỜ 6S)
 * ==========================================
 */
async function initSplashScreen() {
    if (!DOM.splash) return;

    // Khóa cuộn trang khi đang ở Splash
    DOM.body.style.overflow = 'hidden';

    try {
        // Tải file danh ngôn (Nhẹ, chỉ tải 1 lần)
        const response = await fetch('data/data-danh-ngon.json');
        const danhNgonList = await response.json();
        
        // Random 1 câu danh ngôn
        const randomQuote = danhNgonList[Math.floor(Math.random() * danhNgonList.length)];

        // Render giao diện Splash (Tuyệt đối không có nút Bản Dịch / Nguyên Văn)
        DOM.splash.innerHTML = `
            <div class="splash-content fade-in">
                <img src="assets/images/splash-art.jpg" alt="Văn Đạo" class="splash-image">
                <h2 class="splash-quote">"${randomQuote.text}"</h2>
                <p class="splash-author">— ${randomQuote.author} —</p>
            </div>
        `;

        // Đợi đúng 6 giây theo yêu cầu
        setTimeout(() => {
            // Hiệu ứng mờ dần
            DOM.splash.classList.add('fade-out');
            
            // Sau khi mờ xong thì xóa khỏi DOM và mở khóa cuộn
            setTimeout(() => {
                DOM.splash.remove();
                DOM.body.style.overflow = 'auto';
                
                // Kích hoạt Router và App chính
                startApp();
            }, 800); // Khớp với thời gian transition của CSS

        }, 6000);

    } catch (error) {
        console.error("[Lỗi Splash] Không thể tải danh ngôn:", error);
        // Nếu lỗi, bỏ qua Splash và vào App luôn để tránh treo web
        if (DOM.splash) DOM.splash.remove();
        DOM.body.style.overflow = 'auto';
        startApp();
    }
}

/**
 * ==========================================
 * KHỐI 2: KHỞI CHẠY APP CHÍNH
 * ==========================================
 */
function startApp() {
    console.log("[Văn Đạo] Khởi chạy hệ thống...");
    
    // 1. Khởi tạo Router (Xử lý chuyển trang)
    initRouter();
    
    // 2. Khởi tạo Performance (Lazy load ảnh, tối ưu cuộn)
    if (initPerformance) initPerformance();

    // 3. Tải View mặc định (Trang Chủ)
    renderHomeView();

    // 4. Khởi tạo Search Engine (Nếu có thanh tìm kiếm)
    const searchInput = document.getElementById('search-input');
    if (searchInput) initSearch(searchInput);
    
    // 5. Cập nhật dung lượng Offline
    if (checkStorageSize) checkStorageSize();
}

/**
 * ==========================================
 * KHỐI 3: GẮN CÁC SỰ KIỆN TOÀN CỤC (EVENT LISTENERS)
 * ==========================================
 */
function bindGlobalEvents() {
    // 3.1. Sự kiện mở/đóng Cài đặt
    if (DOM.btnSettings) {
        DOM.btnSettings.addEventListener('click', () => {
            if (DOM.modalSettings) DOM.modalSettings.classList.add('active');
        });
    }

    // 3.2. Sự kiện Menu (Mobile)
    if (DOM.btnMenu) {
        DOM.btnMenu.addEventListener('click', () => {
            // Gọi hàm mở menu (nằm trong router hoặc render)
            navigateTo('menu'); 
        });
    }

    // 3.3. Xử lý Sự kiện Click ra ngoài để đóng Tooltip / Modal
    document.addEventListener('click', (e) => {
        // Đóng Tooltip (nếu click không trúng vào tooltip hoặc từ khóa highlight)
        const tooltip = document.querySelector('.vd-tooltip');
        if (tooltip && !e.target.closest('.highlight')) {
            tooltip.remove();
        }

        // Đóng Modal Cài đặt nếu click ra ngoài
        if (e.target === DOM.modalSettings) {
            DOM.modalSettings.classList.remove('active');
        }
    });

    // 3.4. Lắng nghe sự kiện offline/online
    window.addEventListener('online', () => {
        console.log("[Mạng] Đã có kết nối Internet.");
        DOM.body.classList.remove('is-offline');
    });
    
    window.addEventListener('offline', () => {
        console.warn("[Mạng] Mất kết nối Internet.");
        DOM.body.classList.add('is-offline');
    });
}

/**
 * ==========================================
 * KHỐI 4: ĐĂNG KÝ SERVICE WORKER (PWA)
 * ==========================================
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('[PWA] ServiceWorker đăng ký thành công. Scope:', registration.scope);
                })
                .catch(error => {
                    console.error('[PWA] Lỗi đăng ký ServiceWorker:', error);
                });
        });
    }
}

/**
 * ==========================================
 * KHỐI 5: KHỞI TẠO (BOOTSTRAP)
 * ==========================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // Bước 1: Gắn sự kiện toàn cục
    bindGlobalEvents();
    
    // Bước 2: Đăng ký PWA
    registerServiceWorker();
    
    // Bước 3: Chạy Splash Screen
    initSplashScreen();
});
