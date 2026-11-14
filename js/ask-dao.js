/**
 * ==========================================================
 * NGỌC THANH - HỎI ĐẠO UI CONTROLLER (js/ask-dao.js)
 * Vị trí: js/ask-dao.js
 * Version: 3.2.1 (Fixed duplicate import error)
 * ==========================================================
 */

// Đảm bảo CHỈ CÓ DUY NHẤT 1 dòng import này
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
        // Gọi MasterAI xử lý
        const resultType = await MasterAI.processQuery(input, container);

        if (resultType && resultType.type === 'search') {
            if (filterBar) filterBar.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            if (containerId === 'heritage-grid') container.style.display = 'grid';
            if (fallbackRenderFn) fallbackRenderFn();
        } else {
            if (filterBar) filterBar.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
            if (containerId === 'heritage-grid') container.style.display = 'block';
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
    const { inputId, containerId, filterBarId, paginationId, fallbackRenderFn, btnId } = options;
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(btnId || 'clear-search-btn'); 
    
    if (input) { input.value = ''; input.focus(); }
    if (clearBtn) clearBtn.classList.remove('show');

    const container = document.getElementById(containerId);
    if (container && containerId === 'heritage-grid') {
        container.style.display = 'grid';
    }

    const filterBar = document.getElementById(filterBarId);
    const pagination = document.getElementById(paginationId);
    if (filterBar) filterBar.style.display = 'flex';
    if (pagination) pagination.style.display = 'flex';
    
    if (fallbackRenderFn) fallbackRenderFn();
}
