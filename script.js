/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (VERSION 4.6 - UNIFIED KNOWLEDGE WEB)
   Tác giả: Văn Đạo
   
   TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
   - Dữ liệu ngoại vi: Nạp 9 file JSON (bao gồm cả Thể loại).
   - Điều hướng Chính xác: Hỗ trợ tìm kiếm Thể loại (dùng name) và Tác phẩm (dùng title).
   - Học thuật: Tự động sinh Badge xác minh cho Danh ngôn.
   - Trải nghiệm: Tủ sách Offline dùng HTML5 Dialog.
   ===================================================================== */

/* =====================================================================
   MODULE 0: HẰNG SỐ TOÀN CỤC & KHO ICON
   ===================================================================== */
const SVG_ATTR = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;

const ICONS = {
    pen:        `<svg ${SVG_ATTR} width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    clock:      `<svg ${SVG_ATTR} width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    scroll:     `<svg ${SVG_ATTR} width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    check:      `<svg ${SVG_ATTR} width="16" height="16" stroke="#10b981"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    question:   `<svg ${SVG_ATTR} width="18" height="18" style="color:var(--accent-gold); flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    arrowRight: `<svg ${SVG_ATTR} width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    chevron:    `<svg ${SVG_ATTR} width="20" height="20" class="chevron-icon"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    sparkle:    `<svg ${SVG_ATTR} width="18" height="18"><path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>`
};

const ITEMS_PER_PAGE = 20;
const ENCY_ITEMS_PER_PAGE = 20;

/* --- State toàn cục --- */
let THEORY_DATA = [];
let AUTHOR_DATA = [];
let WORKS_DATA  = [];
let QUOTES_DATA = [];
let COMMENTARY_DATA = {};

let DICTIONARY_DATA = { symbols: {}, dienTich: {}, hanViet: {} };
let CATEGORY_NAMES = {};
let FORTUNE_CONFIG = {};
let FORTUNE_ADVICE = {};
let THE_LOAI_DATA = []; // Biến mới chứa dữ liệu Thể loại

const GLOBAL_INDEX = new Map(); 
const GLOBAL_INDEX_BY_KEY = new Map(); 
const GLOBAL_RECORDS = []; 

let currentMainCat = 'all';
let currentGenre = 'all';
let currentPage = 1;
let currentEncyGroup = 'triet-thuyet';
let currentEncyPage = 1;
let currentEncyDataForRender = [];
let currentQuoteIndex = -1;
let quoteIntervalId = null;

/* =====================================================================
   MODULE 1: ĐỘNG CƠ HIỆU NĂNG
   ===================================================================== */
const PerformanceEngine = (() => {
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
   MODULE 2: VIEW MANAGER (PROMISE-BASED)
   ===================================================================== */
const ViewManager = (() => {
    const scrollPositions = { home: 0, heritage: 0, encyclopedia: 0, analyze: 0 };
    let switchToken = 0;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    function getCurrentViewId() {
        const active = document.querySelector('.view.active');
        return active ? active.id.replace('view-', '') : null;
    }

    function ensureViewRendered(viewId) {
        if (viewId === 'heritage') {
            const grid = document.getElementById('heritage-grid');
            if (grid && grid.dataset.rendered !== 'true') {
                grid.dataset.rendered = 'true';
                renderHeritage();
            }
        }
        if (viewId === 'encyclopedia') {
            const container = document.getElementById('encyclopedia-container');
            if (container && !container.dataset.renderedGroup) renderEncyclopedia();
        }
    }

    async function switchView(viewId) {
        const targetView = document.getElementById(`view-${viewId}`);
        if (!targetView) return false;
        
        const token = ++switchToken;
        const currentViewId = getCurrentViewId();
        if (currentViewId === viewId) { ensureViewRendered(viewId); return true; }

        if (currentViewId) {
            scrollPositions[currentViewId] = window.scrollY;
            unloadView(currentViewId);
        }

        const silkOverlay = document.getElementById('silkTransition');
        if (silkOverlay) {
            silkOverlay.classList.remove('entering', 'leaving', 'active');
            void silkOverlay.offsetWidth;
            silkOverlay.classList.add('active', 'entering');
            await wait(300);
            if (token !== switchToken) return false;
        }

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });

        targetView.classList.add('active');
        const targetNav = document.getElementById(`nav-${viewId}`);
        if (targetNav) { targetNav.classList.add('active'); targetNav.setAttribute('aria-current', 'page'); }

        const navMenu = document.getElementById('navMenu');
        if (navMenu) navMenu.classList.remove('show');

        ensureViewRendered(viewId);
        if (silkOverlay) silkOverlay.classList.remove('active', 'entering');

        await new Promise(requestAnimationFrame);
        if (token !== switchToken) return false;

        window.scrollTo({ top: scrollPositions[viewId] || 0, behavior: 'instant' });
        return true;
    }

    return { switchView, getCurrentViewId, getScrollPositions: () => scrollPositions };
})();

function switchView(viewId) { return ViewManager.switchView(viewId); }

function unloadView(viewId) {
    if (viewId !== 'encyclopedia') return;
    const container = document.getElementById('encyclopedia-container');
    if (!container) return;
    container.querySelectorAll('details[open]').forEach(details => {
        details.open = false;
        const content = details.querySelector('.accordion-content');
        if (content) { content.replaceChildren(); delete content.dataset.contentLoaded; }
    });
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const btn = document.querySelector('.mobile-menu-btn');
    if (!navMenu) return;
    const nowOpen = navMenu.classList.toggle('show');
    if (btn) btn.setAttribute('aria-expanded', String(nowOpen));
}

/* =====================================================================
   MODULE 3: TIỆN ÍCH
   ===================================================================== */
function debounce(func, wait) {
    let timeout;
    const debounced = function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
    debounced.cancel = () => { clearTimeout(timeout); timeout = null; };
    return debounced;
}

let cancelPendingEncyclopediaSearch = () => {};

function removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function normalizeRouteText(value) {
    return removeAccents(String(value ?? '').normalize('NFKC').toLocaleLowerCase('vi'))
        .replace(/[’'`]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function normalizeRouteId(value) {
    return normalizeRouteText(value).replace(/\s+/g, '-');
}

function normalizeRouteGroup(value) {
    const key = normalizeRouteId(value);
    const aliases = {
        'triet-thuyet': 'triet-thuyet', 'ly-thuyet': 'triet-thuyet', 'theory': 'triet-thuyet',
        'ky-tai': 'ky-tai', 'tac-gia': 'ky-tai', 'author': 'ky-tai', 'authors': 'ky-tai',
        'tinh-hoa': 'tinh-hoa', 'tac-pham': 'tinh-hoa', 'work': 'tinh-hoa', 'works': 'tinh-hoa', 'heritage': 'tinh-hoa',
        'the-loai': 'the-loai', 'genre': 'the-loai', 'genres': 'the-loai'
    };
    return aliases[key] || null;
}

function getRecordTitleAlias(item, group) {
    if (group === 'the-loai') return String(item?.name || '').trim();
    const title = String(item?.title || '').trim();
    if (group === 'ky-tai') return title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
    return title;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}

function highlightText(text, tokens) {
    if (!text || !tokens?.length) return escapeHTML(text);
    return text.split(/(\s+)/).map(word => {
        const clean = removeAccents(word.toLowerCase());
        if (tokens.some(t => clean.includes(t)) && word.trim()) return `<mark>${escapeHTML(word)}</mark>`;
        return escapeHTML(word);
    }).join('');
}

function formatContent(html) {
    if (!html) return '';
    let formatted = html.replace(/([IVX]+\.)\s/g, '<br><br><strong style="color:var(--accent-text);">$1</strong> ');
    formatted = formatted.replace(/^<strong>(.*?)<\/strong>/, '$1');
    formatted = formatted.replace(/^<b>(.*?)<\/b>/, '$1');
    return formatted;
}

function handleSearchInput() {
    const input = document.getElementById('encyclopedia-search');
    const clearBtn = document.getElementById('clear-search-btn');
    if (!input || !clearBtn) return;
    if (input.value.length > 0) clearBtn.classList.add('show');
    else clearBtn.classList.remove('show');
}

function clearSearch() {
    const input = document.getElementById('encyclopedia-search');
    const clearBtn = document.getElementById('clear-search-btn');
    if (!input) return;
    input.value = ''; 
    if (clearBtn) clearBtn.classList.remove('show'); 
    input.focus(); 
    searchEncyclopedia(); 
}

/* =====================================================================
   MODULE 4: VĂN HIẾN (TÁC PHẨM)
   ===================================================================== */
