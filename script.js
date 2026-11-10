/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (ULTIMATE V113)
   Tác giả: Văn Đạo
   Mô tả: 
   - Đã loại bỏ Canvas Gooey để chống lag, thay bằng hiệu ứng CSS.
   - Hiệu ứng chuyển Theme loang Gradient (Thanh Ngọc / Đen ánh Kim).
   - Tự động khôi phục nháp bài thơ khi App cập nhật ngầm.
   - Đồng bộ màu thanh trạng thái điện thoại (Trắng/Đen).
   - Tối ưu hóa hiệu năng và sửa lỗi Smart Link.
   ===================================================================== */

/* =====================================================================
   MODULE 1: HỆ THỐNG ICONS (SVG) & HẰNG SỐ TOÀN CỤC
   ===================================================================== */
const ICON_PEN = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
const ICON_BOOK = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
const ICON_CLOCK = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const ICON_SCROLL = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
const ICON_CHECK_GREEN = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 6px; display: inline-block;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const ICON_QUESTION = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--accent-gold)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; display: inline-block; flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
const ICON_ARROW_RIGHT = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-left: 4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

const THEME_KEY = 'vandao_theme';       
const CACHE_KEY = 'vandao_cache_v24'; // Tăng version để xóa cache dữ liệu cũ
const ITEMS_PER_PAGE = 20;              

let THEORY_DATA = [];    
let AUTHOR_DATA = [];    
let WORKS_DATA = [];     
let QUOTES_DATA = [];    

let currentMainCat = 'all';       
let currentGenre = 'all';         
let currentPage = 1;              
let currentEncyGroup = 'ly-thuyet'; 

/* =====================================================================
   MODULE 2: QUẢN LÝ THEME (SÁNG/TỐI) & FAVICON
   ===================================================================== */
// Hàm chuyển đổi Sáng/Tối (Hiệu ứng giọt nước loang Gradient)
function toggleTheme() {
    const isCurrentlyDark = document.body.classList.contains('dark-mode');
    const overlay = document.getElementById('theme-transition-overlay');
    if (!overlay) return;
    
    // 1. Chọn màu Gradient cho giọt nước
    if (isCurrentlyDark) {
        // Đang Tối -> Chuyển sang Sáng: Loang Thanh Ngọc
        overlay.style.background = 'radial-gradient(circle, #7da89e 0%, #faf9f6 60%)';
    } else {
        // Đang Sáng -> Chuyển sang Tối: Loang Đen ánh kim
        overlay.style.background = 'radial-gradient(circle, #d4af37 0%, #0a0a0a 70%)';
    }
    
    // 2. Reset giọt nước về kích thước 0
    overlay.style.transition = 'none';
    overlay.style.opacity = '0'; 
    overlay.classList.remove('expand');
    void overlay.offsetWidth; // Ép trình duyệt tính toán lại
    
    // 3. Kích hoạt hiệu ứng loang
    overlay.style.transition = 'transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease';
    overlay.style.opacity = '1'; 
    overlay.classList.add('expand');
    
    // 4. Đổi giao diện khi đã loang gần kín
    setTimeout(() => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        
        updateThemeText(isDark); 
        updateFavicon(isDark);
        updateThemeColor(isDark); 
        
        // 5. Làm mờ dần giọt nước để lộ ra giao diện mới
        overlay.style.transition = 'opacity 0.4s ease';
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            overlay.style.transition = 'none';
            overlay.classList.remove('expand');
        }, 400);

    }, 700); // Đợi 700ms cho giọt nước loang rộng ra
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
    
    updateThemeText(isDark); 
    updateFavicon(isDark);
    updateThemeColor(isDark); 
}

function updateThemeText(isDark) {
    const textEl = document.getElementById('theme-text');
    if (textEl) textEl.textContent = isDark ? 'Chế độ Sáng' : 'Chế độ Tối';
}

function updateFavicon(isDark) {
    const favicon = document.getElementById('dynamic-favicon');
    if (favicon) {
        favicon.href = isDark ? 'anh-logo_toi.png' : 'anh-logo_trang.png';
    }
}

// ĐỒNG BỘ MÀU THANH TRẠNG THÁI (Sáng thì Trắng, Tối thì Đen)
function updateThemeColor(isDark) {
    const metaThemeColor = document.getElementById('theme-color-meta');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#0a0a0a' : '#faf9f6');
    }
}

/* =====================================================================
   MODULE 3: ĐIỀU HƯỚNG (ROUTING) & QUẢN LÝ VIEW
   ===================================================================== */
