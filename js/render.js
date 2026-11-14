/**
 * ==========================================================
 * VĂN ĐẠO — RENDER MODULE
 * Vị trí: js/render.js
 * Version: 3.0.0 (Contemplative UI — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. KHÔNG CHẤM ĐIỂM (No Scoring):
 *    - Không có hàm nào render điểm số.
 *    - Không có UI nào hiển thị "8.5/10".
 *    - Chỉ có câu hỏi chiêm nghiệm và lời gợi mở.
 *
 * 2. TÁCH BIỆT RENDER LOGIC:
 *    - renderHeritage:       Văn Hiến (danh sách tác phẩm)
 *    - renderEncyclopedia:   Bách Khoa (accordion)
 *    - renderPagination:     Phân trang
 *    - renderContemplativeQuestions: [MỚI] Câu hỏi chiêm nghiệm
 *    - renderCopyButton:     [MỚI] Nút copy từng tầng
 *    - showToast:            [MỚI] Thông báo Bạch Ngọc
 *    - renderSkeleton:       [MỚI] Skeleton loading
 *
 * 3. UI BẠCH NGỌC:
 *    - Không gradient neon.
 *    - Không emoji.
 *    - Chỉ dùng CSS variables (--accent, --accent-gold, --text-main...).
 *
 * 4. TƯƠNG THÍCH NGƯỢC:
 *    - Tất cả export cũ vẫn giữ nguyên.
 *    - main.js cũ vẫn chạy được nếu chưa cập nhật.
 *    - Chỉ THÊM các hàm mới, không XÓA hàm cũ.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v2.3.0: (tiền thân) Clean UI & Intent Router UX.
 * - v3.0.0: Thêm Contemplative UI (không chấm điểm), Toast, Skeleton,
 *           Copy button. Giữ nguyên tất cả chức năng cũ.
 *
 * ==========================================================
 */

import { APP_DATA, STATE, ICONS, ITEMS_PER_PAGE, ENCY_ITEMS_PER_PAGE } from './config.js';
import { escapeHTML, normalizeRouteId, highlightText, formatContent, removeAccents } from './utils.js';
import { VDSearchEngine } from './search.js';
import { DataHub } from './network/data-hub.js';

// =====================================================================
// MODULE 1: LAZY LOAD (TỐI ƯU HIỆU NĂNG CUỘN)
// =====================================================================
export const PerformanceEngine = (() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px 400px 0px", threshold: 0.01 });

    return {
        observe: (sel) => document.querySelectorAll(sel).forEach(el => observer.observe(el))
    };
})();

// =====================================================================
// MODULE 2: BẠCH NGỌC UI HELPERS (MỚI)
// =====================================================================

/**
 * Hiển thị Toast thông báo (style Bạch Ngọc — không emoji, không neon).
 *
 * @param {string} message - Nội dung thông báo
 * @param {string} type    - 'success' | 'error' | 'info'
 * @param {number} duration - Thời gian hiển thị (ms), mặc định 2500
 */
export function showToast(message, type = 'success', duration = 2500) {
    // Tạo container nếu chưa có
    let container = document.getElementById('vd-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'vd-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    // Icon SVG theo type
    const icons = {
        success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
        info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    // Tạo toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #ffffff;
        color: var(--text-main);
        font-family: var(--font-body);
        font-size: 1rem;
        font-style: italic;
        padding: 14px 24px;
        border-radius: var(--radius-pill);
        border: 1px solid var(--border-color);
        border-left: 3px solid ${type === 'error' ? 'var(--color-error)' : 'var(--accent)'};
        box-shadow: var(--shadow-solid);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s var(--ease-silk);
        display: flex;
        align-items: center;
        gap: 10px;
        pointer-events: auto;
        max-width: 90vw;
    `;

    toast.innerHTML = `
        <span style="color: ${type === 'error' ? 'var(--color-error)' : 'var(--accent)'}; flex-shrink: 0;">
            ${icons[type] || icons.info}
        </span>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    // Hiện toast
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Tự động ẩn
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Render câu hỏi chiêm nghiệm (thay thế hoàn toàn điểm số).
 *
 * @param {Array} questions - Mảng câu hỏi từ ContemplativeEngine
 * @returns {string} HTML
 */
export function renderContemplativeQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
        return `<p style="font-style: italic; color: var(--text-muted); text-align: center; padding: 20px 0;">
            Chưa có gợi mở nào. Mời Bạn đọc chậm lại và tự cảm nhận.
        </p>`;
    }

    // Biểu tượng hoa văn (SVG, không emoji)
    const fleuronSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-gold); flex-shrink: 0;"><path d="M12 2C9 5 6 8 6 12s3 7 6 10c3-3 6-6 6-10s-3-7-6-10z"></path><path d="M12 2v20"></path></svg>`;

    return questions.map(q => `
        <div class="contemplative-question" style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px dashed rgba(46, 139, 87, 0.15); line-height: 1.7;">
            ${fleuronSvg}
            <div style="flex: 1;">
                ${q.quote ? `<div style="font-style: italic; color: var(--accent-text); margin-bottom: 6px;">“${escapeHTML(q.quote)}”</div>` : ''}
                <div>${q.question}</div>
            </div>
        </div>
    `).join('');
}

