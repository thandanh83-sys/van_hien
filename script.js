/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (ULTIMATE V28 - ALL-IN-ONE)
   Tác giả: Văn Đạo
   Mô tả: Bộ não trung tâm xử lý Theme, Routing, Data Render, 
          Random Quotes, Đổi Favicon động và Động cơ Thi Pháp 4 Tầng.
   ===================================================================== */

/* =====================================================================
   MODULE 1: HỆ THỐNG ICONS (SVG) & HẰNG SỐ
   ===================================================================== */
const ICON_PEN = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
const ICON_CLOCK = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const ICON_SCROLL = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

const THEME_KEY = 'vandao_theme';

/* =====================================================================
   MODULE 2: QUẢN LÝ THEME (SÁNG/TỐI) & FAVICON
   ===================================================================== */
/**
 * Hàm chuyển đổi giao diện Sáng/Tối.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    
    updateCanvasColors();
    updateThemeText(isDark);
    updateFavicon(isDark); // Gọi hàm đổi Logo
}

/**
 * Khôi phục Theme khi tải lại trang.
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme === 'dark';
    
    if (isDark) document.body.classList.add('dark-mode');
    
    updateThemeText(isDark);
    updateFavicon(isDark); // Gọi hàm đổi Logo
}

/**
 * Cập nhật text hiển thị trên nút bấm (Sáng/Tối).
 */
function updateThemeText(isDark) {
    const textEl = document.getElementById('theme-text');
    if (textEl) textEl.textContent = isDark ? 'Chế độ Sáng' : 'Chế độ Tối';
}

/**
 * Hàm tự động đổi Favicon (Logo) dựa trên chế độ Sáng/Tối.
 * Sử dụng đúng tên file ảnh bạn đã up lên GitHub.
 */
function updateFavicon(isDark) {
    const favicon = document.getElementById('dynamic-favicon');
    if (favicon) {
        favicon.href = isDark ? 'logo_toi.png' : 'logo_trang.png';
    }
}

/* =====================================================================
   MODULE 3: ĐIỀU HƯỚNG (ROUTING) & MENU
   ===================================================================== */
/**
 * Chuyển đổi giữa các View.
 */
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

/**
 * Bật/tắt Menu Mobile.
 */
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('show');
}

// Sự kiện click ra ngoài menu để tự động đóng
document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (navMenu && navMenu.classList.contains('show') && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        navMenu.classList.remove('show');
    }
});

/* =====================================================================
   MODULE 4: RENDER DỮ LIỆU (VĂN HIẾN, BÁCH KHOA, DANH NGÔN)
   ===================================================================== */
/**
 * Render danh sách thẻ Văn Hiến.
 */