function switchView(viewId) {
    const currentActive = document.querySelector('.view.active');
    
    if (currentActive && currentActive.id !== `view-${viewId}`) {
        unloadView(currentActive.id.replace('view-', ''));
    }
    
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(link => link.classList.remove('active'));
    
    const targetView = document.getElementById(`view-${viewId}`);
    const targetNav = document.getElementById(`nav-${viewId}`);
    if (targetView) targetView.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
    
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('show');
    
    if (viewId === 'heritage') {
        const grid = document.getElementById('heritage-grid');
        if (grid && grid.innerHTML.trim() === '') renderHeritage();
    } else if (viewId === 'encyclopedia') {
        const container = document.getElementById('encyclopedia-container');
        if (container && container.innerHTML.trim() === '') renderEncyclopedia();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function unloadView(viewId) {
    if (viewId === 'heritage') {
        const grid = document.getElementById('heritage-grid');
        if (grid) grid.innerHTML = ''; 
        const pag = document.getElementById('pagination-container');
        if (pag) pag.innerHTML = ''; 
    } else if (viewId === 'encyclopedia') {
        const container = document.getElementById('encyclopedia-container');
        if (container) container.innerHTML = '';
    } else if (viewId === 'analyze') {
        const panel = document.getElementById('results-panel');
        if (panel) panel.innerHTML = ''; 
    }
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('show');
}

document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (navMenu && navMenu.classList.contains('show') && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        navMenu.classList.remove('show');
    }
});

/* =====================================================================
   MODULE 4: TÌM KIẾM DEBOUNCE (CHỐNG LAG KHI GÕ)
   ===================================================================== */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/* =====================================================================
   MODULE 5: VĂN HIẾN (LỌC 2 TẦNG, TÌM KIẾM, PHÂN TRANG)
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
    
    if (uniqueGenres.size === 0) { subBar.style.display = 'none'; }
    else {
        subBar.style.display = 'flex';
        let subHtml = `<button class="filter-btn active" onclick="filterSubGenre('all', this)" style="padding: 6px 16px; font-size: 0.8rem;">Tất cả thể loại</button>`;
        Array.from(uniqueGenres).sort().forEach(genre => { subHtml += `<button class="filter-btn" onclick="filterSubGenre('${genre}', this)" style="padding: 6px 16px; font-size: 0.8rem;">${genre}</button>`; });
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

function searchHeritage() { 
    currentPage = 1; 
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
    if (keyword) data = data.filter(item => item.title.toLowerCase().includes(keyword) || item.author.toLowerCase().includes(keyword));

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
            ? `<button onclick="gotoEncyclopediaById('${item.id}')" class="detail-btn">Chi tiết ${ICON_ARROW_RIGHT}</button>` 
            : '';

        return `
        <div class="heritage-card lazy-card" id="${item.id}">
            <div style="display: flex; flex-wrap: wrap; margin-bottom: 10px;">${genreTags}</div>
            <h3>${item.title}</h3>
            <div class="h-author">${ICON_PEN} ${item.author}</div>
            <p>${item.desc}</p>
            <div class="h-meta">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <span>${ICON_CLOCK} ${item.era || 'Mọi thời đại'}</span>
                    <span>${ICON_SCROLL} ${item.script || 'Đa dạng'}</span>
                </div>
                ${detailBtn}
            </div>
        </div>
        `;
    }).join('');
    
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    let pagContainer = document.getElementById('pagination-container');
    if (!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'pagination-container';
        pagContainer.className = 'pagination-container';
        document.getElementById('heritage-grid').after(pagContainer);
    }
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
   MODULE 6: BÁCH KHOA (LÝ THUYẾT & TINH HOA)
   ===================================================================== */
function filterEncyclopediaGroup(group, btnElement) {
    currentEncyGroup = group;
    document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    
    const searchInput = document.getElementById('encyclopedia-search');
    if (searchInput) searchInput.value = '';
    
    renderEncyclopedia();
}

