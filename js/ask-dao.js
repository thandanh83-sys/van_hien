/**
 * ==========================================================
 * NGỌC THANH - HỎI ĐẠO UI CONTROLLER (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 3.2.0 (Unified Omnibox & Layout Fix)
 * ==========================================================
 * CHỨC NĂNG:
 * - Lắng nghe sự kiện từ người dùng (Enter, Click nút X).
 * - Chuyển giao câu hỏi cho Master AI xử lý (Omnibox Routing).
 * - Điều khiển trạng thái UI: 
 *   + Nếu là Search (danh sách) -> Hiện Filter, Phân trang, dùng Layout Grid.
 *   + Nếu là Ask Dạo (câu trả lời AI) -> Ẩn Filter, dùng Layout Block (rộng rãi).
 * 
 * TRIẾT LÝ:
 * - Không xử lý dữ liệu ở đây. Mọi thứ giao phó cho MasterAI.
 * - UI chỉ phản ứng với kết quả trả về (type: 'search' hoặc 'answered').
 * ==========================================================
 */

// [CHUẨN HÓA IMPORT] Đường dẫn tương đối chính xác từ thư mục js/
import { MasterAI } from './ai/master.js';

/**
 * Hàm xử lý hợp nhất: Tự động phát hiện Tra cứu hay Hỏi Đạo.
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
        // Giao phó toàn bộ cho Master AI (Xử lý Omnibox Routing)
        // Master AI sẽ tự động hiển thị Loading và render kết quả vào container
        const resultType = await MasterAI.processQuery(input, container);

        // -------------------------------------------------------------
        // ĐIỀU KHIỂN UI DỰA TRÊN KẾT QUẢ
        // -------------------------------------------------------------
        if (resultType && resultType.type === 'search') {
            // [TRƯỜNG HỢP 1] Tìm kiếm danh sách thông thường
            // -> Hiện lại bộ lọc và phân trang
            if (filterBar) filterBar.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            
            // [FIX LAYOUT] Khôi phục Grid cho danh sách thẻ tác phẩm
            if (containerId === 'heritage-grid') {
                container.style.display = 'grid';
            }
            
            // Gọi hàm render danh sách (từ render.js)
            if (fallbackRenderFn) fallbackRenderFn();
        } else {
            // [TRƯỜNG HỢP 2] Câu hỏi (AI đã trả lời)
            // -> Ẩn bộ lọc và phân trang để có không gian rộng rãi cho câu trả lời
            if (filterBar) filterBar.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
            
            // [FIX LAYOUT] Chuyển từ Grid sang Block để khung AI không bị bóp méo
            if (containerId === 'heritage-grid') {
                container.style.display = 'block';
            }
        }

    } catch (err) {
        console.error('[SMART SEARCH UI] Lỗi:', err);
        // Nếu có lỗi xảy ra ở tầng UI (không phải tầng AI), hiển thị thông báo an toàn
        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-answer">Đã xảy ra lỗi giao diện: ${err.message}</div>
            </div>
        `;
        // Ẩn filter/pagination để thông báo lỗi hiển thị rõ ràng
        if (filterBar) filterBar.style.display = 'none';
        if (pagination) pagination.style.display = 'none';
    }
}

/**
 * Khôi phục giao diện tìm kiếm mặc định khi người dùng xóa chữ
 * (Hoặc khi bấm nút X).
 * 
 * @param {Object} options - Cấu hình (cần thêm containerId và btnId)
 */
export function resetSearchState(options) {
    const { inputId, containerId, filterBarId, paginationId, fallbackRenderFn } = options;
    const input = document.getElementById(inputId);
    
    // Nút X có thể là của Văn Hiến hoặc Bách Khoa
    const clearBtn = document.getElementById(options.btnId || 'clear-search-btn'); 
    
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
    
    // 4. [FIX LAYOUT] Khôi phục Grid nếu là khung Văn Hiến
    const container = document.getElementById(containerId);
    if (container && containerId === 'heritage-grid') {
        container.style.display = 'grid';
    }
    
    // 5. Render lại danh sách mặc định
    if (fallbackRenderFn) fallbackRenderFn();
}
