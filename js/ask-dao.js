/**
 * ==========================================================
 * VĂN ĐẠO - HỎI ĐẠO UI (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 1.1.0 (Smart Search Integration)
 * ==========================================================
 * CHỨC NĂNG:
 * - Hợp nhất logic Tra Cứu và Hỏi Đạo.
 * - Tự động phát hiện ý định để gọi AI hoặc Tìm kiếm.
 * - Render câu trả lời của AI (Ask Result) với UI tinh tế.
 * ==========================================================
 */

import { AIDispatcher } from './ai.js';
import { escapeHTML } from './utils.js';

/**
 * Hàm xử lý hợp nhất: Tự động phát hiện Tra cứu hay Hỏi Đạo
 * @param {Object} options - Cấu hình cho từng view (Văn Hiến hoặc Bách Khoa)
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
        // 1. Phân tích ý định người dùng
        const intent = AIDispatcher.parseIntent(text);
        
        // 2. Nếu là tìm kiếm thông thường hoặc rỗng -> Chuyển về Search Engine
        if (intent.type === 'search' || intent.type === 'empty') {
            if (filterBar) filterBar.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            if (fallbackRenderFn) fallbackRenderFn();
            return;
        }

        // 3. Nếu là câu hỏi chuyên sâu -> Gọi AI Dispatcher
        const result = await AIDispatcher.dispatch(intent);
        renderAnswer(container, result, text);

    } catch (err) {
        console.error('[SMART SEARCH] Lỗi:', err);
        container.innerHTML = `<div class="ask-result ask-error"><div class="ask-answer">Đã xảy ra lỗi: ${escapeHTML(err.message)}</div></div>`;
    }
}

/**
 * Khôi phục giao diện tìm kiếm mặc định khi người dùng xóa chữ
 */
export function resetSearchState(options) {
    const { inputId, filterBarId, paginationId, fallbackRenderFn } = options;
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById('clear-search-btn');
    
    if (input) { input.value = ''; input.focus(); }
    if (clearBtn) clearBtn.classList.remove('show');

    const filterBar = document.getElementById(filterBarId);
    const pagination = document.getElementById(paginationId);
    if (filterBar) filterBar.style.display = 'flex';
    if (pagination) pagination.style.display = 'flex';
    
    if (fallbackRenderFn) fallbackRenderFn();
}

/**
 * Render câu trả lời của AI ra giao diện
 */
function renderAnswer(container, result, query) {
    let metaList = '';

    // Tạo danh sách các nút liên kết (Meta items) nếu có
    if (result.meta && Array.isArray(result.meta)) {
        const validMetas = result.meta.filter(m => m.id && (m.title || m.name));

        if (validMetas.length > 0) {
            metaList = `
                <div class="ask-meta-list">
                    ${validMetas.map(m => {
                        const title = m.title || m.name || m.id;
                        let group = m._group;
                        
                        // Tự động xác định group nếu thiếu
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
        'local-data': 'Dữ liệu nội bộ',
        'dictionary': 'Từ điển',
        'search-engine': 'Tìm kiếm',
        'error': 'Lỗi'
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