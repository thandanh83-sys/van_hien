/* =========================================
   1. QUẢN LÝ THEME (SEN NGỌC & HẮC LONG)
   ========================================= */
const themeBtn = document.getElementById('theme-btn');
const currentTheme = localStorage.getItem('vandao-theme');

// Khôi phục theme đã lưu khi tải lại trang
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('vandao-theme', isDark ? 'dark' : 'light');
}

/* =========================================
   2. ĐIỀU HƯỚNG & HIỆU ỨNG NAVBAR
   ========================================= */
// Hiệu ứng đổi màu navbar khi cuộn
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('mainNavbar');
    navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// Chuyển đổi giữa các trang (View)
function switchView(viewId) {
    // Ẩn tất cả các view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    // Bỏ active của tất cả các nút menu
    document.querySelectorAll('.nav-btn').forEach(a => a.classList.remove('active'));
    
    // Hiển thị view được chọn và thêm active cho nút tương ứng
    document.getElementById(`view-${viewId}`).classList.add('active');
    document.getElementById(`nav-${viewId}`).classList.add('active');
    
    // Cuộn lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Đóng menu mobile nếu đang mở
    document.getElementById('navMenu').classList.remove('show');
}

// Bật/tắt menu mobile
function toggleMobileMenu() {
    document.getElementById('navMenu').classList.toggle('show');
}

/* =========================================
   3. HIỆU ỨNG GÕ CHỮ (TYPEWRITER)
   ========================================= */
const textToType = "Vạn tượng trong lời.\nThiên thu trong ý.";
const typeTarget = document.getElementById('typewriter-text');
const cursor = document.getElementById('cursor');
let typeIndex = 0;

function typeWriter() {
    if (typeIndex < textToType.length) {
        if (textToType.charAt(typeIndex) === '\n') {
            typeTarget.innerHTML += '<br>';
        } else {
            typeTarget.innerHTML += textToType.charAt(typeIndex);
        }
        typeIndex++;
        setTimeout(typeWriter, 100);
    } else {
        // Gõ xong thì tắt con trỏ nhấp nháy
        cursor.style.display = 'none'; 
    }
}

/* =========================================
   4. HIỆU ỨNG 3D TILT CHO THẺ CHỨC NĂNG
   ========================================= */
function initTilt() {
    const tiltCards = document.querySelectorAll('.tilt');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2; 
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; // Nghiêng tối đa 10 độ
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s ease';
        });
        
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    });
}

/* =========================================
   5. RENDER DỮ LIỆU TỪ FILE DATA.JS
   ========================================= */
// Các icon SVG dùng chung
const svgUser = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
const svgClock = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

function renderData() {
    // 5.1. Render Văn Hiến (Trang chính)
    const fullGrid = document.getElementById('heritage-grid');
    if(fullGrid) {
        fullGrid.innerHTML = HERITAGE_DATA.map(item => `
            <div class="heritage-card">
                <span class="h-tag">${item.genre}</span>
                <h3>${item.title}</h3>
                <div class="author">${svgUser} ${item.author}</div>
                <p>${item.desc}</p>
                <div style="font-size: 0.8rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 10px; display: flex; gap: 15px;">
                    <div class="meta-item">${svgClock} ${item.era}</div>
                    <div class="meta-item">✍️ ${item.script}</div>
                </div>
            </div>
        `).join('');
    }

    // 5.2. Render Văn Hiến (Preview ở Trang Chủ - chỉ lấy 3 cái đầu)
    const previewGrid = document.getElementById('home-preview-grid');
    if(previewGrid) {
        previewGrid.innerHTML = HERITAGE_DATA.slice(0, 3).map(item => `
            <div class="preview-card" onclick="switchView('heritage')">
                <span class="h-tag">${item.genre}</span>
                <h3 style="font-family: 'Playfair Display'; font-size: 1.3rem; margin-bottom: 5px;">${item.title}</h3>
                <div style="color: var(--accent); font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    ${svgUser.replace('stroke-width="2"', 'stroke="currentColor" style="width:14px;height:14px;"')} ${item.author}
                </div>
            </div>
        `).join('');
    }

    // 5.3. Render Đại Bách Khoa (8 Quyển)
    const encyContainer = document.getElementById('encyclopedia-container');
    if(encyContainer) {
        encyContainer.innerHTML = ENCYCLOPEDIA_DATA.map(item => `
            <div class="accordion-item">
                <details>
                    <summary>${item.title}</summary>
                    <div class="accordion-content">
                        ${item.content}
                    </div>
                </details>
            </div>
        `).join('');
    }

    // 5.4. Render Dải chữ chạy (Marquee)
    const marquee = document.getElementById('marquee-content');
    if(marquee) {
        const svgStar = `<svg viewBox="0 0 24 24"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z"/></svg>`;
        // Tạo 1 chuỗi từ khóa
        const marqueeHTML = MARQUEE_KEYWORDS.map(k => `<span>${k} ${svgStar}</span>`).join('');
        // Nhân đôi chuỗi để tạo vòng lặp vô tận không bị đứt quãng
        marquee.innerHTML = marqueeHTML + marqueeHTML; 
    }
}

