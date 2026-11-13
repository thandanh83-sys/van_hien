/**
 * ==========================================================
 * VĂN ĐẠO - RENDER MODULE (js/render.js)
 * Vị trí: js/render.js
 * Version: 1.0.1 (Refined Words & Bug Fixes)
 * ==========================================================
 */

import { APP_DATA, STATE, ICONS, ITEMS_PER_PAGE, ENCY_ITEMS_PER_PAGE } from './config.js';
import { escapeHTML, normalizeRouteId, highlightText, formatContent, removeAccents } from './utils.js';
import { VDSearchEngine } from './search.js';

/* =====================================================================
   MODULE 1: ĐỘNG CƠ HIỆU NĂNG (LAZY LOAD)
   ===================================================================== */
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

/* =====================================================================
   MODULE 2: VĂN HIẾN (TÁC PHẨM)
   ===================================================================== */
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
    itemsInCat.forEach(i => { if (Array.isArray(i.the_loai)) i.the_loai.forEach(g => uniqueGenres.add(g)); });

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
    if (keyword) data = data.filter(i =>
        i.title.toLowerCase().includes(keyword) ||
        i.author.toLowerCase().includes(keyword) ||
        (i.desc && i.desc.toLowerCase().includes(keyword))
    );

    if (!data.length) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-style:italic;">Không tìm thấy mục từ nào phù hợp.</p>`;
        document.getElementById('pagination-container').innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    if (STATE.currentPage > totalPages) STATE.currentPage = totalPages;
    if (STATE.currentPage < 1) STATE.currentPage = 1;
    const paged = data.slice((STATE.currentPage - 1) * ITEMS_PER_PAGE, STATE.currentPage * ITEMS_PER_PAGE);

    grid.innerHTML = paged.map(item => {
        const tags = Array.isArray(item.the_loai) ? item.the_loai.map(g => `<span class="h-tag">${g}</span>`).join(' ') : '';
        const btn = item.id
            ? `<button type="button" class="detail-btn" data-route-encyclopedia="true" data-route-id="${escapeHTML(item.id)}" data-route-group="tinh-hoa" data-route-title="${escapeHTML(item.title)}" data-route-author="${escapeHTML(item.author || '')}">Chi tiết ${ICONS.arrowRight}</button>`
            : '';
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

/* =====================================================================
   MODULE 3: CONTENT MANAGER (BỘ NHỚ ĐỆM)
   ===================================================================== */
export const ContentManager = (() => {
    const MAX_CACHE_BYTES = 5 * 1024 * 1024; // 5MB
    const cache = new Map();
    const pending = new Map();
    let currentSize = 0;

    function getCache(key) {
        if (!cache.has(key)) return null;
        const v = cache.get(key);
        cache.delete(key); cache.set(key, v); // LRU
        return v;
    }

    function setCache(key, value) {
        if (cache.has(key)) {
            currentSize -= JSON.stringify(cache.get(key)).length;
            cache.delete(key);
        }
        const size = JSON.stringify(value).length;
        if (size > MAX_CACHE_BYTES) return;
        
        while (currentSize + size > MAX_CACHE_BYTES && cache.size) {
            const oldest = cache.keys().next().value;
            currentSize -= JSON.stringify(cache.get(oldest)).length;
            cache.delete(oldest);
        }
        cache.set(key, value);
        currentSize += size;
    }

    async function load(item, group, signal) {
        const key = `${group}:${item.id}`;
        const cached = getCache(key);
        if (cached) return cached;
        
        const inFlight = pending.get(key);
        if (inFlight && !inFlight.signal?.aborted) return inFlight.promise;
        if (inFlight) pending.delete(key);

        const task = (async () => {
            let result;
            try {
                if (group === 'tinh-hoa') {
                    const res = await fetch(`./data/tac-pham/${encodeURIComponent(item.id)}.json`, { signal });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    result = await res.json();
                } else if (group === 'ky-tai') {
                    const res = await fetch(`./data/tac-gia/${encodeURIComponent(item.id)}.json`, { signal });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    result = await res.json();
                } else {
                    // [FIX LỖI 7] Dành cho triet-thuyet: Lấy trực tiếp content từ data index
                    result = { content: item.content || item.description || '' };
                }
                setCache(key, result);
                return result;
            } catch (err) {
                if (err.name === 'AbortError') console.log(`[CONTENT] Huỷ tải: ${key}`);
                throw err;
            }
        })();

        pending.set(key, { promise: task, signal });
        try { return await task; }
        finally {
            if (pending.get(key)?.promise === task) pending.delete(key);
        }
    }

    return { load, clearCache: () => { cache.clear(); currentSize = 0; } };
})();

const accordionAbortControllers = new Map();

export function findEncyclopediaItem(id, group) {
    if (group === 'triet-thuyet') return APP_DATA.THEORY_DATA.find(i => i.id === id);
    if (group === 'ky-tai') return APP_DATA.AUTHOR_DATA.find(i => i.id === id);
    if (group === 'tinh-hoa') return APP_DATA.WORKS_DATA.find(i => i.id === id);
    if (group === 'the-loai') return APP_DATA.THE_LOAI_DATA.find(i => i.id === id);
    return null;
}

export async function ensureAccordionContent(details) {
    if (!details || !details.open) return;
    const itemId = details.dataset.id;
    const group = details.dataset.group;
    const cacheKey = `${group}:${itemId}`;
    const contentDiv = details.querySelector('.accordion-content');
    
    if (!itemId || !group || !contentDiv) return;
    if (contentDiv.dataset.contentLoaded === 'true') return;
    if (contentDiv.dataset.loading === 'true') return;

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
                if (other !== details) { other.open = false; clearAccordionContent(other); }
            });
            ensureAccordionContent(details);
        } else {
            clearAccordionContent(details);
        }
    }, true);
}

