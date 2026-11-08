/* =========================================
   VĂN ĐẠO ENGINE - MASTER SCRIPT
   Tác giả: Văn Đạo
   Mô tả: Xử lý logic, render dữ liệu, tìm kiếm và phân tích.
   ========================================= */

/* =========================================
   1. QUẢN LÝ THEME (SÁNG/TỐI)
   ========================================= */
const themeBtn = document.getElementById('theme-btn');
const currentTheme = localStorage.getItem('vandao-theme');

// Khôi phục theme đã lưu khi tải lại trang
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

// Hàm chuyển đổi Theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('vandao-theme', isDark ? 'dark' : 'light');
}

/* =========================================
   2. ĐIỀU HƯỚNG (NAVIGATION)
   ========================================= */
// Hiệu ứng đổi màu navbar khi cuộn chuột
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('mainNavbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    }
});

// Chuyển đổi giữa các trang (View)
function switchView(viewId) {
    // 1. Ẩn tất cả các view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    // 2. Bỏ active của tất cả các nút menu
    document.querySelectorAll('.nav-btn').forEach(a => a.classList.remove('active'));
    
    // 3. Hiển thị view được chọn
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add('active');
    
    // 4. Thêm active cho nút tương ứng
    const targetNav = document.getElementById(`nav-${viewId}`);
    if (targetNav) targetNav.classList.add('active');
    
    // 5. Cuộn lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 6. Đóng menu mobile nếu đang mở
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('show');
}

// Bật/tắt menu trên thiết bị di động
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('show');
}

/* =========================================
   3. HIỆU ỨNG 3D TILT CHO THẺ CHỨC NĂNG
   ========================================= */
function initTilt() {
    const tiltCards = document.querySelectorAll('.tilt');
    
    tiltCards.forEach(card => {
        // Khi di chuột vào thẻ
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2; 
            const centerY = rect.height / 2;
            
            // Tính toán góc nghiêng (tối đa 10 độ)
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        // Khi chuột rời khỏi thẻ
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s ease';
        });
        
        // Khi bắt đầu di chuột vào
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none'; // Tắt transition để phản hồi tức thì
        });
    });
}

/* =========================================
   4. RENDER DỮ LIỆU (VĂN HIẾN & BÁCH KHOA)
   ========================================= */
// Các icon SVG dùng chung
const svgUser = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
const svgClock = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

// Hàm render Văn Hiến (có hỗ trợ bộ lọc)
function renderHeritage(filterCategory = 'all') {
    const fullGrid = document.getElementById('heritage-grid');
    if (!fullGrid) return;

    // Lọc dữ liệu từ HERITAGE_DATA
    const filteredData = filterCategory === 'all' 
        ? HERITAGE_DATA 
        : HERITAGE_DATA.filter(item => item.category === filterCategory);

    // Tạo HTML cho từng tác phẩm
    fullGrid.innerHTML = filteredData.map(item => `
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

// Hàm xử lý khi bấm nút Bộ lọc
function filterHeritage(category, btnElement) {
    // 1. Đổi màu nút active
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }
    
    // 2. Render lại danh sách theo bộ lọc mới
    renderHeritage(category);
}

// Hàm render toàn bộ dữ liệu ban đầu
function renderData() {
    // 1. Render Văn Hiến (Mặc định hiện tất cả)
    renderHeritage('all');

    // 2. Render Văn Hiến (Preview ở Trang Chủ - lấy 3 tác phẩm đầu tiên)
    const previewGrid = document.getElementById('home-preview-grid');
    if (previewGrid) {
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

    // 3. Render Đại Bách Khoa (8 Quyển)
    const encyContainer = document.getElementById('encyclopedia-container');
    if (encyContainer) {
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

    // 4. Render Dải chữ chạy (Marquee)
    const marquee = document.getElementById('marquee-content');
    if (marquee) {
        const svgStar = `<svg viewBox="0 0 24 24"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z"/></svg>`;
        const marqueeHTML = MARQUEE_KEYWORDS.map(k => `<span>${k} ${svgStar}</span>`).join('');
        // Nhân đôi chuỗi để tạo vòng lặp vô tận không bị đứt quãng
        marquee.innerHTML = marqueeHTML + marqueeHTML; 
    }
}

/* =========================================
   5. TRÍCH DẪN TỰ ĐỔI (QUOTE CAROUSEL)
   ========================================= */
function initQuotes() {
    let quoteIndex = 0;
    const qText = document.getElementById('quoteText');
    const qAuth = document.getElementById('quoteAuthor');
    
    if (!qText || !qAuth) return;

    setInterval(() => {
        // Hiệu ứng mờ dần
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
    }, 4000); // Đổi 4 giây một lần
}

/* =========================================
   6. THUẬT TOÁN TAM THANH (PHÂN TÍCH THƠ NFD)
   ========================================= */
