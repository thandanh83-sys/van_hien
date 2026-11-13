/**
 * ==========================================================
 * VĂN ĐẠO - HỎI ĐẠO & TRA CỨU UI (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 1.0.4 (Smart Search Integration)
 * ==========================================================
 * CHỨC NĂNG:
 * - Hợp nhất Tra Cứu và Hỏi Đạo vào một luồng xử lý duy nhất.
 * - Tự động phát hiện ý định (Intent) của người dùng.
 * - Nếu là câu hỏi -> Hiển thị khối "Lời Đáp" (Ask Result).
 * - Nếu là từ khóa -> Chuyển về giao diện tìm kiếm mặc định.
 * ==========================================================
 */

import { AIDispatcher } from './ai.js';
import { escapeHTML } from './utils.js';
import { searchEncyclopedia } from './render.js';

/**
 * Hàm xử lý hợp nhất: Tự động phát hiện Tra cứu hay Hỏi Đạo
 */
export async function handleSmartSearch() {
    const input = document.getElementById('encyclopedia-search');
    const container = document.getElementById('encyclopedia-container');
    if (!input || !container) return;

    const text = input.value.trim();
    if (!text) {
        // Nếu ô trống, reset lại giao diện mặc định
        resetToDefaultSearch();
        return;
    }

    const filterBar = document.getElementById('encyclopedia-filter-bar');
    const pagination = document.getElementById('encyclopedia-pagination');

    // Hiển thị trạng thái chờ
    if (filterBar) filterBar.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    
    container.innerHTML = `
        <div class="ask-loading">
            <div class="spinner"></div>
            <p>Đang kết nối tri thức...</p>
        </div>
    `;

    try {
        // 1. Phân tích ý định
        const intent = AIDispatcher.parseIntent(text);
        
        // 2. Nếu chỉ là tìm kiếm từ khóa bình thường
        if (intent.type === 'search' || intent.type === 'empty') {
            if (filterBar) filterBar.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            searchEncyclopedia(); // Chạy lại hàm search cũ trong render.js
            return;
        }

        // 3. Nếu là câu hỏi (Hỏi Đạo) -> Gọi AI Dispatcher
        const result = await AIDispatcher.dispatch(intent);
        renderAnswer(container, result, text);

    } catch (err) {
        console.error('[SMART SEARCH] Lỗi:', err);
        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-answer">Đã xảy ra lỗi: ${escapeHTML(err.message)}</div>
            </div>
        `;
    }
}

/**
 * Khôi phục giao diện tìm kiếm mặc định
 */
function resetToDefaultSearch() {
    const filterBar = document.getElementById('encyclopedia-filter-bar');
    const pagination = document.getElementById('encyclopedia-pagination');
    if (filterBar) filterBar.style.display = 'flex';
    if (pagination) pagination.style.display = 'flex';
    
    // Gọi hàm render lại danh sách mặc định (Triết Thuyết)
    import('./render.js').then(m => m.renderEncyclopedia());
}

/**
 * Render câu trả lời của AI ra giao diện
 */
function renderAnswer(container, result, query) {
    let metaList = '';

    // Tạo danh sách các nút liên kết (Meta items)
    if (result.meta && Array.isArray(result.meta)) {
        const validMetas = result.meta.filter(m => m.id && (m.title || m.name));

        if (validMetas.length > 0) {
            metaList = `
                <div class="ask-meta-list">
                    ${validMetas.map(m => {
                        const title = m.title || m.name || m.id;
                        let group = m._group;
                        
                        // Fallback xác định group nếu thiếu
                        if (!group) {
                            if (m.id.startsWith('tac-gia')) group = 'ky-tai';
                            else if (m.id.startsWith('quyen')) group = 'triet-thuyet';
                            else if (m.id.startsWith('tho-') || m.id.startsWith('truyen-')) group = 'the-loai';
                            else group = 'tinh-hoa';
                        }
                        
                        return `
                            <button type="button" class="ask-meta-item"
                                data-route-encyclopedia="true"
                                data-route-id="${escapeHTML(m.id)}"
                                data-route-group="${escapeHTML(group)}"
                                data-route-title="${escapeHTML(title)}">
                                ${escapeHTML(title)}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }
    }

    // Map tên hiển thị của các Phân khu / Máy
    const sourceLabels = {
        'node-triet-thuyet': 'Phân khu Triết Thuyết',
        'node-ky-tai':       'Phân khu Kỳ Tài',
        'node-tinh-hoa':     'Phân khu Tinh Hoa',
        'node-the-loai':     'Phân khu Thể Loại',
        'search-engine':     'Đang tìm kiếm',
        'mother-local':      'Máy Mẹ (Cục bộ)',
        'mother-00':         'Máy Mẹ'
    };
    const sourceLabel = sourceLabels[result.source] || result.source || 'Không rõ';

    // Render HTML
    container.innerHTML = `
        <div class="ask-result">
            <div class="ask-source">
                <span class="ask-source-dot"></span>
                ${escapeHTML(sourceLabel)}
            </div>
            <div class="ask-query">Hỏi: "${escapeHTML(query)}"</div>
            <div class="ask-answer">${escapeHTML(result.answer || '')}</div>
            ${result.detail ? `<div class="ask-detail">${escapeHTML(result.detail)}</div>` : ''}
            ${metaList}
        </div>
    `;
}