/**
 * Render nút copy từng tầng (chỉ hiện khi hover).
 *
 * @param {string} textToCopy - Nội dung cần copy
 * @param {string} label      - Nhãn (mặc định: 'Chép')
 * @returns {string} HTML
 */
export function renderCopyButton(textToCopy, label = 'Chép') {
    const penSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;

    // Mã hóa nội dung để tránh lỗi HTML
    const encoded = encodeURIComponent(textToCopy);

    return `
        <button type="button"
                class="btn-copy-section"
                data-copy-content="${encoded}"
                onclick="(function(btn){
                    const content = decodeURIComponent(btn.getAttribute('data-copy-content'));
                    if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(content).then(function(){
                            btn.classList.add('copied');
                            const original = btn.innerHTML;
                            btn.innerHTML = '${penSvg} Đã chép';
                            setTimeout(function(){
                                btn.classList.remove('copied');
                                btn.innerHTML = original;
                            }, 1800);
                        });
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = content;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); } catch(e) {}
                        document.body.removeChild(ta);
                        btn.classList.add('copied');
                        const original = btn.innerHTML;
                        btn.innerHTML = '${penSvg} Đã chép';
                        setTimeout(function(){
                            btn.classList.remove('copied');
                            btn.innerHTML = original;
                        }, 1800);
                    }
                })(this)"
                title="Chép nội dung này"
                style="
                    background: rgba(255, 255, 255, 0.9);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-sm);
                    padding: 4px 10px;
                    font-family: var(--font-body);
                    font-size: 0.75rem;
                    font-style: italic;
                    color: var(--text-muted);
                    cursor: pointer;
                    opacity: 0;
                    transition: all 0.3s var(--ease-silk);
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    float: right;
                ">
            ${penSvg} ${label}
        </button>
    `;
}

/**
 * Render Skeleton loading (style Bạch Ngọc).
 *
 * @param {number} count - Số item skeleton
 * @returns {string} HTML
 */
export function renderSkeleton(count = 3) {
    const items = Array.from({ length: count }, () => `
        <div class="skeleton-bach-ngoc" style="height: 180px; border-radius: var(--radius-card); margin-bottom: 12px;"></div>
    `).join('');

    return `<div class="skeleton-wrapper">${items}</div>`;
}

// =====================================================================
// MODULE 3: VĂN HIẾN (DANH SÁCH TÁC PHẨM)
// =====================================================================

export function initMainFilters() {
    const mainBar = document.getElementById('main-filter-bar');
    if (!mainBar || !APP_DATA.WORKS_DATA.length) return;

    let html = `<button class="filter-btn active" onclick="window.filterMainCategory('all', this)">Tất cả</button>`;
    Object.keys(APP_DATA.CATEGORY_NAMES).forEach(cat => {
        html += `<button class="filter-btn" onclick="window.filterMainCategory('${cat}', this)">${APP_DATA.CATEGORY_NAMES[cat]}</button>`;
    });
    mainBar.innerHTML = html;
}