function executePipeline() {
    const rawText = document.getElementById('poemInput').value;
    if (!rawText.trim()) return;
    
    // Tách các dòng thơ
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Phân tích từng dòng
    let linesHtml = lines.map((line, index) => {
        // Tách từ bằng Regex (hỗ trợ tiếng Việt)
        const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
        
        // Phân tích thanh điệu bằng NFD
        const pattern = syllables.map(s => {
            const nfd = s.normalize('NFD');
            // Nếu chứa dấu huyền, sắc, ngã, hỏi, nặng -> Trắc (T)
            if (nfd.includes('\u0300') || nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323')) {
                return 'T';
            }
            // Không dấu -> Bằng (B)
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

    // Xuất kết quả
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
   7. TÌM KIẾM THÔNG MINH (LIVE SEARCH)
   ========================================= */
// Hàm loại bỏ dấu tiếng Việt để tìm kiếm không dấu
function removeTones(str) {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/Đ/g, 'D')
              .toLowerCase();
}

function initSearch() {
    const searchInput = document.getElementById('global-search');
    const resultsBox = document.getElementById('search-results');
    
    if (!searchInput || !resultsBox) return;

    // Lắng nghe sự kiện gõ phím
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Nếu không gõ gì thì ẩn hộp kết quả
        if (query.length === 0) {
            resultsBox.classList.remove('active');
            resultsBox.innerHTML = '';
            return;
        }

        const cleanQuery = removeTones(query);
        let results = [];

        // 1. Tìm trong Văn Hiến
        HERITAGE_DATA.forEach(item => {
            const textToSearch = removeTones(item.title + " " + item.author + " " + item.genre + " " + item.desc);
            if (textToSearch.includes(cleanQuery)) {
                results.push({
                    type: "Văn Hiến",
                    title: item.title,
                    sub: item.author,
                    view: "heritage"
                });
            }
        });

        // 2. Tìm trong Bách Khoa (Bóc tách thẻ HTML để tìm text thuần)
        ENCYCLOPEDIA_DATA.forEach(item => {
            const plainContent = item.content.replace(/<[^>]*>?/gm, ' ');
            const textToSearch = removeTones(item.title + " " + plainContent);
            
            if (textToSearch.includes(cleanQuery)) {
                results.push({
                    type: "Bách Khoa",
                    title: item.title,
                    sub: "Lý thuyết văn học",
                    view: "encyclopedia"
                });
            }
        });

        // 3. Hiển thị kết quả (Giới hạn 6 kết quả đầu tiên cho gọn)
        if (results.length > 0) {
            resultsBox.innerHTML = results.slice(0, 6).map(r => `
                <div class="search-item" data-view="${r.view}" data-title="${r.title}" data-query="${query}" onclick="handleSearchClick(this)">
                    <span class="s-type">${r.type}</span>
                    <h4>${r.title}</h4>
                    <p>${r.sub}</p>
                </div>
            `).join('');
        } else {
            resultsBox.innerHTML = `<div class="no-results">Không tìm thấy kết quả cho "${query}"</div>`;
        }
        
        resultsBox.classList.add('active');
    });

    // Ẩn kết quả khi click ra ngoài vùng tìm kiếm
    document.addEventListener('click', (e) => {
        if (!document.getElementById('search-container').contains(e.target)) {
            resultsBox.classList.remove('active');
        }
    });
}

// Hàm xử lý khi click vào một kết quả tìm kiếm
function handleSearchClick(element) {
    const viewId = element.getAttribute('data-view');
    const title = element.getAttribute('data-title');
    const query = element.getAttribute('data-query');
    
    // 1. Chuyển sang trang tương ứng
    switchView(viewId);
    
    // 2. Xóa thanh tìm kiếm và ẩn hộp kết quả
    document.getElementById('global-search').value = '';
    document.getElementById('search-results').classList.remove('active');
    
    // 3. Đợi 0.3s để trang render xong, sau đó tìm và làm nổi bật
    setTimeout(() => {
        let targetContainer = null;
        let textToHighlight = null;

        if (viewId === 'encyclopedia') {
            const accordions = document.querySelectorAll('.accordion-item');
            for (let acc of accordions) {
                const summary = acc.querySelector('summary');
                if (summary.textContent.trim() === title) {
                    acc.setAttribute('open', 'true'); // Mở quyển sách
                    targetContainer = acc;
                    
                    // Tìm đoạn văn chính xác để highlight
                    const cleanQuery = removeTones(query);
                    const contentDiv = acc.querySelector('.accordion-content');
                    const elements = contentDiv.querySelectorAll('p, li, h4');
                    
                    for (let el of elements) {
                        if (removeTones(el.textContent).includes(cleanQuery)) {
                            textToHighlight = el;
                            break; 
                        }
                    }
                    break;
                }
            }
        } else if (viewId === 'heritage') {
            // Nếu đang ở chế độ lọc khác mà tìm kiếm, cần đưa về 'all' để thấy kết quả
            const allBtn = document.querySelector('.filter-btn'); 
            if(allBtn && !allBtn.classList.contains('active')) {
                filterHeritage('all', allBtn);
            }

            const cards = document.querySelectorAll('.heritage-card');
            for (let card of cards) {
                const h3 = card.querySelector('h3');
                if (h3 && h3.textContent.trim() === title) {
                    targetContainer = card;
                    break;
                }
            }
        }

        // Thực hiện cuộn và highlight
        if (targetContainer) {
            targetContainer.classList.add('highlight-target');
            
            if (textToHighlight) {
                // Nếu tìm thấy đoạn văn cụ thể trong Bách Khoa, cuộn đến đoạn văn đó
                textToHighlight.classList.add('highlight-text');
                textToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => textToHighlight.classList.remove('highlight-text'), 4000);
            } else {
                // Nếu không tìm thấy, cuộn đến đầu Quyển/Thẻ
                targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            setTimeout(() => targetContainer.classList.remove('highlight-target'), 3000);
        }
    }, 300);
}

/* =========================================
   8. KHỞI CHẠY KHI TẢI TRANG
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    renderData();       // Nạp dữ liệu vào các khung
    initTilt();         // Khởi tạo hiệu ứng nghiêng 3D
    initQuotes();       // Khởi tạo trích dẫn tự đổi
    initSearch();       // Khởi tạo tìm kiếm thông minh
    
    // Lưu ý: Không còn hàm typeWriter vì chữ đã được thiết kế bay bổng bằng CSS
});