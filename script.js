/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (VERSION 1.0 - FINAL)
   Tác giả: Văn Đạo
   Mô tả: 
   - Tối ưu hóa hiệu năng (Chỉ vẽ khi lướt tới, Canvas ngủ đông).
   - Phân chia Bách Khoa thành 3 nhóm: Triết Thuyết, Kỳ Tài, Tinh Hoa.
   - Tự động sắp xếp A-Z, cuộn thông minh không bị Header che.
   - Điều phối Màn hình chờ Dải lụa (Splash Screen) mượt mà.
   ===================================================================== */

/* =====================================================================
   MODULE 0: KHO ICON SVG & HẰNG SỐ TOÀN CỤC
   ===================================================================== */
const SVG_ATTR = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;

const ICONS = {
    pen:        `<svg ${SVG_ATTR} width="16" height="16"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    clock:      `<svg ${SVG_ATTR} width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    scroll:     `<svg ${SVG_ATTR} width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    check:      `<svg ${SVG_ATTR} width="16" height="16" stroke="#10b981"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    question:   `<svg ${SVG_ATTR} width="18" height="18" style="color:var(--accent-gold); flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    arrowRight: `<svg ${SVG_ATTR} width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    chevron:    `<svg ${SVG_ATTR} width="20" height="20" class="chevron-icon"><polyline points="6 9 12 15 18 9"></polyline></svg>`
};

const CACHE_KEY = 'vandao_cache_v1';        
const ITEMS_PER_PAGE = 20;                  

let THEORY_DATA = [];    
let AUTHOR_DATA = [];    
let WORKS_DATA = [];     
let QUOTES_DATA = [];    

let currentMainCat = 'all';       
let currentGenre = 'all';         
let currentPage = 1;              
let currentEncyGroup = 'triet-thuyet'; // Mặc định là Triết Thuyết
let currentQuoteIndex = -1;
let quoteIntervalId = null;

const worksDetailCache = new Map();
const viewScrollPositions = { 'home': 0, 'heritage': 0, 'encyclopedia': 0, 'analyze': 0 };


/* =====================================================================
   MODULE 1: ĐỘNG CƠ HIỆU NĂNG (TẢI TRƯỚC 400PX CHỐNG LAG)
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

    function observeNewElements(selector) {
        document.querySelectorAll(selector).forEach(el => observer.observe(el));
    }
    return { observe: observeNewElements };
})();


/* =====================================================================
   MODULE 2: ĐIỀU HƯỚNG (ROUTING) & QUẢN LÝ VIEW
   ===================================================================== */
function switchView(viewId) {
    const currentActive = document.querySelector('.view.active');
    const currentViewId = currentActive ? currentActive.id.replace('view-', '') : null;
    
    if (currentViewId === viewId) return;

    if (currentViewId) {
        viewScrollPositions[currentViewId] = window.scrollY;
        unloadView(currentViewId);
    }
    
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });
    
    const targetView = document.getElementById(`view-${viewId}`);
    const targetNav = document.getElementById(`nav-${viewId}`);
    if (targetView) targetView.classList.add('active');
    if (targetNav) {
        targetNav.classList.add('active');
        targetNav.setAttribute('aria-current', 'page');
    }
    
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('show');
    
    let isRendering = false;
    if (viewId === 'heritage') {
        const grid = document.getElementById('heritage-grid');
        if (grid && grid.innerHTML.trim() === '') {
            grid.innerHTML = Array(6).fill(`<div class="skeleton skeleton-card"><div class="skeleton-line title"></div><div class="skeleton-line desc"></div></div>`).join('');
            setTimeout(() => renderHeritage(), 10); 
            isRendering = true;
        }
    } else if (viewId === 'encyclopedia') {
        const container = document.getElementById('encyclopedia-container');
        if (container && container.innerHTML.trim() === '') {
            setTimeout(() => renderEncyclopedia(), 10);
            isRendering = true;
        }
    }
    
    const savedY = viewScrollPositions[viewId] || 0;
    if (savedY > 0) {
        setTimeout(() => window.scrollTo({ top: savedY, behavior: 'instant' }), isRendering ? 60 : 10);
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function unloadView(viewId) {
    if (viewId === 'heritage') {
        const grid = document.getElementById('heritage-grid');
        if (grid) grid.innerHTML = ''; 
        const pag = document.getElementById('pagination-container');
        if (pag) pag.innerHTML = ''; 
    } else if (viewId === 'encyclopedia') {
        const container = document.getElementById('encyclopedia-container');
        if (container) {
            container.querySelectorAll('details').forEach(d => d.open = false);
            container.innerHTML = ''; 
        }
    }
    // ĐÃ XÓA PHẦN XÓA DOM CỦA 'analyze' ĐỂ GIỮ NGUYÊN KẾT QUẢ
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const btn = document.querySelector('.mobile-menu-btn');
    if (navMenu) {
        const nowOpen = navMenu.classList.toggle('show');
        if (btn) btn.setAttribute('aria-expanded', String(nowOpen));
    }
}


/* =====================================================================
   MODULE 3: CÁC HÀM TIỆN ÍCH
   ===================================================================== */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}


/* =====================================================================
   MODULE 4: VĂN HIẾN (LỌC, TÌM KIẾM, PHÂN TRANG)
   ===================================================================== */