function renderEncyclopedia() {
    const container = document.getElementById('encyclopedia-container');
    if (!container) return;
    
    let data = [];
    if (currentEncyGroup === 'ly-thuyet') {
        data = THEORY_DATA;
    } else {
        data = [...AUTHOR_DATA, ...WORKS_DATA];
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<p style="text-align: center; padding: 40px; color: var(--text-muted); font-style: italic;">Không có dữ liệu trong nhóm này.</p>`;
        return;
    }
    
    container.innerHTML = data.map((item, index) => `
        <div class="accordion-item" id="vol-${index}">
            <details data-index="${index}">
                <summary>${item.title}</summary>
                <div class="accordion-content"></div>
            </details>
        </div>
    `).join('');

    const allDetails = container.querySelectorAll('details');
    allDetails.forEach(detail => {
        detail.addEventListener('toggle', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const contentDiv = this.querySelector('.accordion-content');
            
            if (this.open) {
                allDetails.forEach(other => { if (other !== this && other.open) other.open = false; });
                if (contentDiv.innerHTML.trim() === '') contentDiv.innerHTML = data[index].content;

                const yOffset = -100; 
                const y = this.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
            } else { 
                contentDiv.innerHTML = ''; 
            }
        });
    });
}

function searchEncyclopedia() {
    const keyword = document.getElementById('encyclopedia-search').value.toLowerCase().trim();
    const items = document.querySelectorAll('.accordion-item');
    let data = currentEncyGroup === 'ly-thuyet' ? THEORY_DATA : [...AUTHOR_DATA, ...WORKS_DATA];

    items.forEach(item => {
        const details = item.querySelector('details');
        const title = item.querySelector('summary').textContent.toLowerCase();
        const index = parseInt(details.getAttribute('data-index'));
        
        const rawContent = data[index].content.toLowerCase();
        const cleanContent = rawContent.replace(/<[^>]*>/g, '');

        if (title.includes(keyword) || cleanContent.includes(keyword)) {
            item.classList.remove('hidden-by-search');
            if (keyword !== '') {
                details.open = true;
                const contentDiv = details.querySelector('.accordion-content');
                if (contentDiv.innerHTML.trim() === '') contentDiv.innerHTML = data[index].content;
            }
        } else {
            item.classList.add('hidden-by-search');
            details.open = false;
            details.querySelector('.accordion-content').innerHTML = '';
        }
    });
}

function gotoEncyclopediaById(id) {
    let searchId = id.toLowerCase();
    if (/^[ivx]+$/.test(searchId)) {
        searchId = 'quyen-' + searchId;
    }

    let targetGroup = 'tinh-hoa';
    let searchData = [...AUTHOR_DATA, ...WORKS_DATA];
    let volIndex = searchData.findIndex(item => item.id === searchId);

    if (volIndex === -1) {
        targetGroup = 'ly-thuyet';
        searchData = THEORY_DATA;
        volIndex = searchData.findIndex(item => item.id === searchId);
    }
    
    if (volIndex !== -1) {
        switchView('encyclopedia');
        currentEncyGroup = targetGroup;
        
        document.querySelectorAll('#encyclopedia-filter-bar .filter-btn').forEach(btn => btn.classList.remove('active'));
        const btns = document.querySelectorAll('#encyclopedia-filter-bar .filter-btn');
        if (targetGroup === 'ly-thuyet' && btns[0]) btns[0].classList.add('active');
        if (targetGroup === 'tinh-hoa' && btns[1]) btns[1].classList.add('active');
        
        renderEncyclopedia();
        
        setTimeout(() => {
            const target = document.getElementById(`vol-${volIndex}`);
            if (target) {
                target.querySelector('details').open = true;
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    } else {
        alert('Chưa có bài viết chi tiết cho mục này trong Đại Bách Khoa.');
    }
}

/* =====================================================================
   MODULE 7: ĐỘNG CƠ PHÂN TÍCH THI PHÁP (4 TẦNG)
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
        const counts = lines.map(l => l.count); const n = counts.length; 
        const uniform = counts.every(c => c === counts[0]); const c = counts[0];
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
        const lastSyl = lines.map(l => l.lastSyllable); const rhymeParts = lastSyl.map(s => getRhymePart(s));
        for (let i = 0; i < lines.length; i++) { for (let j = i + 1; j < lines.length; j++) { const match = (rhymeParts[i] === rhymeParts[j] && rhymeParts[i] !== ''); result.chan.push({ text: `Câu ${i+1} & Câu ${j+1} ("${lastSyl[i]}" - "${lastSyl[j]}")`, isMatch: match, rhyme: rhymeParts[i] }); } }
        for (let i = 0; i < lines.length - 1; i++) { const endPart = rhymeParts[i]; const nextWords = lines[i+1].text.match(/[\p{L}\p{N}]+/gu) || []; let hasMatch = false; for (let k = 0; k < nextWords.length - 1; k++) { const match = (getRhymePart(nextWords[k]) === endPart && endPart !== ''); if (match) { result.lung.push({ text: `Cuối câu ${i+1} vần với chữ ${k+1} câu ${i+2} ("${nextWords[k]}")`, isMatch: true, rhyme: endPart }); hasMatch = true; } } if (!hasMatch && endPart) { result.lung.push({ text: `Cuối câu ${i+1} ("${lastSyl[i]}") không có vần lưng ở câu ${i+2}`, isMatch: false, rhyme: '' }); } }
        for (let i = 0; i < lines.length - 1; i += 2) { const match = (rhymeParts[i] === rhymeParts[i+1] && rhymeParts[i] !== ''); result.lien.push({ text: `Câu ${i+1} & Câu ${i+2} ("${lastSyl[i]}" - "${lastSyl[i+1]}")`, isMatch: match, rhyme: rhymeParts[i] }); }
        for (let i = 0; i < lines.length - 2; i += 2) { const match = (rhymeParts[i] === rhymeParts[i+2] && rhymeParts[i] !== ''); result.cach.push({ text: `Câu ${i+1} & Câu ${i+3} ("${lastSyl[i]}" - "${lastSyl[i+2]}")`, isMatch: match, rhyme: rhymeParts[i] }); }
        return { lastSyllables: lastSyl, rhymeParts, details: result };
    }
    
    const SYMBOLS = { 'trăng': { vol: 'V', sec: '5.2', mean: 'đoàn viên, nhớ quê, cô đơn, chiêm nghiệm' }, 'nguyệt': { vol: 'V', sec: '5.2', mean: 'Hán Việt của "trăng"' }, 'liễu': { vol: 'V', sec: '5.2', mean: 'chia biệt' }, 'đào': { vol: 'V', sec: '5.2', mean: 'tuổi trẻ, mùa xuân' }, 'sen': { vol: 'V', sec: '5.2', mean: 'thanh khiết' }, 'hạc': { vol: 'V', sec: '5.2', mean: 'thanh cao, trường thọ' }, 'nhạn': { vol: 'V', sec: '5.2', mean: 'tin tức' }, 'mây': { vol: 'V', sec: '5.2', mean: 'phiêu du' }, 'nước': { vol: 'V', sec: '5.2', mean: 'thời gian, mềm mại' }, 'thuyền': { vol: 'V', sec: '5.2', mean: 'hành trình' }, 'bến đò': { vol: 'V', sec: '5.2', mean: 'gặp gỡ, chia tay' } };
    const DIEN_TICH = { 'sân lai': { vol: 'V', sec: '5.2', mean: 'lòng hiếu thảo (Lão Lai Tử)' }, 'ngưu lang': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' }, 'chức nữ': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' }, 'gót sen': { vol: 'V', sec: '5.2', mean: 'đôi chân phụ nữ phong kiến' }, 'bèo dạt': { vol: 'V', sec: '5.2', mean: 'thân phận trôi nổi' }, 'chim lồng': { vol: 'V', sec: '5.2', mean: 'bị giam hãm, mất tự do' } };
    const HAN_VIET = { 'vọng': { vol: 'VIII', sec: '8.5', mean: '望 — trông về, ngóng đợi.' }, 'khúc': { vol: 'VIII', sec: '8.5', mean: '曲 — khúc nhạc, bản nhạc.' }, 'dặm trường': { vol: 'VIII', sec: '8.5', mean: 'trường = 長 (dài) — đường xa.' } };
    
    function findSymbols(text) { const lower = text.toLowerCase(); const out = []; for (const [kw, info] of Object.entries(SYMBOLS)) { if (lower.includes(kw)) out.push({ type: 'Biểu tượng', keyword: kw, ...info }); } for (const [kw, info] of Object.entries(DIEN_TICH)) { if (lower.includes(kw)) out.push({ type: 'Điển tích', keyword: kw, ...info }); } for (const [kw, info] of Object.entries(HAN_VIET)) { if (lower.includes(kw)) out.push({ type: 'Hán Việt', keyword: kw, ...info }); } return out; }
    
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
    const inputField = document.getElementById('poemInput'); const resultsPanel = document.getElementById('results-panel');
    if (!inputField || !resultsPanel) return;
    const rawText = inputField.value;
    if (!rawText.trim()) { resultsPanel.innerHTML = `<div class="result-step" style="border-left-color:var(--accent-gold);"><p style="font-style:italic;color:var(--text-muted);text-align:center;">Vui lòng nhập bài thơ để phân tích.</p></div>`; return; }
    
    const report = POETRY_ANALYZER.generateReport(rawText); if (!report) { resultsPanel.innerHTML = ''; return; }

    const tier0 = report.bangTrac.map(l => `<div class="line-row" style="border-bottom: none !important; padding: 8px 0;"><span style="color:var(--text-muted);font-family:var(--font-sans);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2,'0')}</span><span style="flex:1;text-align:center;padding:0 10px;">${l.text}</span><span class="pattern-text">${l.pattern}</span></div>`).join('');
    
    const renderRhymeList = (title, arr, color) => {
        if (arr.length === 0) return '';
        const list = arr.map(item => `<li style="margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 0.95rem; color: var(--text-muted); padding: 4px 0; border-bottom: none !important;"><span style="flex: 1; padding-right: 15px;">${item.text}</span><span style="color: ${item.isMatch ? color : 'var(--text-muted)'}; font-weight: 500; white-space: nowrap; display: flex; align-items: center;">${item.isMatch ? `${ICON_CHECK_GREEN} cùng vần [${item.rhyme}]` : `- khác vần`}</span></li>`).join('');
        return `<div style="margin-bottom: 20px;"><strong style="display: block; margin-bottom: 10px; color: ${color}; font-size: 1rem;">${title}</strong><ul style="padding-left: 0; list-style: none; margin: 0;">${list}</ul></div>`;
    };
    
    const tier1 = `<div style="margin-bottom:20px;"><strong>Thể thơ nhận diện:</strong> ${report.form.form} <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note} (độ tin cậy: ${report.form.confidence})</span></div>${renderRhymeList('1. Vần chân (cuối câu)', report.rhymes.details.chan, 'var(--accent)')}${renderRhymeList('2. Vần lưng (chữ giữa câu)', report.rhymes.details.lung, 'var(--accent-gold)')}${renderRhymeList('3. Vần liền (câu 1-2, 3-4)', report.rhymes.details.lien, 'var(--text-main)')}${renderRhymeList('4. Vần cách (câu 1-3, 2-4)', report.rhymes.details.cach, 'var(--text-muted)')}`;
    
    const tier2 = report.symbols.length === 0 ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng / điển tích / từ Hán Việt đặc biệt.</p>` : report.symbols.map(s => `<div class="symbol-row" style="border-bottom: none !important; padding: 8px 0;"><span class="symbol-keyword">${s.keyword}</span><span class="symbol-meaning"><em style="color:var(--text-main);font-size:0.8rem;">[${s.type}]</em> ${s.mean}</span><span class="volume-link" onclick="gotoEncyclopediaById('${s.vol}')">Xem Bách Khoa</span></div>`).join('');
    
    const tier3 = report.questions.map(q => {
        const formattedQ = q.replace(/\(Xem Quyển ([IVX]+), mục ([\d.]+)\)/g, (match, vol, sec) => `(<span class="volume-link" onclick="gotoEncyclopediaById('${vol}')">Xem Bách Khoa</span>)`);
        return `<div class="question-item" style="display: flex; align-items: flex-start; border-bottom: none !important; padding: 8px 0;"><div style="margin-top: 2px;">${ICON_QUESTION}</div><div style="line-height: 1.6;">${formattedQ}</div></div>`;
    }).join('');
    
    resultsPanel.innerHTML = `<div class="result-step tier-0"><div class="tier-label">TẦNG 0 — DỮ KIỆN THÔ</div><div class="step-title">Bóc tách thanh điệu (Bằng / Trắc)</div>${tier0}<p class="tier-note">B (Bằng): không dấu, dấu huyền. T (Trắc): sắc, hỏi, ngã, nặng.</p></div><div class="result-step tier-1"><div class="tier-label">TẦNG 1 — ĐỐI CHIẾU LÝ THUYẾT</div><div class="step-title">Thể thơ và Hệ thống Vần</div>${tier1}</div><div class="result-step tier-2"><div class="tier-label">TẦNG 2 — CHIẾU RỌI</div><div class="step-title">Biểu tượng · Điển tích · Hán Việt</div>${tier2}</div><div class="result-step tier-3"><div class="tier-label">TẦNG 3 — MỞ NGỎ</div><div class="step-title">Câu hỏi cho người đọc</div>${tier3}</div>`;
}

/* =====================================================================
   MODULE 8: HIỆU ỨNG ĐỘNG (VISUAL EFFECTS)
   ===================================================================== */
// Hàm khởi tạo Hạt sương (Vẫn giữ nguyên vì rất nhẹ)
function initDewdrops() {
    const container = document.getElementById('dewdrop-container'); if (!container) return;
    setInterval(() => {
        if (document.body.classList.contains('dark-mode')) return;
        const drop = document.createElement('div'); drop.className = 'dewdrop';
        const size = Math.random() * 6 + 2; drop.style.width = `${size}px`; drop.style.height = `${size}px`;
        drop.style.left = `${Math.random() * 100}vw`; drop.style.animationDuration = `${Math.random() * 10 + 10}s`;
        container.appendChild(drop); 
        setTimeout(() => drop.remove(), 20000);
    }, 800);
}

/* =====================================================================
   MODULE 9: TẢI DỮ LIỆU & QUẢN LÝ BỘ NHỚ ĐỆM (CACHE)
   ===================================================================== */
let currentQuoteIndex = -1;

async function loadAllData() {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            THEORY_DATA = parsed.theory;
            AUTHOR_DATA = parsed.authors;
            WORKS_DATA = parsed.works;
            QUOTES_DATA = parsed.quotes;
        } else {
            const [resT, resA, resW, resQ] = await Promise.all([
                fetch('./data-ly-thuyet.json', { cache: "no-store" }), 
                fetch('./data-tac-gia.json', { cache: "no-store" }), 
                fetch('./data-tac-pham.json', { cache: "no-store" }), 
                fetch('./data-danh-ngon.json', { cache: "no-store" })
            ]);
            THEORY_DATA = await resT.json(); 
            AUTHOR_DATA = await resA.json(); 
            WORKS_DATA = await resW.json(); 
            QUOTES_DATA = await resQ.json();
            
            localStorage.setItem(CACHE_KEY, JSON.stringify({ 
                theory: THEORY_DATA, 
                authors: AUTHOR_DATA, 
                works: WORKS_DATA, 
                quotes: QUOTES_DATA 
            }));
        }
        
        loadSavedTheme(); 
        initMainFilters(); 
        initDewdrops(); // Vẫn giữ hạt sương
        
        renderRandomQuote(); 
        setInterval(renderRandomQuote, 6000);
        handleHashScroll();
        
    } catch (error) { 
        console.error("Chi tiết lỗi tải dữ liệu:", error);
        alert("Lỗi tải dữ liệu: " + error.message); 
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
        container.innerHTML = `<div class="quote-mark">"</div><p class="quote-text">${quote.text}</p><p class="quote-author">— ${quote.author} —</p>`;
        container.style.opacity = 1;
    }, 500);
}