function renderHeritage(filterCategory = 'all') {
    const grid = document.getElementById('heritage-grid');
    if (!grid || typeof HERITAGE_DATA === 'undefined') return;

    const filteredData = filterCategory === 'all' 
        ? HERITAGE_DATA 
        : HERITAGE_DATA.filter(item => item.category === filterCategory);

    grid.innerHTML = filteredData.map(item => `
        <div class="heritage-card">
            <span class="h-tag">${item.genre}</span>
            <h3>${item.title}</h3>
            <div class="h-author">${ICON_PEN} ${item.author}</div>
            <p>${item.desc}</p>
            <div class="h-meta">
                <span>${ICON_CLOCK} ${item.era}</span>
                <span>${ICON_SCROLL} ${item.script}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Xử lý lọc Văn Hiến.
 */
function filterHeritage(category, btnElement) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderHeritage(category);
}

/**
 * Render Đại Bách Khoa dạng Accordion.
 */
function renderEncyclopedia() {
    const container = document.getElementById('encyclopedia-container');
    if (!container || typeof ENCYCLOPEDIA_DATA === 'undefined') return;

    container.innerHTML = ENCYCLOPEDIA_DATA.map(item => `
        <div class="accordion-item">
            <details>
                <summary>${item.title}</summary>
                <div class="accordion-content">${item.content}</div>
            </details>
        </div>
    `).join('');
}

/**
 * Render và tự động đổi Danh ngôn mỗi 6 giây.
 */
let currentQuoteIndex = -1;
function renderRandomQuote() {
    const container = document.getElementById('daily-quote-container');
    if (!container || typeof QUOTES_DATA === 'undefined') return;

    // Hiệu ứng mờ dần
    container.style.opacity = 0;
    setTimeout(() => {
        let newIndex;
        // Đảm bảo không lặp lại câu cũ
        do { newIndex = Math.floor(Math.random() * QUOTES_DATA.length); } 
        while (QUOTES_DATA.length > 1 && newIndex === currentQuoteIndex);

        currentQuoteIndex = newIndex;
        const quote = QUOTES_DATA[currentQuoteIndex];

        container.innerHTML = `
            <div class="quote-mark">“</div>
            <p class="quote-text">${quote.text}</p>
            <p class="quote-author">— ${quote.author} —</p>
        `;
        container.style.opacity = 1;
    }, 500);
}

/* =====================================================================
   MODULE 5: ĐỘNG CƠ PHÂN TÍCH THI PHÁP (4 TẦNG - NO AI)
   ===================================================================== */
const POETRY_ANALYZER = (() => {
    // Hàm phụ trợ: Lấy thanh điệu (B/T)
    function getTone(syllable) {
        const nfd = syllable.normalize('NFD');
        // Dấu sắc, ngã, hỏi, nặng là Trắc (T). Còn lại (không dấu, huyền) là Bằng (B).
        const isTrac = nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323');
        return isTrac ? 'T' : 'B';
    }

    // --- TẦNG 0: BÓC TÁCH BẰNG/TRẮC ---
    function analyzeBangTrac(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        return lines.map((line, i) => {
            const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
            const pattern = syllables.map(s => getTone(s)).join(' - ');
            return { 
                lineNum: i + 1, 
                text: line, 
                count: syllables.length, 
                pattern, 
                lastSyllable: syllables[syllables.length - 1] || '' 
            };
        });
    }

    // --- TẦNG 1: NHẬN DIỆN THỂ THƠ & VẦN ---
    function detectForm(lines) {
        const counts = lines.map(l => l.count);
        const n = counts.length;
        const uniform = counts.every(c => c === counts[0]);
        const c = counts[0];

        if (n === 4 && c === 7) return { form: 'Thất ngôn tứ tuyệt', confidence: 'cao', note: '4 câu × 7 chữ' };
        if (n === 8 && c === 7) return { form: 'Thất ngôn bát cú Đường luật', confidence: 'cao', note: '8 câu × 7 chữ' };
        if (n >= 2 && counts[0] === 6 && counts[1] === 8) {
            const strict = n % 2 === 0 && counts.every((v, i) => v === (i % 2 === 0 ? 6 : 8));
            return strict ? { form: 'Lục bát', confidence: 'cao', note: 'Luân phiên 6-8 đều' } : { form: 'Hình thức sáu-tám (biến thể)', confidence: 'trung bình', note: 'Có câu 6-8' };
        }
        if (!uniform) return { form: 'Thơ tự do hoặc biến thể', confidence: 'thấp', note: `Số chữ mỗi câu: ${counts.join(' - ')}` };
        return { form: `Thơ ${c} chữ`, confidence: 'trung bình', note: `${n} câu × ${c} chữ` };
    }

    function checkRhyme(lines) {
        const lastSyl = lines.map(l => l.lastSyllable);
        // Lấy 2 ký tự cuối, bỏ dấu để so sánh vần tương đối
        const rhymeParts = lastSyl.map(s => {
            const clean = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return clean.slice(-2);
        });
        const groups = {};
        rhymeParts.forEach((r, i) => { if (!groups[r]) groups[r] = []; groups[r].push(i + 1); });
        
        let dominant = { key: null, lines: [] };
        for (const [k, v] of Object.entries(groups)) { 
            if (v.length > dominant.lines.length) dominant = { key: k, lines: v }; 
        }
        return { lastSyllables: lastSyl, rhymeParts, groups, dominantRhyme: dominant.key, dominantLines: dominant.lines, hasRhyme: dominant.lines.length >= 2 };
    }

    // --- TẦNG 2: CHIẾU RỌI (TỪ ĐIỂN BIỂU TƯỢNG) ---
    const SYMBOLS = {
        'trăng': { vol: 'V', sec: '5.2', mean: 'đoàn viên, nhớ quê, cô đơn, chiêm nghiệm' }, 
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
        'sân lai': { vol: 'V', sec: '5.2', mean: 'lòng hiếu thảo (Lão Lai Tử)' }, 
        'ngưu lang': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' },
        'chức nữ': { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' }, 
        'gót sen': { vol: 'V', sec: '5.2', mean: 'đôi chân phụ nữ phong kiến' },
        'bèo dạt': { vol: 'V', sec: '5.2', mean: 'thân phận trôi nổi' }, 
        'chim lồng': { vol: 'V', sec: '5.2', mean: 'bị giam hãm, mất tự do' }
    };
    const HAN_VIET = {
        'vọng': { vol: 'V', sec: '5.3', mean: '望 — trông về, ngóng đợi.' }, 
        'khúc': { vol: 'V', sec: '5.3', mean: '曲 — khúc nhạc, bản nhạc.' },
        'dặm trường': { vol: 'V', sec: '5.3', mean: 'trường = 長 (dài) — đường xa.' }
    };

    function findSymbols(text) {
        const lower = text.toLowerCase();
        const out = [];
        for (const [kw, info] of Object.entries(SYMBOLS)) { if (lower.includes(kw)) out.push({ type: 'Biểu tượng', keyword: kw, ...info }); }
        for (const [kw, info] of Object.entries(DIEN_TICH)) { if (lower.includes(kw)) out.push({ type: 'Điển tích', keyword: kw, ...info }); }
        for (const [kw, info] of Object.entries(HAN_VIET)) { if (lower.includes(kw)) out.push({ type: 'Hán Việt', keyword: kw, ...info }); }
        return out;
    }

    // --- TẦNG 3: MỞ NGỎ (CÂU HỎI GỢI MỞ) ---
    function buildQuestions(form, rhymes, symbols) {
        const qs = [];
        if (form.confidence !== 'cao') qs.push(`Bài được nhận diện là "${form.form}" (độ tin cậy ${form.confidence}). Đây có thể là biến thể có chủ ý hay chỉ là ngẫu nhiên? (Xem Quyển I.3)`);
        if (!rhymes.hasRhyme) qs.push(`Không thấy vần chân rõ ràng giữa các câu. Tác giả có chủ ý dùng vần lỏng, hay đây là thơ tự do?`);
        else if (rhymes.dominantLines.length < rhymes.lastSyllables.length) qs.push(`Có ${rhymes.lastSyllables.length - rhymes.dominantLines.length} câu không cùng vần "${rhymes.dominantRhyme}". Việc đổi vần có phải để chuyển ý? (Xem Quyển II.2)`);
        if (symbols.length > 0) qs.push(`"${symbols[0].keyword}" xuất hiện — trong ngữ cảnh này, nó đang gợi nghĩa nào? (Xem Quyển V, mục ${symbols[0].sec})`);
        qs.push(`Điều gì ở bài thơ này là "của riêng" tác giả — khác với những bài cùng thể?`);
        return qs.slice(0, 5);
    }

    // API trả về kết quả
    function generateReport(text) {
        const bangTrac = analyzeBangTrac(text);
        if (bangTrac.length === 0) return null;
        
        const form = detectForm(bangTrac);
        const rhymes = checkRhyme(bangTrac);
        const symbols = findSymbols(text);
        const questions = buildQuestions(form, rhymes, symbols);
        
        return { bangTrac, form, rhymes, symbols, questions };
    }

    return { generateReport };
})();

/* =====================================================================
   MODULE 6: HIỂN THỊ BÁO CÁO 4 TẦNG & ĐIỀU HƯỚNG BÁCH KHOA
   ===================================================================== */
function executePipeline() {
    const inputField = document.getElementById('poemInput');
    const resultsPanel = document.getElementById('results-panel');
    if (!inputField || !resultsPanel) return;

    const rawText = inputField.value;
    if (!rawText.trim()) {
        resultsPanel.innerHTML = `
            <div class="result-step" style="border-left-color:var(--accent-gold);">
                <p style="font-style:italic;color:var(--text-muted);text-align:center;">Vui lòng nhập bài thơ để phân tích.</p>
            </div>`;
        return;
    }

    const report = POETRY_ANALYZER.generateReport(rawText);
    if (!report) { resultsPanel.innerHTML = ''; return; }

    // Định nghĩa các SVG nhỏ dùng trong báo cáo (Không dùng emoji)
    const SVG_CHECK = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px; display: inline-block;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const SVG_DOT = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--text-muted)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px; display: inline-block;"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    const SVG_QUESTION = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--accent-gold)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; display: inline-block; flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

    // --- TẦNG 0 HTML ---
    const tier0 = report.bangTrac.map(l => `
        <div class="line-row">
            <span style="color:var(--text-muted);font-family:var(--font-sans);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2,'0')}</span>
            <span style="flex:1;text-align:center;padding:0 10px;">${l.text}</span>
            <span class="pattern-text">${l.pattern}</span>
        </div>
    `).join('');

    // --- TẦNG 1 HTML ---
    const rhymeRows = report.bangTrac.map((l, i) => `
        <tr>
            <td>Câu ${l.lineNum}</td>
            <td>${l.lastSyllable}</td>
            <td class="rhyme-part">[${report.rhymes.rhymeParts[i] || '—'}]</td>
            <td>${report.rhymes.dominantLines.includes(l.lineNum) ? `${SVG_CHECK} cùng vần` : `${SVG_DOT} khác`}</td>
        </tr>
    `).join('');

    const tier1 = `
        <div style="margin-bottom:15px;">
            <strong>Thể thơ nhận diện:</strong> ${report.form.form} 
            <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note} (độ tin cậy: ${report.form.confidence})</span>
        </div>
        <div style="margin-bottom:10px;"><strong>Đối chiếu vần chân:</strong></div>
        <table class="rhyme-table">${rhymeRows}</table>
        <div style="font-size:0.85rem;color:var(--text-muted);margin-top:10px;">
            ${report.rhymes.hasRhyme 
                ? `Vần chủ đạo: <span class="rhyme-part">[${report.rhymes.dominantRhyme}]</span> xuất hiện ở câu ${report.rhymes.dominantLines.join(', ')}.` 
                : 'Không có vần chân lặp lại từ 2 câu trở lên.'}
        </div>`;

    // --- TẦNG 2 HTML ---
    const tier2 = report.symbols.length === 0
        ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng / điển tích / từ Hán Việt đặc biệt.</p>`
        : report.symbols.map(s => `
            <div class="symbol-row">
                <span class="symbol-keyword">${s.keyword}</span>
                <span class="symbol-meaning"><em style="color:var(--text-main);font-size:0.8rem;">[${s.type}]</em> ${s.mean}</span>
                <span class="volume-link" onclick="gotoEncyclopedia('${s.vol}')">→ Quyển ${s.vol}.${s.sec}</span>
            </div>
        `).join('');

    // --- TẦNG 3 HTML (Dùng Flexbox để căn icon SVG và chữ) ---
    const tier3 = report.questions.map(q => `
        <div class="question-item" style="display: flex; align-items: flex-start;">
            <div style="margin-top: 2px;">${SVG_QUESTION}</div>
            <div>${q}</div>
        </div>
    `).join('');

    // --- RENDER TỔNG THỂ ---
    resultsPanel.innerHTML = `
        <div class="result-step tier-0">
            <div class="tier-label">TẦNG 0 — DỮ KIỆN THÔ</div>
            <div class="step-title">Bóc tách thanh điệu (Bằng / Trắc)</div>
            ${tier0}
            <p class="tier-note">B (Bằng): không dấu, dấu huyền. T (Trắc): sắc, hỏi, ngã, nặng. Đây là dữ kiện — không phán xét.</p>
        </div>
        <div class="result-step tier-1">
            <div class="tier-label">TẦNG 1 — ĐỐI CHIẾU LÝ THUYẾT</div>
            <div class="step-title">Thể thơ và vần chân</div>
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

/**
 * Hàm phụ trợ: Điều hướng tới đúng Quyển trong Bách Khoa khi click.
 */
function gotoEncyclopedia(volNum) {
    switchView('encyclopedia');
    setTimeout(() => {
        const details = document.querySelectorAll('#encyclopedia-container details');
        for (const d of details) {
            const summary = d.querySelector('summary');
            if (!summary) continue;
            const text = summary.textContent.trim();
            if (text.startsWith(`Quyển ${volNum}.`) || text.startsWith(`Quyển ${volNum} `)) {
                d.open = true;
                d.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
    }, 400);
}

/* =====================================================================
   MODULE 7: HIỆU ỨNG ĐỘNG & VISUAL EFFECTS
   ===================================================================== */
let canvas, ctx;
let ripples = [];
let isDarkTheme = false;

function updateCanvasColors() { 
    isDarkTheme = document.body.classList.contains('dark-mode'); 
}

/**
 * Hiệu ứng quầng sáng theo chuột (Desktop).
 */
function initCursorGlow() {
    if (window.matchMedia('(pointer: fine)').matches) {
        const glow = document.getElementById('cursor-glow');
        if (!glow) return;
        window.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => { 
                glow.style.left = `${e.clientX}px`; 
                glow.style.top = `${e.clientY}px`; 
            });
        });
    } else {
        const glow = document.getElementById('cursor-glow');
        if (glow) glow.style.display = 'none';
    }
}

/**
 * Hiệu ứng gợn sóng nước (Canvas).
 */
function initWaterCanvas() {
    canvas = document.getElementById('water-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => { 
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight; 
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    window.addEventListener('click', (e) => { 
        ripples.push({ x: e.clientX, y: e.clientY, radius: 2, alpha: 0.5, growth: 1.5, fade: 0.015 }); 
    });

    function animateRipples() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Màu Vàng Gold (Tối) hoặc Xanh Ngọc (Sáng)
        const color = isDarkTheme ? '212, 175, 55' : '125, 168, 158'; 
        
        for (let i = ripples.length - 1; i >= 0; i--) {
            let p = ripples[i]; 
            p.radius += p.growth; 
            p.alpha -= p.fade;
            if (p.alpha <= 0) { ripples.splice(i, 1); continue; }
            
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${color}, ${p.alpha})`; 
            ctx.lineWidth = 1.5; 
            ctx.stroke();
        }
        requestAnimationFrame(animateRipples);
    }
    animateRipples();
}