const CATEGORY_NAMES = {
    'van-hoc-dan-gian': 'Văn học Dân gian', 'thi-ca': 'Thi ca', 'van-xuoi': 'Văn xuôi',
    'ky-khao-cuu': 'Ký & Khảo cứu', 'kich-san-khau': 'Kịch & Sân khấu',
    'am-nhac-mua': 'Âm nhạc & Múa', 'my-thuat': 'Mỹ thuật', 'mo-rong': 'Mở rộng'
};

function initMainFilters() {
    const mainBar = document.getElementById('main-filter-bar');
    if (!mainBar || WORKS_DATA.length === 0) return;
    let html = `<button class="filter-btn active" onclick="filterMainCategory('all', this)">Tất cả</button>`;
    Object.keys(CATEGORY_NAMES).forEach(cat => {
        html += `<button class="filter-btn" onclick="filterMainCategory('${cat}', this)">${CATEGORY_NAMES[cat]}</button>`;
    });
    mainBar.innerHTML = html;
}

function filterMainCategory(category, btnElement) {
    currentMainCat = category; currentGenre = 'all'; currentPage = 1;
    document.querySelectorAll('#main-filter-bar .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    
    const subBar = document.getElementById('sub-filter-bar');
    if (category === 'all') { subBar.style.display = 'none'; renderHeritage(); return; }
    
    const itemsInCat = WORKS_DATA.filter(item => item.loai_hinh === category);
    const uniqueGenres = new Set();
    itemsInCat.forEach(item => { if (Array.isArray(item.the_loai)) item.the_loai.forEach(g => uniqueGenres.add(g)); });
    
    if (uniqueGenres.size === 0) { 
        subBar.style.display = 'none'; 
    } else {
        subBar.style.display = 'flex';
        let subHtml = `<button class="filter-btn active" onclick="filterSubGenre('all', this)" style="padding: 6px 16px; font-size: 0.8rem;">Tất cả thể loại</button>`;
        Array.from(uniqueGenres).sort().forEach(genre => { 
            subHtml += `<button class="filter-btn" onclick="filterSubGenre('${genre}', this)" style="padding: 6px 16px; font-size: 0.8rem;">${genre}</button>`; 
        });
        subBar.innerHTML = subHtml;
    }
    renderHeritage();
}

function filterSubGenre(genre, btnElement) {
    currentGenre = genre; currentPage = 1;
    document.querySelectorAll('#sub-filter-bar .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderHeritage();
}

function renderHeritage() {
    const grid = document.getElementById('heritage-grid');
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (!grid) return;
    
    let data = WORKS_DATA;
    if (currentMainCat !== 'all') data = data.filter(item => item.loai_hinh === currentMainCat);
    if (currentGenre !== 'all') data = data.filter(item => item.the_loai && item.the_loai.includes(currentGenre));
    if (keyword) data = data.filter(item => 
        item.title.toLowerCase().includes(keyword) || 
        item.author.toLowerCase().includes(keyword) || 
        (item.desc && item.desc.toLowerCase().includes(keyword))
    );
    
    if (data.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); font-style: italic;">Không tìm thấy mục từ nào phù hợp.</p>`;
        document.getElementById('pagination-container').innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const paginatedData = data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    grid.innerHTML = paginatedData.map(item => {
        let genreTags = '';
        if (Array.isArray(item.the_loai)) {
            genreTags = item.the_loai.map(g => `<span class="h-tag" style="margin-right: 5px; margin-bottom: 5px;">${g}</span>`).join(' ');
        }
        const detailBtn = item.id 
            ? `<button onclick="gotoEncyclopediaById('${item.id}')" class="detail-btn">Chi tiết ${ICONS.arrowRight}</button>` 
            : '';
            
        return `
        <div class="heritage-card" id="${item.id}">
            <div style="display: flex; flex-wrap: wrap; margin-bottom: 10px;">${genreTags}</div>
            <h3>${item.title}</h3>
            <div class="h-author">${ICONS.pen} ${item.author}</div>
            <p>${item.desc || ''}</p>
            <div class="h-meta">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <span>${ICONS.clock} ${item.era || 'Mọi thời đại'}</span>
                    <span>${ICONS.scroll} ${item.script || 'Đa dạng'}</span>
                </div>
                ${detailBtn}
            </div>
        </div>`;
    }).join('');
    
    renderPagination(totalPages);
    const countEl = document.getElementById('heritage-count');
    if (countEl) countEl.textContent = `Tìm thấy ${data.length} tác phẩm`;
    
    PerformanceEngine.observe('.heritage-card');
}

function renderPagination(totalPages) {
    let pagContainer = document.getElementById('pagination-container');
    if (!pagContainer) return;
    if (totalPages <= 1) { pagContainer.innerHTML = ''; return; }
    
    let html = `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Trước</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) { 
            html += `<span class="page-ellipsis">...</span>`; 
        }
    }
    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Sau</button>`;
    pagContainer.innerHTML = html;
}

function changePage(page) { 
    currentPage = page; 
    renderHeritage(); 
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
}


/* =====================================================================
   MODULE 5: BÁCH KHOA (3 NHÓM: TRIẾT THUYẾT - KỲ TÀI - TINH HOA)
   ===================================================================== */

// Hàm dùng chung: Sắp xếp A-Z (Bỏ qua tiền tố "Quyển I", "Chân Dung Tác Giả:")
function sortEncyData(data) {
    return data.sort((a, b) => {
        const cleanTitle = (t) => t.replace(/^(Quyển [IVXLCDM]+\.|Chân Dung Tác Giả:)\s*/i, '').toLowerCase();
        return cleanTitle(a.title).localeCompare(cleanTitle(b.title));
    });
}

function filterEncyclopediaGroup(group, btnElement) {
    currentEncyGroup = group;
    document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    if (btnElement) {
        btnElement.classList.add('active');
        btnElement.setAttribute('aria-pressed', 'true');
    }
    const searchInput = document.getElementById('encyclopedia-search');
    if (searchInput) searchInput.value = '';
    renderEncyclopedia();
}

function renderEncyclopedia() {
    const container = document.getElementById('encyclopedia-container');
    if (!container) return;
    
    // 1. LẤY DỮ LIỆU THEO TỪNG NHÓM
    let data = [];
    if (currentEncyGroup === 'triet-thuyet') data = [...THEORY_DATA];
    else if (currentEncyGroup === 'ky-tai') data = [...AUTHOR_DATA];
    else if (currentEncyGroup === 'tinh-hoa') data = [...WORKS_DATA];

    if (!data || data.length === 0) {
        container.innerHTML = `<p style="text-align: center; padding: 40px; color: var(--text-muted); font-style: italic;">Không có dữ liệu.</p>`;
        return;
    }

    // 2. SẮP XẾP A-Z
    sortEncyData(data);
    
    // 3. RENDER HTML
    container.innerHTML = data.map((item, index) => `
        <div class="accordion-item" id="vol-${index}">
            <details data-index="${index}">
                <summary><span class="summary-title">${item.title}</span>${ICONS.chevron}</summary>
                <div class="accordion-content"></div>
            </details>
        </div>
    `).join('');

    const allDetails = container.querySelectorAll('details');
    allDetails.forEach(detail => {
        detail.addEventListener('toggle', async function() {
            const index = parseInt(this.getAttribute('data-index'));
            const contentDiv = this.querySelector('.accordion-content');
            const dataItem = data[index];
            
            if (this.open) {
                allDetails.forEach(other => { if (other !== this && other.open) other.open = false; });
                
                if (contentDiv.innerHTML.trim() === '') {
                    // Lazy Load chỉ áp dụng cho Tinh Hoa (Tác Phẩm)
                    if (currentEncyGroup === 'tinh-hoa') {
                        contentDiv.innerHTML = `<p style="opacity:.5;font-style:italic; padding: 10px;">${ICONS.clock} Đang tải nội dung...</p>`;
                        try {
                            const full = await loadWorkDetail(dataItem.id);
                            contentDiv.innerHTML = full.content || '<p>Đang cập nhật nội dung...</p>';
                        } catch (err) {
                            contentDiv.innerHTML = `<p style="color:var(--text-muted); padding: 10px;">Không tải được nội dung. Vui lòng kiểm tra mạng.</p>`;
                        }
                    } else {
                        // Triết Thuyết và Kỳ Tài đã có content sẵn
                        contentDiv.innerHTML = dataItem.content;
                    }
                }
            } else { 
                contentDiv.innerHTML = ''; 
            }
        });
    });
    
    PerformanceEngine.observe('.accordion-item');
}

function searchEncyclopedia() {
    const keyword = document.getElementById('encyclopedia-search').value.toLowerCase().trim();
    const items = document.querySelectorAll('.accordion-item');
    
    let data = [];
    if (currentEncyGroup === 'triet-thuyet') data = [...THEORY_DATA];
    else if (currentEncyGroup === 'ky-tai') data = [...AUTHOR_DATA];
    else if (currentEncyGroup === 'tinh-hoa') data = [...WORKS_DATA];
    
    sortEncyData(data); // Phải sort để index khớp với lúc render
    
    items.forEach(item => {
        const details = item.querySelector('details');
        const title = item.querySelector('.summary-title').textContent.toLowerCase();
        const index = parseInt(details.getAttribute('data-index'));
        const datum = data[index];
        
        let searchable = (datum.content || '').toLowerCase();
        if (!searchable && datum.id) {
            const cached = worksDetailCache.get(datum.id);
            searchable = (cached?.content || datum.desc || '').toLowerCase();
        }
        const cleanContent = searchable.replace(/<[^>]*>/g, '');
        
        if (title.includes(keyword) || cleanContent.includes(keyword)) {
            item.classList.remove('hidden-by-search');
            if (keyword !== '') details.open = true;
        } else {
            item.classList.add('hidden-by-search');
            details.open = false;
            details.querySelector('.accordion-content').innerHTML = '';
        }
    });
    
    const visible = document.querySelectorAll('.accordion-item:not(.hidden-by-search)').length;
    const countEl = document.getElementById('encyclopedia-count');
    if (countEl) countEl.textContent = `Tìm thấy ${visible} mục`;
}

function gotoEncyclopediaById(id) {
    let searchId = id.toLowerCase();
    if (/^[ivx]+$/.test(searchId)) searchId = 'quyen-' + searchId;
    
    let targetGroup = '';
    let targetData = [];
    let searchIdInSorted = -1;

    // 1. Xác định tác phẩm/tác giả nằm ở nhóm nào
    if (THEORY_DATA.some(item => item.id === searchId)) {
        targetGroup = 'triet-thuyet'; targetData = [...THEORY_DATA];
    } else if (AUTHOR_DATA.some(item => item.id === searchId)) {
        targetGroup = 'ky-tai'; targetData = [...AUTHOR_DATA];
    } else if (WORKS_DATA.some(item => item.id === searchId)) {
        targetGroup = 'tinh-hoa'; targetData = [...WORKS_DATA];
    }
    
    if (targetGroup !== '') {
        currentEncyGroup = targetGroup;
        
        // Cập nhật UI Nút bấm
        document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        const btns = document.querySelectorAll('#encyclopedia-filter-bar .filter-btn');
        if (targetGroup === 'triet-thuyet' && btns[0]) { btns[0].classList.add('active'); btns[0].setAttribute('aria-pressed', 'true'); }
        if (targetGroup === 'ky-tai' && btns[1]) { btns[1].classList.add('active'); btns[1].setAttribute('aria-pressed', 'true'); }
        if (targetGroup === 'tinh-hoa' && btns[2]) { btns[2].classList.add('active'); btns[2].setAttribute('aria-pressed', 'true'); }
        
        // Render lại giao diện
        const currentActive = document.querySelector('.view.active');
        const currentViewId = currentActive ? currentActive.id.replace('view-', '') : null;
        if (currentViewId === 'encyclopedia') renderEncyclopedia();
        else switchView('encyclopedia');

        // Tìm đúng vị trí (Index) sau khi đã sắp xếp A-Z
        sortEncyData(targetData); 
        searchIdInSorted = targetData.findIndex(item => item.id === searchId);
        
        // Đợi render xong, mở sách và cuộn mượt mà
        setTimeout(() => {
            const finalTarget = document.getElementById(`vol-${searchIdInSorted}`);
            if (finalTarget) {
                finalTarget.classList.add('is-visible'); 
                finalTarget.style.opacity = '1';
                finalTarget.style.transform = 'translateY(0)';
                
                const detailsEl = finalTarget.querySelector('details');
                if(detailsEl) detailsEl.open = true;
                
                // Đợi 350ms cho Accordion mở ra hết cỡ
                setTimeout(() => {
                    const summaryEl = finalTarget.querySelector('summary');
                    if (summaryEl) {
                        // Dùng Native scrollIntoView, CSS đã có scroll-margin-top để né Header
                        summaryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    // Bật hiệu ứng Highlight (CSS sẽ lo phần animation)
                    finalTarget.classList.add('highlight-target');
                    setTimeout(() => finalTarget.classList.remove('highlight-target'), 2000);
                }, 350); 
            }
        }, 300);
    } else { 
        console.warn('Không tìm thấy mục này trong Bách Khoa.'); 
    }
}


/* =====================================================================
   MODULE 6: ĐỘNG CƠ PHÂN TÍCH THI PHÁP (4 TẦNG)
   ===================================================================== */
const POETRY_ANALYZER = (() => {
    function getTone(syllable) { 
        const nfd = syllable.normalize('NFD'); 
        return (nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323')) ? 'T' : 'B'; 
    }
    function getRhymePart(word) { 
        if (!word) return ''; 
        const clean = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); 
        const match = clean.match(/[aeiouy]+[^aeiouy]*$/); 
        return match ? match[0] : clean.slice(-2); 
    }
    function analyzeBangTrac(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        return lines.map((line, i) => {
            const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
            const pattern = syllables.map(s => getTone(s)).join(' - ');
            return { lineNum: i + 1, text: line, count: syllables.length, pattern, lastSyllable: syllables[syllables.length - 1] || '' };
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
            return strict ? { form: 'Lục bát', confidence: 'cao', note: 'Luân phiên 6-8 đều' } : { form: 'Hình thức sáu-tám (biến thể)', confidence: 'trung bình', note: 'Có câu 6-8' }; 
        }
        
        if (!uniform) return { form: 'Thơ tự do hoặc biến thể', confidence: 'thấp', note: `Số chữ mỗi câu: ${counts.join(' - ')}` };
        return { form: `Thơ ${c} chữ`, confidence: 'trung bình', note: `${n} câu × ${c} chữ` };
    }
    function checkRhymeDetails(lines) {
        const result = { chan: [], lung: [], lien: [], cach: [] };
        const lastSyl = lines.map(l => l.lastSyllable); 
        const rhymeParts = lastSyl.map(s => getRhymePart(s));
        
        for (let i = 0; i < lines.length; i++) { 
            for (let j = i + 1; j < lines.length; j++) { 
                const match = (rhymeParts[i] === rhymeParts[j] && rhymeParts[i] !== ''); 
                result.chan.push({ text: `Câu ${i+1} & Câu ${j+1} ("${lastSyl[i]}" - "${lastSyl[j]}")`, isMatch: match, rhyme: rhymeParts[i] }); 
            } 
        }
        for (let i = 0; i < lines.length - 1; i++) { 
            const endPart = rhymeParts[i]; 
            const nextWords = lines[i+1].text.match(/[\p{L}\p{N}]+/gu) || []; 
            let hasMatch = false; 
            for (let k = 0; k < nextWords.length - 1; k++) { 
                const match = (getRhymePart(nextWords[k]) === endPart && endPart !== ''); 
                if (match) { 
                    result.lung.push({ text: `Cuối câu ${i+1} vần với chữ ${k+1} câu ${i+2} ("${nextWords[k]}")`, isMatch: true, rhyme: endPart }); 
                    hasMatch = true; 
                } 
            } 
        }
        for (let i = 0; i < lines.length - 1; i += 2) { 
            const match = (rhymeParts[i] === rhymeParts[i+1] && rhymeParts[i] !== ''); 
            result.lien.push({ text: `Câu ${i+1} & Câu ${i+2} ("${lastSyl[i]}" - "${lastSyl[i+1]}")`, isMatch: match, rhyme: rhymeParts[i] }); 
        }
        for (let i = 0; i < lines.length - 2; i += 2) { 
            const match = (rhymeParts[i] === rhymeParts[i+2] && rhymeParts[i] !== ''); 
            result.cach.push({ text: `Câu ${i+1} & Câu ${i+3} ("${lastSyl[i]}" - "${lastSyl[i+2]}")`, isMatch: match, rhyme: rhymeParts[i] }); 
        }
        return { lastSyllables: lastSyl, rhymeParts, details: result };
    }
    const SYMBOLS = { 'trăng': { vol: 'V', sec: '5.2', mean: 'đoàn viên, nhớ quê, cô đơn' }, 'nguyệt': { vol: 'V', sec: '5.2', mean: 'Hán Việt của "trăng"' }, 'liễu': { vol: 'V', sec: '5.2', mean: 'chia biệt' }, 'đào': { vol: 'V', sec: '5.2', mean: 'tuổi trẻ, mùa xuân' }, 'sen': { vol: 'V', sec: '5.2', mean: 'thanh khiết' }, 'hạc': { vol: 'V', sec: '5.2', mean: 'thanh cao, trường thọ' }, 'nhạn': { vol: 'V', sec: '5.2', mean: 'tin tức' }, 'mây': { vol: 'V', sec: '5.2', mean: 'phiêu du' }, 'nước': { vol: 'V', sec: '5.2', mean: 'thời gian, mềm mại' }, 'thuyền': { vol: 'V', sec: '5.2', mean: 'hành trình' }, 'bến đò': { vol: 'V', sec: '5.2', mean: 'gặp gỡ, chia tay' } };
    const DIEN_TICH = { 'sân lai': { vol: 'V', sec: '5.2', mean: 'lòng hiếu thảo' }, 'ngưu lang': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' }, 'chức nữ': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' }, 'gót sen': { vol: 'V', sec: '5.2', mean: 'đôi chân phụ nữ phong kiến' }, 'bèo dạt': { vol: 'V', sec: '5.2', mean: 'thân phận trôi nổi' }, 'chim lồng': { vol: 'V', sec: '5.2', mean: 'bị giam hãm' } };
    const HAN_VIET = { 'vọng': { vol: 'VIII', sec: '8.5', mean: '望 — trông về, ngóng đợi.' }, 'khúc': { vol: 'VIII', sec: '8.5', mean: '曲 — khúc nhạc.' }, 'dặm trường': { vol: 'VIII', sec: '8.5', mean: 'trường = 長 (dài) — đường xa.' } };
    
    function findSymbols(text) { 
        const lower = text.toLowerCase(); const out = []; 
        for (const [kw, info] of Object.entries(SYMBOLS)) { if (lower.includes(kw)) out.push({ type: 'Biểu tượng', keyword: kw, ...info }); } 
        for (const [kw, info] of Object.entries(DIEN_TICH)) { if (lower.includes(kw)) out.push({ type: 'Điển tích', keyword: kw, ...info }); } 
        for (const [kw, info] of Object.entries(HAN_VIET)) { if (lower.includes(kw)) out.push({ type: 'Hán Việt', keyword: kw, ...info }); } 
        return out; 
    }
    
    function buildQuestions(form, rhymes, symbols) {
        const qs = [];
        if (form.confidence !== 'cao') qs.push(`Bài được nhận diện là "${form.form}" (độ tin cậy ${form.confidence}). Đây có thể là biến thể có chủ ý hay chỉ là ngẫu nhiên? (Xem Quyển I, mục 1.3)`);
        if (rhymes.details.chan.length === 0) qs.push(`Không thấy vần chân rõ ràng giữa các câu. Tác giả có chủ ý dùng vần lỏng, hay đây là thơ tự do?`);
        if (symbols.length > 0) qs.push(`"${symbols[0].keyword}" xuất hiện — trong ngữ cảnh này, nó đang gợi nghĩa nào? (Xem Quyển ${symbols[0].vol}, mục ${symbols[0].sec})`);
        qs.push(`Điều gì ở bài thơ này là "của riêng" tác giả — khác với những bài cùng thể?`);
        return qs.slice(0, 5);
    }
    
    function generateReport(text) { 
        const bangTrac = analyzeBangTrac(text); 
        if (bangTrac.length === 0) return null; 
        const form = detectForm(bangTrac); 
        const rhymes = checkRhymeDetails(bangTrac); 
        const symbols = findSymbols(text); 
        const questions = buildQuestions(form, rhymes, symbols); 
        return { bangTrac, form, rhymes, symbols, questions }; 
    }
    
    return { generateReport };
})();

function executePipeline() {
    const inputField = document.getElementById('poemInput'); 
    const resultsPanel = document.getElementById('results-panel');
    if (!inputField || !resultsPanel) return;
    
    const rawText = inputField.value;
    if (!rawText.trim()) { 
        resultsPanel.innerHTML = `<div class="result-step" style="border-left-color:var(--accent-gold);"><p style="font-style:italic;color:var(--text-muted);text-align:center;">Vui lòng nhập bài thơ để phân tích.</p></div>`; 
        return; 
    }
    
    const report = POETRY_ANALYZER.generateReport(rawText); 
    if (!report) { resultsPanel.innerHTML = ''; return; }
    
    const tier0 = report.bangTrac.map(l => `<div class="line-row" style="border-bottom: none !important; padding: 8px 0;"><span style="color:var(--text-muted);font-family:var(--font-sans);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2,'0')}</span><span style="flex:1;text-align:center;padding:0 10px;">${l.text}</span><span class="pattern-text">${l.pattern}</span></div>`).join('');
    
    const renderRhymeList = (title, arr, color) => {
        const matches = arr.filter(item => item.isMatch);
        
        const groups = {};
        matches.forEach(item => {
            if (!groups[item.rhyme]) groups[item.rhyme] = { cauSet: new Set(), wordSet: new Set() };
            const nums = item.text.match(/Câu \d+/g) || [];
            nums.forEach(n => groups[item.rhyme].cauSet.add(n.replace('Câu ', '')));
            const words = item.text.match(/"([^"]+)"/g) || [];
            words.forEach(w => groups[item.rhyme].wordSet.add(w.replace(/"/g, '')));
        });
        
        const list = Object.entries(groups).map(([rhyme, data]) => {
            const cauList = Array.from(data.cauSet).sort((a, b) => a - b).join(', ');
            const wordList = Array.from(data.wordSet).map(w => `"${w}"`).join(' <span style="opacity: 0.5; margin: 0 4px;">-</span> ');
            
            return `<li style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; font-size: 0.95rem; color: var(--text-muted); padding: 12px 16px; background: rgba(139,184,168,0.06); border-radius: 10px; flex-wrap: wrap; gap: 16px;">
                <span style="font-weight: 500; flex: 1; min-width: 220px; line-height: 1.5;">
                    Câu ${cauList} 
                    <span style="margin-left: 8px; font-style: italic; color: var(--text-main);">(${wordList})</span>
                </span>
                <span style="color: ${color}; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                    ${ICONS.check} cùng vần [${rhyme}]
                </span>
            </li>`;
        }).join('');
        
        return `<div style="margin-bottom: 24px;">
            <strong style="display: block; margin-bottom: 12px; color: ${color}; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">${title}</strong>
            <ul style="padding-left: 0; list-style: none; margin: 0;">${list}</ul>
        </div>`;
    };

    const hasChan = report.rhymes.details.chan.some(r => r.isMatch);
    const hasLung = report.rhymes.details.lung.some(r => r.isMatch);
    const hasLien = report.rhymes.details.lien.some(r => r.isMatch);
    const hasCach = report.rhymes.details.cach.some(r => r.isMatch);

    let rhymeHtml = '';
    if (hasChan) rhymeHtml += renderRhymeList('1. Vần chân (cuối câu)', report.rhymes.details.chan, 'var(--accent)');
    if (hasLung) rhymeHtml += renderRhymeList('2. Vần lưng (chữ giữa câu)', report.rhymes.details.lung, 'var(--accent-gold)');
    if (hasLien) rhymeHtml += renderRhymeList('3. Vần liền (câu 1-2, 3-4)', report.rhymes.details.lien, 'var(--text-main)');
    if (hasCach) rhymeHtml += renderRhymeList('4. Vần cách (câu 1-3, 2-4)', report.rhymes.details.cach, 'var(--text-muted)');

    if (!hasChan && !hasLung && !hasLien && !hasCach) {
        rhymeHtml = `<p style="font-style: italic; color: #e74c3c; padding: 15px 0; text-align: center; font-weight: 500; font-size: 1rem;">Bài thơ không sử dụng vần chân, vần lưng, vần liền hay vần cách.</p>`;
    }

    const tier1 = `<div style="margin-bottom:20px;"><strong>Thể thơ nhận diện:</strong> ${report.form.form} <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note} (độ tin cậy: ${report.form.confidence})</span></div>${rhymeHtml}`;
    
    const tier2 = report.symbols.length === 0 ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng / điển tích / từ Hán Việt đặc biệt.</p>` : report.symbols.map(s => `<div class="symbol-row" style="border-bottom: none !important; padding: 8px 0;"><span class="symbol-keyword">${s.keyword}</span><span class="symbol-meaning"><em style="color:var(--text-main);font-size:0.8rem;">[${s.type}]</em> ${s.mean}</span><span class="volume-link" onclick="gotoEncyclopediaById('${s.vol}')">Xem Bách Khoa</span></div>`).join('');
    
    const tier3 = report.questions.map(q => {
        const formattedQ = q.replace(/\(Xem Quyển ([IVX]+), mục ([\d.]+)\)/g, (match, vol, sec) => `(<span class="volume-link" onclick="gotoEncyclopediaById('${vol}')">Xem Bách Khoa</span>)`);
        return `<div class="question-item" style="display: flex; align-items: flex-start; border-bottom: none !important; padding: 8px 0;"><div style="margin-top: 2px;">${ICONS.question}</div><div style="line-height: 1.6;">${formattedQ}</div></div>`;
    }).join('');
    
    resultsPanel.innerHTML = `<div class="result-step tier-0"><div class="tier-label">TẦNG 0 — DỮ KIỆN THÔ</div><div class="step-title">Bóc tách thanh điệu (Bằng / Trắc)</div>${tier0}<p class="tier-note">B (Bằng): không dấu, dấu huyền. T (Trắc): sắc, hỏi, ngã, nặng.</p></div><div class="result-step tier-1"><div class="tier-label">TẦNG 1 — ĐỐI CHIẾU LÝ THUYẾT</div><div class="step-title">Thể thơ và Hệ thống Vần</div>${tier1}</div><div class="result-step tier-2"><div class="tier-label">TẦNG 2 — CHIẾU RỌI</div><div class="step-title">Biểu tượng · Điển tích · Hán Việt</div>${tier2}</div><div class="result-step tier-3"><div class="tier-label">TẦNG 3 — MỞ NGỎ</div><div class="step-title">Câu hỏi cho người đọc</div>${tier3}</div>`;
}


/* =====================================================================
   MODULE 7: HIỆU ỨNG ĐỘNG (CANVAS SÓNG NƯỚC TINH TẾ)
   ===================================================================== */
function initWaterCanvas() {
    const canvas = document.getElementById('water-canvas');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    let ripples = [];
    let isAnimating = false; 

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createRipple = (x, y) => {
        if (ripples.length > 15) return; 

        const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8bb8a8';

        ripples.push({
            x: x, 
            y: y,
            radius: 0,
            maxRadius: 30 + Math.random() * 20, 
            alpha: 0.8,
            color: color
        });

        if (!isAnimating) {
            isAnimating = true;
            requestAnimationFrame(animate);
        }
    };

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = ripples.length - 1; i >= 0; i--) {
            const p = ripples[i];
            p.radius += 1.2; 
            p.alpha -= 0.02;

            if (p.alpha <= 0 || p.radius > p.maxRadius) {
                ripples.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.lineWidth = 0.8; 
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = p.alpha * 0.4;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1; 

        if (ripples.length > 0) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false; 
        }
    };

    window.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        if (t) createRipple(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener('mousedown', (e) => {
        if (window.matchMedia('(pointer: fine)').matches) {
            createRipple(e.clientX, e.clientY);
        }
    }, { passive: true });
}

function initDewdrops() {
    const container = document.getElementById('dewdrop-container');
    if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    for (let i = 0; i < 15; i++) {
        const drop = document.createElement('div'); 
        drop.className = 'dewdrop';
        
        const layer = Math.floor(Math.random() * 3) + 1; 
        let size, blur, opacity, duration;
        
        if (layer === 1) { 
            size = Math.random() * 3 + 1; blur = 2; opacity = 0.3; duration = Math.random() * 10 + 15;
        } else if (layer === 2) { 
            size = Math.random() * 4 + 3; blur = 1; opacity = 0.6; duration = Math.random() * 10 + 10;
        } else { 
            size = Math.random() * 6 + 5; blur = 0; opacity = 0.9; duration = Math.random() * 5 + 8;
        }

        drop.style.width = `${size}px`; 
        drop.style.height = `${size}px`;
        drop.style.left = `${Math.random() * 100}vw`; 
        drop.style.animationDuration = `${duration}s`;
        drop.style.animationDelay = `-${Math.random() * duration}s`; 
        drop.style.filter = `blur(${blur}px)`;
        drop.style.opacity = opacity;
        
        container.appendChild(drop); 
    }
}


/* =====================================================================
   MODULE 8: TẢI DỮ LIỆU & BỘ NHỚ ĐỆM (CACHE)
   ===================================================================== */
async function loadWorkDetail(id) {
    if (worksDetailCache.has(id)) return worksDetailCache.get(id);
    const res = await fetch(`./data/tac-pham/${encodeURIComponent(id)}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    worksDetailCache.set(id, data);
    return data;
}

function prefetchAllWorkDetails() {
    if (!WORKS_DATA?.length) return;
    const prefetch = () => { WORKS_DATA.forEach(w => loadWorkDetail(w.id).catch(() => {})); };
    if (window.requestIdleCallback) window.requestIdleCallback(prefetch);
    else setTimeout(prefetch, 2000);
}

async function loadAllData() {
    try {
        const [resT, resA, resW, resQ] = await Promise.all([
            fetch('./data/data-ly-thuyet.json',  { cache: 'no-store' }),
            fetch('./data/data-tac-gia.json',    { cache: 'no-store' }),
            fetch('./data/data-tac-pham.json',   { cache: 'no-store' }),
            fetch('./data/data-danh-ngon.json',  { cache: 'no-store' })
        ]);
        
        THEORY_DATA = await resT.json();
        AUTHOR_DATA = await resA.json();
        WORKS_DATA  = await resW.json();
        QUOTES_DATA = await resQ.json();
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({ theory: THEORY_DATA, authors: AUTHOR_DATA, quotes: QUOTES_DATA }));
        
        initMainFilters(); 
        renderRandomQuote(); 
        if (quoteIntervalId) clearInterval(quoteIntervalId);
        quoteIntervalId = setInterval(renderRandomQuote, 6000);
        
        handleHashScroll();
        prefetchAllWorkDetails(); 
        renderHeritage();
        
    } catch (error) { 
        console.error("Lỗi tải dữ liệu (có thể do mạng yếu):", error);
        
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            THEORY_DATA = parsed.theory || [];
            AUTHOR_DATA = parsed.authors || [];
            QUOTES_DATA = parsed.quotes || [];
            initMainFilters();
            renderRandomQuote();
            renderHeritage();
        }
    } finally {
        initWaterCanvas(); 
        initDewdrops();
    }
}

function renderRandomQuote() { 
    const container = document.getElementById('daily-quote-container'); 
    if (!container || QUOTES_DATA.length === 0) return; 
    container.style.opacity = 0;
    setTimeout(() => {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * QUOTES_DATA.length); } while (QUOTES_DATA.length > 1 && newIndex === currentQuoteIndex);
        currentQuoteIndex = newIndex;
        const quote = QUOTES_DATA[currentQuoteIndex];
        
        container.innerHTML = `<p class="quote-text">${quote.text}</p><p class="quote-author">— ${quote.author} —</p>`;
        container.style.opacity = 1;
    }, 500);
}

function handleHashScroll() {
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        
        if (hash.startsWith('view-')) {
            const viewId = hash.replace('view-', '');
            switchView(viewId);
            return;
        }

        const dataIndex = WORKS_DATA.findIndex(item => item.id === hash);
        if (dataIndex !== -1) {
            currentPage = Math.floor(dataIndex / ITEMS_PER_PAGE) + 1;
            currentMainCat = 'all'; currentGenre = 'all'; 
            document.querySelectorAll('#main-filter-bar .filter-btn').forEach(btn => btn.classList.remove('active'));
            const firstBtn = document.querySelector('#main-filter-bar .filter-btn');
            if (firstBtn) firstBtn.classList.add('active');
            document.getElementById('sub-filter-bar').style.display = 'none';
            switchView('heritage');
            setTimeout(() => {
                const element = document.getElementById(hash);
                if (element) {
                    element.classList.add('is-visible'); 
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-target');
                    setTimeout(() => element.classList.remove('highlight-target'), 2000);
                }
            }, 600);
        }
    }
}


