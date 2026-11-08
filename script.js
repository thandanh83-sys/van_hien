/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (ULTIMATE V11)
   Tác giả: Văn Đạo
   Mô tả: Xử lý logic, render dữ liệu, tìm kiếm và phân tích thi pháp.
   Cấu trúc: 7 Modules từ Icons, Theme, Routing, Rendering,
             Analysis, Visual Effects đến Initialization.
   ===================================================================== */

/* =====================================================================
   MODULE 1: HỆ THỐNG ICONS & HẰNG SỐ (CONSTANTS)
   ===================================================================== */
// Sử dụng SVG thay vì Emoji để đồng bộ màu sắc với theme và sắc nét hơn
const ICON_PEN = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
const ICON_CLOCK = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const ICON_SCROLL = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

const THEME_KEY = 'vandao_theme';

/* =====================================================================
   MODULE 2: QUẢN LÝ THEME (SÁNG/TỐI) & CÀI ĐẶT
   ===================================================================== */
/**
 * Hàm chuyển đổi giao diện Sáng/Tối.
 */
function toggleTheme() {
    // 1. Đảo ngược class 'dark-mode' trên thẻ body
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    // 2. Lưu lựa chọn vào LocalStorage
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    
    // 3. Cập nhật các hiệu ứng phụ thuộc vào Theme
    updateCanvasColors();
    updateThemeText(isDark);
}

/**
 * Khôi phục Theme khi tải lại trang.
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme === 'dark';
    
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
    
    updateThemeText(isDark);
}

/**
 * Cập nhật chữ hiển thị trên nút đổi Theme (Mobile Menu).
 * Lưu ý: Màu sắc đã được CSS tự động xử lý (Xanh ngọc ở Sáng, Vàng Gold ở Tối).
 */
function updateThemeText(isDark) {
    const textEl = document.getElementById('theme-text');
    if (textEl) {
        // Nếu đang Tối -> Nút hiển thị "Chế độ Sáng" (để người dùng bấm sang)
        textEl.textContent = isDark ? 'Chế độ Sáng' : 'Chế độ Tối';
    }
}

/* =====================================================================
   MODULE 3: ĐIỀU HƯỚNG (ROUTING) & CHUYỂN VIEW
   ===================================================================== */
/**
 * Hàm chuyển đổi giữa các khu vực.
 * @param {string} viewId - ID của view cần chuyển đến (home, heritage, encyclopedia, analyze)
 */
function switchView(viewId) {
    // 1. Ẩn tất cả các View hiện tại
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // 2. Xóa trạng thái Active của tất cả các nút Menu
    document.querySelectorAll('.nav-btn').forEach(link => {
        link.classList.remove('active');
    });

    // 3. Hiển thị View mới và bật Active cho nút tương ứng
    const targetView = document.getElementById(`view-${viewId}`);
    const targetNav = document.getElementById(`nav-${viewId}`);
    
    if (targetView) targetView.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    // 4. Đóng menu mobile (nếu đang mở)
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('show');

    // 5. Cuộn lên đầu trang một cách mượt mà
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Bật/tắt menu trên thiết bị di động.
 */
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('show');
    }
}

// Sự kiện: Click ra ngoài vùng Menu thì tự động đóng Menu lại
document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    // Nếu menu đang mở, và click KHÔNG nằm trong menu, và KHÔNG nằm trên nút Hamburger
    if (navMenu && navMenu.classList.contains('show') && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        navMenu.classList.remove('show');
    }
});

/* =====================================================================
   MODULE 4: RENDER DỮ LIỆU (VĂN HIẾN & BÁCH KHOA)
   ===================================================================== */
/**
 * Hiển thị danh sách các tác phẩm Văn Hiến.
 */
