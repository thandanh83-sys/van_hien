/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (VERSION 4.4 - ELEGANT MODAL)
   Tác giả: Văn Đạo
   
   TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
   - Tương tác Tĩnh tại (Zen-like Interaction): Sử dụng Fate Modal cho 
     tính năng "Một bài thơ cho hôm nay", mang lại cảm giác như mở một 
     cuốn sách trước mắt.
   - Tiết kiệm Data (Data Economy): Phân trang dạng mũi tên cho Bách Khoa 
     và Văn Hiến, giảm tải DOM và băng thông.
   - Điều hướng Chính xác (Precision Routing): gotoEncyclopediaById chỉ 
     cuộn tới và phát sáng, không tự động mở để tránh lỗi Layout Shift.
   - Sự thanh tao: Loại bỏ URL Hash, giữ mọi thứ tinh gọn và nhã nhặn.
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

const GLOBAL_INDEX = new Map();

let currentMainCat = 'all';
let currentGenre = 'all';
let currentPage = 1;
let currentEncyGroup = 'triet-thuyet';
let currentEncyPage = 1;
let currentEncyDataForRender = [];
let currentQuoteIndex = -1;
let quoteIntervalId = null;

/* --- Bảng biểu tượng / điển tích / Hán Việt --- */
const SYMBOLS = {
    'trăng': { vol: 'V', sec: '5.2', mean: 'đoàn viên, nhớ quê, cô đơn' },
    'nguyệt': { vol: 'V', sec: '5.2', mean: 'Hán Việt của "trăng"' },
    'liễu': { vol: 'V', sec: '5.2', mean: 'chia biệt' },
    'đào': { vol: 'V', sec: '5.2', mean: 'tuổi trẻ, mùa xuân' },
    'sen': { vol: 'V', sec: '5.2', mean: 'thanh khiết' },
    'hạc': { vol: 'V', sec: '5.2', mean: 'thanh cao, trường thọ' },
    'nhạn': { vol: 'V', sec: '5.2', mean: 'tin tức' },
    'mây': { vol: 'V', sec: '5.2', mean: 'phiêu du' },
    'nước': { vol: 'V', sec: '5.2', mean: 'thời gian, mềm mại' },
    'thuyền': { vol: 'V', sec: '5.2', mean: 'hành trình' },
    'bến đò': { vol: 'V', sec: '5.2', mean: 'gặp gỡ, chia tay' }
};
const DIEN_TICH = {
    'sân lai': { vol: 'V', sec: '5.2', mean: 'lòng hiếu thảo' },
    'ngưu lang': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' },
    'chức nữ': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' },
    'gót sen': { vol: 'V', sec: '5.2', mean: 'đôi chân phụ nữ phong kiến' },
    'bèo dạt': { vol: 'V', sec: '5.2', mean: 'thân phận trôi nổi' },
    'chim lồng': { vol: 'V', sec: '5.2', mean: 'bị giam hãm' }
};
const HAN_VIET = {
    'vọng': { vol: 'VIII', sec: '8.5', mean: '望 — trông về, ngóng đợi.' },
    'khúc': { vol: 'VIII', sec: '8.5', mean: '曲 — khúc nhạc.' },
    'dặm trường': { vol: 'VIII', sec: '8.5', mean: 'trường = 長 (dài) — đường xa.' }
};

function findSymbols(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const out = [];
    for (const [kw, info] of Object.entries(SYMBOLS)) if (lower.includes(kw)) out.push({ type: 'Biểu tượng', keyword: kw, ...info });
    for (const [kw, info] of Object.entries(DIEN_TICH)) if (lower.includes(kw)) out.push({ type: 'Điển tích', keyword: kw, ...info });
    for (const [kw, info] of Object.entries(HAN_VIET)) if (lower.includes(kw)) out.push({ type: 'Hán Việt', keyword: kw, ...info });
    return out;
}

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
   MODULE 2: VIEW MANAGER (PROMISE-BASED, CHỐNG RACE CONDITION)
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
        if (!targetView) { console.warn('[VIEW] Không tìm thấy:', viewId); return false; }
        
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
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
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