/* =====================================================================
   MODULE 9: KHỞI CHẠY & ĐIỀU PHỐI SPLASH SCREEN
   ===================================================================== */
document.addEventListener('DOMContentLoaded', async () => { 
    // 1. Khôi phục bài thơ đang viết dở
    const savedPoem = localStorage.getItem('vandao_draft_poem');
    if (savedPoem) {
        const poemInput = document.getElementById('poemInput');
        if (poemInput) poemInput.value = savedPoem;
        localStorage.removeItem('vandao_draft_poem');
    }

    // 2. ĐÁNH DẤU THỜI GIAN BẮT ĐẦU (Để tính toán thời gian hiển thị Lụa)
    const startTime = Date.now();
    const splash = document.getElementById('jade-splash');
    const container = document.querySelector('.container');

    // 3. TIẾN HÀNH TẢI DỮ LIỆU (Chạy ngầm)
    await loadAllData(); 

    // 4. TÍNH TOÁN THỜI GIAN CHỜ (Giữ hiệu ứng Lụa ít nhất 2.5 giây để người dùng kịp nhìn)
    const minSplashTime = 2500; // 2.5 giây
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minSplashTime - elapsedTime);

    // 5. ĐỢI CHO ĐỦ THỜI GIAN RỒI MỚI TAN LỤA VÀ HIỆN TRANG CHỦ
    setTimeout(() => {
        if (splash) {
            // Bước 5.1: Kích hoạt hiệu ứng Lụa tan đi (trượt ra 4 phía)
            splash.classList.add('leaving'); 
            
            // Bước 5.2: Đợi Lụa trượt đi một nửa (khoảng 800ms) thì bắt đầu cho trang chủ sáng lên
            setTimeout(() => {
                if (container) container.classList.add('app-ready');
            }, 800); 

            // Bước 5.3: Dọn dẹp thẻ Splash khỏi DOM sau khi trượt xong (1.5s) để giải phóng bộ nhớ
            setTimeout(() => splash.remove(), 1500);
        } else {
            if (container) container.classList.add('app-ready');
        }
    }, remainingTime);

    // 6. Gắn các sự kiện tìm kiếm
    const searchInputHeritage = document.getElementById('search-input');
    if (searchInputHeritage) {
        searchInputHeritage.addEventListener('input', debounce(() => { currentPage = 1; renderHeritage(); }, 300)); 
    }
    const searchInputEncy = document.getElementById('encyclopedia-search');
    if (searchInputEncy) {
        searchInputEncy.addEventListener('input', debounce(() => { searchEncyclopedia(); }, 300));
    }
});

window.addEventListener('hashchange', handleHashScroll);

document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (navMenu && navMenu.classList.contains('show') && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        navMenu.classList.remove('show');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    }
});
