/**
 * ==========================================================
 * VĂN ĐẠO - HỎI ĐẠO & TRA CỨU UI (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 1.0.8 (Smart Search Integration)
 * ==========================================================
 */

import { AIDispatcher } from './ai.js';
import { escapeHTML } from './utils.js';

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

    if (filterBar) filterBar.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    
    container.innerHTML = `
        <div class="ask-loading">
            <div class="spinner"></div>
            <p>Đang kết nối tri thức...</p>
        </div>
    `;

    try {
        const intent = AIDispatcher.parseIntent(text);
        
        // Nếu chỉ là tìm kiếm từ khóa bình thường
        if (intent.type === 'search' || intent.type === 'empty') {
            if (filterBar) filterBar.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            if (fallbackRenderFn) fallbackRenderFn();
            return;
        }

        // Nếu là câu hỏi -> Gọi AI
        const result = await AIDispatcher.dispatch(intent);
        renderAnswer(container, result, text);

    } catch (err) {
        console.error('[SMART SEARCH] Lỗi:', err);
        container.innerHTML = `<div class="ask-result ask-error"><div class="ask-answer">Đã xảy ra lỗi: ${escapeHTML(err.message)}</div></div>`;
    }
}

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
                        return `<button type="button" class="ask-meta-item" data-route-encyclopedia="true" data-route-id="${escapeHTML(m.id)}" data-route-group="${escapeHTML(group)}" data-route-title="${escapeHTML(title)}">${escapeHTML(title)}</button>`;
                    }).join('')}
                </div>
            `;
        }
    }

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
            <div class="ask-source"><span class="ask-source-dot"></span>${escapeHTML(sourceLabel)}</div>
            <div class="ask-query">Hỏi: "${escapeHTML(query)}"</div>
            <div class="ask-answer">${escapeHTML(result.answer || '')}</div>
            ${result.detail ? `<div class="ask-detail">${escapeHTML(result.detail)}</div>` : ''}
            ${metaList}
        </div>
    `;
}