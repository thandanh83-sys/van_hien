/**
 * ==========================================================
 * VĂN ĐẠO - MAIN ENTRY POINT (js/main.js)
 * Kiến trúc: Bạch Ngọc (Tinh gọn - Bất đồng bộ - Module hóa)
 * Chức năng: Khởi tạo ứng dụng, kết nối các module, quản lý Splash
 * ==========================================================
 */

// 1. IMPORT CÁC MODULE CON (Khớp chính xác với cấu trúc thư mục của bạn)
import { STATE, ICONS, CONFIG } from './config.js';
import { initRouter, navigateTo } from './router.js';
import { initSearch, buildSearchIndex } from './search.js';
import { renderHomeView } from './render.js';
import { downloadAllOffline, checkStorageSize, clearOfflineData } from './offline.js';

// 2. KHAI BÁO CÁC PHẦN TỬ DOM TOÀN CỤC (Khớp ID với index.html)
const DOM = {
    body: document.body,
    splash: document.getElementById('splash-screen'),
    appContent: document.getElementById('app-content'),
    btnSettings: document.getElementById('btn-settings'),
    btnSearch: document.getElementById('btn-search'),
    btnMenu: document.getElementById('btn-menu'),
    modalSettings: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    searchContainer: document.getElementById('search-container'),
    searchInput: document.getElementById('search-input'),
    
    // Các nút trong phần Cài đặt
    btnDownloadAll: document.getElementById('btn-download-all'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    btnClearCache: document.getElementById('btn-clear-cache')
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

        // Render giao diện Splash (Sử dụng ảnh nen.jpg thực tế của bạn)
        DOM.splash.innerHTML = `
            <div class="splash-content fade-in" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <img src="assets/nen.jpg" alt="Văn Đạo" class="splash-image">
                <h2 class="splash-quote">"${randomQuote.text || randomQuote.noi_dung}"</h2>
                <p class="splash-author">— ${randomQuote.author || randomQuote.tac_gia} —</p>
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
async function startApp() {
    console.log("[Văn Đạo] Khởi chạy hệ thống...");
    
    // 1. Khởi tạo Router (Xử lý chuyển trang)
    initRouter();

    // 2. Xây dựng bộ não tìm kiếm (Search Index)
    await buildSearchIndex();

    // 3. Tải View mặc định (Trang Chủ)
    renderHomeView();

    // 4. Khởi tạo sự kiện cho thanh tìm kiếm
    if (DOM.searchInput) {
        initSearch(DOM.searchInput);
    }
    
    // 5. Cập nhật dung lượng Offline
    checkStorageSize();
}

/**
 * ==========================================
 * KHỐI 3: GẮN CÁC SỰ KIỆN TƯƠNG TÁC (EVENT LISTENERS)
 * ==========================================
 */
function bindGlobalEvents() {
    // 3.1. Mở/Đóng Modal Cài đặt
    if (DOM.btnSettings && DOM.modalSettings) {
        DOM.btnSettings.addEventListener('click', () => {
            DOM.modalSettings.classList.add('active');
            checkStorageSize(); // Cập nhật dung lượng mỗi khi mở
        });
    }

    if (DOM.btnCloseSettings) {
        DOM.btnCloseSettings.addEventListener('click', () => {
            DOM.modalSettings.classList.remove('active');
        });
    }

    // 3.2. Bật/Tắt thanh Tìm kiếm
    if (DOM.btnSearch && DOM.searchContainer) {
        DOM.btnSearch.addEventListener('click', () => {
            if (DOM.searchContainer.style.display === 'none') {
                DOM.searchContainer.style.display = 'block';
                DOM.searchInput.focus();
            } else {
                DOM.searchContainer.style.display = 'none';
            }
        });
    }

    // 3.3. Xử lý Tải Toàn Bộ Offline
    if (DOM.btnDownloadAll) {
        DOM.btnDownloadAll.addEventListener('click', async () => {
            // Đổi trạng thái nút
            DOM.btnDownloadAll.innerText = "ĐANG TẢI...";
            DOM.btnDownloadAll.disabled = true;
            
            // Hiển thị thanh tiến trình
            DOM.progressContainer.style.display = 'block';
            DOM.progressText.style.display = 'block';

            // Gọi hàm tải từ offline.js
            const result = await downloadAllOffline((percent) => {
                // Callback cập nhật % liên tục
                DOM.progressBar.style.width = `${percent}%`;
                DOM.progressText.innerText = `${percent}%`;
            });

            // Hoàn tất
            DOM.btnDownloadAll.innerText = "TẢI TOÀN BỘ";
            DOM.btnDownloadAll.disabled = false;
            
            if (result.success) {
                alert(`Đã tải xong! Thành công: ${result.total - result.failed} file. Lỗi: ${result.failed} file.`);
                setTimeout(() => {
                    DOM.progressContainer.style.display = 'none';
                    DOM.progressText.style.display = 'none';
                    DOM.progressBar.style.width = '0%';
                }, 3000);
            } else {
                alert("Lỗi khi tải dữ liệu. Vui lòng thử lại.");
            }
        });
    }

    // 3.4. Xóa dữ liệu Offline
    if (DOM.btnClearCache) {
        DOM.btnClearCache.addEventListener('click', async () => {
            const confirmDelete = confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu Offline?");
            if (confirmDelete) {
                await clearOfflineData();
                checkStorageSize(); // Cập nhật lại dung lượng
            }
        });
    }

    // 3.5. Click ra ngoài Modal để đóng
    window.addEventListener('click', (e) => {
        if (e.target === DOM.modalSettings) {
            DOM.modalSettings.classList.remove('active');
        }
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
    // 1. Gắn sự kiện toàn cục
    bindGlobalEvents();
    
    // 2. Đăng ký PWA
    registerServiceWorker();
    
    // 3. Chạy Splash Screen (Sau khi đã có đủ sự kiện)
    initSplashScreen();
});