// Định dạng nội dung: Chia mục I, II, III... và bỏ in đậm tên bài thơ
function formatContent(html) {
    if (!html) return '';
    // Tách các mục La Mã (I., II., III., IV.) thành đoạn mới
    let formatted = html.replace(/([IVX]+\.)\s/g, '<br><br><strong>$1</strong> ');
    // Xóa in đậm ở tên bài thơ (thường nằm ở đầu)
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
const CATEGORY_NAMES = {
    'van-hoc-dan-gian': 'Văn học Dân gian', 'thi-ca': 'Thi ca', 'van-xuoi': 'Văn xuôi',
    'ky-khao-cuu': 'Ký & Khảo cứu', 'kich-san-khau': 'Kịch & Sân khấu',
    'am-nhac-mua': 'Âm nhạc & Múa', 'my-thuat': 'Mỹ thuật', 'mo-rong': 'Mở rộng'
};

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
        const tags = Array.isArray(item.the_loai)
            ? item.the_loai.map(g => `<span class="h-tag">${g}</span>`).join(' ')
            : '';
        const btn = item.id
            ? `<button onclick="gotoEncyclopediaById('${item.id}')" class="detail-btn">Chi tiết ${ICONS.arrowRight}</button>`
            : '';
        return `
        <div class="heritage-card" id="${item.id}">
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
        if (pending.has(key)) return pending.get(key);

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
                    result = { content: item.content || '' };
                }
                setCache(key, result);
                return result;
            } catch (err) {
                if (err.name === 'AbortError') console.log(`[CONTENT] Huỷ tải: ${key}`);
                throw err;
            }
        })();

        pending.set(key, task);
        try { return await task; }
        finally { pending.delete(key); }
    }

    return { load, clearCache: () => { cache.clear(); currentSize = 0; }, getStats: () => ({ items: cache.size, size: currentSize }) };
})();

const accordionAbortControllers = new Map();

function findEncyclopediaItem(id, group) {
    if (group === 'triet-thuyet') return THEORY_DATA.find(i => i.id === id);
    if (group === 'ky-tai') return AUTHOR_DATA.find(i => i.id === id);
    if (group === 'tinh-hoa') return WORKS_DATA.find(i => i.id === id);
    return null;
}

async function ensureAccordionContent(details) {
    if (!details || !details.open) return;
    const itemId = details.dataset.id;
    const group = details.dataset.group;
    const contentDiv = details.querySelector('.accordion-content');
    if (!itemId || !group || !contentDiv) return;
    if (contentDiv.dataset.contentLoaded === 'true') return;
    if (contentDiv.dataset.loading === 'true') return;

    const controller = new AbortController();
    accordionAbortControllers.set(itemId, controller);

    const item = findEncyclopediaItem(itemId, group);
    if (!item) return;

    contentDiv.dataset.loading = 'true';
    contentDiv.innerHTML = `<p style="opacity:.5;font-style:italic;padding:10px;">${ICONS.clock} Đang tải nội dung...</p>`;

    try {
        const data = await ContentManager.load(item, group, controller.signal);
        if (!details.isConnected || !details.open || details.dataset.id !== itemId) return;

        if (data.content && data.content.trim()) {
            // Sử dụng formatContent để chia mục I, II, III...
            contentDiv.innerHTML = formatContent(data.content);
            highlightSymbolsInContent(contentDiv);           // [2.5]
            appendRelatedSection(contentDiv, item, group);    // [1.4]
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
        accordionAbortControllers.delete(itemId);
    }
}

function clearAccordionContent(details) {
    const itemId = details.dataset.id;
    if (accordionAbortControllers.has(itemId)) {
        accordionAbortControllers.get(itemId).abort();
        accordionAbortControllers.delete(itemId);
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
   MODULE 5.1: SEARCH ENGINE (BUILD NGẦM)
   ===================================================================== */
const VDSearchEngine = (() => {
    let invertedIndex = {}, docLengths = {}, totalDocs = 0, isIndexed = false;
    const STOPWORDS = new Set(["cua","va","la","co","trong","cho","nhung","cac","mot","duoc","voi","da","de","khi","ra","ve","tu","nhu","nguoi","tai","thi","ma","nay","do"]);

    function tokenize(text) {
        if (!text) return [];
        const clean = removeAccents(text.toLowerCase().replace(/<[^>]*>/g, ' '));
        return (clean.match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 1 && !STOPWORDS.has(w));
    }

    async function buildIndexAsync() {
        invertedIndex = {}; docLengths = {};
        const entries = Array.from(GLOBAL_INDEX.entries());
        totalDocs = entries.length;
        const CHUNK = 50;
        for (let i = 0; i < entries.length; i += CHUNK) {
            entries.slice(i, i + CHUNK).forEach(([id, idx]) => {
                const item = idx.data;
                const words = tokenize([item.title, item.author, item.desc, item.content].join(' '));
                docLengths[id] = words.length;
                words.forEach(w => {
                    if (!invertedIndex[w]) invertedIndex[w] = {};
                    invertedIndex[w][id] = (invertedIndex[w][id] || 0) + 1;
                });
            });
            await new Promise(r => setTimeout(r, 0));
        }
        isIndexed = true;
        console.log("[SEARCH] Build index xong.");
    }

    function search(query) {
        const qNorm = removeAccents(query.trim().toLowerCase());
        const tokens = qNorm.split(/\s+/).filter(t => t.length);
        if (!tokens.length) return [];
        const scores = {};

        GLOBAL_INDEX.forEach((idx, id) => {
            const item = idx.data;
            const tTitle = removeAccents((item.title || '').toLowerCase());
            const tContent = removeAccents((item.content || '').toLowerCase());
            if (qNorm.length > 2) {
                if (tTitle.includes(qNorm)) scores[id] = (scores[id] || 0) + 500;
                else if (tContent.includes(qNorm)) scores[id] = (scores[id] || 0) + 100;
            }
        });

        tokens.forEach(w => {
            if (!invertedIndex[w]) return;
            const docs = invertedIndex[w];
            const idf = Math.log(totalDocs / Object.keys(docs).length) + 1;
            for (const [docId, count] of Object.entries(docs)) {
                const tf = count / docLengths[docId];
                let score = tf * idf;
                const item = GLOBAL_INDEX.get(docId).data;
                const tTitle = removeAccents((item.title || '').toLowerCase());
                const tAuthor = removeAccents((item.author || '').toLowerCase());
                if (tTitle.includes(w)) score *= 5;
                else if (tAuthor.includes(w)) score *= 3;
                scores[docId] = (scores[docId] || 0) + score;
            }
        });

        return Object.entries(scores).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
    }

    return { buildIndexAsync, search, getIndexStatus: () => isIndexed };
})();

function triggerAsyncSearchIndex() {
    if (!VDSearchEngine.getIndexStatus()) VDSearchEngine.buildIndexAsync();
}

/* =====================================================================
   MODULE 5.2: RENDER ENCYCLOPEDIA & ROUTER
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
        return clean(a.title).localeCompare(clean(b.title));
    });
}

function filterEncyclopediaGroup(group, btnElement) {
    currentEncyGroup = group;
    currentEncyPage = 1; // Reset trang khi đổi nhóm
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

    if (!dataToRender?.length) {
        container.innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-muted);">Không có dữ liệu.</p>`;
        document.getElementById('encyclopedia-pagination').innerHTML = '';
        container.dataset.renderedGroup = currentEncyGroup;
        bindEncyclopediaEvents();
        return;
    }

    // Phân trang cho Bách Khoa
    const totalPages = Math.ceil(dataToRender.length / ENCY_ITEMS_PER_PAGE);
    if (currentEncyPage > totalPages) currentEncyPage = totalPages;
    if (currentEncyPage < 1) currentEncyPage = 1;

    const pagedData = dataToRender.slice((currentEncyPage - 1) * ENCY_ITEMS_PER_PAGE, currentEncyPage * ENCY_ITEMS_PER_PAGE);

    container.innerHTML = pagedData.map(item => {
        const group = item._group || currentEncyGroup;
        let title = item.title;
        let badge = '';
        if (isSearchMode) {
            title = highlightText(item.title, tokens);
            const bt = group === 'triet-thuyet' ? 'Lý Thuyết' : (group === 'ky-tai' ? 'Tác Giả' : 'Tác Phẩm');
            const bc = group === 'triet-thuyet' ? '#557a6f' : (group === 'ky-tai' ? '#8bb8a8' : '#d4c4a8');
            badge = `<span style="font-size:0.65em;opacity:0.9;color:#fff;background-color:${bc};padding:2px 6px;border-radius:4px;margin-left:8px;white-space:nowrap;font-family:var(--font-body);">${bt}</span>`;
        }
        return `
        <div class="accordion-item" id="${escapeHTML(item.id)}" data-id="${escapeHTML(item.id)}" data-group="${group}">
            <details data-id="${escapeHTML(item.id)}" data-group="${group}">
                <summary><span class="summary-title">${title} ${badge}</span>${ICONS.chevron}</summary>
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
        document.getElementById('encyclopedia-container').innerHTML = `<p style="text-align:center;padding:40px;color:var(--text-muted);font-style:italic;">Không tìm thấy kết quả nào cho "${escapeHTML(kw)}".</p>`;
        document.getElementById('encyclopedia-count').textContent = `Tìm thấy 0 mục`;
        document.getElementById('encyclopedia-pagination').innerHTML = '';
        return;
    }
    const tokens = removeAccents(kw.toLowerCase()).split(/\s+/).filter(t => t.length);
    const data = results.map(r => {
        const idx = GLOBAL_INDEX.get(r.id);
        return { ...idx.data, _group: idx.type };
    });
    currentEncyPage = 1;
    renderEncyclopediaList(data, true, tokens);
    document.getElementById('encyclopedia-count').textContent = `Tìm thấy ${results.length} mục`;
}

// HÀM ĐIỀU HƯỚNG (CHỈ CUỘN TỚI VÀ PHÁT SÁNG - KHÔNG TỰ MỞ)
async function gotoEncyclopediaById(id) {
    if (!id) return;
    let searchId = String(id).toLowerCase().trim();
    
    if (/^[ivxlcdm]+$/i.test(searchId)) {
        const vol = `quyen-${searchId}`;
        if (THEORY_DATA.some(i => i.id === vol)) searchId = vol;
    }

    const targetInfo = GLOBAL_INDEX.get(searchId);
    if (!targetInfo) { console.warn('[ROUTER] Không tìm thấy ID:', searchId); return; }
    const targetGroup = targetInfo.type;

    // 1. Reset thanh tìm kiếm
    const si = document.getElementById('encyclopedia-search');
    if (si) si.value = '';
    document.getElementById('clear-search-btn')?.classList.remove('show');
    const filterBar = document.getElementById('encyclopedia-filter-bar');
    if (filterBar) filterBar.style.display = 'flex';

    // 2. Chuyển sang tab Bách Khoa
    const switched = await switchView('encyclopedia');
    if (!switched) return;

    // 3. Chuyển sang đúng nhóm và Render
    currentEncyGroup = targetGroup;
    currentEncyPage = 1; // Reset về trang 1 khi nhảy tới
    
    // Tìm vị trí của item trong danh sách để tính toán trang
    let data = [];
    if (currentEncyGroup === 'triet-thuyet') data = THEORY_DATA;
    else if (currentEncyGroup === 'ky-tai') data = AUTHOR_DATA;
    else if (currentEncyGroup === 'tinh-hoa') data = WORKS_DATA;
    
    sortEncyData(data, currentEncyGroup);
    const itemIndex = data.findIndex(i => i.id === searchId);
    if (itemIndex !== -1) {
        currentEncyPage = Math.floor(itemIndex / ENCY_ITEMS_PER_PAGE) + 1;
    }

    renderEncyclopedia();

    // Cập nhật trạng thái nút bấm Filter
    document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
    });
    const btns = document.querySelectorAll('#encyclopedia-filter-bar .filter-btn');
    if (targetGroup === 'triet-thuyet' && btns[0]) { btns[0].classList.add('active'); btns[0].setAttribute('aria-pressed', 'true'); }
    if (targetGroup === 'ky-tai' && btns[1]) { btns[1].classList.add('active'); btns[1].setAttribute('aria-pressed', 'true'); }
    if (targetGroup === 'tinh-hoa' && btns[2]) { btns[2].classList.add('active'); btns[2].setAttribute('aria-pressed', 'true'); }

    // 4. Tìm phần tử ĐÍCH (Vỏ Accordion)
    const targetEl = document.getElementById(searchId);
    if (!targetEl) return;

    // 5. Cuộn tới phần tử (Lúc này Accordion vẫn ĐANG ĐÓNG - Chiều cao nhỏ, căn giữa cực chuẩn)
    await new Promise(requestAnimationFrame);
    
    targetEl.classList.add('is-visible'); 
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // 6. Phát sáng phần tử
    targetEl.classList.add('highlight-target');
    
    // 7. Tự động tắt phát sáng sau 2.5 giây
    setTimeout(() => {
        targetEl.classList.remove('highlight-target');
    }, 2500);
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
        : report.symbols.map(s => `<div class="symbol-row" style="padding:8px 0;"><span class="symbol-keyword">${s.keyword}</span><span class="symbol-meaning"><em style="font-size:0.8rem;">[${s.type}]</em> ${s.mean}</span><span class="volume-link" onclick="gotoEncyclopediaById('${s.vol}')">Xem Bách Khoa</span></div>`).join('');
    const tier3 = report.questions.map(q => {
        const formatted = q.replace(/\(Xem Quyển ([IVX]+), mục ([\d.]+)\)/g, (_, v) => `(<span class="volume-link" onclick="gotoEncyclopediaById('${v}')">Xem Bách Khoa</span>)`);
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
        const [rT, rA, rW, rQ, rC] = await Promise.all([
            fetch('./data/data-ly-thuyet.json'),
            fetch('./data/data-tac-gia.json'),
            fetch('./data/data-tac-pham.json'),
            fetch('./data/data-danh-ngon.json'),
            fetch('./data/data-loi-binh.json') // File lời bình Tam giáo
        ]);
        THEORY_DATA = await rT.json();
        AUTHOR_DATA = await rA.json();
        WORKS_DATA  = await rW.json();
        QUOTES_DATA = await rQ.json();
        COMMENTARY_DATA = await rC.json();

        const addToIndex = (arr, type) => arr.forEach(item => {
            if (GLOBAL_INDEX.has(item.id)) {
                console.warn(`[INDEX] Trùng ID: "${item.id}" (${GLOBAL_INDEX.get(item.id).type} vs ${type}). Giữ bản cũ.`);
            } else GLOBAL_INDEX.set(item.id, { type, data: item });
        });
        addToIndex(THEORY_DATA, 'triet-thuyet');
        addToIndex(AUTHOR_DATA, 'ky-tai');
        addToIndex(WORKS_DATA, 'tinh-hoa');

        initMainFilters();
        renderRandomQuote();
        if (quoteIntervalId) clearInterval(quoteIntervalId);
        quoteIntervalId = setInterval(renderRandomQuote, 6000);

        triggerAsyncSearchIndex();

    } catch (err) {
        console.error("[SYSTEM] Lỗi tải dữ liệu:", err);
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
    if (!c || !QUOTES_DATA.length) return;
    c.style.opacity = 0;
    setTimeout(() => {
        let ni;
        do { ni = Math.floor(Math.random() * QUOTES_DATA.length); } while (QUOTES_DATA.length > 1 && ni === currentQuoteIndex);
        currentQuoteIndex = ni;
        const q = QUOTES_DATA[currentQuoteIndex];
        c.innerHTML = `<p class="quote-text">${q.text}</p><p class="quote-author">— ${q.author} —</p>`;
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

    // --- NGHI THỨC CHUYỂN GIAO: SPLASH -> SILK -> TRANG CHỦ ---
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
    document.getElementById('encyclopedia-search')?.addEventListener('input', debounce(searchEncyclopedia, 300));

    // Xử lý PWA Shortcuts (Query Param)
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab && ['heritage', 'encyclopedia', 'analyze'].includes(initialTab)) {
        setTimeout(() => switchView(initialTab), 500); 
        history.replaceState(null, '', window.location.pathname);
    }

    bindEncyclopediaEvents();
});

document.addEventListener('click', e => {
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (navMenu?.classList.contains('show') && !navMenu.contains(e.target) && !menuBtn?.contains(e.target)) {
        navMenu.classList.remove('show');
        menuBtn?.setAttribute('aria-expanded', 'false');
    }
});

/* =====================================================================
   MODULE 10: TÍNH NĂNG MỞ RỘNG (1.4, 1.5, 2.5)
   ===================================================================== */

/* ---------- 2.5: SYMBOL HIGHLIGHTER ---------- */
function highlightSymbolsInContent(container) {
    if (!container?.firstChild) return;
    const keywords = Object.keys(SYMBOLS).concat(Object.keys(DIEN_TICH));
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
            const info = SYMBOLS[kw.toLowerCase()] || DIEN_TICH[kw.toLowerCase()];
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
            ${related.map(w => `<div class="related-card" data-goto="${escapeHTML(w.id)}">${escapeHTML(w.title)}<small>${escapeHTML(w.author || '')}</small></div>`).join('')}
        </div>
    `;
    section.addEventListener('click', e => {
        const card = e.target.closest('[data-goto]');
        if (card) gotoEncyclopediaById(card.dataset.goto);
    });
    container.appendChild(section);
}

/* ---------- 1.5: RANDOM POEM (LITERARY DIVINATION MODAL) ---------- */
const FORTUNE_CONFIG = {
    'dai-cat':   { name: 'Đại Cát',   color: '#d4c4a8' }, 
    'trung-cat': { name: 'Trung Cát', color: '#8bb8a8' }, 
    'tieu-cat':  { name: 'Tiểu Cát',  color: '#739e8f' }, 
    'binh-hoa':  { name: 'Bình Hòa',  color: '#6a7c76' }, 
    'tieu-hung': { name: 'Tiểu Hung', color: '#a36b6b' }, 
    'dai-hung':  { name: 'Đại Hung',  color: '#804a4a' }  
};

const FORTUNE_ADVICE = {
    'dai-cat':   "Nên: Hành động táo bạo, nắm bắt cơ hội. Tránh: Sự chủ quan.",
    'trung-cat': "Nên: Tiếp tục nỗ lực, mở rộng kết nối. Tránh: Nóng vội.",
    'tieu-cat':  "Nên: Tận hưởng điều nhỏ bé, hoàn thiện việc cũ. Tránh: Kỳ vọng quá cao.",
    'binh-hoa':  "Nên: Nghỉ ngơi, đọc sách, chiêm nghiệm. Tránh: Đưa ra quyết định lớn.",
    'tieu-hung': "Nên: Cẩn trọng lời ăn tiếng nói, giữ bình tĩnh. Tránh: Tranh cãi.",
    'dai-hung':  "Nên: Ẩn mình, bảo toàn sức khỏe, thiền định. Tránh: Đối đầu trực diện."
};

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
    
    loadingEl.style.display = 'block';
    resultEl.style.display = 'none';

    setTimeout(async () => {
        const randomWork = validWorks[Math.floor(Math.random() * validWorks.length)];
        const fortuneKey = determineFortuneByContext(randomWork);
        const fortuneInfo = FORTUNE_CONFIG[fortuneKey];
        
        let excerpt = randomWork.desc;
        try {
            const res = await fetch(`./data/tac-pham/${encodeURIComponent(randomWork.id)}.json`);
            if (res.ok) {
                const data = await res.json();
                if (data.content) {
                    const plainText = data.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    if (plainText.length > 50 && !plainText.includes('đang được Văn Đạo hiệu đính')) {
                        excerpt = `"${plainText.substring(0, 150)}..."`;
                    }
                }
            }
        } catch (e) { console.log("Lỗi tải excerpt"); }

        let pool = COMMENTARY_DATA[fortuneKey] || ["Một ngày bình yên để đọc và ngẫm."];
        const commentaryText = pool[Math.floor(Math.random() * pool.length)];
        const adviceText = FORTUNE_ADVICE[fortuneKey] || "";

        const badge = document.getElementById('fate-badge');
        badge.textContent = `Vận Khí: ${fortuneInfo.name}`;
        badge.style.color = fortuneInfo.color;
        badge.style.borderColor = fortuneInfo.color;
        
        document.getElementById('fate-title').textContent = randomWork.title;
        document.getElementById('fate-author').textContent = `— ${randomWork.author} —`;
        document.getElementById('fate-excerpt').innerHTML = excerpt;
        
        const bridgeText = generateBridgeText(randomWork, fortuneKey);
        
        document.getElementById('fate-commentary').innerHTML = `
            <p style="margin-bottom: 15px; color: var(--accent-text); font-style: italic;">${bridgeText}</p>
            <p style="margin-bottom: 15px;">${commentaryText}</p>
            <div style="background: rgba(0,0,0,0.03); padding: 10px 15px; border-radius: 8px; border-left: 2px solid ${fortuneInfo.color}; font-size: 0.95rem;">
                <strong>Lời khuyên:</strong> ${adviceText}
            </div>
        `;

        document.getElementById('fate-goto-btn').onclick = () => {
            overlay.classList.remove('show');
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
            gotoEncyclopediaById(randomWork.id);
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 500);
        };

        loadingEl.style.display = 'none';
        resultEl.style.display = 'block';

    }, 1200);
}

// Sự kiện đóng Modal (Gắn 1 lần duy nhất)
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
});

/* ---------- EXPORT ---------- */
window.gotoEncyclopediaById = gotoEncyclopediaById;
window.toggleMobileMenu = toggleMobileMenu;
window.filterMainCategory = filterMainCategory;
window.filterSubGenre = filterSubGenre;
window.changePage = changePage;
window.filterEncyclopediaGroup = filterEncyclopediaGroup;
window.executePipeline = executePipeline;
window.randomPoem = randomPoem;
window.handleSearchInput = handleSearchInput;
window.clearSearch = clearSearch;

/* ---------- HÀM PHÂN TRANG DÙNG CHUNG (Đã hỗ trợ mũi tên) ---------- */
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
