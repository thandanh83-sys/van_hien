/**
 * ==========================================================
 * VĂN ĐẠO - HỎI ĐẠO UI CONTROLLER (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 3.0.0 (Unified Semantic Routing)
 * ==========================================================
 * TRIẾT LÝ:
 * - Không xử lý dữ liệu ở đây. Mọi thứ giao phó cho MasterAI.
 * - UI chỉ phản ứng với kết quả trả về (type: 'search' hoặc 'answered').
 * ==========================================================
 */

import { MasterAI } from './ai/master.js';

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
        // MasterAI.processQuery sẽ tự động dùng SmartInputParser để quyết định
        // xem đây là Search hay Ask Dạo.
        const resultType = await MasterAI.processQuery(input, container);

        if (resultType && resultType.type === 'search') {
            if (filterBar) filterBar.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            if (fallbackRenderFn) fallbackRenderFn();
        } else {
            // Đã trả lời bằng Ask Dạo (Pipeline/Search dẫn dắt)
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
