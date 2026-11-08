/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (ULTIMATE V38 - PERFECT LAYOUT)
   Tác giả: Văn Đạo
   Cập nhật: Tầng 1 chia khối 2 cột, dấu tích bên trái, [vần chung] bên phải.
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
   MODULE 4: RENDER DỮ LIỆU (VĂN HIẾN, BÁCH KHOA, DANH NGÔN)
   ===================================================================== */
function renderHeritage(filterCategory = 'all') {
    const grid = document.getElementById('heritage-grid');
    if (!grid || typeof HERITAGE_DATA === 'undefined') return;
    const filteredData = filterCategory === 'all' ? HERITAGE_DATA : HERITAGE_DATA.filter(item => item.category === filterCategory);
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

function filterHeritage(category, btnElement) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderHeritage(category);
}

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

let currentQuoteIndex = -1;
function renderRandomQuote() {
    const container = document.getElementById('daily-quote-container');
    if (!container || typeof QUOTES_DATA === 'undefined') return;
    container.style.opacity = 0;
    setTimeout(() => {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * QUOTES_DATA.length); } while (QUOTES_DATA.length > 1 && newIndex === currentQuoteIndex);
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
   MODULE 5: ĐỘNG CƠ PHÂN TÍCH THI PHÁP (4 TẦNG)
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
            return { 
                lineNum: i + 1, text: line, count: syllables.length, pattern, 
                lastSyllable: syllables[syllables.length - 1] || '' 
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
            return strict ? { form: 'Lục bát', confidence: 'cao', note: 'Luân phiên 6-8 đều' } : { form: 'Hình thức sáu-tám (biến thể)', confidence: 'trung bình', note: 'Có câu 6-8' };
        }
        if (!uniform) return { form: 'Thơ tự do hoặc biến thể', confidence: 'thấp', note: `Số chữ mỗi câu: ${counts.join(' - ')}` };
        return { form: `Thơ ${c} chữ`, confidence: 'trung bình', note: `${n} câu × ${c} chữ` };
    }

    function checkRhymeDetails(lines) {
        const result = { chan: [], lung: [], lien: [], cach: [] };
        const lastSyl = lines.map(l => l.lastSyllable);
        const rhymeParts = lastSyl.map(s => getRhymePart(s));

        // 1. Vần chân
        for (let i = 0; i < lines.length; i++) {
            for (let j = i + 1; j < lines.length; j++) {
                if (rhymeParts[i] === rhymeParts[j] && rhymeParts[i] !== '') {
                    result.chan.push(`Câu ${i+1} & Câu ${j+1} ("${lastSyl[i]}" - "${lastSyl[j]}") — [vần: ${rhymeParts[i]}]`);
                }
            }
        }
        // 2. Vần lưng
        for (let i = 0; i < lines.length - 1; i++) {
            const endPart = rhymeParts[i];
            if (!endPart) continue;
            const nextWords = lines[i+1].text.match(/[\p{L}\p{N}]+/gu) || [];
            for (let k = 0; k < nextWords.length - 1; k++) {
                if (getRhymePart(nextWords[k]) === endPart) {
                    result.lung.push(`Cuối câu ${i+1} ("${lastSyl[i]}") vần với chữ ${k+1} câu ${i+2} ("${nextWords[k]}") — [vần: ${endPart}]`);
                }
            }
        }
        // 3. Vần liền
        for (let i = 0; i < lines.length - 1; i += 2) {
            if (rhymeParts[i] === rhymeParts[i+1] && rhymeParts[i] !== '') {
                result.lien.push(`Câu ${i+1} & Câu ${i+2} ("${lastSyl[i]}" - "${lastSyl[i+1]}") — [vần: ${rhymeParts[i]}]`);
            }
        }
        // 4. Vần cách
        for (let i = 0; i < lines.length - 2; i += 2) {
            if (rhymeParts[i] === rhymeParts[i+2] && rhymeParts[i] !== '') {
                result.cach.push(`Câu ${i+1} & Câu ${i+3} ("${lastSyl[i]}" - "${lastSyl[i+2]}") — [vần: ${rhymeParts[i]}]`);
            }
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
        'vọng': { vol: 'VIII', sec: '8.6', mean: '望 — trông về, ngóng đợi.' }, 'khúc': { vol: 'VIII', sec: '8.6', mean: '曲 — khúc nhạc, bản nhạc.' },
        'dặm trường': { vol: 'VIII', sec: '8.6', mean: 'trường = 長 (dài) — đường xa.' }
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
        if (form.confidence !== 'cao') qs.push(`Bài được nhận diện là "${form.form}" (độ tin cậy ${form.confidence}). Đây có thể là biến thể có chủ ý hay chỉ là ngẫu nhiên? (Xem Quyển I.3)`);
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
   MODULE 6: HIỂN THỊ BÁO CÁO 4 TẦNG (GIAO DIỆN TINH GỌN)
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

    const SVG_QUESTION = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--accent-gold)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px; display: inline-block; flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    const SVG_CHECK_SMALL = (color) => `<svg viewBox="0 0 24 24" width="16" height="16" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 3px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    // --- TẦNG 0 ---
    const tier0 = report.bangTrac.map(l => `
        <div class="line-row">
            <span style="color:var(--text-muted);font-family:var(--font-sans);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2,'0')}</span>
            <span style="flex:1;text-align:center;padding:0 10px;">${l.text}</span>
            <span class="pattern-text">${l.pattern}</span>
        </div>
    `).join('');

    // --- TẦNG 1 (DẠNG BẢNG CHIA 2 CỘT, TÍCH BÊN TRÁI, VẦN BÊN PHẢI) ---
    const renderRhymeBlock = (title, arr, color) => {
        if (arr.length === 0) return '';
        const list = arr.map(item => {
            const parts = item.split(' — ');
            const text = parts[0];
            const rhyme = parts[1] || '';
            return `<li style="margin-bottom: 8px; display: flex; align-items: flex-start; justify-content: space-between; font-size: 0.95rem; color: var(--text-muted); border-bottom: 1px dashed var(--glass-border); padding-bottom: 8px;">
                <span style="display: flex; align-items: flex-start; gap: 8px; padding-right: 10px;">
                    <span style="color: ${color}; flex-shrink: 0;">${SVG_CHECK_SMALL(color)}</span>
                    <span>${text}</span>
                </span>
                <span style="color: ${color}; font-weight: 500; white-space: nowrap; font-family: monospace;">- ${rhyme}</span>
            </li>`;
        }).join('');
        
        return `<div style="flex: 1; min-width: 280px; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 8px; border: 1px solid var(--glass-border);">
            <strong style="display: block; margin-bottom: 15px; color: ${color}; font-size: 1rem; text-transform: uppercase;">${title}</strong>
            <ul style="padding-left: 0; list-style: none; margin: 0;">${list}</ul>
        </div>`;
    };

    const tier1 = `
        <div style="margin-bottom:20px;">
            <strong>Thể thơ nhận diện:</strong> ${report.form.form} 
            <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note} (độ tin cậy: ${report.form.confidence})</span>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            ${renderRhymeBlock('1. Vần chân (cuối câu)', report.rhymes.details.chan, 'var(--accent)')}
            ${renderRhymeBlock('2. Vần lưng (chữ giữa câu)', report.rhymes.details.lung, 'var(--accent-gold)')}
            ${renderRhymeBlock('3. Vần liền (câu 1-2, 3-4)', report.rhymes.details.lien, 'var(--text-main)')}
            ${renderRhymeBlock('4. Vần cách (câu 1-3, 2-4)', report.rhymes.details.cach, 'var(--text-muted)')}
        </div>
        
        ${(report.rhymes.details.chan.length === 0 && report.rhymes.details.lung.length === 0 && report.rhymes.details.lien.length === 0 && report.rhymes.details.cach.length === 0) 
            ? '<p style="color:var(--text-muted);font-style:italic;text-align:center;padding:20px;">Không phát hiện quy tắc gieo vần nào trong bài thơ này.</p>' 
            : ''}
    `;

    // --- TẦNG 2 ---
    const tier2 = report.symbols.length === 0
        ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng / điển tích / từ Hán Việt đặc biệt.</p>`
        : report.symbols.map(s => `
            <div class="symbol-row">
                <span class="symbol-keyword">${s.keyword}</span>
                <span class="symbol-meaning"><em style="color:var(--text-main);font-size:0.8rem;">[${s.type}]</em> ${s.mean}</span>
                <!-- TRUYỀN CẢ vol VÀ sec VÀO HÀM -->
                <span class="volume-link" onclick="gotoEncyclopedia('${s.vol}', '${s.sec}')">→ Quyển ${s.vol} (Mục ${s.sec})</span>
            </div>
        `).join('');

    // --- TẦNG 3 ---
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

/**
 * Hàm phụ trợ: Điều hướng tới đúng Quyển và đúng Mục trong Bách Khoa.
 */
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
   MODULE 7: HIỆU ỨNG ĐỘNG & VISUAL EFFECTS
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
   MODULE 8: KHỞI CHẠY (INITIALIZATION)
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
    updateCanvasColors();
    renderHeritage('all');
    renderEncyclopedia();
    renderRandomQuote(); 
    setInterval(renderRandomQuote, 6000); 
    initCursorGlow();
    initWaterCanvas();
    initDewdrops();
    
    console.log("VĂN ĐẠO V38: Hệ thống đã sẵn sàng! Layout Tầng 1 đã được hoàn thiện.");
});