function initMainFilters() {
    const mainBar = document.getElementById('main-filter-bar');
    if (!mainBar || !WORKS_DATA.length) return;
    let html = `<button class="filter-btn active" onclick="filterMainCategory('all', this)">Tất cả</button>`;
    Object.keys(CATEGORY_NAMES).forEach(cat => {
        html += `<button class="filter-btn" onclick="filterMainCategory('${cat}', this)">${CATEGORY_NAMES[cat]}</button>`;
    });
    mainBar.innerHTML = html;
}

function filterMainCategory(category, btnElement) {
    currentMainCat = category; currentGenre = 'all'; currentPage = 1;
    document.querySelectorAll('#main-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const subBar = document.getElementById('sub-filter-bar');
    if (!subBar) return;

    if (category === 'all') { subBar.style.display = 'none'; renderHeritage(); return; }

    const itemsInCat = WORKS_DATA.filter(i => i.loai_hinh === category);
    const uniqueGenres = new Set();
    itemsInCat.forEach(i => { if (Array.isArray(i.the_loai)) i.the_loai.forEach(g => uniqueGenres.add(g)); });

    if (!uniqueGenres.size) { subBar.style.display = 'none'; }
    else {
        subBar.style.display = 'flex';
        let html = `<button class="filter-btn active" onclick="filterSubGenre('all', this)" style="padding:6px 16px;font-size:0.8rem;">Tất cả thể loại</button>`;
        Array.from(uniqueGenres).sort().forEach(g => {
            html += `<button class="filter-btn" onclick="filterSubGenre('${g}', this)" style="padding:6px 16px;font-size:0.8rem;">${g}</button>`;
        });
        subBar.innerHTML = html;
    }
    renderHeritage();
}

function filterSubGenre(genre, btnElement) {
    currentGenre = genre; currentPage = 1;
    document.querySelectorAll('#sub-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderHeritage();
}

function renderHeritage() {
    const grid = document.getElementById('heritage-grid');
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (!grid) return;

    let data = WORKS_DATA;
    if (currentMainCat !== 'all') data = data.filter(i => i.loai_hinh === currentMainCat);
    if (currentGenre !== 'all') data = data.filter(i => i.the_loai?.includes(currentGenre));
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
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const paged = data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
   MODULE 5: CONTENT MANAGER & BÁCH KHOA
   ===================================================================== */
const ContentManager = (() => {
    const MAX_CACHE_BYTES = 5 * 1024 * 1024;
    const cache = new Map();
    const pending = new Map();
    let currentSize = 0;

    function getCache(key) {
        if (!cache.has(key)) return null;
        const v = cache.get(key);
        cache.delete(key); cache.set(key, v);
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
                    // Thể loại không có file riêng, dùng mô tả trực tiếp
                    result = { content: item.description || '' };
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

    return { load, clearCache: () => { cache.clear(); currentSize = 0; }, getStats: () => ({ items: cache.size, size: currentSize }) };
})();

const accordionAbortControllers = new Map();

function findEncyclopediaItem(id, group) {
    if (group === 'triet-thuyet') return THEORY_DATA.find(i => i.id === id);
    if (group === 'ky-tai') return AUTHOR_DATA.find(i => i.id === id);
    if (group === 'tinh-hoa') return WORKS_DATA.find(i => i.id === id);
    if (group === 'the-loai') return THE_LOAI_DATA.find(i => i.id === id); // Hỗ trợ Thể loại
    return null;
}

async function ensureAccordionContent(details) {
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

function clearAccordionContent(details) {
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

function bindEncyclopediaEvents() {
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
   MODULE 5.1: SEARCH ENGINE
   ===================================================================== */
const VDSearchEngine = (() => {
    let invertedIndex = Object.create(null), docLengths = Object.create(null), totalDocs = 0, isIndexed = false;
    const STOPWORDS = new Set(["cua","va","la","co","trong","cho","nhung","cac","mot","duoc","voi","da","de","khi","ra","ve","tu","nhu","nguoi","tai","thi","ma","nay","do"]);

    function tokenize(text) {
        if (!text) return [];
        const clean = normalizeRouteText(String(text).replace(/<[^>]*>/g, ' '));
        return (clean.match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    async function buildIndexAsync() {
        invertedIndex = Object.create(null);
        docLengths = Object.create(null);
        const entries = GLOBAL_RECORDS.slice();
        totalDocs = entries.length;
        const CHUNK = 50;
        for (let i = 0; i < entries.length; i += CHUNK) {
            entries.slice(i, i + CHUNK).forEach(record => {
                const item = record.data;
                const key = record.key;
                // Hỗ trợ cả title (Tác phẩm) và name (Thể loại)
                const titleText = item.title || item.name || '';
                const words = tokenize([titleText, item.author, item.desc, item.description, item.content].join(' '));
                docLengths[key] = Math.max(words.length, 1);
                words.forEach(w => {
                    if (!invertedIndex[w]) invertedIndex[w] = Object.create(null);
                    invertedIndex[w][key] = (invertedIndex[w][key] || 0) + 1;
                });
            });
            await new Promise(r => setTimeout(r, 0));
        }
        isIndexed = true;
        console.log(`[SEARCH] Build index xong: ${totalDocs} tài liệu.`);
    }

    function search(query) {
        const qNorm = normalizeRouteText(query);
        const tokens = tokenize(qNorm);
        if (!qNorm) return [];
        const scores = new Map();

        for (const record of GLOBAL_RECORDS) {
            const item = record.data;
            const titleText = item.title || item.name || '';
            const title = normalizeRouteText(titleText);
            const titleAlias = normalizeRouteText(getRecordTitleAlias(item, record.group));
            const author = normalizeRouteText(item.author);
            let score = 0;
            if (title === qNorm || titleAlias === qNorm) score += 700;
            else if (title.includes(qNorm) || titleAlias.includes(qNorm)) score += 360;
            if (author && author === qNorm) score += record.group === 'ky-tai' ? 620 : 260;
            else if (author && author.includes(qNorm)) score += 120;
            if (score) scores.set(record.key, score);
        }

        if (isIndexed && tokens.length) {
            tokens.forEach(w => {
                const docs = invertedIndex[w];
                if (!docs) return;
                const docCount = Object.keys(docs).length;
                const idf = Math.log((totalDocs || 1) / Math.max(docCount, 1)) + 1;
                for (const [key, count] of Object.entries(docs)) {
                    const record = GLOBAL_INDEX_BY_KEY.get(key);
                    if (!record) continue;
                    const tf = count / (docLengths[key] || 1);
                    let score = tf * idf;
                    const titleText = record.data.title || record.data.name || '';
                    const title = normalizeRouteText(titleText);
                    const author = normalizeRouteText(record.data.author);
                    if (title.includes(w)) score *= 5;
                    else if (author.includes(w)) score *= 3;
                    scores.set(key, (scores.get(key) || 0) + score);
                }
            });
        }

        return Array.from(scores, ([key, score]) => {
            const record = GLOBAL_INDEX_BY_KEY.get(key);
            return record ? { key, id: record.id, group: record.group, score } : null;
        }).filter(Boolean).sort((a, b) => b.score - a.score);
    }

    return { buildIndexAsync, search, getIndexStatus: () => isIndexed };
})();

function triggerAsyncSearchIndex() {
    if (!VDSearchEngine.getIndexStatus()) VDSearchEngine.buildIndexAsync();
}

/* =====================================================================
   MODULE 5.2: RENDER ENCYCLOPEDIA
   ===================================================================== */
function romanToInt(roman) {
    if (roman === '0') return 0;
    const map = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    let num = 0; const s = roman.toLowerCase();
    for (let i = 0; i < s.length; i++) {
        const cur = map[s[i]], nxt = map[s[i + 1]];
        if (nxt && cur < nxt) { num += nxt - cur; i++; } else num += cur;
    }
    return num;
}

function sortEncyData(data, group) {
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

function filterEncyclopediaGroup(group, btnElement) {
    currentEncyGroup = group;
    currentEncyPage = 1;
    document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
    });
    if (btnElement) { btnElement.classList.add('active'); btnElement.setAttribute('aria-pressed', 'true'); }
    const si = document.getElementById('encyclopedia-search');
    if (si) si.value = '';
    document.getElementById('clear-search-btn')?.classList.remove('show');
    renderEncyclopedia();
}

function renderEncyclopediaList(dataToRender, isSearchMode = false, tokens = []) {
    const container = document.getElementById('encyclopedia-container');
    if (!container) return;

    currentEncyDataForRender = dataToRender;
    container.dataset.searchMode = isSearchMode ? 'true' : 'false';

    if (!dataToRender?.length) {
        container.innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-muted);">Không có dữ liệu.</p>`;
        document.getElementById('encyclopedia-pagination')?.replaceChildren();
        container.dataset.renderedGroup = currentEncyGroup;
        bindEncyclopediaEvents();
        return;
    }

    const totalPages = Math.ceil(dataToRender.length / ENCY_ITEMS_PER_PAGE);
    if (currentEncyPage > totalPages) currentEncyPage = totalPages;
    if (currentEncyPage < 1) currentEncyPage = 1;

    const pagedData = dataToRender.slice((currentEncyPage - 1) * ENCY_ITEMS_PER_PAGE, currentEncyPage * ENCY_ITEMS_PER_PAGE);

    container.innerHTML = pagedData.map(item => {
        const group = item._group || currentEncyGroup;
        let displayTitle = item.title || item.name; // Hỗ trợ cả title và name
        let badge = '';
        if (isSearchMode) {
            displayTitle = highlightText(displayTitle, tokens);
            let bt = group === 'triet-thuyet' ? 'Lý Thuyết' : (group === 'ky-tai' ? 'Tác Giả' : 'Tác Phẩm');
            let bc = group === 'triet-thuyet' ? '#557a6f' : (group === 'ky-tai' ? '#8bb8a8' : '#d4c4a8');
            
            // Xử lý badge cho Thể loại
            if (group === 'the-loai') {
                bt = 'Thể Loại';
                bc = '#b89a64';
            }
            
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
    container.dataset.renderedGroup = currentEncyGroup;
    container.dataset.rendered = 'true';
    bindEncyclopediaEvents();
    PerformanceEngine.observe('.accordion-item');
}

function renderEncyclopedia() {
    let data = [];
    if (currentEncyGroup === 'triet-thuyet') data = THEORY_DATA.map(i => ({ ...i, _group: 'triet-thuyet' }));
    else if (currentEncyGroup === 'ky-tai') data = AUTHOR_DATA.map(i => ({ ...i, _group: 'ky-tai' }));
    else if (currentEncyGroup === 'tinh-hoa') data = WORKS_DATA.map(i => ({ ...i, _group: 'tinh-hoa' }));
    sortEncyData(data, currentEncyGroup);
    renderEncyclopediaList(data, false);
}

function searchEncyclopedia() {
    const input = document.getElementById('encyclopedia-search');
    if (!input) return;
    const kw = input.value.trim();
    const filterBar = document.getElementById('encyclopedia-filter-bar');

    if (!kw) {
        if (filterBar) filterBar.style.display = 'flex';
        currentEncyPage = 1;
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
        const idx = GLOBAL_INDEX_BY_KEY.get(r.key);
        return idx ? { ...idx.data, _group: idx.group || idx.type } : null;
    }).filter(Boolean);
    currentEncyPage = 1;
    renderEncyclopediaList(data, true, tokens);
    document.getElementById('encyclopedia-count').textContent = `Tìm thấy ${results.length} mục`;
}

/* =====================================================================
   MODULE 5.3: ROUTER VẠN NĂNG
   ===================================================================== */
let encyclopediaNavigationToken = 0;
let lastHighlightedTarget = null;
const highlightTimers = new WeakMap();

function extractRouteLocator(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    try {
        const parsed = new URL(raw, window.location.href);
        if (parsed.hash) return decodeURIComponent(parsed.hash.slice(1));
        for (const name of ['id', 'target', 'item', 'slug', 'key']) {
            const candidate = parsed.searchParams.get(name);
            if (candidate) return candidate;
        }
        if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('/')) {
            const leaf = parsed.pathname.split('/').filter(Boolean).pop();
            return leaf ? decodeURIComponent(leaf.replace(/\.html?$/i, '')) : raw;
        }
    } catch (_) { /* Do nothing */ }
    return raw.replace(/^#/, '');
}

function resolveEncyclopediaTarget(input) {
    if (!GLOBAL_RECORDS.length) return { ok: false, reason: 'not-ready' };

    const options = (input && typeof input === 'object') ? input : { query: input };
    let explicitGroup = normalizeRouteGroup(options.group || options.type || options.category);
    const rawKey = String(options.key || '').trim();
    let keyLocator = '';
    if (rawKey.includes(':')) {
        const sep = rawKey.indexOf(':');
        const keyGroup = normalizeRouteGroup(rawKey.slice(0, sep));
        if (keyGroup) { explicitGroup = explicitGroup || keyGroup; keyLocator = rawKey.slice(sep + 1); }
    }
    
    const suppliedId = extractRouteLocator(options.id || options.itemId || options.targetId || options.slug || options.anchor || options.hash || options.href || keyLocator || rawKey);
    const suppliedTitle = options.title || options.name || '';
    const suppliedAuthor = options.author || '';
    const suppliedVolume = options.volume || options.roman || '';
    const queryText = String(options.query || options.value || suppliedTitle || suppliedId || suppliedVolume || '').trim();
    const queryNorm = normalizeRouteText(queryText);
    const idNorm = normalizeRouteId(suppliedId || queryText);
    const titleNorm = normalizeRouteText(suppliedTitle || queryText);
    const authorNorm = normalizeRouteText(suppliedAuthor);

    let records = explicitGroup ? GLOBAL_RECORDS.filter(r => r.group === explicitGroup) : GLOBAL_RECORDS.slice();
    if (!records.length) return { ok: false, reason: 'group-empty' };

    if (authorNorm && titleNorm) {
        const paired = records.filter(r => r.group === 'tinh-hoa' && normalizeRouteText(r.data.author) === authorNorm && normalizeRouteText(r.data.title) === titleNorm);
        if (paired.length === 1) return { ok: true, record: paired[0] };
        if (paired.length > 1) return { ok: false, reason: 'ambiguous', candidates: paired };
    }

    if (idNorm) {
        const exactId = records.filter(r => normalizeRouteId(r.id) === idNorm);
        if (exactId.length === 1) return { ok: true, record: exactId[0] };
        if (exactId.length > 1) return { ok: false, reason: 'ambiguous', candidates: exactId };
    }

    const volumeText = normalizeRouteText(suppliedVolume || queryText).replace(/^quyen\s+/, '');
    const romanMatch = volumeText.match(/^([ivxlcdm]+|\d+)$/i);
    if (romanMatch && (!explicitGroup || explicitGroup === 'triet-thuyet')) {
        const volumeId = `quyen-${romanMatch[1].toLowerCase()}`;
        const volumeRecord = records.find(r => r.group === 'triet-thuyet' && normalizeRouteId(r.id) === volumeId);
        if (volumeRecord) return { ok: true, record: volumeRecord };
    }

    const cleanQuery = removeAccents(titleNorm);
    const exactTitle = records.filter(r => {
        const itemName = r.data.title || r.data.name || '';
        const names = [itemName, getRecordTitleAlias(r.data, r.group)].filter(Boolean).map(normalizeRouteText);
        return names.includes(titleNorm) || names.map(removeAccents).includes(cleanQuery);
    });
    if (exactTitle.length === 1) return { ok: true, record: exactTitle[0] };
    if (exactTitle.length > 1) return { ok: false, reason: 'ambiguous', candidates: exactTitle };

    const exactAuthorProfiles = records.filter(r => r.group === 'ky-tai' && normalizeRouteText(getRecordTitleAlias(r.data, r.group)) === queryNorm);
    if (exactAuthorProfiles.length === 1) return { ok: true, record: exactAuthorProfiles[0] };
    if (exactAuthorProfiles.length > 1) return { ok: false, reason: 'ambiguous', candidates: exactAuthorProfiles };

    if (queryNorm.length >= 4) {
        const partial = records.filter(r => {
            const itemName = r.data.title || r.data.name || '';
            return normalizeRouteText(itemName).includes(queryNorm) ||
                   removeAccents(normalizeRouteText(itemName)).includes(cleanQuery) ||
                   normalizeRouteText(r.data.author).includes(queryNorm);
        });
        if (partial.length === 1) return { ok: true, record: partial[0] };
        if (partial.length > 1) return { ok: false, reason: 'ambiguous', candidates: partial };
    }

    return { ok: false, reason: 'not-found' };
}

function findEncyclopediaDOMTarget(record) {
    const container = document.getElementById('encyclopedia-container');
    if (!container || !record) return null;
    const candidates = container.querySelectorAll('.accordion-item[data-group][data-id], .accordion-item[data-group][data-item-id]');
    for (const element of candidates) {
        const elementId = element.dataset.itemId || element.dataset.id;
        if (element.dataset.group === record.group && elementId === record.id) return element;
    }
    return null;
}

function getTheorySectionHeading(record, section) {
    if (!record || record.group !== 'triet-thuyet' || !section || !record.data?.content) return '';
    const wanted = String(section).trim().replace(/\.$/, '');
    const headings = record.data.content.match(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi) || [];
    for (const heading of headings) {
        const plain = heading.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
        const match = plain.match(/^([\d]+(?:\.[\d]+)+)\.?\s*(.*)$/);
        if (match && match[1] === wanted) return match[2].trim();
    }
    return '';
}

function updateEncyclopediaActiveFilter(group) {
    document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(button => {
        button.classList.remove('active'); button.setAttribute('aria-pressed', 'false');
    });
    const buttons = document.querySelectorAll('#encyclopedia-filter-bar .filter-btn');
    const index = { 'triet-thuyet': 0, 'ky-tai': 1, 'tinh-hoa': 2 }[group];
    if (index !== undefined && buttons[index]) {
        buttons[index].classList.add('active'); buttons[index].setAttribute('aria-pressed', 'true');
    }
}

async function gotoEncyclopediaById(query) {
    const resolved = resolveEncyclopediaTarget(query);
    if (!resolved.ok) {
        const queryLabel = typeof query === 'object' ? (query.title || query.name || query.id || query.query || 'đích đến') : String(query ?? '');
        const message = resolved.reason === 'ambiguous'
            ? `Có nhiều mục gần khớp với “${queryLabel}”. Hãy truyền thêm nhóm hoặc tác giả.`
            : `Chưa tìm thấy mục “${queryLabel}” trong Bách Khoa.`;
        console.warn('[ROUTER]', message, resolved.candidates || '');
        const status = document.getElementById('encyclopedia-count');
        if (status) status.textContent = message;
        return { ok: false, reason: resolved.reason, candidates: resolved.candidates || [] };
    }

    const record = resolved.record;
    const token = ++encyclopediaNavigationToken;
    cancelPendingEncyclopediaSearch();
    const searchInput = document.getElementById('encyclopedia-search');
    if (searchInput) searchInput.value = '';
    document.getElementById('clear-search-btn')?.classList.remove('show');
    const filterBar = document.getElementById('encyclopedia-filter-bar');
    if (filterBar) filterBar.style.display = 'flex';

    const switched = await switchView('encyclopedia');
    if (!switched || token !== encyclopediaNavigationToken) return { ok: false, reason: 'superseded' };

    const data = getRecordsForGroup(record.group);
    const sorted = sortEncyData(data.slice(), record.group);
    const itemIndex = sorted.findIndex(item => item.id === record.id);
    if (itemIndex < 0) return { ok: false, reason: 'missing-index-record' };
    
    const targetPage = Math.floor(itemIndex / ENCY_ITEMS_PER_PAGE) + 1;
    const container = document.getElementById('encyclopedia-container');
    
    const reusableTarget = currentEncyGroup === record.group && currentEncyPage === targetPage &&
        container?.dataset.renderedGroup === record.group && container.dataset.searchMode !== 'true'
        ? findEncyclopediaDOMTarget(record) : null;

    if (!reusableTarget) {
        currentEncyGroup = record.group;
        currentEncyPage = targetPage;
        renderEncyclopedia();
    }
    updateEncyclopediaActiveFilter(record.group);

    if (!reusableTarget) {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (token !== encyclopediaNavigationToken) return { ok: false, reason: 'superseded' };
    }

    const targetEl = reusableTarget || findEncyclopediaDOMTarget(record);
    if (!targetEl) return { ok: false, reason: 'dom-not-found', record };

    const section = query && typeof query === 'object' ? query.section : '';
    targetEl.querySelectorAll('.route-section-hint').forEach(node => node.remove());
    if (section) {
        const sectionTitle = getTheorySectionHeading(record, section);
        const summaryTitle = targetEl.querySelector('.summary-title');
        if (summaryTitle) {
            const hint = document.createElement('span');
            hint.className = 'route-section-hint';
            hint.textContent = `Mục ${section}${sectionTitle ? ` · ${sectionTitle}` : ''}`;
            summaryTitle.appendChild(hint);
        }
    }

    targetEl.classList.add('is-visible');
    document.querySelectorAll('#encyclopedia-container .accordion-item').forEach(item => {
        item.style.contentVisibility = 'visible';
    });

    if (lastHighlightedTarget && lastHighlightedTarget !== targetEl) {
        lastHighlightedTarget.classList.remove('highlight-target');
        lastHighlightedTarget.querySelectorAll('.route-section-hint').forEach(node => node.remove());
        lastHighlightedTarget.style.contentVisibility = '';
        const oldTimer = highlightTimers.get(lastHighlightedTarget);
        if (oldTimer) clearTimeout(oldTimer);
    }
    
    const targetTimer = highlightTimers.get(targetEl);
    if (targetTimer) clearTimeout(targetTimer);
    targetEl.classList.remove('highlight-target');
    void targetEl.offsetWidth;
    targetEl.classList.add('highlight-target');
    lastHighlightedTarget = targetEl;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const targetRect = targetEl.getBoundingClientRect();
    const destinationTop = Math.max(0, window.scrollY + targetRect.top + targetRect.height / 2 - window.innerHeight / 2);
    
    if (reducedMotion) {
        const root = document.documentElement;
        const previousBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo({ top: destinationTop, behavior: 'auto' });
        requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
    } else {
        window.scrollTo({ top: destinationTop, behavior: 'smooth' });
    }

    const timer = setTimeout(() => {
        targetEl.classList.remove('highlight-target');
        if (lastHighlightedTarget === targetEl) lastHighlightedTarget = null;
    }, 2800);
    highlightTimers.set(targetEl, timer);

    const status = document.getElementById('encyclopedia-count');
    if (status) {
        const section = query && typeof query === 'object' && query.section ? ` · mục ${query.section}` : '';
        status.textContent = `Đã định vị: ${record.data.title || record.data.name}${section}`;
    }
    return { ok: true, id: record.id, group: record.group, matchedBy: resolved.matchedBy, element: targetEl };
}

function getRecordsForGroup(group) {
    if (group === 'triet-thuyet') return THEORY_DATA;
    if (group === 'ky-tai') return AUTHOR_DATA;
    if (group === 'tinh-hoa') return WORKS_DATA;
    if (group === 'the-loai') return THE_LOAI_DATA;
    return [];
}

/* =====================================================================
   MODULE 6: POETRY ANALYZER (THI PHÁP)
   ===================================================================== */
const POETRY_ANALYZER = (() => {
    function getTone(s) {
        const nfd = s.normalize('NFD');
        return (nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323')) ? 'T' : 'B';
    }
    function getRhymePart(word) {
        if (!word) return '';
        const clean = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const m = clean.match(/[aeiouy]+[^aeiouy]*$/);
        return m ? m[0] : clean.slice(-2);
    }
    function analyzeBangTrac(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length);
        return lines.map((line, i) => {
            const syl = line.match(/[\p{L}\p{N}]+/gu) || [];
            return {
                lineNum: i + 1, text: line, count: syl.length,
                pattern: syl.map(getTone).join(' - '),
                lastSyllable: syl[syl.length - 1] || ''
            };
        });
    }
    function detectForm(lines) {
        const counts = lines.map(l => l.count);
        const n = counts.length;
        const uniform = counts.every(c => c === counts[0]);
        const c = counts[0];
        if (n === 2 && c === 7) return { form: 'Thất ngôn (2 câu)', confidence: 'trung bình', note: '2 câu × 7 chữ' };
        if (n === 4 && c === 7) return { form: 'Thất ngôn tứ tuyệt', confidence: 'cao', note: '4 câu × 7 chữ' };
        if (n === 8 && c === 7) return { form: 'Thất ngôn bát cú Đường luật', confidence: 'cao', note: '8 câu × 7 chữ' };
        if (n >= 2 && counts[0] === 6 && counts[1] === 8) {
            const strict = n % 2 === 0 && counts.every((v, i) => v === (i % 2 === 0 ? 6 : 8));
            return strict
                ? { form: 'Lục bát', confidence: 'cao', note: 'Luân phiên 6-8 đều' }
                : { form: 'Hình thức sáu-tám (biến thể)', confidence: 'trung bình', note: 'Có câu 6-8' };
        }
        if (!uniform) return { form: 'Thơ tự do hoặc biến thể', confidence: 'thấp', note: `Số chữ: ${counts.join(' - ')}` };
        return { form: `Thơ ${c} chữ`, confidence: 'trung bình', note: `${n} câu × ${c} chữ` };
    }
    function checkRhymeDetails(lines) {
        const result = { chan: [], lung: [], lien: [], cach: [] };
        const lastSyl = lines.map(l => l.lastSyllable);
        const rhymeParts = lastSyl.map(getRhymePart);
        for (let i = 0; i < lines.length; i++)
            for (let j = i + 1; j < lines.length; j++) {
                const match = rhymeParts[i] === rhymeParts[j] && rhymeParts[i] !== '';
                result.chan.push({ text: `Câu ${i+1} & Câu ${j+1} ("${lastSyl[i]}" - "${lastSyl[j]}")`, isMatch: match, rhyme: rhymeParts[i] });
            }
        for (let i = 0; i < lines.length - 1; i++) {
            const ep = rhymeParts[i];
            const nw = lines[i+1].text.match(/[\p{L}\p{N}]+/gu) || [];
            for (let k = 0; k < nw.length - 1; k++) {
                if (getRhymePart(nw[k]) === ep && ep !== '') {
                    result.lung.push({ text: `Cuối câu ${i+1} vần với chữ ${k+1} câu ${i+2} ("${nw[k]}")`, isMatch: true, rhyme: ep });
                }
            }
        }
        for (let i = 0; i < lines.length - 1; i += 2) {
            const m = rhymeParts[i] === rhymeParts[i+1] && rhymeParts[i] !== '';
            result.lien.push({ text: `Câu ${i+1} & Câu ${i+2}`, isMatch: m, rhyme: rhymeParts[i] });
        }
        for (let i = 0; i < lines.length - 2; i += 2) {
            const m = rhymeParts[i] === rhymeParts[i+2] && rhymeParts[i] !== '';
            result.cach.push({ text: `Câu ${i+1} & Câu ${i+3}`, isMatch: m, rhyme: rhymeParts[i] });
        }
        return { lastSyllables: lastSyl, rhymeParts, details: result };
    }
    function buildQuestions(form, rhymes, symbols) {
        const qs = [];
        if (form.confidence !== 'cao') qs.push(`Bài được nhận diện là "${form.form}" (độ tin cậy ${form.confidence}). Đây có thể là biến thể có chủ ý hay ngẫu nhiên? (Xem Quyển I, mục 1.3)`);
        if (!rhymes.details.chan.length) qs.push(`Không thấy vần chân rõ ràng. Tác giả có chủ ý dùng vần lỏng, hay đây là thơ tự do?`);
        if (symbols.length) qs.push(`"${symbols[0].keyword}" xuất hiện — trong ngữ cảnh này gợi nghĩa nào? (Xem Quyển ${symbols[0].vol}, mục ${symbols[0].sec})`);
        qs.push(`Điều gì ở bài thơ này là "của riêng" tác giả — khác với bài cùng thể?`);
        return qs.slice(0, 5);
    }
    function generateReport(text) {
        const bangTrac = analyzeBangTrac(text);
        if (!bangTrac.length) return null;
        const form = detectForm(bangTrac);
        const rhymes = checkRhymeDetails(bangTrac);
        const symbols = findSymbols(text);
        const questions = buildQuestions(form, rhymes, symbols);
        return { bangTrac, form, rhymes, symbols, questions };
    }
    return { generateReport };
})();

function executePipeline() {
    const input = document.getElementById('poemInput');
    const panel = document.getElementById('results-panel');
    if (!input || !panel) return;
    const raw = input.value;
    if (!raw.trim()) {
        panel.innerHTML = `<div class="result-step" style="border-left-color:var(--accent-gold);"><p style="font-style:italic;color:var(--text-muted);text-align:center;">Vui lòng nhập bài thơ để phân tích.</p></div>`;
        return;
    }
    const report = POETRY_ANALYZER.generateReport(raw);
    if (!report) { panel.innerHTML = ''; return; }

    const tier0 = report.bangTrac.map(l =>
        `<div class="line-row" style="border-bottom:none!important;padding:8px 0;"><span style="color:var(--text-muted);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2,'0')}</span><span style="flex:1;text-align:center;padding:0 10px;">${l.text}</span><span class="pattern-text">${l.pattern}</span></div>`
    ).join('');

    const renderRhyme = (title, arr, color) => {
        const matches = arr.filter(i => i.isMatch);
        const groups = {};
        matches.forEach(i => {
            if (!groups[i.rhyme]) groups[i.rhyme] = { cauSet: new Set(), wordSet: new Set() };
            (i.text.match(/Câu \d+/g) || []).forEach(n => groups[i.rhyme].cauSet.add(n.replace('Câu ', '')));
            (i.text.match(/"([^"]+)"/g) || []).forEach(w => groups[i.rhyme].wordSet.add(w.replace(/"/g, '')));
        });
        const list = Object.entries(groups).map(([r, d]) =>
            `<li style="margin-bottom:12px;display:flex;justify-content:space-between;padding:12px 16px;background:rgba(139,184,168,0.06);border-radius:10px;flex-wrap:wrap;gap:16px;">
                <span style="flex:1;min-width:220px;line-height:1.5;">Câu ${Array.from(d.cauSet).sort((a,b)=>a-b).join(', ')} <span style="margin-left:8px;font-style:italic;color:var(--text-main);">(${Array.from(d.wordSet).map(w=>`"${w}"`).join(' - ')})</span></span>
                <span style="color:${color};font-weight:700;">${ICONS.check} cùng vần [${r}]</span>
            </li>`
        ).join('');
        return `<div style="margin-bottom:24px;"><strong style="display:block;margin-bottom:12px;color:${color};font-size:0.85rem;text-transform:uppercase;">${title}</strong><ul style="padding-left:0;list-style:none;margin:0;">${list}</ul></div>`;
    };

    const hChan = report.rhymes.details.chan.some(r => r.isMatch);
    const hLung = report.rhymes.details.lung.some(r => r.isMatch);
    const hLien = report.rhymes.details.lien.some(r => r.isMatch);
    const hCach = report.rhymes.details.cach.some(r => r.isMatch);
    let rhymeHtml = '';
    if (hChan) rhymeHtml += renderRhyme('1. Vần chân', report.rhymes.details.chan, 'var(--accent)');
    if (hLung) rhymeHtml += renderRhyme('2. Vần lưng', report.rhymes.details.lung, 'var(--accent-gold)');
    if (hLien) rhymeHtml += renderRhyme('3. Vần liền', report.rhymes.details.lien, 'var(--text-main)');
    if (hCach) rhymeHtml += renderRhyme('4. Vần cách', report.rhymes.details.cach, 'var(--text-muted)');
    if (!hChan && !hLung && !hLien && !hCach) rhymeHtml = `<p style="font-style:italic;color:#e74c3c;padding:15px 0;text-align:center;">Bài thơ không sử dụng vần.</p>`;

    const tier1 = `<div style="margin-bottom:20px;"><strong>Thể thơ:</strong> ${report.form.form} <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note}</span></div>${rhymeHtml}`;
    
    const tier2 = !report.symbols.length
        ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng đặc biệt.</p>`
        : report.symbols.map(s => `<div class="symbol-row" style="padding:8px 0;">
            <span class="symbol-keyword">${escapeHTML(s.keyword)}</span>
            <span class="symbol-meaning"><em style="font-size:0.8rem;">[${escapeHTML(s.type)}]</em> ${escapeHTML(s.mean)}</span>
            <button type="button" class="volume-link" data-route-encyclopedia="true" 
                data-route-volume="${escapeHTML(s.vol)}" 
                data-route-section="${escapeHTML(s.sec)}" 
                data-route-group="triet-thuyet">Xem Bách Khoa</button>
        </div>`).join('');
        
    const tier3 = report.questions.map(q => {
        const formatted = q.replace(/\(Xem Quyển ([IVXLCDM]+), mục ([\d.]+)\)/g, (_, v, sec) => 
            `(<button type="button" class="volume-link" data-route-encyclopedia="true" 
                data-route-volume="${escapeHTML(v)}" 
                data-route-section="${escapeHTML(sec)}" 
                data-route-group="triet-thuyet">Xem Bách Khoa</button>)`
        );
        return `<div class="question-item" style="display:flex;gap:8px;padding:8px 0;"><div>${ICONS.question}</div><div style="line-height:1.6;">${formatted}</div></div>`;
    }).join('');

    panel.innerHTML = `
        <div class="result-step tier-0"><div class="tier-label">TẦNG 0</div><div class="step-title">Bóc tách thanh điệu</div>${tier0}<p class="tier-note">B: không dấu, huyền. T: sắc, hỏi, ngã, nặng.</p></div>
        <div class="result-step tier-1"><div class="tier-label">TẦNG 1</div><div class="step-title">Thể thơ & Vần</div>${tier1}</div>
        <div class="result-step tier-2"><div class="tier-label">TẦNG 2</div><div class="step-title">Biểu tượng · Điển tích</div>${tier2}</div>
        <div class="result-step tier-3"><div class="tier-label">TẦNG 3</div><div class="step-title">Câu hỏi mở</div>${tier3}</div>
    `;
}

/* =====================================================================
   MODULE 7: HIỆU ỨNG & MODULE 8: LOAD DATA
   ===================================================================== */
function initWaterCanvas() {
    const canvas = document.getElementById('water-canvas');
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    let ripples = [], animating = false;
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize(); addEventListener('resize', resize);

    const createRipple = (x, y) => {
        if (ripples.length > 15) return;
        const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8bb8a8';
        ripples.push({ x, y, r: 0, maxR: 30 + Math.random() * 20, a: 0.8, color });
        if (!animating) { animating = true; requestAnimationFrame(animate); }
    };
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = ripples.length - 1; i >= 0; i--) {
            const p = ripples[i];
            p.r += 1.2; p.a -= 0.02;
            if (p.a <= 0 || p.r > p.maxR) { ripples.splice(i, 1); continue; }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.strokeStyle = p.color; ctx.globalAlpha = p.a; ctx.lineWidth = 0.8; ctx.stroke();
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff'; ctx.globalAlpha = p.a * 0.4; ctx.lineWidth = 0.5; ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (ripples.length) requestAnimationFrame(animate); else animating = false;
    };
    addEventListener('touchstart', e => { const t = e.touches[0]; if (t) createRipple(t.clientX, t.clientY); }, { passive: true });
    addEventListener('mousedown', e => { if (matchMedia('(pointer: fine)').matches) createRipple(e.clientX, e.clientY); }, { passive: true });
}

function initDewdrops() {
    const container = document.getElementById('dewdrop-container');
    if (!container || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 6; i++) {
        const d = document.createElement('div');
        d.className = 'dewdrop';
        const size = Math.random() * 6 + 4;
        const dur = Math.random() * 10 + 15;
        d.style.cssText = `
            width:${size}px;height:${size}px;
            left:${Math.random()*100}vw;
            animation-duration:${dur}s;
            animation-delay:-${Math.random()*dur}s;
            background:radial-gradient(circle at 30% 30%, #fff, #8bb8a8);
            box-shadow:0 0 12px 3px rgba(139,184,168,0.6), inset 0 0 5px #fff;
            opacity:${Math.random()*0.4+0.6};
        `;
        container.appendChild(d);
    }
}

async function loadAllData() {
    try {
        const safeFetch = async (url, fallback = []) => {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (e) {
                console.warn(`[SYSTEM] Lỗi tải file ${url}:`, e);
                return fallback; 
            }
        };

        // Nạp 9 file JSON
        const results = await Promise.all([
            safeFetch('./data/data-ly-thuyet.json', []),
            safeFetch('./data/data-tac-gia.json', []),
            safeFetch('./data/data-tac-pham.json', []),
            safeFetch('./data/data-danh-ngon.json', []), 
            safeFetch('./data/data-loi-binh.json', {}),
            safeFetch('./data/data-tu-dien.json', { symbols: {}, dienTich: {}, hanViet: {} }),
            safeFetch('./data/data-the-loai.json', {}),
            safeFetch('./data/data-van-khi.json', { config: {}, advice: {} }),
            safeFetch('./data/data-tu-dien-the-loai.json', []) // Dữ liệu thể loại mới
        ]);

        THEORY_DATA = results[0];
        AUTHOR_DATA = results[1];
        WORKS_DATA  = results[2];
        QUOTES_DATA = results[3];
        COMMENTARY_DATA = results[4];
        
        DICTIONARY_DATA = results[5];
        CATEGORY_NAMES = results[6];
        FORTUNE_CONFIG = results[7].config || {};
        FORTUNE_ADVICE = results[7].advice || {};
        THE_LOAI_DATA = results[8];

        GLOBAL_INDEX.clear(); GLOBAL_INDEX_BY_KEY.clear(); GLOBAL_RECORDS.length = 0;
        
        const addToIndex = (arr, group) => {
            if (!Array.isArray(arr)) return;
            arr.forEach(item => {
                if (!item?.id) return;
                // Một số thể loại có thể không có title mà chỉ có name
                if (!item?.title && !item?.name) return; 
                
                const key = `${group}:${item.id}`;
                const record = { key, id: item.id, group, type: group, data: item };
                if (GLOBAL_INDEX_BY_KEY.has(key)) return;
                GLOBAL_INDEX_BY_KEY.set(key, record);
                GLOBAL_RECORDS.push(record);
                if (!GLOBAL_INDEX.has(item.id)) GLOBAL_INDEX.set(item.id, record);
            });
        };
        addToIndex(THEORY_DATA, 'triet-thuyet');
        addToIndex(AUTHOR_DATA, 'ky-tai');
        addToIndex(WORKS_DATA, 'tinh-hoa');
        addToIndex(THE_LOAI_DATA, 'the-loai'); // Nạp thể loại vào mạng lưới

        initMainFilters();
        
        if (QUOTES_DATA && QUOTES_DATA.length > 0) {
            renderRandomQuote();
            if (quoteIntervalId) clearInterval(quoteIntervalId);
            quoteIntervalId = setInterval(renderRandomQuote, 6000);
        } else {
            const qContainer = document.getElementById('daily-quote-container');
            if (qContainer) qContainer.innerHTML = `<p style="text-align:center; font-style:italic; color:var(--text-muted); padding: 20px;">Không có dữ liệu danh ngôn.</p>`;
        }

        triggerAsyncSearchIndex();

    } catch (err) {
        console.error("[SYSTEM] Lỗi nghiêm trọng khi tải dữ liệu:", err);
    } finally {
        initWaterCanvas();
        initDewdrops();
    }
}

async function auditWorksData() {
    console.log("%c[AUDIT] KIỂM TRA TÁC PHẨM", "color:#8bb8a8;font-weight:bold;");
    let ok = 0, empty = 0, err = 0;
    for (const w of WORKS_DATA) {
        try {
            const res = await fetch(`./data/tac-pham/${encodeURIComponent(w.id)}.json`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            const clean = (d.content || '').replace(/<[^>]*>/g, '').trim();
            if (clean.length > 100 && !clean.includes('đang được Văn Đạo hiệu đính')) ok++;
            else empty++;
        } catch { err++; }
    }
    console.log(`[RESULT] ${ok} CÓ | ${empty} RỖNG | ${err} LỖI`);
}

async function auditAuthorsData() {
    console.log("%c[AUDIT] KIỂM TRA TÁC GIẢ", "color:#8bb8a8;font-weight:bold;");
    let ok = 0, empty = 0, err = 0;
    for (const a of AUTHOR_DATA) {
        try {
            const res = await fetch(`./data/tac-gia/${encodeURIComponent(a.id)}.json`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            const clean = (d.content || '').replace(/<[^>]*>/g, '').trim();
            if (clean.length > 100 && !clean.includes('đang được Văn Đạo hiệu đính')) ok++;
            else empty++;
        } catch { err++; }
    }
    console.log(`[RESULT] ${ok} CÓ | ${empty} RỖNG | ${err} LỖI`);
}

window.auditWorksData = auditWorksData;
window.auditAuthorsData = auditAuthorsData;

function renderRandomQuote() { 
    const c = document.getElementById('daily-quote-container');
    if (!c || QUOTES_DATA.length === 0) return; 
    c.style.opacity = 0;
    setTimeout(() => {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * QUOTES_DATA.length); } while (QUOTES_DATA.length > 1 && newIndex === currentQuoteIndex);
        currentQuoteIndex = newIndex;
        const quote = QUOTES_DATA[currentQuoteIndex];
        
        // Badge xác minh (Tuần 3)
        let statusBadge = '';
        if (quote.verificationStatus) {
            const statusMap = {
                'verified': { text: 'Nguyên văn', color: '#10b981' },
                'translated': { text: 'Bản dịch', color: '#3b82f6' },
                'attributed': { text: 'Tương truyền', color: '#8bb8a8' },
                'needs-review': { text: 'Cần kiểm chứng', color: '#a36b6b' },
                'author-declared': { text: 'Văn Đạo', color: '#d4c4a8' }
            };
            const statusInfo = statusMap[quote.verificationStatus] || { text: 'Khác', color: '#6a7c76' };
            statusBadge = `<span style="display: inline-block; margin-top: 12px; padding: 3px 10px; border-radius: 4px; border: 1px solid ${statusInfo.color}; color: ${statusInfo.color}; font-size: 0.65rem; font-family: var(--font-body); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${statusInfo.text}</span>`;
        }

        c.innerHTML = `<p class="quote-text">${quote.text}</p><p class="quote-author">— ${quote.author} —</p>${statusBadge}`;
        c.style.opacity = 1;
    }, 500);
}

/* =====================================================================
   MODULE 9: KHỞI CHẠY (SỰ LIỀN MẠCH TUYỆT ĐỐI)
   ===================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
    const splash = document.getElementById('jade-splash');
    const status = document.getElementById('bootStatusText');
    const qc = document.querySelector('.boot-quote');
    const qt = document.getElementById('splash-quote-text');

    await new Promise(r => setTimeout(r, 800));
    if (status) status.textContent = "Đang kết nối tri thức...";
    const t0 = Date.now();
    try { await loadAllData(); }
    catch (e) { console.error(e); if (status) status.textContent = "Kết nối yếu..."; await new Promise(r => setTimeout(r, 1000)); }

    if (QUOTES_DATA.length && qc && qt) {
        const q = QUOTES_DATA[Math.floor(Math.random() * QUOTES_DATA.length)];
        qt.innerHTML = `&ldquo;${q.text}&rdquo; <br><span style="font-size:0.8rem;opacity:0.7;margin-top:8px;display:inline-block;">— ${q.author} —</span>`;
        qc.classList.add('show');
    }

    const minSplash = 5000;
    const remaining = Math.max(0, minSplash - (Date.now() - t0));
    if (status) status.textContent = "Sẵn sàng trải nghiệm...";
    await new Promise(r => setTimeout(r, remaining));

    if (splash) {
        const silkOverlay = document.getElementById('silkTransition');
        if (silkOverlay) {
            silkOverlay.classList.remove('entering', 'leaving', 'active');
            void silkOverlay.offsetWidth;
            silkOverlay.classList.add('active', 'entering');
        }
        splash.classList.add('leaving'); 
        setTimeout(() => {
            splash.remove();
            const homeView = document.getElementById('view-home');
            if (homeView) homeView.classList.add('elegant-fade-in');
        }, 500); 
        setTimeout(() => {
            if (silkOverlay) silkOverlay.classList.remove('active', 'entering');
        }, 1000);
    }

    const draft = localStorage.getItem('vandao_draft_poem');
    if (draft) {
        const pi = document.getElementById('poemInput');
        if (pi) pi.value = draft;
        localStorage.removeItem('vandao_draft_poem');
    }

    document.getElementById('search-input')?.addEventListener('input', debounce(() => { currentPage = 1; renderHeritage(); }, 300));
    const encyclopediaSearchInput = document.getElementById('encyclopedia-search');
    if (encyclopediaSearchInput) {
        const debouncedSearch = debounce(searchEncyclopedia, 300);
        cancelPendingEncyclopediaSearch = debouncedSearch.cancel;
        encyclopediaSearchInput.addEventListener('input', debouncedSearch);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab && ['heritage', 'encyclopedia', 'analyze'].includes(initialTab)) {
        setTimeout(() => switchView(initialTab), 500); 
        history.replaceState(null, '', window.location.pathname);
    }

    bindEncyclopediaEvents();
});

document.addEventListener('click', e => {
    // Xử lý tất cả các nút có data-route-encyclopedia
    const routeControl = e.target.closest('[data-route-encyclopedia="true"]');
    if (routeControl) {
        e.preventDefault();
        const route = {};
        if (routeControl.dataset.routeId) route.id = routeControl.dataset.routeId;
        if (routeControl.dataset.routeGroup) route.group = routeControl.dataset.routeGroup;
        if (routeControl.dataset.routeTitle) route.title = routeControl.dataset.routeTitle;
        if (routeControl.dataset.routeAuthor) route.author = routeControl.dataset.routeAuthor;
        if (routeControl.dataset.routeVolume) route.volume = routeControl.dataset.routeVolume;
        if (routeControl.dataset.routeSection) route.section = routeControl.dataset.routeSection;
        if (routeControl.dataset.routeQuery) route.query = routeControl.dataset.routeQuery;
        if (routeControl.dataset.routeAnchor) route.anchor = routeControl.dataset.routeAnchor;
        if (routeControl.dataset.routeHash) route.hash = routeControl.dataset.routeHash;
        if (routeControl.dataset.routeHref) route.href = routeControl.dataset.routeHref;
        if (routeControl.dataset.routeKey) route.key = routeControl.dataset.routeKey;
        if (routeControl.dataset.routeValue) route.value = routeControl.dataset.routeValue;
        gotoEncyclopediaById(route);
        return;
    }

    // Xử lý đóng menu mobile
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (navMenu?.classList.contains('show') && !navMenu.contains(e.target) && !menuBtn?.contains(e.target)) {
        navMenu.classList.remove('show');
        menuBtn?.setAttribute('aria-expanded', 'false');
    }
});

/* =====================================================================
   MODULE 10: TÍNH NĂNG MỞ RỘNG (1.4, 1.5, 2.5) & SETTINGS UI
   ===================================================================== */

/* ---------- 2.5: SYMBOL HIGHLIGHTER ---------- */
function findSymbols(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const out = [];
    const { symbols, dienTich, hanViet } = DICTIONARY_DATA;
    for (const [kw, info] of Object.entries(symbols || {})) if (lower.includes(kw)) out.push({ type: 'Biểu tượng', keyword: kw, ...info });
    for (const [kw, info] of Object.entries(dienTich || {})) if (lower.includes(kw)) out.push({ type: 'Điển tích', keyword: kw, ...info });
    for (const [kw, info] of Object.entries(hanViet || {})) if (lower.includes(kw)) out.push({ type: 'Hán Việt', keyword: kw, ...info });
    return out;
}

function highlightSymbolsInContent(container) {
    if (!container?.firstChild) return;
    const keywords = Object.keys(DICTIONARY_DATA.symbols || {}).concat(Object.keys(DICTIONARY_DATA.dienTich || {}));
    if (!keywords.length) return;

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
            const info = (DICTIONARY_DATA.symbols && DICTIONARY_DATA.symbols[kw.toLowerCase()]) || (DICTIONARY_DATA.dienTich && DICTIONARY_DATA.dienTich[kw.toLowerCase()]);
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

/* ---------- 1.4: RELATED CONTENT ---------- */
function findRelatedWorks(current, limit = 5) {
    if (!current) return [];
    const curSyms = new Set(findSymbols(current.content || '').map(s => s.keyword));
    return WORKS_DATA
        .filter(w => w.id !== current.id)
        .map(w => {
            let score = 0;
            if (w.author === current.author) score += 10;
            const sharedG = (w.the_loai || []).filter(g => (current.the_loai || []).includes(g)).length;
            score += sharedG * 3;
            if (curSyms.size) {
                const sharedS = findSymbols(w.content || '').filter(s => curSyms.has(s.keyword)).length;
                score += sharedS * 2;
            }
            return { w, score };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.w);
}

function appendRelatedSection(container, item, group) {
    if (group !== 'tinh-hoa') return;
    if (container.querySelector('.related-section')) return; 
    const related = findRelatedWorks(item, 5);
    if (!related.length) return;

    const section = document.createElement('div');
    section.className = 'related-section';
    section.innerHTML = `
        <div class="related-title">Tác phẩm liên quan</div>
        <div class="related-grid">
            ${related.map(w => `<button type="button" class="related-card" data-route-encyclopedia="true" data-route-id="${escapeHTML(w.id)}" data-route-group="tinh-hoa" data-route-title="${escapeHTML(w.title)}" data-route-author="${escapeHTML(w.author || '')}">${escapeHTML(w.title)}<small>${escapeHTML(w.author || '')}</small></button>`).join('')}
        </div>
    `;
    container.appendChild(section);
}

/* ---------- 1.5: RANDOM POEM (LITERARY DIVINATION MODAL) ---------- */
function determineFortuneByContext(work) {
    const author = (work.author || '').toLowerCase();
    const era = (work.era || '').toLowerCase();
    const genres = (work.the_loai || []).join(' ').toLowerCase();

    if (author.includes('hồ xuân hương') || author.includes('nguyễn du') || author.includes('nam cao') || author.includes('vũ trọng phụng')) {
        return Math.random() > 0.4 ? 'tieu-hung' : 'binh-hoa';
    }
    if (author.includes('hồ chí minh') || author.includes('tố hữu') || author.includes('phạm tiến duật') || author.includes('chính hữu')) {
        return Math.random() > 0.5 ? 'dai-cat' : 'trung-cat';
    }
    if (author.includes('nguyễn trãi') || author.includes('lý thường kiệt') || author.includes('trần quốc tuấn')) {
        return 'dai-cat';
    }
    if (era.includes('kháng chiến') || era.includes('194') || era.includes('195') || era.includes('196') || era.includes('197')) {
        return Math.random() > 0.4 ? 'tieu-hung' : 'trung-cat';
    }
    if (era.includes('tk 19') || era.includes('tk 18') || era.includes('trung đại') || era.includes('nhà')) {
        return Math.random() > 0.5 ? 'binh-hoa' : 'trung-cat';
    }
    if (genres.includes('truyện ngắn') || genres.includes('tiểu thuyết')) {
        return Math.random() > 0.5 ? 'tieu-cat' : 'tieu-hung';
    }
    if (genres.includes('thơ đường luật') || genres.includes('thơ mới') || genres.includes('lục bát')) {
        return Math.random() > 0.5 ? 'binh-hoa' : 'trung-cat';
    }

    const random = Math.random();
    if (random < 0.1) return 'dai-cat';
    if (random < 0.3) return 'trung-cat';
    if (random < 0.6) return 'tieu-cat';
    if (random < 0.8) return 'binh-hoa';
    if (random < 0.95) return 'tieu-hung';
    return 'dai-hung';
}

function generateBridgeText(work, fortuneKey) {
    const title = work.title;
    const author = work.author;
    const genre = (work.the_loai && work.the_loai[0]) || 'Văn học';
    
    const bridges = {
        'dai-cat': `Vận khí hanh thông, và dường như duyên lành đưa bạn đến với "${title}" của ${author} để tiếp thêm sức mạnh cho những dự định lớn lao.`,
        'trung-cat': `Mọi sự đang trên đà thuận lợi. Tác phẩm ${genre} "${title}" của ${author} như một lời cổ vũ nhẹ nhàng cho những nỗ lực của bạn.`,
        'tieu-cat': `Một chút may mắn ghé thăm. Hãy để "${title}" của ${author} mang đến cho bạn những phút giây thư thái và niềm vui từ những điều giản dị.`,
        'binh-hoa': `Ngày hôm nay như mặt hồ phẳng lặng. Thật hợp để bạn tĩnh tâm cùng "${title}" của ${author} và chiêm nghiệm về những giá trị bình dị.`,
        'tieu-hung': `Dẫu có chút gợn sóng trên mặt hồ tâm trí, nhưng "${title}" của ${author} sẽ là một người bạn đồng hành, nhắc bạn giữ sự điềm tĩnh và nhìn sâu vào bên trong.`,
        'dai-hung': `Trang đời hôm nay có chút bão giông. Hãy để "${title}" của ${author} làm chỗ dựa tinh thần, nhắc bạn rằng nghịch cảnh chính là chất liệu làm nên bản lĩnh.`
    };
    return bridges[fortuneKey] || "";
}

async function randomPoem() {
    const validWorks = WORKS_DATA.filter(w => w.desc && w.desc.trim() !== '');
    if (!validWorks || validWorks.length === 0) {
        alert("Kho tàng văn học đang được tải, vui lòng thử lại sau giây lát.");
        return;
    }

    const overlay = document.getElementById('fate-modal-overlay');
    const loadingEl = document.getElementById('fate-loading');
    const resultEl = document.getElementById('fate-result');
    
    overlay.style.display = 'flex';
    void overlay.offsetWidth; 
    overlay.classList.add('show');
    
    loadingEl.classList.remove('hidden');
    resultEl.classList.remove('show');

    // 1. Render ngầm dữ liệu để chống CLS
    const randomWork = validWorks[Math.floor(Math.random() * validWorks.length)];
    const fortuneKey = determineFortuneByContext(randomWork);
    const fortuneInfo = FORTUNE_CONFIG[fortuneKey] || { name: 'Bình Hòa', color: '#6a7c76' };
    
    let excerpt = randomWork.desc;
    try {
        const res = await fetch(`./data/tac-pham/${encodeURIComponent(randomWork.id)}.json`);
        if (res.ok) {
            const data = await res.json();
            if (data.content) {
                const plainTextCheck = data.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (plainTextCheck.length > 50 && !plainTextCheck.includes('đang được Văn Đạo hiệu đính')) {
                    excerpt = `"${getSmartExcerpt(data.content)}"`; 
                }
            }
        }
    } catch (e) { console.log("Lỗi tải excerpt"); }

    const fortuneData = COMMENTARY_DATA[fortuneKey];
    const adviceText = fortuneData?.advice || "";
    const pool = fortuneData?.commentaries || ["Một ngày bình yên để đọc và ngẫm."];
    const commentaryText = pool[Math.floor(Math.random() * pool.length)];

    const badge = document.getElementById('fate-badge');
    badge.textContent = `Vận Khí: ${fortuneInfo.name}`;
    badge.style.color = fortuneInfo.color;
    badge.style.borderColor = fortuneInfo.color;
    
    document.getElementById('fate-title').textContent = randomWork.title;
    document.getElementById('fate-author').textContent = `— ${randomWork.author} —`;
    document.getElementById('fate-excerpt').innerHTML = excerpt;
    
    const bridgeText = generateBridgeText(randomWork, fortuneKey);
    
    // Xử lý tách Nên / Tránh
    let adviceHtml = '';
    if (adviceText) {
        const parts = adviceText.split('Tránh:');
        const nenText = parts[0] ? parts[0].replace('Nên:', '').trim() : '';
        const tranhText = parts[1] ? parts[1].trim() : '';

        if (tranhText) {
            adviceHtml = `
                <div style="margin-bottom: 8px;">
                    <strong style="color: var(--accent-text);">Nên:</strong> <span style="color: var(--text-main);">${nenText}</span>
                </div>
                <div>
                    <strong style="color: #a36b6b;">Tránh:</strong> <span style="color: var(--text-muted);">${tranhText}</span>
                </div>
            `;
        } else {
            adviceHtml = `<div><strong style="color: var(--accent-text);">Lời khuyên:</strong> ${adviceText}</div>`;
        }
    }

    document.getElementById('fate-commentary').innerHTML = `
        <p style="margin-bottom: 15px; color: var(--accent-text); font-style: italic;">${bridgeText}</p>
        <p style="margin-bottom: 15px;">${commentaryText}</p>
        <div style="background: rgba(139, 184, 168, 0.05); padding: 12px 16px; border-radius: 8px; border-left: 2px solid ${fortuneInfo.color}; font-size: 0.95rem; line-height: 1.6;">
            ${adviceHtml}
        </div>
    `;

    document.getElementById('fate-goto-btn').onclick = () => {
        overlay.classList.remove('show');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
        gotoEncyclopediaById({
            id: randomWork.id,
            group: 'tinh-hoa',
            title: randomWork.title,
            author: randomWork.author
        });
    };

    // 2. Hiện kết quả sau 1.2s
    setTimeout(() => {
        loadingEl.classList.add('hidden');
        resultEl.classList.add('show');
    }, 1200);
}

/* ---------- SETTINGS & OFFLINE UI ---------- */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('draw-literary-fate-btn')?.addEventListener('click', randomPoem);

    const overlay = document.getElementById('fate-modal-overlay');
    const closeBtn = document.getElementById('fate-close-btn');
    
    if (closeBtn && overlay) {
        const closeModal = () => {
            overlay.classList.remove('show');
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        };
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // Khởi tạo Settings Dialog
    const settingsDialog = document.getElementById('settings-dialog');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (settingsDialog && btnOpenSettings && btnCloseSettings) {
        btnOpenSettings.addEventListener('click', () => {
            if (typeof settingsDialog.showModal === 'function') {
                settingsDialog.showModal();
            } else {
                // Fallback cho trình duyệt cũ không hỗ trợ dialog
                settingsDialog.setAttribute('open', '');
            }
        });

        btnCloseSettings.addEventListener('click', () => {
            if (typeof settingsDialog.close === 'function') {
                settingsDialog.close();
            } else {
                settingsDialog.removeAttribute('open');
            }
        });

        // Click ra ngoài để đóng
        settingsDialog.addEventListener('click', (e) => {
            const dialogDimensions = settingsDialog.getBoundingClientRect();
            if (
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom
            ) {
                if (typeof settingsDialog.close === 'function') settingsDialog.close();
                else settingsDialog.removeAttribute('open');
            }
        });
    }
});

/* ---------- HÀM PHÂN TRANG DÙNG CHUNG ---------- */
function renderPagination(totalPages, containerId = 'pagination-container', pageType = 'heritage') {
    const pagContainer = document.getElementById(containerId);
    if (!pagContainer) return;
    if (totalPages <= 1) { pagContainer.innerHTML = ''; return; }

    const page = pageType === 'encyclopedia' ? currentEncyPage : currentPage;

    let html = `<button class="page-btn arrow-btn" onclick="changePage(${page - 1}, '${containerId}', '${pageType}')" ${page === 1 ? 'disabled' : ''}>←</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
            html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="changePage(${i}, '${containerId}', '${pageType}')">${i}</button>`;
        } else if (i === page - 2 || i === page + 2) {
            html += `<span class="page-ellipsis">...</span>`;
        }
    }
    html += `<button class="page-btn arrow-btn" onclick="changePage(${page + 1}, '${containerId}', '${pageType}')" ${page === totalPages ? 'disabled' : ''}>→</button>`;
    pagContainer.innerHTML = html;
}

function changePage(page, containerId = 'pagination-container', pageType = 'heritage') {
    if (pageType === 'encyclopedia') {
        currentEncyPage = page;
        renderEncyclopediaList(currentEncyDataForRender, false);
        document.getElementById('encyclopedia-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        currentPage = page;
        renderHeritage();
        document.getElementById('search-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/* ---------- EXPORT ---------- */
window.gotoEncyclopediaById = gotoEncyclopediaById;
window.resolveEncyclopediaTarget = resolveEncyclopediaTarget;
window.toggleMobileMenu = toggleMobileMenu;
window.filterMainCategory = filterMainCategory;
window.filterSubGenre = filterSubGenre;
window.changePage = changePage;
window.filterEncyclopediaGroup = filterEncyclopediaGroup;
window.executePipeline = executePipeline;
window.randomPoem = randomPoem;
window.handleSearchInput = handleSearchInput;
window.clearSearch = clearSearch;