/**
 * ==========================================================
 * VĂN ĐẠO - ROUTER MODULE (js/router.js)
 * Chức năng: Quản lý chuyển trang (View Manager), lưu vị trí cuộn.
 * Đã sửa: Không còn hiện tượng các view đè lên nhau, tự động tải data.
 * ==========================================================
 */

import { STATE } from './config.js';
import { renderWorkDetail, renderHomeView } from './render.js';
import { loadSingleItem } from './offline.js';

// Lưu trữ vị trí cuộn của từng trang để khi quay lại không bị nhảy lên đầu
const scrollPositions = {};

// Danh sách các ID của khung nhìn (Đảm bảo trong index.html có các thẻ div này)
const VIEWS = [
    'view-home',      // Trang chủ
    'view-detail',    // Trang đọc tác phẩm (bài thơ)
    'view-author',    // Trang chi tiết tác giả
    'view-theory',    // Trang lý thuyết
    'view-settings'   // Trang cài đặt
];

/**
 * ==========================================
 * 1. KHỞI TẠO ROUTER
 * ==========================================
 */
export function initRouter() {
    // Lắng nghe sự kiện thay đổi trên thanh địa chỉ (VD: #/bai-viet/123)
    window.addEventListener('hashchange', handleRoute);
    
    // Lắng nghe sự kiện click vào các nút Bottom Navigation (Mobile)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (target) {
                navigateTo(target);
            }
        });
    });

    // Chạy phân tích URL lần đầu tiên khi vừa load trang
    handleRoute();
}

/**
 * ==========================================
 * 2. HÀM ĐIỀU HƯỚNG (Dùng khi bấm nút, click thẻ)
 * @param {string} viewName - Tên view (home, doc-bai, tac-gia, v.v.)
 * @param {string|null} id - ID của dữ liệu cần tải (nếu có)
 * ==========================================
 */
export function navigateTo(viewName, id = null) {
    let hash = `#/${viewName}`;
    if (id) {
        hash += `/${id}`;
    }
    
    // Nếu URL hiện tại khác URL muốn chuyển, thì mới đổi hash
    if (window.location.hash !== hash) {
        window.location.hash = hash;
    } else {
        // Nếu giống hệt, gọi thẳng hàm xử lý để load lại data
        handleRoute();
    }
}

/**
 * ==========================================
 * 3. XỬ LÝ URL (Đọc Hash và hiển thị View tương ứng)
 * ==========================================
 */
async function handleRoute() {
    // Mặc định nếu không có hash thì về trang chủ
    const hash = window.location.hash || '#/home';
    
    // Phân tách hash: Ví dụ "#/doc-bai/tran-quoc-tuan" -> ['doc-bai', 'tran-quoc-tuan']
    const parts = hash.replace('#/', '').split('/');
    const viewName = parts[0] || 'home';
    const itemId = parts[1] || null;

    console.log(`[Router] Đang chuyển đến: ${viewName} (ID: ${itemId || 'Không có'})`);

    // 1. Lưu lại vị trí cuộn của trang CŨ trước khi chuyển đi
    if (STATE.currentView) {
        scrollPositions[STATE.currentView] = window.scrollY;
    }

    // 2. Ẩn TẤT CẢ các view hiện tại (Tránh đè giao diện lên nhau)
    VIEWS.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
            el.classList.remove('active');
        }
    });

    // 3. Hiển thị view MỚI và load dữ liệu
    let targetViewId = '';
    
    switch (viewName) {
        case 'home':
            targetViewId = 'view-home';
            renderHomeView(); // Vẽ giao diện trang chủ
            break;

        case 'doc-bai': // Xem chi tiết tác phẩm
            targetViewId = 'view-detail';
            if (itemId) {
                await loadWorkView(itemId);
            } else {
                console.error("[Router] Lỗi: Không có ID tác phẩm để tải.");
                targetViewId = 'view-home'; // Fallback về trang chủ
            }
            break;

        case 'tac-gia': // Xem chi tiết tác giả
            targetViewId = 'view-author';
            if (itemId) {
                // await loadAuthorView(itemId);
                console.log("Tính năng tác giả đang phát triển");
            }
            break;

        case 'cai-dat': // Xem cài đặt
            targetViewId = 'view-settings';
            break;

        default:
            targetViewId = 'view-home';
            break;
    }

    // 4. Hiển thị View mới ra màn hình
    const targetEl = document.getElementById(targetViewId);
    if (targetEl) {
        targetEl.style.display = 'block';
        // Dùng requestAnimationFrame để kích hoạt hiệu ứng CSS mượt mà
        requestAnimationFrame(() => targetEl.classList.add('active'));
    }

    // 5. Cập nhật State
    STATE.currentView = viewName;

    // 6. Khôi phục vị trí cuộn (Nếu quay lại trang cũ), ngược lại cuộn lên đầu
    if (scrollPositions[viewName]) {
        window.scrollTo(0, scrollPositions[viewName]);
    } else {
        window.scrollTo(0, 0);
    }

    // 7. Cập nhật trạng thái Active cho Bottom Navigation (Nếu có)
    updateNavigationActive(viewName);
}

/**
 * ==========================================
 * 4. CÁC HÀM HỖ TRỢ (Helper Functions)
 * ==========================================
 */

// Hàm tải dữ liệu bài viết (kết hợp với offline.js)
async function loadWorkView(id) {
    const container = document.getElementById('view-detail');
    if (!container) return;

    // Hiển thị trạng thái chờ (Loading) trong lúc tải file JSON
    container.innerHTML = `
        <div class="loading-state" style="text-align:center; padding: 50px; color: #8bb8a8;">
            <p>Đang tải tác phẩm...</p>
        </div>
    `;

    // Gọi hàm từ offline.js (Chỉ tải đúng 1 file, không tải cả rừng)
    const data = await loadSingleItem(id, 'tac-pham');
    
    if (data) {
        // Nếu có dữ liệu, gọi hàm render từ render.js để vẽ giao diện
        renderWorkDetail(data);
    } else {
        // Nếu file JSON bị lỗi hoặc không tồn tại
        container.innerHTML = `
            <div class="error-state" style="text-align:center; padding: 50px; color: #a85858;">
                <p>Không tìm thấy tác phẩm này.</p>
                <button onclick="window.navigateTo('home')" class="btn-back">Quay lại Trang Chủ</button>
            </div>
        `;
    }
}

// Cập nhật class 'active' cho các icon ở thanh điều hướng dưới cùng
function updateNavigationActive(currentView) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === currentView) {
            item.classList.add('active');
        }
    });
}

// Gắn hàm navigateTo vào window object để có thể gọi từ thẻ HTML (VD: onclick="navigateTo('home')")
window.navigateTo = navigateTo;