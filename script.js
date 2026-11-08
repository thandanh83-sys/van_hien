/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (ULTIMATE V17)
   Tác giả: Văn Đạo
   Mô tả: Xử lý logic, render dữ liệu, tìm kiếm, danh ngôn và thi pháp.
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
    
    // 2. Lưu lựa chọn vào LocalStorage để ghi nhớ cho lần sau
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    
    // 3. Cập nhật các hiệu ứng phụ thuộc vào Theme (Màu sóng nước, chữ hiển thị)
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
 * Cập nhật chữ hiển thị trên nút đổi Theme.
 * Lưu ý: Màu sắc (Xanh ngọc / Vàng sáng) đã được CSS tự động xử lý.
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
 * Hàm chuyển đổi giữa các khu vực (Trang chủ, Văn Hiến, Bách Khoa, Thi Pháp).
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
 * Bật/tắt menu trên thiết bị di động (Mobile Hamburger Menu).
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
   MODULE 4: RENDER DỮ LIỆU (VĂN HIẾN, BÁCH KHOA, DANH NGÔN)
   ===================================================================== */
/**
 * Hiển thị danh sách các tác phẩm Văn Hiến.
 */
function renderHeritage(filterCategory = 'all') {
    const grid = document.getElementById('heritage-grid');
    // Kiểm tra xem thẻ chứa và dữ liệu (từ data-heritage.js) có tồn tại không
    if (!grid || typeof HERITAGE_DATA === 'undefined') return;

    // 1. Lọc dữ liệu dựa trên danh mục
    const filteredData = filterCategory === 'all' 
        ? HERITAGE_DATA 
        : HERITAGE_DATA.filter(item => item.category === filterCategory);

    // 2. Tạo mã HTML cho từng thẻ tác phẩm
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

    // 3. Đổ HTML vào DOM
    grid.innerHTML = htmlContent;
}

/**
 * Xử lý sự kiện khi click vào Nút Bộ Lọc.
 */
function filterHeritage(category, btnElement) {
    // 1. Xóa class active của tất cả các nút
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    // 2. Thêm class active cho nút vừa click
    if (btnElement) btnElement.classList.add('active');
    // 3. Gọi hàm render với danh mục mới
    renderHeritage(category);
}

/**
 * Hiển thị 8 Quyển của Đại Bách Khoa dưới dạng Accordion.
 */
