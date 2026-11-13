/**
 * ==========================================================
 * VĂN ĐẠO - HỎI ĐẠO UI (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 1.0.0 (Network Edition)
 * ==========================================================
 * Chức năng:
 * - Giao diện đối thoại với mạng lưới tri thức (AI).
 * - Được gọi khi người dùng gõ câu hỏi và nhấn Enter
 *   ở chế độ "Hỏi Đạo" trong Bách Khoa.
 * ==========================================================
 */

import { AIDispatcher } from './ai.js';
import { escapeHTML } from './utils.js';

/**
 * Hàm chính: Xử lý câu hỏi từ người dùng
 */
export async function askDao() {
    const input = document.getElementById('encyclopedia-search');
    const container = document.getElementById('encyclopedia-container');
    if (!input || !container) return;

    const text = input.value.trim();
    if (!text) return;

    // Ẩn thanh bộ lọc (filter bar)
    const filterBar = document.getElementById('encyclopedia-filter-bar');
    if (filterBar) filterBar.style.display = 'none';

    // Hiển thị trạng thái đang tải
    container.innerHTML = `
        <div class="ask-loading">
            <div class="spinner"></div>
            <p>Đang hỏi mạng lưới...</p>
        </div>
    `;

    try {
        // 1. Phân tích ý định (Intent)
        const intent = AIDispatcher.parseIntent(text);
        
        // 2. Gửi yêu cầu đến AI Dispatcher
        const result = await AIDispatcher.dispatch(intent);
        
        // 3. Hiển thị kết quả
        renderAnswer(container, result, text);

    } catch (err) {
        console.error('[ASK DAO] Lỗi:', err);
        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-answer">Lỗi: ${escapeHTML(err.message)}</div>
            </div>
        `;
    }
}

/**
 * Render câu trả lời ra giao diện
 */
function renderAnswer(container, result, query) {
    let metaList = '';

    // 1. Tạo danh sách các nút liên kết (Meta items)
    if (result.meta && Array.isArray(result.meta)) {
        const validMetas = result.meta.filter(m => m.id && (m.title || m.name));

        if (validMetas.length > 0) {
            metaList = `
                <div class="ask-meta-list">
                    ${validMetas.map(m => {
                        const title = m.title || m.name || m.id;
                        
                        // Xác định group cho Router (để link đúng)
                        let group = m._group;
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

    // 2. Map tên nguồn dữ liệu
    const sourceLabels = {
        'node-triet-thuyet': 'Máy Con · Triết Thuyết',
        'node-ky-tai':       'Máy Con · Kỳ Tài',
        'node-tinh-hoa':     'Máy Con · Tinh Hoa',
        'node-the-loai':     'Máy Con · Thể Loại',
        'search-engine':     'Cỗ Máy Tìm Kiếm',
        'mother-local':      'Máy Mẹ (cục bộ)',
        'mother-00':         'Máy Mẹ'
    };
    const sourceLabel = sourceLabels[result.source] || result.source || 'Không rõ';

    // 3. Render HTML
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