/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (ULTIMATE V57 - FINAL)
   Tác giả: Văn Đạo
   Mô tả: Tích hợp Tìm kiếm, Copy Link, Deep Link Scroll, Phân tích Thi Pháp,
          Render dữ liệu từ JSON và tất cả hiệu ứng động.
   ===================================================================== */

/* =====================================================================
   MODULE 1: HỆ THỐNG ICONS (SVG) & HẰNG SỐ
   ===================================================================== */
const ICON_PEN = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
const ICON_CLOCK = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const ICON_SCROLL = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
const ICON_CHECK_GREEN = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 6px; display: inline-block;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const ICON_QUESTION = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--accent-gold)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; display: inline-block; flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

const THEME_KEY = 'vandao_theme';

// Danh sách ID các tác phẩm cần gắn nhãn "Cần kiểm chứng"
const NEEDS_REVIEW_IDS = ['chinh-phu-ngam-khuc'];

// Biến toàn cục lưu trữ dữ liệu tải từ JSON
let HERITAGE_DATA = [];
let ENCYCLOPEDIA_DATA = [];
let QUOTES_DATA = [];

/* =====================================================================
   MODULE 2: QUẢN LÝ THEME (SÁNG/TỐI) & FAVICON
   ===================================================================== */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    updateCanvasColors();
    updateThemeText(isDark);
    updateFavicon(isDark);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
    updateThemeText(isDark);
    updateFavicon(isDark);
}

function updateThemeText(isDark) {
    const textEl = document.getElementById('theme-text');
    if (textEl) textEl.textContent = isDark ? 'Chế độ Sáng' : 'Chế độ Tối';
}

function updateFavicon(isDark) {
    const favicon = document.getElementById('dynamic-favicon');
    if (favicon) favicon.href = isDark ? 'logo_toi.png' : 'logo_trang.png';
}

/* =====================================================================
   MODULE 3: ĐIỀU HƯỚNG (ROUTING) & MENU
   ===================================================================== */
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(link => link.classList.remove('active'));
    
    const targetView = document.getElementById(`view-${viewId}`);
    const targetNav = document.getElementById(`nav-${viewId}`);
    
    if (targetView) targetView.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
    
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('show');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
   MODULE 4: LOGIC LỌC, TÌM KIẾM VÀ COPY LINK (VĂN HIẾN)
   ===================================================================== */
let currentMainCat = 'all';
let currentGenre = 'all';

const CATEGORY_NAMES = {
    'dan-gian': 'Dân gian',
    'trung-dai': 'Trung đại',
    'hien-dai': 'Hiện đại',
    'the-gioi': 'Thế giới',
    'dac-thu': 'Đặc thù',
    'ca-dao': 'Ca dao - Tục ngữ',
    'dien-tich': 'Điển tích',
    'truyen-cuoi': 'Truyện cười',
    'ngu-ngon': 'Ngụ ngôn',
    'kich': 'Kịch',
    'ky': 'Ký'
};

function initMainFilters() {
    const mainBar = document.getElementById('main-filter-bar');
    if (!mainBar || HERITAGE_DATA.length === 0) return;

    const uniqueCategories = [...new Set(HERITAGE_DATA.map(item => item.category))];
    let html = `<button class="filter-btn active" onclick="filterMainCategory('all', this)">Tất cả</button>`;
    
    uniqueCategories.forEach(cat => {
        const displayName = CATEGORY_NAMES[cat] || cat.toUpperCase();
        html += `<button class="filter-btn" onclick="filterMainCategory('${cat}', this)">${displayName}</button>`;
    });

    mainBar.innerHTML = html;
}