function renderEncyclopedia() {
    const container = document.getElementById('encyclopedia-container');
    // Kiểm tra xem thẻ chứa và dữ liệu (từ data-encyclopedia.js) có tồn tại không
    if (!container || typeof ENCYCLOPEDIA_DATA === 'undefined') return;

    // Tạo HTML cho từng Quyển sách
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

/**
 * Hiển thị 1 câu Danh ngôn ngẫu nhiên ở Trang Chủ.
 */
function renderRandomQuote() {
    const container = document.getElementById('daily-quote-container');
    // Kiểm tra xem thẻ chứa và dữ liệu (từ data-quotes.js) có tồn tại không
    if (!container || typeof QUOTES_DATA === 'undefined') return;

    // Lấy ngẫu nhiên 1 câu
    const randomIndex = Math.floor(Math.random() * QUOTES_DATA.length);
    const quote = QUOTES_DATA[randomIndex];

    // Đổ HTML ra màn hình với icon dấu ngoặc kép
    container.innerHTML = `
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="var(--accent)" stroke-width="1.5" fill="none" style="margin-bottom: 15px; opacity: 0.7;">
            <path d="M10 11h-4v-4h4v4zm10 0h-4v-4h4v4zm-10 5c-2.5 0-4.5-2-4.5-4.5 0 3-1.5 5.5-4 7.5 3 0 6-1.5 8.5-3zm10 0c-2.5 0-4.5-2-4.5-4.5 0 3-1.5 5.5-4 7.5 3 0 6-1.5 8.5-3z"></path>
        </svg>
        <p style="font-family: var(--font-serif); font-size: 1.6rem; color: var(--text-main); font-style: italic; line-height: 1.5; max-width: 800px; margin: 0 auto;">
            "${quote.text}"
        </p>
        <p style="margin-top: 15px; font-size: 0.9rem; font-weight: 600; color: var(--accent); letter-spacing: 1px;">
            — ${quote.author} —
        </p>
    `;
}

/* =====================================================================
   MODULE 5: PHÂN TÍCH THI PHÁP (NFD PIPELINE) - CHUẨN XÁC 100%
   ===================================================================== */
/**
 * Thuật toán phân tích thơ: Đếm số tiếng, tách thanh điệu (Bằng/Trắc).
 * Sử dụng chuẩn Unicode NFD để nhận diện dấu thanh chính xác.
 */
function executePipeline() {
    const inputField = document.getElementById('poemInput');
    const resultsPanel = document.getElementById('results-panel');
    
    if (!inputField || !resultsPanel) return;
    
    const rawText = inputField.value;
    
    // Xử lý trường hợp người dùng không nhập gì
    if (!rawText.trim()) {
        resultsPanel.innerHTML = `
            <div class="result-step" style="border-left-color:var(--accent-gold);">
                <p style="font-style:italic;color:var(--text-muted);text-align:center;">Vui lòng nhập bài thơ để phân tích.</p>
            </div>`;
        return;
    }

    // 1. Tách văn bản thành các dòng, bỏ qua dòng trống
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let resultHTML = '';
    
    // 2. Xử lý từng dòng thơ
    lines.forEach((line, index) => {
        // Tách các từ (âm tiết) bằng Regex (hỗ trợ cả chữ có dấu)
        const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
        
        // Phân tích thanh điệu của từng âm tiết
        const patternArray = syllables.map(syllable => {
            // Chuyển đổi sang dạng NFD (Tách dấu ra khỏi ký tự gốc)
            const nfdString = syllable.normalize('NFD');
            
            // CHUẨN THI PHÁP VIỆT NAM: 
            // Bằng (B) = Không dấu + Dấu huyền (\u0300)
            // Trắc (T) = Sắc (\u0301), Ngã (\u0303), Hỏi (\u0309), Nặng (\u0323)
            // Tuyệt đối không đưa \u0300 (dấu huyền) vào danh sách Trắc.
            const isTrac = nfdString.includes('\u0301') || 
                           nfdString.includes('\u0303') || 
                           nfdString.includes('\u0309') || 
                           nfdString.includes('\u0323');   
                           
            return isTrac ? 'T' : 'B'; 
        });

        const patternString = patternArray.join(' - '); // Nối bằng dấu gạch ngang
        
        // Tạo HTML cho dòng kết quả
        resultHTML += `
            <div class="line-row">
                <span style="color: var(--text-muted); font-family: var(--font-sans); font-size: 0.9rem;">${String(index + 1).padStart(2, '0')}</span>
                <span style="flex: 1; text-align: center; padding: 0 10px;">${line}</span>
                <span class="pattern-text">${patternString}</span>
            </div>
        `;
    });

    // 3. Hiển thị kết quả
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

/**
 * Cập nhật màu sắc cho Canvas dựa trên Theme hiện tại.
 */
function updateCanvasColors() {
    isDarkTheme = document.body.classList.contains('dark-mode');
}

/**
 * Khởi tạo hiệu ứng Quầng sáng theo chuột (Chỉ trên Desktop).
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
 * Khởi tạo hiệu ứng Gợn sóng nước trên Canvas khi click.
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
        ripples.push({
            x: e.clientX,
            y: e.clientY,
            radius: 2,
            alpha: 0.5,
            growth: 1.5,
            fade: 0.015
        });
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
 * Khởi tạo hiệu ứng Hạt sương bay (Chỉ ở Light Mode).
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

        // Xóa DOM sau khi bay xong để tránh rác bộ nhớ (memory leak)
        setTimeout(() => {
            drop.remove();
        }, 20000);
    }, 800);
}

/* =====================================================================
   MODULE 7: KHỞI CHẠY (INITIALIZATION)
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải Theme đã lưu
    loadSavedTheme();
    updateCanvasColors();

    // 2. Render nội dung tĩnh ban đầu
    renderHeritage('all');
    renderEncyclopedia();
    renderRandomQuote(); // Gọi hàm hiển thị danh ngôn ngẫu nhiên

    // 3. Khởi tạo các hiệu ứng hình ảnh
    initCursorGlow();
    initWaterCanvas();
    initDewdrops();

    console.log("VĂN ĐẠO: Hệ thống V17 đã sẵn sàng và hoạt động hoàn hảo!");
});