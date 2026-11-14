/**
 * ==========================================================
 * VĂN ĐẠO - RENDER MODULE (js/render.js)
 * Vị trí: js/render.js
 * Version: 2.1.0 (Intent Router UX & AI Buttons)
 * ==========================================================
 * CHỨC NĂNG:
 * - Hiển thị Văn Hiến (Tác phẩm), Bách Khoa (Tác giả, Lý thuyết).
 * - Tự động tạo liên kết Tác giả/Tác phẩm liên quan qua DataHub.
 * - Quản lý Lazy Load, Phân trang, và Tooltip biểu tượng.
 * - [MỚI] Gợi ý chuyển sang Hỏi Đạo AI nếu người dùng gõ câu hỏi vào ô tìm kiếm.
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
    return { observe: (sel) => document.querySelectorAll(sel).forEach(el => observer.observe(el)) };
})();

// =====================================================================
// MODULE 2: VĂN HIẾN (DANH SÁCH TÁC PHẨM)
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
    STATE.currentMainCat = category; STATE.currentGenre = 'all'; STATE.currentPage = 1;
    document.querySelectorAll('#main-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const subBar = document.getElementById('sub-filter-bar');
    if (!subBar) return;

    if (category === 'all') { subBar.style.display = 'none'; renderHeritage(); return; }
    
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
    STATE.currentGenre = genre; STATE.currentPage = 1;
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

    // === [MỚI] XỬ LÝ KHI KHÔNG CÓ KẾT QUẢ (INTENT ROUTER UX) ===
    if (!data.length) {
        // Kiểm tra xem người dùng có đang đặt câu hỏi không
        const isQuestion = /[?]|\b(la ai|la gi|the nao|tai sao|nhu the nao)\b/i.test(keyword);
        
        if (isQuestion) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:40px;">
                    <p style="font-size:1.1rem; color:var(--text-main); margin-bottom:15px; font-family:var(--font-heading);">
                        Có vẻ bạn đang đặt một câu hỏi?
                    </p>
                    <p style="color:var(--text-muted);font-style:italic;margin-bottom:20px;">
                        Nhấn <strong>Enter</strong> hoặc click nút bên dưới để Hỏi Đạo AI.
                    </p>
                    <!-- Nút này gọi hàm toàn cục, không giả lập phím Enter -->
                    <button class="btn-ask-ai" onclick="window.triggerSmartSearch('search-input', 'heritage-grid', 'main-filter-bar', 'pagination-container')">
                        Hỏi Đạo AI ngay
                    </button>
                </div>
            `;
        } else {
            grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-style:italic;">Không tìm thấy mục từ nào phù hợp.</p>`;
        }
        document.getElementById('pagination-container').innerHTML = '';
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
// MODULE 3: CONTENT MANAGER (QUẢN LÝ NỘI DUNG QUA DATAHUB)
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
    const itemId = details.dataset.id; const group = details.dataset.group;
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
                if (other !== details) { other.open = false; clearAccordionContent(other); } 
            });
            ensureAccordionContent(details);
        } else { 
            clearAccordionContent(details); 
        }
    }, true);
}

// =====================================================================
// MODULE 4: BÁCH KHOA (SẮP XẾP & HIỂN THỊ)
// =====================================================================
export function romanToInt(roman) {
    if (roman === '0') return 0;
    const map = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    let num = 0; const s = roman.toLowerCase();
    for (let i = 0; i < s.length; i++) {
        const cur = map[s[i]], nxt = map[s[i + 1]];
        if (nxt && cur < nxt) { num += nxt - cur; i++; } else num += cur;
    }
    return num;
}

export function sortEncyData(data, group) {
    return data.sort((a, b) => {
        if (group === 'triet-thuyet') {
            const getNum = id => { const m = id.match(/quyen-([ivxlcdm0-9]+)/i); return m ? romanToInt(m[1]) : 999; };
            return getNum(a.id) - getNum(b.id);
        }
        const clean = t => t.replace(/^(Quyển [IVXLCDM]+\.|Chân Dung Tác Giả:)\s*/i, '').toLowerCase();
        return clean(a.title || a.name || '').localeCompare(clean(b.title || b.name || ''));
    });
}

export function filterEncyclopediaGroup(group, btnElement) {
    STATE.currentEncyGroup = group; STATE.currentEncyPage = 1;
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
        emptyContainer.innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-muted);font-style:italic;">Không tìm thấy kết quả nào cho "${escapeHTML(kw)}".</p>`;
        document.getElementById('encyclopedia-count').textContent = `Tìm thấy 0 mục`;
        document.getElementById('encyclopedia-pagination').innerHTML = '';
        return;
    }
    const tokens = removeAccents(kw.toLowerCase()).split(/\s+/).filter(t => t.length);
    const data = results.map(r => {
        const idx = STATE.GLOBAL_INDEX_BY_KEY.get(r.key);
        return idx ? { ...idx.data, _group: idx.group || idx.type } : null;
    }).filter(Boolean);
    
    STATE.currentEncyPage = 1;
    renderEncyclopediaList(data, true, tokens);
    document.getElementById('encyclopedia-count').textContent = `Tìm thấy ${results.length} mục`;
}

// =====================================================================
// MODULE 5: LIÊN KẾT (DÙNG DATAHUB THAY VÌ TỰ TÍNH TOÁN)
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
    let n; while ((n = walker.nextNode())) textNodes.push(n);
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

    // Nút Hỏi AI (Được xử lý toàn cục ở main.js)
    html += `
        <div style="margin-top: 30px; text-align: center; border-top: 1px dashed rgba(139,184,168,0.3); padding-top: 20px;">
            <button type="button" class="btn-ask-ai"
                data-ai-action="summarize-work"
                data-work-title="${escapeHTML(item.title)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>
                Hỏi AI Tóm Tắt Tác Phẩm Này
            </button>
            <div id="ai-inline-result" style="display: none; margin-top: 15px; text-align: left;"></div>
        </div>
    `;
    
    section.innerHTML = html;
    container.appendChild(section);
}

// =====================================================================
// MODULE 6: PHÂN TRANG
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
