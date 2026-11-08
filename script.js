/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT (ULTIMATE EDITION)
   Tác giả: Văn Đạo
   Mô tả: Xử lý logic, render dữ liệu, tìm kiếm và phân tích thi pháp.
   Cấu trúc: 6 Phân đoạn (Modules) từ Icons, Theme, Routing, Rendering,
             Analysis đến Visual Effects.
   ===================================================================== */

/* =====================================================================
   MODULE 1: HỆ THỐNG ICONS & HẰNG SỐ (CONSTANTS)
   ===================================================================== */
// Sử dụng SVG thay vì Emoji để đồng bộ màu sắc với theme và sắc nét hơn
const ICON_PEN = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
const ICON_CLOCK = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
const ICON_SCROLL = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

/* =====================================================================
   MODULE 2: QUẢN LÝ THEME (SÁNG/TỐI) & CÀI ĐẶT
   ===================================================================== */
const THEME_KEY = 'vandao_theme';
const themeBtn = document.getElementById('theme-btn');

/**
 * Hàm chuyển đổi giao diện Sáng/Tối.
 * Lưu trạng thái vào LocalStorage để ghi nhớ lựa chọn của người dùng.
 */
function toggleTheme() {
    // 1. Đảo ngược class 'dark-mode' trên thẻ body
    document.body.classList.toggle('dark-mode');
    
    // 2. Kiểm tra xem hiện tại có phải Dark Mode không
    const isDark = document.body.classList.contains('dark-mode');
    
    // 3. Lưu vào bộ nhớ trình duyệt
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    
    // 4. (Tùy chọn) Cập nhật lại màu nền Canvas nếu cần
    updateCanvasColors();
}

/**
 * Khôi phục Theme khi tải lại trang.
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
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
    document.querySelectorAll('.nav-links a').forEach(link => {
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

/* =====================================================================
   MODULE 4: RENDER DỮ LIỆU (VĂN HIẾN & BÁCH KHOA)
   ===================================================================== */
/**
 * Hiển thị danh sách các tác phẩm Văn Hiến.
 * @param {string} filterCategory - Nhóm cần lọc ('all', 'dan-gian', 'trung-dai'...)
 */
function renderHeritage(filterCategory = 'all') {
    const grid = document.getElementById('heritage-grid');
    if (!grid) return; // Nếu không tìm thấy thẻ chứa, dừng hàm

    // 1. Lọc dữ liệu dựa trên danh mục (HERITAGE_DATA lấy từ file data.js)
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
    if (!container) return;

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

/* =====================================================================
   MODULE 5: PHÂN TÍCH THI PHÁP (NFD PIPELINE)
   ===================================================================== */
/**
 * Thuật toán phân tích thơ: Đếm số tiếng, tách thanh điệu (Bằng/Trắc).
 * Sử dụng chuẩn Unicode NFD để nhận diện dấu thanh chính xác 100%.
 */
function executePipeline() {
    const inputField = document.getElementById('poemInput');
    const resultsPanel = document.getElementById('results-panel');
    
    if (!inputField || !resultsPanel) return;
    
    const rawText = inputField.value;
    if (!rawText.trim()) {
        alert("Vui lòng nhập bài thơ để phân tích.");
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
            
            // Các mã Unicode của dấu thanh: Huyền(\u0300), Sắc(\u0301), Ngã(\u0303), Hỏi(\u0309), Nặng(\u0323)
            const isTrac = nfdString.includes('\u0300') || nfdString.includes('\u0301') || 
                           nfdString.includes('\u0303') || nfdString.includes('\u0309') || 
                           nfdString.includes('\u0323');
                           
            return isTrac ? 'T' : 'B'; // Trắc hoặc Bằng
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
    // Kiểm tra xem thiết bị có chuột không (tránh lỗi trên điện thoại)
    if (window.matchMedia('(pointer: fine)').matches) {
        const glow = document.getElementById('cursor-glow');
        if (!glow) return;

        window.addEventListener('mousemove', (e) => {
            // Sử dụng requestAnimationFrame để tối ưu hiệu năng (không bị lag)
            requestAnimationFrame(() => {
                glow.style.left = `${e.clientX}px`;
                glow.style.top = `${e.clientY}px`;
            });
        });
    } else {
        // Nếu là mobile, ẩn quầng sáng đi cho nhẹ máy
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

    // Cấu hình kích thước Canvas bằng kích thước cửa sổ
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Bắt sự kiện click để tạo gợn sóng
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

    // Vòng lặp vẽ Animation
    function animateRipples() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Xóa khung hình cũ
        
        // Chọn màu dựa trên theme
        const color = isDarkTheme ? '255, 255, 255' : '125, 168, 158'; // Trắng hoặc Xanh ngọc
        
        // Duyệt ngược mảng để xóa phần tử an toàn
        for (let i = ripples.length - 1; i >= 0; i--) {
            let p = ripples[i];
            p.radius += p.growth;
            p.alpha -= p.fade;

            // Nếu sóng mờ hẳn thì xóa khỏi mảng
            if (p.alpha <= 0) {
                ripples.splice(i, 1);
                continue;
            }

            // Vẽ vòng tròn
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
        // Không tạo hạt sương nếu đang ở Dark Mode
        if (document.body.classList.contains('dark-mode')) return;

        const drop = document.createElement('div');
        drop.className = 'dewdrop';
        
        // Kích thước ngẫu nhiên từ 2px đến 8px
        const size = Math.random() * 6 + 2;
        drop.style.width = `${size}px`;
        drop.style.height = `${size}px`;
        
        // Vị trí ngẫu nhiên theo chiều ngang
        drop.style.left = `${Math.random() * 100}vw`;
        
        // Thời gian bay ngẫu nhiên (10s - 20s)
        drop.style.animationDuration = `${Math.random() * 10 + 10}s`;

        container.appendChild(drop);

        // Tự động xóa DOM sau khi bay xong để tránh rác bộ nhớ
        setTimeout(() => {
            drop.remove();
        }, 20000);
    }, 800); // Tạo hạt mới mỗi 0.8s
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

    // 3. Khởi tạo các hiệu ứng hình ảnh
    initCursorGlow();
    initWaterCanvas();
    initDewdrops();

    console.log("VĂN ĐẠO: Hệ thống đã sẵn sàng!");
});