/**
 * Hiệu ứng hạt sương bay (Chỉ Sáng).
 */
function initDewdrops() {
    const container = document.getElementById('dewdrop-container');
    if (!container) return;
    
    setInterval(() => {
        if (document.body.classList.contains('dark-mode')) return;
        
        const drop = document.createElement('div');
        drop.className = 'dewdrop';
        const size = Math.random() * 6 + 2;
        
        drop.style.width = `${size}px`; 
        drop.style.height = `${size}px`;
        drop.style.left = `${Math.random() * 100}vw`;
        drop.style.animationDuration = `${Math.random() * 10 + 10}s`;
        
        container.appendChild(drop);
        // Xóa DOM sau khi bay xong tránh rác bộ nhớ
        setTimeout(() => drop.remove(), 20000); 
    }, 800);
}

/* =====================================================================
   MODULE 8: KHỞI CHẠY (INITIALIZATION)
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải Theme & Favicon
    loadSavedTheme();
    updateCanvasColors();
    
    // 2. Render dữ liệu tĩnh
    renderHeritage('all');
    renderEncyclopedia();
    
    // 3. Khởi tạo Danh ngôn tự động
    renderRandomQuote(); 
    setInterval(renderRandomQuote, 6000); 
    
    // 4. Khởi tạo hiệu ứng hình ảnh
    initCursorGlow();
    initWaterCanvas();
    initDewdrops();
    
    console.log("VĂN ĐẠO V28: Hệ thống đã sẵn sàng!");
});
