/**
 * ==========================================================
 * VĂN ĐẠO - SEARCH ENGINE MODULE (js/search.js)
 * Chức năng: Tìm kiếm thông minh, không phân biệt dấu (VDSearchEngine).
 * Áp dụng: Inverted Index để tìm kiếm với tốc độ O(1).
 * ==========================================================
 */

import { CONFIG } from './config.js';

// Biến lưu trữ Index (Từ khóa -> Mảng các ID)
let invertedIndex = {};
// Biến lưu trữ dữ liệu gốc để lấy thông tin hiển thị
let searchData = [];

/**
 * ==========================================
 * 1. HÀM CHUẨN HÓA TIẾNG VIỆT (XÓA DẤU)
 * Ví dụ: "Nguyễn Trãi" -> "nguyen trai"
 * ==========================================
 */
function removeDiacritics(str) {
    if (!str) return '';
    return str
        .normalize('NFD') // Tách các dấu ra khỏi chữ cái
        .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu thanh
        .replace(/đ/g, 'd') // Xử lý chữ đ
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
}

/**
 * ==========================================
 * 2. HÀM TÁCH TỪ (TOKENIZER)
 * Cắt câu thành các từ đơn, xóa dấu câu.
 * ==========================================
 */
function tokenize(text) {
    const normalized = removeDiacritics(text);
    // Thay thế các ký tự đặc biệt bằng khoảng trắng, sau đó cắt theo khoảng trắng
    return normalized.replace(/[^\w\s]/gi, ' ').split(/\s+/).filter(word => word.length > 0);
}

/**
 * ==========================================
 * 3. XÂY DỰNG INVERTED INDEX (Tạo bộ não tìm kiếm)
 * Chạy 1 lần duy nhất khi load app. Chỉ dùng file Index nhẹ.
 * ==========================================
 */
export async function buildSearchIndex() {
    try {
        console.log("[Search Engine] Đang xây dựng Inverted Index...");
        
        // Tải file Index tác phẩm (Nhẹ, không chứa nội dung chi tiết)
        const res = await fetch(CONFIG.DATA_PATHS.TAC_PHAM_INDEX);
        searchData = await res.json();
        
        invertedIndex = {}; // Reset index

        searchData.forEach(item => {
            const id = item.id;
            // Gộp Tên tác phẩm và Tên tác giả để tìm kiếm
            const textToIndex = `${item.ten_tac_pham || ''} ${item.tac_gia || ''}`;
            const words = tokenize(textToIndex);

            // Đưa từng từ vào Index
            words.forEach(word => {
                if (!invertedIndex[word]) {
                    invertedIndex[word] = new Set(); // Dùng Set để tránh trùng lặp ID
                }
                invertedIndex[word].add(id);
            });
        });

        console.log(`[Search Engine] Đã index xong ${searchData.length} tác phẩm.`);
        return true;
    } catch (error) {
        console.error("[Search Engine] Lỗi xây dựng Index:", error);
        return false;
    }
}

/**
 * ==========================================
 * 4. HÀM TÌM KIẾM CHÍNH (SEARCH)
 * Nhận câu truy vấn từ người dùng -> Trả về danh sách kết quả.
 * ==========================================
 */
export function searchWorks(query) {
    if (!query || query.trim() === '') return [];

    const queryWords = tokenize(query);
    if (queryWords.length === 0) return [];

    // Tìm giao (Intersection) của các tập hợp ID chứa từng từ khóa
    let matchedIds = null;

    queryWords.forEach(word => {
        // Tìm các ID chứa từ này (hỗ trợ tìm gần đúng: gõ "ngu" ra "nguyen")
        let currentMatches = new Set();
        
        Object.keys(invertedIndex).forEach(indexWord => {
            if (indexWord.includes(word)) {
                invertedIndex[indexWord].forEach(id => currentMatches.add(id));
            }
        });

        // Nếu là từ đầu tiên, gán làm gốc
        if (matchedIds === null) {
            matchedIds = currentMatches;
        } else {
            // Nếu là các từ tiếp theo, phải chứa TẤT CẢ các từ (Phép giao)
            matchedIds = new Set([...matchedIds].filter(id => currentMatches.has(id)));
        }
    });

    if (!matchedIds || matchedIds.size === 0) return [];

    // Lấy thông tin chi tiết của các ID tìm được từ mảng searchData gốc
    const results = searchData.filter(item => matchedIds.has(item.id));
    
    return results;
}

/**
 * ==========================================
 * 5. KHỞI TẠO SỰ KIỆN TÌM KIẾM (Gắn vào ô Input)
 * ==========================================
 */
export function initSearch(inputElement) {
    if (!inputElement) return;

    // Gắn sự kiện khi người dùng gõ phím (Debounce để không spam tìm kiếm)
    let timeout = null;
    inputElement.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const query = e.target.value;
            const results = searchWorks(query);
            renderSearchResults(results, query);
        }, 300); // Đợi 300ms sau khi ngừng gõ mới bắt đầu tìm
    });
}

/**
 * ==========================================
 * 6. HIỂN THỊ KẾT QUẢ TÌM KIẾM (UI)
 * ==========================================
 */
function renderSearchResults(results, query) {
    const container = document.getElementById('search-results');
    if (!container) return;

    // Nếu ô tìm kiếm trống, ẩn kết quả
    if (!query || query.trim() === '') {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    if (results.length === 0) {
        container.innerHTML = `<div class="no-result">Không tìm thấy kết quả cho "${query}"</div>`;
        return;
    }

    // Render danh sách kết quả
    let html = `<div class="search-results-list">`;
    results.forEach(item => {
        // Làm nổi bật từ khóa tìm kiếm (có thể dùng CSS)
        html += `
            <div class="search-item" onclick="window.navigateTo('doc-bai', '${item.id}')">
                <h4 class="search-title">${item.ten_tac_pham}</h4>
                <p class="search-author">${item.tac_gia}</p>
            </div>
        `;
    });
    html += `</div>`;
    
    container.innerHTML = html;
}