function renderHeritage(filterCategory = 'all') {
    const grid = document.getElementById('heritage-grid');
    if (!grid || typeof HERITAGE_DATA === 'undefined') return;

    // Lọc dữ liệu
    const filteredData = filterCategory === 'all' 
        ? HERITAGE_DATA 
        : HERITAGE_DATA.filter(item => item.category === filterCategory);

    // Tạo HTML
    const htmlContent = filteredData.map(item => `
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

    grid.innerHTML = htmlContent;
}

/**
 * Xử lý sự kiện khi click vào Nút Bộ Lọc.
 */
function filterHeritage(category, btnElement) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    renderHeritage(category);
}

/**
 * Hiển thị 8 Quyển của Đại Bách Khoa dưới dạng Accordion.
 */
function renderEncyclopedia() {
    const container = document.getElementById('encyclopedia-container');
    if (!container || typeof ENCYCLOPEDIA_DATA === 'undefined') return;

    const htmlContent = ENCYCLOPEDIA_DATA.map(item => `
        <div class="accordion-item">
            <details>
                <summary>${item.title}</summary>
                <div class="accordion-content">
                    ${item.content}
                </div>
            </details>
        </div>
    `).join('');

    container.innerHTML = htmlContent;
}

/* =====================================================================
   MODULE 5: PHÂN TÍCH THI PHÁP (NFD PIPELINE) - CHUẨN XÁC 100%
   ===================================================================== */
function executePipeline() {
    const inputField = document.getElementById('poemInput');
    const resultsPanel = document.getElementById('results-panel');
    
    if (!inputField || !resultsPanel) return;
    
    const rawText = inputField.value;
    
    // Xử lý trường hợp không nhập gì
    if (!rawText.trim()) {
        resultsPanel.innerHTML = `
            <div class="result-step" style="border-left-color:var(--accent-gold);">
                <p style="font-style:italic;color:var(--text-muted);text-align:center;">Vui lòng nhập bài thơ để phân tích.</p>
            </div>`;
        return;
    }

    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let resultHTML = '';
    
    lines.forEach((line, index) => {
        // Tách âm tiết bằng Regex
        const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
        
        // Phân tích thanh điệu (NFD)
        const patternArray = syllables.map(syllable => {
            const nfdString = syllable.normalize('NFD');
            
            // CHUẨN THI PHÁP VIỆT NAM: 
            // Bằng (B) = Không dấu + Dấu huyền (\u0300)
            // Trắc (T) = Sắc (\u0301), Ngã (\u0303), Hỏi (\u0309), Nặng (\u0323)
            const isTrac = nfdString.includes('\u0301') || 
                           nfdString.includes('\u0303') || 
                           nfdString.includes('\u0309') || 
                           nfdString.includes('\u0323');   
                           
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

function updateCanvasColors() {
    isDarkTheme = document.body.classList.contains('dark-mode');
}

/**
 * Khởi tạo Quầng sáng chuột (Chỉ desktop)
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
 * Khởi tạo Gợn sóng nước (Canvas)
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

    // Sự kiện click tạo sóng
    window.addEventListener('click', (e) => {
        ripples.push({ x: e.clientX, y: e.clientY, radius: 2, alpha: 0.5, growth: 1.5, fade: 0.015 });
    });

    function animateRipples() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Màu sóng: Vàng Gold (Dark mode) hoặc Xanh ngọc (Light mode)
        const color = isDarkTheme ? '212, 175, 55' : '125, 168, 158'; 
        
        for (let i = ripples.length - 1; i >= 0; i--) {
            let p = ripples[i];
            p.radius += p.growth;
            p.alpha -= p.fade;

            if (p.alpha <= 0) { 
                ripples.splice(i, 1); 
                continue; 
            }

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
 * Khởi tạo Hạt sương bay (Chỉ Sáng)
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

        // Xóa DOM sau khi bay xong để tránh tràn RAM
        setTimeout(() => drop.remove(), 20000);
    }, 800);
}

/* =====================================================================
   MODULE 7: KHỞI CHẠY (INITIALIZATION)
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải Theme
    loadSavedTheme();
    updateCanvasColors();

    // 2. Render dữ liệu
    renderHeritage('all');
    renderEncyclopedia();

    // 3. Khởi tạo hiệu ứng
    initCursorGlow();
    initWaterCanvas();
    initDewdrops();

    console.log("VĂN ĐẠO: Hệ thống V11 đã sẵn sàng và hoạt động hoàn hảo!");
});