function filterMainCategory(category, btnElement) {
    currentMainCat = category;
    currentGenre = 'all';
    
    document.querySelectorAll('#main-filter-bar .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const subBar = document.getElementById('sub-filter-bar');
    if (category === 'all') {
        subBar.style.display = 'none';
        renderHeritage();
        return;
    }

    const itemsInCat = HERITAGE_DATA.filter(item => item.category === category);
    const uniqueGenres = [...new Set(itemsInCat.map(item => item.genre))];

    if (uniqueGenres.length === 0) {
        subBar.style.display = 'none';
    } else {
        subBar.style.display = 'flex';
        let subHtml = `<button class="filter-btn active" onclick="filterSubGenre('all', this)" style="padding: 6px 16px; font-size: 0.8rem;">Tất cả thể loại</button>`;
        uniqueGenres.forEach(genre => {
            subHtml += `<button class="filter-btn" onclick="filterSubGenre('${genre}', this)" style="padding: 6px 16px; font-size: 0.8rem;">${genre}</button>`;
        });
        subBar.innerHTML = subHtml;
    }
    renderHeritage();
}

function filterSubGenre(genre, btnElement) {
    currentGenre = genre;
    document.querySelectorAll('#sub-filter-bar .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderHeritage();
}

function renderHeritage() {
    const grid = document.getElementById('heritage-grid');
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!grid) return;
    
    let data = HERITAGE_DATA;
    
    if (currentMainCat !== 'all') data = data.filter(item => item.category === currentMainCat);
    if (currentGenre !== 'all') data = data.filter(item => item.genre === currentGenre);

    if (keyword) {
        data = data.filter(item => 
            item.title.toLowerCase().includes(keyword) || 
            item.author.toLowerCase().includes(keyword)
        );
    }

    if (data.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); font-style: italic;">Không tìm thấy tác phẩm nào phù hợp.</p>`;
        return;
    }

    grid.innerHTML = data.map(item => {
        let statusBadge = '';
        if (NEEDS_REVIEW_IDS.includes(item.id)) {
            statusBadge = `<span style="font-size:0.65rem; background:rgba(212,175,55,0.2); color:var(--accent-gold); padding:2px 8px; border-radius:10px; margin-left:10px; font-weight:normal; vertical-align:middle; white-space:nowrap;">Cần kiểm chứng</span>`;
        }
        
        return `
        <div class="heritage-card" id="${item.id}">
            <span class="h-tag">${item.genre}</span>
            <h3>${item.title} ${statusBadge}</h3>
            <div class="h-author">${ICON_PEN} ${item.author}</div>
            <p>${item.desc}</p>
            
            <div class="h-meta">
                <div>
                    <span>${ICON_CLOCK} ${item.era}</span>
                    <span>${ICON_SCROLL} ${item.script}</span>
                </div>
                <button onclick="copyLink('${item.id}')" class="copy-btn" title="Copy liên kết bài viết">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    Copy
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function copyLink(id) {
    const url = window.location.origin + window.location.pathname + '#' + id;
    navigator.clipboard.writeText(url).then(() => {
        const toast = document.createElement('div');
        toast.textContent = '✓ Đã copy liên kết bài viết!';
        toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:var(--accent); color:#fff; padding:12px 24px; border-radius:30px; font-size:0.95rem; z-index:9999; box-shadow:0 4px 15px rgba(0,0,0,0.2); opacity:0; transition:opacity 0.3s; font-weight:500;';
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.opacity = '1', 10);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }).catch(err => {
        console.error('Lỗi copy: ', err);
        alert('Trình duyệt của bạn không hỗ trợ copy tự động.');
    });
}

// FIX LỖI DEEP LINK: Tự động chuyển tab và cuộn đến thẻ khi mở link #id
function handleHashScroll() {
    if (window.location.hash) {
        const id = window.location.hash.substring(1);
        if (typeof switchView === 'function') {
            switchView('heritage');
        }
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-card');
                setTimeout(() => {
                    element.classList.remove('highlight-card');
                }, 2000);
            }
        }, 600);
    }
}

/* =====================================================================
   MODULE 5: RENDER BÁCH KHOA & MỤC LỤC (TỰ ĐỘNG)
   ===================================================================== */
function renderEncyclopedia() {
    const container = document.getElementById('encyclopedia-container');
    const tocContainer = document.getElementById('encyclopedia-toc');
    if (!container || ENCYCLOPEDIA_DATA.length === 0) return;

    if (tocContainer) {
        tocContainer.innerHTML = ENCYCLOPEDIA_DATA.map((item, index) => {
            const match = item.title.match(/Quyển\s+([IVXLCDM]+|[0-9]+)/i);
            const volNumber = match ? match[1] : (index);
            return `<button class="toc-btn" onclick="scrollToVolume(${index})">Quyển ${volNumber}</button>`;
        }).join('');
    }

    container.innerHTML = ENCYCLOPEDIA_DATA.map((item, index) => `
        <div class="accordion-item" id="vol-${index}">
            <details>
                <summary>${item.title}</summary>
                <div class="accordion-content">${item.content}</div>
            </details>
        </div>
    `).join('');
}

function scrollToVolume(index) {
    const target = document.getElementById(`vol-${index}`);
    if (target) {
        const details = target.querySelector('details');
        if (details) details.open = true;
        
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        const summary = target.querySelector('summary');
        if (summary) {
            summary.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
            setTimeout(() => { summary.style.backgroundColor = ''; }, 1500);
        }
    }
}

/* =====================================================================
   MODULE 6: RENDER DANH NGÔN TỰ ĐỘNG
   ===================================================================== */
let currentQuoteIndex = -1;
function renderRandomQuote() {
    const container = document.getElementById('daily-quote-container');
    if (!container || QUOTES_DATA.length === 0) return;
    
    container.style.opacity = 0;
    setTimeout(() => {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * QUOTES_DATA.length); } while (QUOTES_DATA.length > 1 && newIndex === currentQuoteIndex);
        currentQuoteIndex = newIndex;
        const quote = QUOTES_DATA[currentQuoteIndex];
        
        container.innerHTML = `
            <div class="quote-mark">"</div>
            <p class="quote-text">${quote.text}</p>
            <p class="quote-author">— ${quote.author} —</p>
        `;
        container.style.opacity = 1;
    }, 500);
}

/* =====================================================================
   MODULE 7: ĐỘNG CƠ PHÂN TÍCH THI PHÁP (4 TẦNG)
   ===================================================================== */
const POETRY_ANALYZER = (() => {
    function getTone(syllable) {
        const nfd = syllable.normalize('NFD');
        const isTrac = nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323');
        return isTrac ? 'T' : 'B';
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
            if (!hasMatch && endPart) {
                result.lung.push({ text: `Cuối câu ${i+1} ("${lastSyl[i]}") không có vần lưng ở câu ${i+2}`, isMatch: false, rhyme: '' });
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

    const SYMBOLS = {
        'trăng': { vol: 'V', sec: '5.2', mean: 'đoàn viên, nhớ quê, cô đơn, chiêm nghiệm' }, 'nguyệt': { vol: 'V', sec: '5.2', mean: 'Hán Việt của "trăng"' },
        'liễu': { vol: 'V', sec: '5.2', mean: 'chia biệt' }, 'đào': { vol: 'V', sec: '5.2', mean: 'tuổi trẻ, mùa xuân' },
        'sen': { vol: 'V', sec: '5.2', mean: 'thanh khiết' }, 'hạc': { vol: 'V', sec: '5.2', mean: 'thanh cao, trường thọ' },
        'nhạn': { vol: 'V', sec: '5.2', mean: 'tin tức' }, 'mây': { vol: 'V', sec: '5.2', mean: 'phiêu du' },
        'nước': { vol: 'V', sec: '5.2', mean: 'thời gian, mềm mại' }, 'thuyền': { vol: 'V', sec: '5.2', mean: 'hành trình' },
        'bến đò': { vol: 'V', sec: '5.2', mean: 'gặp gỡ, chia tay' }
    };
    const DIEN_TICH = {
        'sân lai': { vol: 'V', sec: '5.2', mean: 'lòng hiếu thảo (Lão Lai Tử)' }, 'ngưu lang': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' },
        'chức nữ': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' }, 'gót sen': { vol: 'V', sec: '5.2', mean: 'đôi chân phụ nữ phong kiến' },
        'bèo dạt': { vol: 'V', sec: '5.2', mean: 'thân phận trôi nổi' }, 'chim lồng': { vol: 'V', sec: '5.2', mean: 'bị giam hãm, mất tự do' }
    };
    const HAN_VIET = {
        'vọng': { vol: 'VIII', sec: '8.5', mean: '望 — trông về, ngóng đợi.' },
        'khúc': { vol: 'VIII', sec: '8.5', mean: '曲 — khúc nhạc, bản nhạc.' },
        'dặm trường': { vol: 'VIII', sec: '8.5', mean: 'trường = 長 (dài) — đường xa.' }
    };

    function findSymbols(text) {
        const lower = text.toLowerCase();
        const out = [];
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

/* =====================================================================
   MODULE 8: HIỂN THỊ BÁO CÁO 4 TẦNG
   ===================================================================== */
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

    const tier0 = report.bangTrac.map(l => `
        <div class="line-row" style="border-bottom: none !important; padding: 8px 0;">
            <span style="color:var(--text-muted);font-family:var(--font-sans);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2,'0')}</span>
            <span style="flex:1;text-align:center;padding:0 10px;">${l.text}</span>
            <span class="pattern-text">${l.pattern}</span>
        </div>
    `).join('');

    const renderRhymeList = (title, arr, color) => {
        if (arr.length === 0) return '';
        const list = arr.map(item => `
            <li style="margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 0.95rem; color: var(--text-muted); padding: 4px 0; border-bottom: none !important;">
                <span style="flex: 1; padding-right: 15px;">${item.text}</span>
                <span style="color: ${item.isMatch ? color : 'var(--text-muted)'}; font-weight: 500; white-space: nowrap; display: flex; align-items: center;">
                    ${item.isMatch ? `${ICON_CHECK_GREEN} cùng vần [${item.rhyme}]` : `- khác vần`}
                </span>
            </li>`).join('');
        
        return `<div style="margin-bottom: 20px;">
            <strong style="display: block; margin-bottom: 10px; color: ${color}; font-size: 1rem;">${title}</strong>
            <ul style="padding-left: 0; list-style: none; margin: 0;">${list}</ul>
        </div>`;
    };

    const tier1 = `
        <div style="margin-bottom:20px;">
            <strong>Thể thơ nhận diện:</strong> ${report.form.form} 
            <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note} (độ tin cậy: ${report.form.confidence})</span>
        </div>
        ${renderRhymeList('1. Vần chân (cuối câu)', report.rhymes.details.chan, 'var(--accent)')}
        ${renderRhymeList('2. Vần lưng (chữ giữa câu)', report.rhymes.details.lung, 'var(--accent-gold)')}
        ${renderRhymeList('3. Vần liền (câu 1-2, 3-4)', report.rhymes.details.lien, 'var(--text-main)')}
        ${renderRhymeList('4. Vần cách (câu 1-3, 2-4)', report.rhymes.details.cach, 'var(--text-muted)')}
    `;

    const tier2 = report.symbols.length === 0
        ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng / điển tích / từ Hán Việt đặc biệt.</p>`
        : report.symbols.map(s => `
            <div class="symbol-row" style="border-bottom: none !important; padding: 8px 0;">
                <span class="symbol-keyword">${s.keyword}</span>
                <span class="symbol-meaning"><em style="color:var(--text-main);font-size:0.8rem;">[${s.type}]</em> ${s.mean}</span>
                <span class="volume-link" onclick="gotoEncyclopedia('${s.vol}', '${s.sec}')">→ Quyển ${s.vol} (Mục ${s.sec})</span>
            </div>
        `).join('');

    const tier3 = report.questions.map(q => {
        const formattedQ = q.replace(/\(Xem Quyển ([IVX]+), mục ([\d.]+)\)/g, (match, vol, sec) => {
            return `(<span class="volume-link" onclick="gotoEncyclopedia('${vol}', '${sec}')">Xem Quyển ${vol}, mục ${sec}</span>)`;
        });
        
        return `
            <div class="question-item" style="display: flex; align-items: flex-start; border-bottom: none !important; padding: 8px 0;">
                <div style="margin-top: 2px;">${ICON_QUESTION}</div>
                <div style="line-height: 1.6;">${formattedQ}</div>
            </div>
        `;
    }).join('');

    resultsPanel.innerHTML = `
        <div class="result-step tier-0">
            <div class="tier-label">TẦNG 0 — DỮ KIỆN THÔ</div>
            <div class="step-title">Bóc tách thanh điệu (Bằng / Trắc)</div>
            ${tier0}
            <p class="tier-note">B (Bằng): không dấu, dấu huyền. T (Trắc): sắc, hỏi, ngã, nặng.</p>
        </div>
        <div class="result-step tier-1">
            <div class="tier-label">TẦNG 1 — ĐỐI CHIẾU LÝ THUYẾT</div>
            <div class="step-title">Thể thơ và Hệ thống Vần</div>
            ${tier1}
        </div>
        <div class="result-step tier-2">
            <div class="tier-label">TẦNG 2 — CHIẾU RỌI</div>
            <div class="step-title">Biểu tượng · Điển tích · Hán Việt</div>
            ${tier2}
        </div>
        <div class="result-step tier-3">
            <div class="tier-label">TẦNG 3 — MỞ NGỎ</div>
            <div class="step-title">Câu hỏi cho người đọc</div>
            ${tier3}
        </div>
    `;
}

/* =====================================================================
   MODULE 9: ĐIỀU HƯỚNG THÔNG MINH (SMART SCROLL)
   ===================================================================== */
function gotoEncyclopedia(volNum, secNum) {
    switchView('encyclopedia');
    setTimeout(() => {
        const details = document.querySelectorAll('#encyclopedia-container details');
        for (const d of details) {
            const summary = d.querySelector('summary');
            if (!summary) continue;
            const text = summary.textContent.trim();
            
            if (text.startsWith(`Quyển ${volNum}.`) || text.startsWith(`Quyển ${volNum} `)) {
                d.open = true;
                if (secNum) {
                    const headings = d.querySelectorAll('h4');
                    for (const h of headings) {
                        if (h.textContent.includes(secNum)) {
                            setTimeout(() => {
                                h.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                h.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                                h.style.padding = '5px 10px';
                                h.style.borderRadius = '4px';
                                h.style.transition = 'background-color 1.5s ease';
                                setTimeout(() => { h.style.backgroundColor = 'transparent'; }, 2000);
                            }, 300);
                            return;
                        }
                    }
                }
                d.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
    }, 400);
}

/* =====================================================================
   MODULE 10: HIỆU ỨNG ĐỘNG & VISUAL EFFECTS
   ===================================================================== */
let canvas, ctx;
let ripples = [];
let isDarkTheme = false;

function updateCanvasColors() { isDarkTheme = document.body.classList.contains('dark-mode'); }

function initCursorGlow() {
    if (window.matchMedia('(pointer: fine)').matches) {
        const glow = document.getElementById('cursor-glow');
        if (!glow) return;
        window.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => { glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`; });
        });
    } else {
        const glow = document.getElementById('cursor-glow');
        if (glow) glow.style.display = 'none';
    }
}

function initWaterCanvas() {
    canvas = document.getElementById('water-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    const resizeCanvas = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('click', (e) => { ripples.push({ x: e.clientX, y: e.clientY, radius: 2, alpha: 0.5, growth: 1.5, fade: 0.015 }); });
    
    function animateRipples() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const color = isDarkTheme ? '212, 175, 55' : '125, 168, 158'; 
        for (let i = ripples.length - 1; i >= 0; i--) {
            let p = ripples[i]; p.radius += p.growth; p.alpha -= p.fade;
            if (p.alpha <= 0) { ripples.splice(i, 1); continue; }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${color}, ${p.alpha})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
        requestAnimationFrame(animateRipples);
    }
    animateRipples();
}

function initDewdrops() {
    const container = document.getElementById('dewdrop-container');
    if (!container) return;
    setInterval(() => {
        if (document.body.classList.contains('dark-mode')) return;
        const drop = document.createElement('div');
        drop.className = 'dewdrop';
        const size = Math.random() * 6 + 2;
        drop.style.width = `${size}px`; drop.style.height = `${size}px`;
        drop.style.left = `${Math.random() * 100}vw`;
        drop.style.animationDuration = `${Math.random() * 10 + 10}s`;
        container.appendChild(drop);
        setTimeout(() => drop.remove(), 20000); 
    }, 800);
}

/* =====================================================================
   MODULE 11: KHỞI CHẠY & TẢI DỮ LIỆU TỰ ĐỘNG
   ===================================================================== */
async function loadAllData() {
    try {
        const fetchOptions = { cache: "no-store" }; 
        
        const [resHeritage, resEncyclopedia, resQuotes] = await Promise.all([
            fetch('./data-heritage.json', fetchOptions),
            fetch('./data-encyclopedia.json', fetchOptions),
            fetch('./data-quotes.json', fetchOptions)
        ]);

        if (!resHeritage.ok) throw new Error(`Không tìm thấy file data-heritage.json (Mã HTTP: ${resHeritage.status})`);
        if (!resEncyclopedia.ok) throw new Error(`Không tìm thấy file data-encyclopedia.json (Mã HTTP: ${resEncyclopedia.status})`);
        if (!resQuotes.ok) throw new Error(`Không tìm thấy file data-quotes.json (Mã HTTP: ${resQuotes.status})`);

        const textHeritage = await resHeritage.text();
        const textEncyclopedia = await resEncyclopedia.text();
        const textQuotes = await resQuotes.text();

        try { HERITAGE_DATA = JSON.parse(textHeritage); } 
        catch (e) { throw new Error("File data-heritage.json bị lỗi cú pháp JSON."); }

        try { ENCYCLOPEDIA_DATA = JSON.parse(textEncyclopedia); } 
        catch (e) { throw new Error("File data-encyclopedia.json bị lỗi cú pháp JSON."); }

        try { QUOTES_DATA = JSON.parse(textQuotes); } 
        catch (e) { throw new Error("File data-quotes.json bị lỗi cú pháp JSON."); }

        loadSavedTheme();
        updateCanvasColors();
        
        initMainFilters();
        renderHeritage();
        renderEncyclopedia();
        
        renderRandomQuote(); 
        setInterval(renderRandomQuote, 6000); 
        
        initCursorGlow();
        initWaterCanvas();
        initDewdrops();

        handleHashScroll();

        console.log("VĂN ĐẠO V57: Tải dữ liệu thành công!");

    } catch (error) {
        console.error("LỖI TẢI DỮ LIỆU: ", error);
        alert("Lỗi tải dữ liệu:\n\n" + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});

window.addEventListener('hashchange', handleHashScroll);