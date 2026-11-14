/**
 * ==========================================================
 * NGỌC THANH - HỎI ĐẠO UI CONTROLLER (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 3.3.0 (Fixed duplicate import error & Grid layout)
 * ==========================================================
 * CHỨC NĂNG:
 * - Lắng nghe sự kiện từ người dùng.
 * - Chuyển giao câu hỏi cho Master AI xử lý.
 * - Điều khiển trạng thái UI (Ẩn/Hiện thanh Filter, Phân trang, Grid/Block).
 * ==========================================================
 */

// [FIX] Đảm bảo CHỈ CÓ DUY NHẤT 1 dòng import này từ thư mục ai
import { MasterAI } from './ai/master.js';

/**
 * Hàm xử lý hợp nhất: Tự động phát hiện Tra cứu hay Hỏi Đạo
 */
export async function handleSmartSearch(options) {
    const { inputId, containerId, filterBarId, paginationId, fallbackRenderFn } = options;
    
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    if (!input || !container) return;

    const text = input.value.trim();
    
    if (!text) {
        if (fallbackRenderFn) fallbackRenderFn();
        return;
    }

    const filterBar = document.getElementById(filterBarId);
    const pagination = document.getElementById(paginationId);

    try {
        // Gọi MasterAI xử lý
        const resultType = await MasterAI.processQuery(input, container);

        if (resultType && resultType.type === 'search') {
            // Nếu là tìm kiếm danh sách -> Trả lại layout Grid
            if (containerId === 'heritage-grid') container.style.display = 'grid';
            
            if (filterBar) filterBar.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            if (fallbackRenderFn) fallbackRenderFn();
        } else {
            // Nếu là câu trả lời AI -> Chuyển thành layout Block để hiển thị rộng rãi
            if (containerId === 'heritage-grid') container.style.display = 'block';
            
            if (filterBar) filterBar.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
        }

    } catch (err) {
        console.error('[SMART SEARCH UI] Lỗi:', err);
        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-answer">Đã xảy ra lỗi giao diện: ${err.message}</div>
            </div>
        `;
        if (filterBar) filterBar.style.display = 'none';
        if (pagination) pagination.style.display = 'none';
    }
}

/**
 * Khôi phục giao diện tìm kiếm mặc định khi người dùng xóa chữ
 */
export function resetSearchState(options) {
    const { inputId, containerId, filterBarId, paginationId, fallbackRenderFn, btnId } = options;
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(btnId || 'clear-search-btn'); 
    
    if (input) { input.value = ''; input.focus(); }
    if (clearBtn) clearBtn.classList.remove('show');

    const container = document.getElementById(containerId);
    if (container && containerId === 'heritage-grid') {
        container.style.display = 'grid';
    }

    const filterBar = document.getElementById(filterBarId);
    const pagination = document.getElementById(paginationId);
    if (filterBar) filterBar.style.display = 'flex';
    if (pagination) pagination.style.display = 'flex';
    
    if (fallbackRenderFn) fallbackRenderFn();
}