/* =========================================
   6. TRÍCH DẪN TỰ ĐỔI (QUOTE CAROUSEL)
   ========================================= */
function initQuotes() {
    let quoteIndex = 0;
    const qText = document.getElementById('quoteText');
    const qAuth = document.getElementById('quoteAuthor');
    
    if(!qText || !qAuth) return;

    setInterval(() => {
        // Mờ dần
        qText.style.opacity = '0'; 
        qAuth.style.opacity = '0';
        
        setTimeout(() => {
            // Đổi nội dung
            quoteIndex = (quoteIndex + 1) % QUOTES_DATA.length;
            qText.textContent = `"${QUOTES_DATA[quoteIndex].text}"`;
            qAuth.textContent = `— ${QUOTES_DATA[quoteIndex].author} —`;
            
            // Hiện lại
            qText.style.opacity = '1'; 
            qAuth.style.opacity = '1';
        }, 500); // Đợi 0.5s cho hiệu ứng mờ hoàn tất
    }, 4000); // Đổi 4 giây 1 lần
}

/* =========================================
   7. THUẬT TOÁN TAM THANH (PHÂN TÍCH THƠ)
   ========================================= */
function executePipeline() {
    const rawText = document.getElementById('poemInput').value;
    if (!rawText.trim()) return;
    
    // Tách các dòng thơ
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let linesHtml = lines.map((line, index) => {
        // Tách âm tiết (dùng regex hỗ trợ Unicode)
        const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
        
        // Phân tích thanh điệu
        const pattern = syllables.map(s => {
            // Chuyển sang NFD để tách dấu thanh
            const nfd = s.normalize('NFD');
            // Nếu chứa các dấu: huyền, sắc, ngã, hỏi, nặng -> Trắc (T)
            if (nfd.includes('\u0300') || nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323')) {
                return 'T';
            }
            // Không dấu (ngang) -> Bằng (B)
            return 'B';
        }).join(' - ');
        
        return `
            <div class="line-row">
                <span style="color: var(--text-muted);">${String(index+1).padStart(2, '0')}</span>
                <span style="flex: 1; margin: 0 1rem;">${line}</span>
                <span class="pattern-text">${pattern}</span>
            </div>
        `;
    }).join('');
    
    // Đánh giá cấu trúc 6-8
    const counts = lines.map(l => (l.match(/[\p{L}\p{N}]+/gu) || []).length);
    const is68 = counts.length > 0 && counts[0] === 6 && counts.every((c, i) => c === (i % 2 === 0 ? 6 : 8));

    // Hiển thị kết quả ra màn hình
    document.getElementById('results-panel').innerHTML = `
        <div class="result-step">
            <div class="step-title">Thái Thanh (Tầng 1)</div>
            <p>Ghi nhận ${lines.length} dòng thơ.</p>
        </div>
        <div class="result-step thuong">
            <div class="step-title">Thượng Thanh (Tầng 2)</div>
            ${linesHtml}
        </div>
        <div class="result-step ngoc">
            <div class="step-title">Ngọc Thanh (Tầng 3)</div>
            <p>[Dữ kiện]: ${is68 ? "Văn bản có cấu trúc 6-8 tiếng." : "Không theo quy chuẩn 6-8."}</p>
        </div>
    `;
}

/* =========================================
   8. KHỞI CHẠY KHI TẢI TRANG
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Nạp dữ liệu từ Data.js vào HTML
    renderData();
    
    // 2. Khởi tạo các hiệu ứng
    initTilt();
    initQuotes();
    
    // 3. Chạy hiệu ứng gõ chữ sau 0.5s
    setTimeout(typeWriter, 500);
});