export function filterMainCategory(category, btnElement) {
    STATE.currentMainCat = category;
    STATE.currentGenre = 'all';
    STATE.currentPage = 1;

    document.querySelectorAll('#main-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const subBar = document.getElementById('sub-filter-bar');
    if (!subBar) return;

    if (category === 'all') {
        subBar.style.display = 'none';
        renderHeritage();
        return;
    }

    const itemsInCat = APP_DATA.WORKS_DATA.filter(i => i.loai_hinh === category);
    const uniqueGenres = new Set();
    itemsInCat.forEach(i => {
        if (Array.isArray(i.the_loai)) i.the_loai.forEach(g => uniqueGenres.add(g));
    });

    if (!uniqueGenres.size) {
        subBar.style.display = 'none';
    } else {
        subBar.style.display = 'flex';
        let html = `<button class="filter-btn active" onclick="window.filterSubGenre('all', this)" style="padding:6px 16px;font-size:0.8rem;">Tất cả thể loại</button>`;
        Array.from(uniqueGenres).sort().forEach(g => {
            html += `<button class="filter-btn" onclick="window.filterSubGenre('${g}', this)" style="padding:6px 16px;font-size:0.8rem;">${g}</button>`;
        });
        subBar.innerHTML = html;
    }
    renderHeritage();
}

export function filterSubGenre(genre, btnElement) {
    STATE.currentGenre = genre;
    STATE.currentPage = 1;
    document.querySelectorAll('#sub-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderHeritage();
}

export function renderHeritage() {
    const grid = document.getElementById('heritage-grid');
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (!grid) return;

    let data = APP_DATA.WORKS_DATA;
    if (STATE.currentMainCat !== 'all') data = data.filter(i => i.loai_hinh === STATE.currentMainCat);
    if (STATE.currentGenre !== 'all') data = data.filter(i => i.the_loai?.includes(STATE.currentGenre));
    if (keyword) {
        data = data.filter(i =>
            i.title.toLowerCase().includes(keyword) ||
            i.author.toLowerCase().includes(keyword) ||
            (i.desc && i.desc.toLowerCase().includes(keyword))
        );
    }

    // === XỬ LÝ KHI KHÔNG CÓ KẾT QUẢ (INTENT ROUTER UX) ===
    if (!data.length) {
        const isQuestion = /[?]|\b(la ai|la gi|the nao|tai sao|nhu the nao|ai viet)\b/i.test(keyword);

        if (isQuestion) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:40px;">
                    <p style="font-size:1.1rem; color:var(--text-main); margin-bottom:15px; font-family:var(--font-body);">
                        Có vẻ Bạn đang đặt một câu hỏi?
                    </p>
                    <p style="color:var(--text-muted);font-style:italic;margin-bottom:20px;">
                        Nhấn <strong>Enter</strong> hoặc click nút bên dưới để Hỏi Đạo AI.
                    </p>
                    <button class="btn-ask-ai" onclick="window.triggerSmartSearch('search-input', 'heritage-grid', 'main-filter-bar', 'pagination-container')">
                        Hỏi Đạo AI ngay
                    </button>
                </div>
            `;
        } else {
            grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-style:italic;">Không tìm thấy mục từ nào phù hợp.</p>`;
        }
        const pagContainer = document.getElementById('pagination-container');
        if (pagContainer) pagContainer.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    if (STATE.currentPage > totalPages) STATE.currentPage = totalPages;
    if (STATE.currentPage < 1) STATE.currentPage = 1;
    const paged = data.slice((STATE.currentPage - 1) * ITEMS_PER_PAGE, STATE.currentPage * ITEMS_PER_PAGE);

    grid.innerHTML = paged.map(item => {
        const tags = Array.isArray(item.the_loai) ? item.the_loai.map(g => `<span class="h-tag">${g}</span>`).join(' ') : '';
        const btn = item.id ? `<button type="button" class="detail-btn" data-route-encyclopedia="true" data-route-id="${escapeHTML(item.id)}" data-route-group="tinh-hoa" data-route-title="${escapeHTML(item.title)}" data-route-author="${escapeHTML(item.author || '')}">Chi tiết ${ICONS.arrowRight}</button>` : '';
        return `
        <div class="heritage-card" id="heritage-${escapeHTML(normalizeRouteId(item.id))}" data-item-id="${escapeHTML(item.id)}" data-group="tinh-hoa">
            <div style="display:flex;flex-wrap:wrap;margin-bottom:10px;">${tags}</div>
            <h3>${item.title}</h3>
            <div class="h-author">${ICONS.pen} ${item.author}</div>
            <p>${item.desc || ''}</p>
            <div class="h-meta">
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <span>${ICONS.clock} ${item.era || 'Mọi thời đại'}</span>
                    <span>${ICONS.scroll} ${item.script || 'Đa dạng'}</span>
                </div>
                ${btn}
            </div>
        </div>`;
    }).join('');

    renderPagination(totalPages, 'pagination-container', 'heritage');
    const countEl = document.getElementById('heritage-count');
    if (countEl) countEl.textContent = `Tìm thấy ${data.length} tác phẩm`;
    PerformanceEngine.observe('.heritage-card');
}

// =====================================================================
// MODULE 4: CONTENT MANAGER (QUẢN LÝ NỘI DUNG QUA DATAHUB)
// =====================================================================

export const ContentManager = (() => {
    async function load(item, group, signal) {
        try {
            const detail = await DataHub.getDetail(item.id);
            return { content: detail.content || detail.description || '' };
        } catch (err) {
            if (err.name === 'AbortError') console.log(`[CONTENT] Huỷ tải: ${item.id}`);
            throw err;
        }
    }
    return { load, clearCache: () => DataHub.clearCache() };
})();

const accordionAbortControllers = new Map();

export function findEncyclopediaItem(id, group) {
    const meta = DataHub.getMetadata(id);
    return meta ? meta.data : null;
}

export async function ensureAccordionContent(details) {
    if (!details || !details.open) return;
    const itemId = details.dataset.id;
    const group = details.dataset.group;
    const cacheKey = `${group}:${itemId}`;
    const contentDiv = details.querySelector('.accordion-content');

    if (!itemId || !group || !contentDiv || contentDiv.dataset.contentLoaded === 'true' || contentDiv.dataset.loading === 'true') return;

    const controller = new AbortController();
    accordionAbortControllers.set(cacheKey, controller);
    const item = findEncyclopediaItem(itemId, group);

    if (!item) {
        if (accordionAbortControllers.get(cacheKey) === controller) accordionAbortControllers.delete(cacheKey);
        return;
    }

    contentDiv.dataset.loading = 'true';
    contentDiv.innerHTML = `<p style="opacity:.5;font-style:italic;padding:10px;">${ICONS.clock} Đang tải nội dung...</p>`;

    try {
        const data = await ContentManager.load(item, group, controller.signal);

        if (!details.isConnected || !details.open || details.dataset.id !== itemId) return;

        if (data.content && data.content.trim()) {
            contentDiv.innerHTML = formatContent(data.content);
            highlightSymbolsInContent(contentDiv);
            appendRelatedSection(contentDiv, item, group);
        } else {
            contentDiv.innerHTML = `<p style="text-align:center;padding:30px;font-style:italic;">Nội dung đang được Văn Đạo hiệu đính.</p>`;
        }
        contentDiv.dataset.contentLoaded = 'true';
    } catch (err) {
        if (err.name === 'AbortError') return;
        if (!details.isConnected || !details.open) return;
        contentDiv.innerHTML = `<p style="padding:10px;color:var(--text-muted);">Không thể tải nội dung. Hãy thử lại.</p>`;
    } finally {
        delete contentDiv.dataset.loading;
        if (accordionAbortControllers.get(cacheKey) === controller) accordionAbortControllers.delete(cacheKey);
    }
}

export function clearAccordionContent(details) {
    const itemId = details.dataset.id;
    const group = details.dataset.group;
    const cacheKey = `${group}:${itemId}`;

    if (accordionAbortControllers.has(cacheKey)) {
        accordionAbortControllers.get(cacheKey).abort();
        accordionAbortControllers.delete(cacheKey);
    }

    const content = details.querySelector('.accordion-content');
    if (!content) return;

    content.replaceChildren();
    delete content.dataset.contentLoaded;
    delete content.dataset.loading;
}

export function bindEncyclopediaEvents() {
    const container = document.getElementById('encyclopedia-container');
    if (!container || container.dataset.eventBound === 'true') return;
    container.dataset.eventBound = 'true';

    container.addEventListener('toggle', (e) => {
        const details = e.target;
        if (!(details instanceof HTMLDetailsElement)) return;
        if (!details.matches('details[data-id][data-group]')) return;

        if (details.open) {
            container.querySelectorAll('details[open]').forEach(other => {
                if (other !== details) {
                    other.open = false;
                    clearAccordionContent(other);
                }
            });
            ensureAccordionContent(details);
        } else {
            clearAccordionContent(details);
        }
    }, true);
}

// =====================================================================
// MODULE 5: BÁCH KHOA (SẮP XẾP & HIỂN THỊ)
// =====================================================================

export function romanToInt(roman) {
    if (roman === '0') return 0;
    const map = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    let num = 0;
    const s = roman.toLowerCase();
    for (let i = 0; i < s.length; i++) {
        const cur = map[s[i]], nxt = map[s[i + 1]];
        if (nxt && cur < nxt) { num += nxt - cur; i++; } else num += cur;
    }
    return num;
}

export function sortEncyData(data, group) {
    return data.sort((a, b) => {
        if (group === 'triet-thuyet') {
            const getNum = id => {
                const m = id.match(/quyen-([ivxlcdm0-9]+)/i);
                return m ? romanToInt(m[1]) : 999;
            };
            return getNum(a.id) - getNum(b.id);
        }
        const clean = t => t.replace(/^(Quyển [IVXLCDM]+\.|Chân Dung Tác Giả:)\s*/i, '').toLowerCase();
        return clean(a.title || a.name || '').localeCompare(clean(b.title || b.name || ''));
    });
}

export function filterEncyclopediaGroup(group, btnElement) {
    STATE.currentEncyGroup = group;
    STATE.currentEncyPage = 1;

    document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    if (btnElement) {
        btnElement.classList.add('active');
        btnElement.setAttribute('aria-pressed', 'true');
    }

    const si = document.getElementById('encyclopedia-search');
    if (si) si.value = '';
    document.getElementById('clear-search-btn')?.classList.remove('show');
    renderEncyclopedia();
}

export function renderEncyclopediaList(dataToRender, isSearchMode = false, tokens = []) {
    const container = document.getElementById('encyclopedia-container');
    if (!container) return;
    STATE.currentEncyDataForRender = dataToRender;
    container.dataset.searchMode = isSearchMode ? 'true' : 'false';

    if (!dataToRender?.length) {
        container.innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-muted);">Không có dữ liệu.</p>`;
        document.getElementById('encyclopedia-pagination')?.replaceChildren();
        container.dataset.renderedGroup = STATE.currentEncyGroup;
        bindEncyclopediaEvents();
        return;
    }

    const totalPages = Math.ceil(dataToRender.length / ENCY_ITEMS_PER_PAGE);
    if (STATE.currentEncyPage > totalPages) STATE.currentEncyPage = totalPages;
    if (STATE.currentEncyPage < 1) STATE.currentEncyPage = 1;
    const pagedData = dataToRender.slice((STATE.currentEncyPage - 1) * ENCY_ITEMS_PER_PAGE, STATE.currentEncyPage * ENCY_ITEMS_PER_PAGE);

    container.innerHTML = pagedData.map(item => {
        const group = item._group || STATE.currentEncyGroup;
        let displayTitle = item.title || item.name;
        let badge = '';

        if (isSearchMode) {
            displayTitle = highlightText(displayTitle, tokens);
            let bt = group === 'triet-thuyet' ? 'Lý Thuyết' : (group === 'ky-tai' ? 'Tác Giả' : 'Tác Phẩm');
            let bc = group === 'triet-thuyet' ? '#557a6f' : (group === 'ky-tai' ? '#8bb8a8' : '#d4c4a8');
            if (group === 'the-loai') { bt = 'Thể Loại'; bc = '#b89a64'; }
            badge = `<span style="font-size:0.65em;opacity:0.9;color:#fff;background-color:${bc};padding:2px 6px;border-radius:4px;margin-left:8px;white-space:nowrap;font-family:var(--font-body);">${bt}</span>`;
        }

        const safeDomId = `ency-${group}-${normalizeRouteId(item.id).replace(/[^a-z0-9_-]/g, '-')}`;
        return `
        <div class="accordion-item" id="${escapeHTML(safeDomId)}" data-id="${escapeHTML(item.id)}" data-item-id="${escapeHTML(item.id)}" data-group="${escapeHTML(group)}">
            <details data-id="${escapeHTML(item.id)}" data-item-id="${escapeHTML(item.id)}" data-group="${escapeHTML(group)}">
                <summary><span class="summary-title">${displayTitle} ${badge}</span>${ICONS.chevron}</summary>
                <div class="accordion-content"></div>
            </details>
        </div>`;
    }).join('');

    renderPagination(totalPages, 'encyclopedia-pagination', 'encyclopedia');
    container.dataset.renderedGroup = STATE.currentEncyGroup;
    container.dataset.rendered = 'true';
    bindEncyclopediaEvents();
    PerformanceEngine.observe('.accordion-item');
}

export function renderEncyclopedia() {
    let data = [];
    if (STATE.currentEncyGroup === 'triet-thuyet') data = APP_DATA.THEORY_DATA.map(i => ({ ...i, _group: 'triet-thuyet' }));
    else if (STATE.currentEncyGroup === 'ky-tai') data = APP_DATA.AUTHOR_DATA.map(i => ({ ...i, _group: 'ky-tai' }));
    else if (STATE.currentEncyGroup === 'tinh-hoa') data = APP_DATA.WORKS_DATA.map(i => ({ ...i, _group: 'tinh-hoa' }));
    sortEncyData(data, STATE.currentEncyGroup);
    renderEncyclopediaList(data, false);
}

export function searchEncyclopedia() {
    const input = document.getElementById('encyclopedia-search');
    if (!input) return;
    const kw = input.value.trim();
    const filterBar = document.getElementById('encyclopedia-filter-bar');

    if (!kw) {
        if (filterBar) filterBar.style.display = 'flex';
        STATE.currentEncyPage = 1;
        renderEncyclopedia();
        return;
    }
    if (filterBar) filterBar.style.display = 'none';

    if (!VDSearchEngine.getIndexStatus()) VDSearchEngine.buildIndexAsync();

    const results = VDSearchEngine.search(kw);
    if (!results.length) {
        const emptyContainer = document.getElementById('encyclopedia-container');
        emptyContainer.dataset.searchMode = 'true';

        const isQuestion = /[?]|\b(la ai|la gi|the nao|tai sao|nhu the nao|ai viet)\b/i.test(kw);

        if (isQuestion) {
            emptyContainer.innerHTML = `
                <div style="text-align:center;padding:40px;">
                    <p style="font-size:1.1rem; color:var(--text-main); margin-bottom:15px; font-family:var(--font-body);">
                        Có vẻ Bạn đang tìm kiếm câu trả lời cho câu hỏi này?
                    </p>
                    <p style="color:var(--text-muted);font-style:italic;margin-bottom:20px;">
                        Hãy nhấn <strong>Enter</strong> hoặc click nút bên dưới để Hỏi Đạo AI.
                    </p>
                    <button class="btn-ask-ai" onclick="window.triggerSmartSearch('encyclopedia-search', 'encyclopedia-container', 'encyclopedia-filter-bar', 'encyclopedia-pagination')">
                        Hỏi Đạo AI ngay
                    </button>
                </div>
            `;
        } else {
            emptyContainer.innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-muted);font-style:italic;">Không tìm thấy kết quả nào cho "${escapeHTML(kw)}".</p>`;
        }

        const countEl = document.getElementById('encyclopedia-count');
        if (countEl) countEl.textContent = `Tìm thấy 0 mục`;
        const pagEl = document.getElementById('encyclopedia-pagination');
        if (pagEl) pagEl.innerHTML = '';
        return;
    }

    const tokens = removeAccents(kw.toLowerCase()).split(/\s+/).filter(t => t.length);
    const data = results.map(r => {
        const idx = STATE.GLOBAL_INDEX_BY_KEY.get(r.key);
        return idx ? { ...idx.data, _group: idx.group || idx.type } : null;
    }).filter(Boolean);

    STATE.currentEncyPage = 1;
    renderEncyclopediaList(data, true, tokens);
    const countEl = document.getElementById('encyclopedia-count');
    if (countEl) countEl.textContent = `Tìm thấy ${results.length} mục`;
}

