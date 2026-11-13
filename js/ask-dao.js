/**
 * ==========================================================
 * VĂN ĐẠO - HỎI ĐẠO UI CONTROLLER (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 1.2.0 (Multi-Agent Interface)
 * ==========================================================
 * CHỨC NĂNG:
 * - Lắng nghe sự kiện từ người dùng (Enter hoặc Click).
 * - Chuyển giao câu hỏi cho Master AI xử lý.
 * - Điều khiển trạng thái UI (Ẩn/Hiện thanh Filter, Phân trang)
 *   tùy thuộc vào việc Master AI trả về kết quả Tìm kiếm hay Câu trả lời.
 * ==========================================================
 */

import { MasterAI } from './ai/master.js';

/**
 * Hàm xử lý hợp nhất: Tự động phát hiện Tra cứu hay Hỏi Đạo
 * 
 * @param {Object} options - Cấu hình cho từng view (Văn Hiến hoặc Bách Khoa)
 * @param {string} options.inputId - ID ô tìm kiếm
 * @param {string} options.containerId - ID khung chứa kết quả
 * @param {string} options.filterBarId - ID thanh lọc (để ẩn/hiện)
 * @param {string} options.paginationId - ID khung phân trang (để ẩn/hiện)
 * @param {Function} options.fallbackRenderFn - Hàm render danh sách mặc định nếu là tìm kiếm
 */
export async function handleSmartSearch(options) {
    const { inputId, containerId, filterBarId, paginationId, fallbackRenderFn } = options;
    
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    if (!input || !container) return;

    const text = input.value.trim();
    
    // Nếu ô trống, khôi phục giao diện mặc định
    if (!text) {
        if (fallbackRenderFn) fallbackRenderFn();
        return;
    }

    const filterBar = document.getElementById(filterBarId);
    const pagination = document.getElementById(paginationId);

    try {
        // Giao phó toàn bộ cho Master AI (Input -> Agents -> Output)
        // Master AI sẽ tự động hiển thị Loading và render kết quả vào container
        const resultType = await MasterAI.processQuery(input, container);

        // ĐIỀU KHIỂN UI DỰA TRÊN KẾT QUẢ
        if (resultType && resultType.type === 'search') {
            // Nếu là Tìm kiếm thông thường -> Hiện lại bộ lọc và phân trang
            if (filterBar) filterBar.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            
            // Gọi hàm render danh sách (từ render.js)
            if (fallbackRenderFn) fallbackRenderFn();
        } else {
            // Nếu là câu hỏi (Hỏi Đạo) -> Ẩn bộ lọc và phân trang để có không gian rộng rãi
            if (filterBar) filterBar.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
        }

    } catch (err) {
        console.error('[SMART SEARCH UI] Lỗi:', err);
        // Nếu có lỗi xảy ra ở tầng UI (không phải tầng AI), hiển thị thông báo an toàn
        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-answer">Đã xảy ra lỗi giao diện: ${err.message}</div>
            </div>
        `;
    }
}

/**
 * Khôi phục giao diện tìm kiếm mặc định khi người dùng xóa chữ
 * (Hoặc khi bấm nút X)
 */
export function resetSearchState(options) {
    const { inputId, filterBarId, paginationId, fallbackRenderFn } = options;
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById('clear-search-btn'); // Dùng chung nút X
    
    // 1. Reset ô input
    if (input) { 
        input.value = ''; 
        input.focus(); 
    }
    
    // 2. Ẩn nút X
    if (clearBtn) clearBtn.classList.remove('show');

    // 3. Hiện lại bộ lọc và phân trang
    const filterBar = document.getElementById(filterBarId);
    const pagination = document.getElementById(paginationId);
    if (filterBar) filterBar.style.display = 'flex';
    if (pagination) pagination.style.display = 'flex';
    
    // 4. Render lại danh sách mặc định
    if (fallbackRenderFn) fallbackRenderFn();
}