function handleHashScroll() {
    if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const dataIndex = WORKS_DATA.findIndex(item => item.id === id);
        if (dataIndex !== -1) {
            currentPage = Math.floor(dataIndex / ITEMS_PER_PAGE) + 1;
            currentMainCat = 'all'; currentGenre = 'all'; 
            document.querySelectorAll('#main-filter-bar .filter-btn').forEach(btn => btn.classList.remove('active'));
            const firstBtn = document.querySelector('#main-filter-bar .filter-btn');
            if (firstBtn) firstBtn.classList.add('active');
            document.getElementById('sub-filter-bar').style.display = 'none';
            
            switchView('heritage');
            
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-card');
                    setTimeout(() => element.classList.remove('highlight-card'), 2000);
                }
            }, 600);
        }
    }
}

/* =====================================================================
   MODULE 10: KHỞI CHẠY & GẮN SỰ KIỆN
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => { 
    // --- TỰ ĐỘNG KHÔI PHỤC CHỮ ĐANG VIẾT DỞ (NẾU CÓ) ---
    const savedPoem = localStorage.getItem('vandao_draft_poem');
    if (savedPoem) {
        const poemInput = document.getElementById('poemInput');
        if (poemInput) poemInput.value = savedPoem;
        localStorage.removeItem('vandao_draft_poem');
    }

    // Bắt đầu tải dữ liệu
    loadAllData(); 

    // Gắn Debounce cho thanh tìm kiếm Văn Hiến
    const searchInputHeritage = document.getElementById('search-input');
    if (searchInputHeritage) {
        searchInputHeritage.addEventListener('input', debounce(function() {
            currentPage = 1; 
            renderHeritage();
        }, 300)); 
    }

    // Gắn Debounce cho thanh tìm kiếm Bách Khoa
    const searchInputEncy = document.getElementById('encyclopedia-search');
    if (searchInputEncy) {
        searchInputEncy.addEventListener('input', debounce(function() {
            searchEncyclopedia();
        }, 300));
    }
});

window.addEventListener('hashchange', handleHashScroll);