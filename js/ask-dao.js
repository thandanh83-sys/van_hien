/**
 * ==========================================================
 * VĂN ĐẠO - HỎI ĐẠO UI (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 1.0.1 (Refined Words)
 * ==========================================================
 */

import { AIDispatcher } from './ai.js';
import { escapeHTML } from './utils.js';

export async function askDao() {
    const input = document.getElementById('encyclopedia-search');
    const container = document.getElementById('encyclopedia-container');
    if (!input || !container) return;

    const text = input.value.trim();
    if (!text) return;

    // Ẩn thanh bộ lọc (filter bar) và phân trang (pagination)
    const filterBar = document.getElementById('encyclopedia-filter-bar');
    const pagination = document.getElementById('encyclopedia-pagination');
    if (filterBar) filterBar.style.display = 'none';
    if (pagination) pagination.style.display = 'none';

    container.innerHTML = `
        <div class="ask-loading">
            <div class="spinner"></div>
            <p>Đang hỏi mạng lưới...</p>
        </div>
    `;

    try {
        const intent = AIDispatcher.parseIntent(text);
        const result = await AIDispatcher.dispatch(intent);
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

function renderAnswer(container, result, query) {
    let metaList = '';

    if (result.meta && Array.isArray(result.meta)) {
        const validMetas = result.meta.filter(m => m.id && (m.title || m.name));

        if (validMetas.length > 0) {
            metaList = `
                <div class="ask-meta-list">
                    ${validMetas.map(m => {
                        const title = m.title || m.name || m.id;
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

    // [FIX LỖI 4 & 6] Đổi từ ngữ hiển thị
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