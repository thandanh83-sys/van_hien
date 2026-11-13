/**
 * ==========================================================
 * VĂN ĐẠO AI - OUTPUT AI (js/ai/output-ai.js)
 * Chức năng: Định dạng kết quả thành HTML để hiển thị
 * ==========================================================
 */

import { escapeHTML } from '../utils.js';

export const OutputAI = {
    /**
     * Render câu trả lời ra màn hình
     */
    render(container, result, query) {
        let metaList = '';

        // Tạo danh sách nút liên kết (nếu có)
        if (result.meta && Array.isArray(result.meta)) {
            const validMetas = result.meta.filter(m => m.id && (m.title || m.name));
            if (validMetas.length > 0) {
                metaList = `
                    <div class="ask-meta-list">
                        ${validMetas.map(m => {
                            const title = m.title || m.name || m.id;
                            let group = m._group || 'tinh-hoa';
                            if (m.id.startsWith('tac-gia')) group = 'ky-tai';
                            else if (m.id.startsWith('quyen')) group = 'triet-thuyet';
                            
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

        const sourceLabels = {
            'local-data': 'Dữ liệu nội bộ',
            'dictionary': 'Từ điển',
            'search-engine': 'Tìm kiếm',
            'analysis': 'Phân tích',
            'master': 'Hệ thống',
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
    },

    renderLoading(container) {
        container.innerHTML = `
            <div class="ask-loading">
                <div class="spinner"></div>
                <p>Đang kết nối tri thức...</p>
            </div>
        `;
    },

    renderError(container, message) {
        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-answer">Đã xảy ra lỗi: ${escapeHTML(message)}</div>
            </div>
        `;
    }
};