/* =========================================
   1. QUẢN LÝ THEME (SEN NGỌC & HẮC LONG)
   ========================================= */
const themeBtn = document.getElementById('theme-btn');
const currentTheme = localStorage.getItem('vandao-theme');

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
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('mainNavbar');
    navbar.classList.toggle('scrolled', window.scrollY > 20);
});

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(a => a.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    document.getElementById(`nav-${viewId}`).classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('navMenu').classList.remove('show');
}

function toggleMobileMenu() {
    document.getElementById('navMenu').classList.toggle('show');
}

/* =========================================
   3. HIỆU ỨNG GÕ CHỮ (TYPEWRITER)
   ========================================= */
const textToType = "Vạn tượng trong lời,\nThiên thu trong ý.";
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
        if(cursor) cursor.style.display = 'none'; 
    }
}

/* =========================================
   4. HIỆU ỨNG 3D TILT
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
            
            const rotateX = ((y - centerY) / centerY) * -10;
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
   5. RENDER DỮ LIỆU & BỘ LỌC VĂN HIẾN
   ========================================= */
const svgUser = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
const svgClock = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;

// Hàm render Văn Hiến (có hỗ trợ lọc)
function renderHeritage(filterCategory = 'all') {
    const fullGrid = document.getElementById('heritage-grid');
    if(!fullGrid) return;

    // Lọc dữ liệu nếu không phải 'all'
    const filteredData = filterCategory === 'all' 
        ? HERITAGE_DATA 
        : HERITAGE_DATA.filter(item => item.category === filterCategory);

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
    // Đổi màu nút active
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    
    // Render lại danh sách theo bộ lọc
    renderHeritage(category);
}

function renderData() {
    // 1. Render Văn Hiến (Mặc định hiện tất cả)
    renderHeritage('all');

    // 2. Render Văn Hiến (Preview ở Trang Chủ - lấy 3 tác phẩm đầu)
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

    // 3. Render Đại Bách Khoa (8 Quyển)
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

    // 4. Render Dải chữ chạy (Marquee)
    const marquee = document.getElementById('marquee-content');
    if(marquee) {
        const svgStar = `<svg viewBox="0 0 24 24"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z"/></svg>`;
        const marqueeHTML = MARQUEE_KEYWORDS.map(k => `<span>${k} ${svgStar}</span>`).join('');
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
        qText.style.opacity = '0'; 
        qAuth.style.opacity = '0';
        
        setTimeout(() => {
            quoteIndex = (quoteIndex + 1) % QUOTES_DATA.length;
            qText.textContent = `"${QUOTES_DATA[quoteIndex].text}"`;
            qAuth.textContent = `— ${QUOTES_DATA[quoteIndex].author} —`;
            
            qText.style.opacity = '1'; 
            qAuth.style.opacity = '1';
        }, 500); 
    }, 4000); 
}

/* =========================================
   7. THUẬT TOÁN TAM THANH (PHÂN TÍCH THƠ)
   ========================================= */
function executePipeline() {
    const rawText = document.getElementById('poemInput').value;
    if (!rawText.trim()) return;
    
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let linesHtml = lines.map((line, index) => {
        const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
        
        const pattern = syllables.map(s => {
            const nfd = s.normalize('NFD');
            if (nfd.includes('\u0300') || nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323')) {
                return 'T';
            }
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
    
    const counts = lines.map(l => (l.match(/[\p{L}\p{N}]+/gu) || []).length);
    const is68 = counts.length > 0 && counts[0] === 6 && counts.every((c, i) => c === (i % 2 === 0 ? 6 : 8));

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
   8. TÍNH NĂNG TÌM KIẾM (LIVE SEARCH)
   ========================================= */
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

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
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

        // 2. Tìm trong Bách Khoa
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

        // 3. Hiển thị kết quả
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

    // Ẩn kết quả khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!document.getElementById('search-container').contains(e.target)) {
            resultsBox.classList.remove('active');
        }
    });
}

function handleSearchClick(element) {
    const viewId = element.getAttribute('data-view');
    const title = element.getAttribute('data-title');
    const query = element.getAttribute('data-query');
    
    switchView(viewId);
    document.getElementById('global-search').value = '';
    document.getElementById('search-results').classList.remove('active');
    
    setTimeout(() => {
        let targetContainer = null;
        let textToHighlight = null;

        if (viewId === 'encyclopedia') {
            const accordions = document.querySelectorAll('.accordion-item');
            for (let acc of accordions) {
                const summary = acc.querySelector('summary');
                if (summary.textContent.trim() === title) {
                    acc.setAttribute('open', 'true');
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
            const cards = document.querySelectorAll('.heritage-card');
            for (let card of cards) {
                const h3 = card.querySelector('h3');
                if (h3 && h3.textContent.trim() === title) {
                    targetContainer = card;
                    break;
                }
            }
        }

        if (targetContainer) {
            targetContainer.classList.add('highlight-target');
            
            if (textToHighlight) {
                textToHighlight.classList.add('highlight-text');
                textToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => textToHighlight.classList.remove('highlight-text'), 4000);
            } else {
                targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            setTimeout(() => targetContainer.classList.remove('highlight-target'), 3000);
        }
    }, 300);
}

/* =========================================
   9. KHỞI CHẠY KHI TẢI TRANG
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    renderData();
    initTilt();
    initQuotes();
    initSearch(); 
    
    setTimeout(typeWriter, 500);
});