/* =====================================================================
   MODULE 4: RENDER ENCYCLOPEDIA (BÁCH KHOA)
   ===================================================================== */
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
        b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
    });
    if (btnElement) { btnElement.classList.add('active'); btnElement.setAttribute('aria-pressed', 'true'); }
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
    // [FIX LỖI 3] Nếu đang ở chế độ Hỏi Đạo, không chạy search thường
    if (STATE.searchMode === 'ask') return;

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

/* =====================================================================
   MODULE 5: TÁC PHẨM & TÁC GIẢ LIÊN QUAN (NÂNG CẤP TỪ NGỮ)
   ===================================================================== */
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

            candidates.push({
                type, keyword, info: info && typeof info === 'object' ? info : { mean: String(info || '') },
                start, end, length: end - start
            });
        }
    }

    candidates.sort((a, b) => b.length - a.length || a.start - b.start);
    const accepted = [];
    for (const item of candidates) {
        const overlaps = accepted.some(hit => item.start < hit.end && item.end > hit.start);
        if (!overlaps) accepted.push(item);
    }

    return accepted.sort((a, b) => a.start - b.start).map(({ type, keyword, info }) => ({
        type, keyword, ...info
    }));
}

export function highlightSymbolsInContent(container) {
    if (!container?.firstChild) return;
    const keywords = Object.keys(APP_DATA.DICTIONARY_DATA.symbols || {}).concat(Object.keys(APP_DATA.DICTIONARY_DATA.dienTich || {}));
    if (!keywords.length) return;

    keywords.sort((a, b) => b.length - a.length);

    const pattern = new RegExp(
        `(?<![\\p{L}\\p{N}])(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`,
        'giu'
    );

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
            const info = (APP_DATA.DICTIONARY_DATA.symbols && APP_DATA.DICTIONARY_DATA.symbols[kw.toLowerCase()]) || 
                         (APP_DATA.DICTIONARY_DATA.dienTich && APP_DATA.DICTIONARY_DATA.dienTich[kw.toLowerCase()]);
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
    if (!current) return [];
    
    const currentAuthor = (current.author || '').toLowerCase().trim();
    const isAnonymous = !currentAuthor || ['dân gian', 'khuyết danh', 'vô danh'].includes(currentAuthor);
    const currentText = current.desc || current.content || '';
    
    let scoredWorks = APP_DATA.WORKS_DATA
        .filter(w => w.id !== current.id)
        .map(w => {
            let score = 0;
            const reasons = [];

            // [FIX LỖI 2] Đổi từ ngữ văn vẻ hơn
            if (!isAnonymous && w.author && w.author.toLowerCase().trim() === currentAuthor) {
                score += 60;
                reasons.push("Đồng tác giả");
            }
            if (current.era && w.era && current.era.toLowerCase().trim() === w.era.toLowerCase().trim()) {
                score += 40;
                reasons.push("Đồng thời đại");
            }
            if (current.loai_hinh && w.loai_hinh === current.loai_hinh) {
                score += 30;
                if (!reasons.length) reasons.push("Chung nguồn cảm hứng");
            }
            const sharedGenres = (w.the_loai || []).filter(g => (current.the_loai || []).includes(g));
            if (sharedGenres.length > 0) {
                score += sharedGenres.length * 25;
                if (!reasons.length) reasons.push(`Đồng điệu: ${sharedGenres[0]}`);
            }
            if (score > 0) {
                const curSyms = new Set(findSymbols(currentText).map(s => s.keyword));
                if (curSyms.size > 0) {
                    const wText = w.desc || w.content || '';
                    const sharedSyms = findSymbols(wText).filter(s => curSyms.has(s.keyword)).length;
                    if (sharedSyms > 0) {
                        score += sharedSyms * 5;
                        if (!reasons.length) reasons.push("Chung chủ đề");
                    }
                }
            }
            return { w, score, reason: reasons[0] || "" };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => ({ ...x.w, _reason: x.reason }));

    if (scoredWorks.length === 0) {
        const others = APP_DATA.WORKS_DATA.filter(w => w.id !== current.id);
        others.sort(() => 0.5 - Math.random());
        scoredWorks = others.slice(0, 3).map(w => ({ ...w, _reason: "Gợi ý ngẫu nhiên" }));
    }
    return scoredWorks;
}

export function findRelatedAuthors(current, limit = 4) {
    if (!current || !current.author) return [];
    const currentAuthor = current.author.toLowerCase().trim();
    if (['dân gian', 'khuyết danh', 'vô danh'].includes(currentAuthor)) return [];
    
    const currentAuthorObj = APP_DATA.AUTHOR_DATA.find(a => {
        const t = (a.title || a.name || '').replace(/^Chân Dung Tác Giả:\s*/i, '').toLowerCase().trim();
        return t === currentAuthor;
    });
    
    const currentWorks = APP_DATA.WORKS_DATA.filter(w => 
        w.author && w.author.toLowerCase().trim() === currentAuthor
    );
    if (currentWorks.length === 0) return [];
    
    const currentEras = new Set(currentWorks.map(w => (w.era || '').toLowerCase().trim()).filter(Boolean));
    const currentLoaiHinh = new Set(currentWorks.map(w => w.loai_hinh).filter(Boolean));
    const currentGenres = new Set();
    currentWorks.forEach(w => (w.the_loai || []).forEach(g => currentGenres.add(g)));
    
    return APP_DATA.AUTHOR_DATA
        .filter(a => !currentAuthorObj || a.id !== currentAuthorObj.id)
        .map(a => {
            const authorName = (a.title || a.name || '').replace(/^Chân Dung Tác Giả:\s*/i, '').toLowerCase().trim();
            if (authorName === currentAuthor) return null;
            const theirWorks = APP_DATA.WORKS_DATA.filter(w => w.author && w.author.toLowerCase().trim() === authorName);
            if (theirWorks.length === 0) return null;
            
            let score = 0;
            let reason = "";
            
            const theirEras = new Set(theirWorks.map(w => (w.era || '').toLowerCase().trim()).filter(Boolean));
            const sharedEras = [...currentEras].filter(e => theirEras.has(e));
            if (sharedEras.length > 0) { score += sharedEras.length * 25; reason = "Đồng thời đại"; }
            
            const theirLoaiHinh = new Set(theirWorks.map(w => w.loai_hinh).filter(Boolean));
            const sharedLoaiHinh = [...currentLoaiHinh].filter(l => theirLoaiHinh.has(l));
            if (sharedLoaiHinh.length > 0) {
                score += sharedLoaiHinh.length * 20;
                if (!reason) reason = "Chung nguồn cảm hứng";
            }
            
            const theirGenres = new Set();
            theirWorks.forEach(w => (w.the_loai || []).forEach(g => theirGenres.add(g)));
            const sharedGenres = [...currentGenres].filter(g => theirGenres.has(g));
            if (sharedGenres.length > 0) {
                score += sharedGenres.length * 15;
                if (!reason) reason = `Đồng điệu văn chương`;
            }
            
            return { a, score, reason };
        })
        .filter(x => x && x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => ({ ...x.a, _reason: x.reason }));
}

export function appendRelatedSection(container, item, group) {
    if (group !== 'tinh-hoa') return;
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

/* =====================================================================
   MODULE 10: PHÂN TRANG DÙNG CHUNG
   ===================================================================== */
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