// =====================================================================
// MODULE 6: LIÊN KẾT (DÙNG DATAHUB THAY VÌ TỰ TÍNH TOÁN)
// =====================================================================

export function findSymbols(text) {
    if (!text) return [];
    const source = String(text).toLocaleLowerCase('vi').normalize('NFC');
    const dictionary = APP_DATA.DICTIONARY_DATA || {};
    const groups = [
        ['Biểu tượng', dictionary.symbols || {}],
        ['Điển tích', dictionary.dienTich || {}],
        ['Hán Việt', dictionary.hanViet || {}]
    ];

    const candidates = [];
    for (const [type, entries] of groups) {
        for (const [keyword, info] of Object.entries(entries)) {
            const normalizedKeyword = String(keyword).toLocaleLowerCase('vi').normalize('NFC').trim();
            if (!normalizedKeyword) continue;
            const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
            const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, 'u');
            const match = pattern.exec(source);
            if (!match) continue;
            const start = match.index + match[1].length;
            const end = start + match[2].length;
            candidates.push({ type, keyword, info: info && typeof info === 'object' ? info : { mean: String(info || '') }, start, end, length: end - start });
        }
    }
    candidates.sort((a, b) => b.length - a.length || a.start - b.start);
    const accepted = [];
    for (const item of candidates) {
        const overlaps = accepted.some(hit => item.start < hit.end && item.end > hit.start);
        if (!overlaps) accepted.push(item);
    }
    return accepted.sort((a, b) => a.start - b.start).map(({ type, keyword, info }) => ({ type, keyword, ...info }));
}

