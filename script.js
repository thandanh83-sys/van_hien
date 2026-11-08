/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (ULTIMATE V24 - FINAL)
   ===================================================================== */

/* =====================================================================
   MODULE 1: HỆ THỐNG ICONS & HẰNG SỐ
   ===================================================================== */
const ICON_PEN = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
const ICON_CLOCK = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const ICON_SCROLL = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

const THEME_KEY = 'vandao_theme';

/* =====================================================================
   MODULE 2: QUẢN LÝ THEME
   ===================================================================== */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    updateCanvasColors();
    updateThemeText(isDark);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
    updateThemeText(isDark);
}

function updateThemeText(isDark) {
    const textEl = document.getElementById('theme-text');
    if (textEl) textEl.textContent = isDark ? 'Chế độ Sáng' : 'Chế độ Tối';
}

/* =====================================================================
   MODULE 3: ĐIỀU HƯỚNG & MENU
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
   MODULE 4: RENDER DỮ LIỆU & DANH NGÔN TỰ ĐỘNG
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

// --- LOGIC TỰ ĐỘNG ĐỔI DANH NGÔN ---
let currentQuoteIndex = -1;

function renderRandomQuote() {
    const container = document.getElementById('daily-quote-container');
    if (!container || typeof QUOTES_DATA === 'undefined') return;

    // Hiệu ứng mờ dần (Fade out)
    container.style.opacity = 0;

    // Đợi 0.5s để mờ hẳn rồi đổi nội dung
    setTimeout(() => {
        let newIndex;
        // Đảm bảo câu mới không trùng câu cũ
        do {
            newIndex = Math.floor(Math.random() * QUOTES_DATA.length);
        } while (QUOTES_DATA.length > 1 && newIndex === currentQuoteIndex);

        currentQuoteIndex = newIndex;
        const quote = QUOTES_DATA[currentQuoteIndex];

        container.innerHTML = `
            <div class="quote-mark">“</div>
            <p class="quote-text">${quote.text}</p>
            <p class="quote-author">— ${quote.author} —</p>
        `;
        
        // Hiện lên lại (Fade in)
        container.style.opacity = 1;
    }, 500);
}

/* =====================================================================
   MODULE 5: PHÂN TÍCH THI PHÁP
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

    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let resultHTML = '';
    
    lines.forEach((line, index) => {
        const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
        const patternArray = syllables.map(syllable => {
            const nfdString = syllable.normalize('NFD');
            const isTrac = nfdString.includes('\u0301') || nfdString.includes('\u0303') || nfdString.includes('\u0309') || nfdString.includes('\u0323');   
            return isTrac ? 'T' : 'B'; 
        });

        resultHTML += `
            <div class="line-row">
                <span style="color: var(--text-muted); font-family: var(--font-sans); font-size: 0.9rem;">${String(index + 1).padStart(2, '0')}</span>
                <span style="flex: 1; text-align: center; padding: 0 10px;">${line}</span>
                <span class="pattern-text">${patternArray.join(' - ')}</span>
            </div>
        `;
    });

    resultsPanel.innerHTML = `
        <div class="result-step">
            <div class="step-title">Kết quả bóc tách thanh điệu (Dữ kiện)</div>
            ${resultHTML}
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 15px; text-align: center; font-style: italic;">
                * B (Bằng): Không dấu, dấu huyền. T (Trắc): Sắc, hỏi, ngã, nặng.
            </p>
        </div>
    `;
}

/* =====================================================================
   MODULE 6: HIỆU ỨNG ĐỘNG & VISUAL EFFECTS
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
            let p = ripples[i];
            p.radius += p.growth; p.alpha -= p.fade;
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
   MODULE 7: KHỞI CHẠY
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
    updateCanvasColors();
    renderHeritage('all');
    renderEncyclopedia();
    
    // CHẠY DANH NGÔN LẦN ĐẦU VÀ TỰ ĐỘNG LẶP LẠI SAU 6 GIÂY
    renderRandomQuote(); 
    setInterval(renderRandomQuote, 6000); 

    initCursorGlow();
    initWaterCanvas();
    initDewdrops();
});