export function highlightSymbolsInContent(container) {
    if (!container?.firstChild) return;
    const keywords = Object.keys(APP_DATA.DICTIONARY_DATA.symbols || {}).concat(Object.keys(APP_DATA.DICTIONARY_DATA.dienTich || {}));
    if (!keywords.length) return;
    keywords.sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const tag = node.parentElement?.tagName;
            if (['A', 'CODE', 'SCRIPT', 'STYLE', 'MARK', 'EM', 'STRONG', 'I', 'B'].includes(tag)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);
    textNodes.forEach(tn => {
        const text = tn.nodeValue;
        if (!pattern.test(text)) return;
        pattern.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0, m;
        while ((m = pattern.exec(text)) !== null) {
            if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            const kw = m[1];
            const info = (APP_DATA.DICTIONARY_DATA.symbols && APP_DATA.DICTIONARY_DATA.symbols[kw.toLowerCase()]) || (APP_DATA.DICTIONARY_DATA.dienTich && APP_DATA.DICTIONARY_DATA.dienTich[kw.toLowerCase()]);
            const span = document.createElement('span');
            span.className = 'symbol-mark';
            span.dataset.symbol = kw;
            span.dataset.tooltip = info?.mean || '';
            span.textContent = kw;
            frag.appendChild(span);
            last = m.index + m[0].length;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        tn.parentNode.replaceChild(frag, tn);
    });
}

export function findRelatedWorks(current, limit = 5) {
    if (!current || !current.id) return [];
    const graph = DataHub.getGraph(current.id);
    if (!graph) return [];

    let related = graph.relatedWorks || [];
    if (related.length === 0) {
        const others = APP_DATA.WORKS_DATA.filter(w => w.id !== current.id);
        others.sort(() => 0.5 - Math.random());
        related = others.slice(0, limit).map(w => ({ ...w, _reason: "Gợi ý ngẫu nhiên" }));
    }
    return related.slice(0, limit);
}

export function findRelatedAuthors(current, limit = 4) {
    if (!current || !current.id) return [];
    const graph = DataHub.getGraph(current.id);
    if (!graph) return [];

    if (graph.author) {
        return [{ ...graph.author, _reason: "Tác giả của tác phẩm" }];
    }
    if (graph.relatedWorks && graph.relatedWorks.length > 0) {
        return graph.relatedWorks.slice(0, limit).map(a => ({ ...a, _reason: "Đồng thời đại" }));
    }
    return [];
}

export function appendRelatedSection(container, item, group) {
    if (container.querySelector('.related-section')) return;

    const relatedWorks = findRelatedWorks(item, 5);
    const relatedAuthors = findRelatedAuthors(item, 4);
    if (!relatedWorks.length && !relatedAuthors.length) return;

    const section = document.createElement('div');
    section.className = 'related-section';

    let html = '';

    if (relatedAuthors.length > 0) {
        html += `
            <div class="related-block">
                <div class="related-title">Tác giả liên quan</div>
                <div class="related-grid author-grid">
                    ${relatedAuthors.map(a => {
                        const authorName = (a.title || a.name || '').replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
                        return `
                            <button type="button" class="related-card author-related-card"
                                data-route-encyclopedia="true"
                                data-route-id="${escapeHTML(a.id)}"
                                data-route-group="ky-tai"
                                data-route-title="${escapeHTML(authorName)}">
                                <div class="author-related-name">${escapeHTML(authorName)}</div>
                                ${a._reason ? `<div class="author-related-reason">${escapeHTML(a._reason)}</div>` : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (relatedWorks.length > 0) {
        html += `
            <div class="related-block">
                <div class="related-title">Tác phẩm liên quan</div>
                <div class="related-grid">
                    ${relatedWorks.map(w => `
                        <div class="related-card work-related-card">
                            <div class="work-related-title"
                                data-route-encyclopedia="true"
                                data-route-id="${escapeHTML(w.id)}"
                                data-route-group="tinh-hoa"
                                data-route-title="${escapeHTML(w.title)}"
                                data-route-author="${escapeHTML(w.author || '')}">
                                ${escapeHTML(w.title)}
                            </div>
                            <div class="work-related-meta">
                                <span class="work-related-author"
                                    data-route-encyclopedia="true"
                                    data-route-group="ky-tai"
                                    data-route-title="${escapeHTML(w.author || '')}">
                                    ${escapeHTML(w.author || 'Vô danh')}
                                </span>
                                <span class="work-related-reason">${escapeHTML(w._reason || '')}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    section.innerHTML = html;
    container.appendChild(section);
}

// =====================================================================
// MODULE 7: PHÂN TRANG
// =====================================================================

export function renderPagination(totalPages, containerId = 'pagination-container', pageType = 'heritage') {
    const pagContainer = document.getElementById(containerId);
    if (!pagContainer) return;
    if (totalPages <= 1) { pagContainer.innerHTML = ''; return; }

    const page = pageType === 'encyclopedia' ? STATE.currentEncyPage : STATE.currentPage;
    let html = `<button class="page-btn arrow-btn" onclick="window.changePage(${page - 1}, '${containerId}', '${pageType}')" ${page === 1 ? 'disabled' : ''}>←</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
            html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="window.changePage(${i}, '${containerId}', '${pageType}')">${i}</button>`;
        } else if (i === page - 2 || i === page + 2) {
            html += `<span class="page-ellipsis">...</span>`;
        }
    }

    html += `<button class="page-btn arrow-btn" onclick="window.changePage(${page + 1}, '${containerId}', '${pageType}')" ${page === totalPages ? 'disabled' : ''}>→</button>`;
    pagContainer.innerHTML = html;
}

export function changePage(page, containerId = 'pagination-container', pageType = 'heritage') {
    if (pageType === 'encyclopedia') {
        STATE.currentEncyPage = page;
        renderEncyclopediaList(STATE.currentEncyDataForRender, false);
        document.getElementById('encyclopedia-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        STATE.currentPage = page;
        renderHeritage();
        document.getElementById('search-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// =====================================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// =====================================================================
/**
 * SAU KHI DÙNG render.js v3.0.0, BẠN CẦN:
 *
 * 1. main.js:
 *    - Sửa `executePipeline` để dùng `renderContemplativeQuestions`
 *      thay cho tier chấm điểm (nếu có).
 *    - Dùng `showToast` khi copy thành công.
 *    - Dùng `renderSkeleton` khi đang tải.
 *    - Dùng `renderCopyButton` cho mỗi tầng phân tích.
 *
 * 2. css/components.css:
 *    - Thêm CSS cho `.btn-copy-section`, `.contemplative-question`,
 *      `.skeleton-bach-ngoc` (xem MASTER PLAN Phần 1.6).
 *
 * 3. sw.js:
 *    - Tăng CACHE_VERSION vì có file JS mới.
 *
 * 4. data/manifests/static-assets.json:
 *    - Chạy `python tools/update_manifests.py` (nếu cần).
 */
