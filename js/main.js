/**
 * ==========================================================
 * VĂN ĐẠO - MAIN ENTRY POINT (js/main.js)
 * Chức năng: Khởi chạy App, quản lý Splash, Load Data, Bói Thơ,
 * Thi Pháp, Canvas, và gắn toàn bộ sự kiện giao diện.
 * ==========================================================
 */

// =====================================================================
// 1. IMPORT CÁC MODULE (Đảm bảo đúng đường dẫn)
// =====================================================================
import { APP_DATA, STATE, ICONS } from './config.js';
import { debounce, escapeHTML, removeAccents } from './utils.js';
import { switchView, toggleMobileMenu, gotoEncyclopediaById, setCancelSearch } from './router.js';
import { 
    initMainFilters, renderHeritage, searchEncyclopedia, 
    bindEncyclopediaEvents, filterEncyclopediaGroup, 
    filterMainCategory, filterSubGenre, renderEncyclopedia, 
    renderPagination, changePage, findSymbols, renderEncyclopediaList,
    PerformanceEngine
} from './render.js';
import { VDSearchEngine, triggerAsyncSearchIndex } from './search.js';
import { downloadAllOffline, clearOfflineData, cancelDownload, checkStorageSize } from './offline.js';

// =====================================================================
// PHẦN 1: HIỆU ỨNG NỀN (CANVAS SÓNG NƯỚC & HẠT SƯƠNG)
// =====================================================================
function initWaterCanvas() {
    const canvas = document.getElementById('water-canvas');
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    let ripples = [], animating = false;
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize(); addEventListener('resize', resize);

    const createRipple = (x, y) => {
        if (ripples.length > 15) return;
        const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8bb8a8';
        ripples.push({ x, y, r: 0, maxR: 30 + Math.random() * 20, a: 0.8, color });
        if (!animating) { animating = true; requestAnimationFrame(animate); }
    };
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = ripples.length - 1; i >= 0; i--) {
            const p = ripples[i];
            p.r += 1.2; p.a -= 0.02;
            if (p.a <= 0 || p.r > p.maxR) { ripples.splice(i, 1); continue; }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.strokeStyle = p.color; ctx.globalAlpha = p.a; ctx.lineWidth = 0.8; ctx.stroke();
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff'; ctx.globalAlpha = p.a * 0.4; ctx.lineWidth = 0.5; ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (ripples.length) requestAnimationFrame(animate); else animating = false;
    };
    addEventListener('touchstart', e => { const t = e.touches[0]; if (t) createRipple(t.clientX, t.clientY); }, { passive: true });
    addEventListener('mousedown', e => { if (matchMedia('(pointer: fine)').matches) createRipple(e.clientX, e.clientY); }, { passive: true });
}

function initDewdrops() {
    const container = document.getElementById('dewdrop-container');
    if (!container || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 6; i++) {
        const d = document.createElement('div');
        d.className = 'dewdrop';
        const size = Math.random() * 6 + 4;
        const dur = Math.random() * 10 + 15;
        d.style.cssText = `
            width:${size}px;height:${size}px;
            left:${Math.random()*100}vw;
            animation-duration:${dur}s;
            animation-delay:-${Math.random()*dur}s;
            background:radial-gradient(circle at 30% 30%, #fff, #8bb8a8);
            box-shadow:0 0 12px 3px rgba(139,184,168,0.6), inset 0 0 5px #fff;
            opacity:${Math.random()*0.4+0.6};
        `;
        container.appendChild(d);
    }
}

// =====================================================================
// PHẦN 2: THI PHÁP HỌC (POETRY ANALYZER) - TRÍCH XUẤT NGUYÊN BẢN
// =====================================================================
const POETRY_ANALYZER = (() => {
    function getTone(s) {
        const nfd = s.normalize('NFD');
        return (nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323')) ? 'T' : 'B';
    }
    function getRhymePart(word) {
        if (!word) return '';
        const clean = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const m = clean.match(/[aeiouy]+[^aeiouy]*$/);
        return m ? m[0] : clean.slice(-2);
    }
    function analyzeBangTrac(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length);
        return lines.map((line, i) => {
            const syl = line.match(/[\p{L}\p{N}]+/gu) || [];
            return {
                lineNum: i + 1, text: line, count: syl.length,
                pattern: syl.map(getTone).join(' - '),
                lastSyllable: syl[syl.length - 1] || ''
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
            return strict
                ? { form: 'Lục bát', confidence: 'cao', note: 'Luân phiên 6-8 đều' }
                : { form: 'Hình thức sáu-tám (biến thể)', confidence: 'trung bình', note: 'Có câu 6-8' };
        }
        if (!uniform) return { form: 'Thơ tự do hoặc biến thể', confidence: 'thấp', note: `Số chữ: ${counts.join(' - ')}` };
        return { form: `Thơ ${c} chữ`, confidence: 'trung bình', note: `${n} câu × ${c} chữ` };
    }
    function checkRhymeDetails(lines) {
        const result = { chan: [], lung: [], lien: [], cach: [] };
        const lastSyl = lines.map(l => l.lastSyllable);
        const rhymeParts = lastSyl.map(getRhymePart);
        for (let i = 0; i < lines.length; i++)
            for (let j = i + 1; j < lines.length; j++) {
                const match = rhymeParts[i] === rhymeParts[j] && rhymeParts[i] !== '';
                result.chan.push({ text: `Câu ${i+1} & Câu ${j+1} ("${lastSyl[i]}" - "${lastSyl[j]}")`, isMatch: match, rhyme: rhymeParts[i] });
            }
        for (let i = 0; i < lines.length - 1; i++) {
            const ep = rhymeParts[i];
            const nw = lines[i+1].text.match(/[\p{L}\p{N}]+/gu) || [];
            for (let k = 0; k < nw.length - 1; k++) {
                if (getRhymePart(nw[k]) === ep && ep !== '') {
                    result.lung.push({ text: `Cuối câu ${i+1} vần với chữ ${k+1} câu ${i+2} ("${nw[k]}")`, isMatch: true, rhyme: ep });
                }
            }
        }
        for (let i = 0; i < lines.length - 1; i += 2) {
            const m = rhymeParts[i] === rhymeParts[i+1] && rhymeParts[i] !== '';
            result.lien.push({ text: `Câu ${i+1} & Câu ${i+2}`, isMatch: m, rhyme: rhymeParts[i] });
        }
        for (let i = 0; i < lines.length - 2; i += 2) {
            const m = rhymeParts[i] === rhymeParts[i+2] && rhymeParts[i] !== '';
            result.cach.push({ text: `Câu ${i+1} & Câu ${i+3}`, isMatch: m, rhyme: rhymeParts[i] });
        }
        return { lastSyllables: lastSyl, rhymeParts, details: result };
    }
    function buildQuestions(form, rhymes, symbols) {
        const qs = [];
        if (form.confidence !== 'cao') qs.push(`Bài được nhận diện là "${form.form}" (độ tin cậy ${form.confidence}). Đây có thể là biến thể có chủ ý hay ngẫu nhiên? (Xem Quyển I, mục 1.3)`);
        if (!rhymes.details.chan.length) qs.push(`Không thấy vần chân rõ ràng. Tác giả có chủ ý dùng vần lỏng, hay đây là thơ tự do?`);
        if (symbols.length) qs.push(`"${symbols[0].keyword}" xuất hiện — trong ngữ cảnh này gợi nghĩa nào? (Xem Quyển ${symbols[0].vol}, mục ${symbols[0].sec})`);
        qs.push(`Điều gì ở bài thơ này là "của riêng" tác giả — khác với bài cùng thể?`);
        return qs.slice(0, 5);
    }
    function generateReport(text) {
        const bangTrac = analyzeBangTrac(text);
        if (!bangTrac.length) return null;
        const form = detectForm(bangTrac);
        const rhymes = checkRhymeDetails(bangTrac);
        const symbols = findSymbols(text); 
        const questions = buildQuestions(form, rhymes, symbols);
        return { bangTrac, form, rhymes, symbols, questions };
    }
    return { generateReport };
})();

function executePipeline() {
    const input = document.getElementById('poemInput');
    const panel = document.getElementById('results-panel');
    if (!input || !panel) return;
    const raw = input.value;
    if (!raw.trim()) {
        panel.innerHTML = `<div class="result-step" style="border-left-color:var(--accent-gold);"><p style="font-style:italic;color:var(--text-muted);text-align:center;">Vui lòng nhập bài thơ để phân tích.</p></div>`;
        return;
    }
    const report = POETRY_ANALYZER.generateReport(raw);
    if (!report) { panel.innerHTML = ''; return; }

    const tier0 = report.bangTrac.map(l =>
        `<div class="line-row" style="border-bottom:none!important;padding:8px 0;"><span style="color:var(--text-muted);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2,'0')}</span><span style="flex:1;text-align:center;padding:0 10px;">${l.text}</span><span class="pattern-text">${l.pattern}</span></div>`
    ).join('');

    const renderRhyme = (title, arr, color) => {
        const matches = arr.filter(i => i.isMatch);
        const groups = {};
        matches.forEach(i => {
            if (!groups[i.rhyme]) groups[i.rhyme] = { cauSet: new Set(), wordSet: new Set() };
            (i.text.match(/Câu \d+/g) || []).forEach(n => groups[i.rhyme].cauSet.add(n.replace('Câu ', '')));
            (i.text.match(/"([^"]+)"/g) || []).forEach(w => groups[i.rhyme].wordSet.add(w.replace(/"/g, '')));
        });
        const list = Object.entries(groups).map(([r, d]) =>
            `<li style="margin-bottom:12px;display:flex;justify-content:space-between;padding:12px 16px;background:rgba(139,184,168,0.06);border-radius:10px;flex-wrap:wrap;gap:16px;">
                <span style="flex:1;min-width:220px;line-height:1.5;">Câu ${Array.from(d.cauSet).sort((a,b)=>a-b).join(', ')} <span style="margin-left:8px;font-style:italic;color:var(--text-main);">(${Array.from(d.wordSet).map(w=>`"${w}"`).join(' - ')})</span></span>
                <span style="color:${color};font-weight:700;">${ICONS.check} cùng vần [${r}]</span>
            </li>`
        ).join('');
        return `<div style="margin-bottom:24px;"><strong style="display:block;margin-bottom:12px;color:${color};font-size:0.85rem;text-transform:uppercase;">${title}</strong><ul style="padding-left:0;list-style:none;margin:0;">${list}</ul></div>`;
    };

    const hChan = report.rhymes.details.chan.some(r => r.isMatch);
    const hLung = report.rhymes.details.lung.some(r => r.isMatch);
    const hLien = report.rhymes.details.lien.some(r => r.isMatch);
    const hCach = report.rhymes.details.cach.some(r => r.isMatch);
    let rhymeHtml = '';
    if (hChan) rhymeHtml += renderRhyme('1. Vần chân', report.rhymes.details.chan, 'var(--accent)');
    if (hLung) rhymeHtml += renderRhyme('2. Vần lưng', report.rhymes.details.lung, 'var(--accent-gold)');
    if (hLien) rhymeHtml += renderRhyme('3. Vần liền', report.rhymes.details.lien, 'var(--text-main)');
    if (hCach) rhymeHtml += renderRhyme('4. Vần cách', report.rhymes.details.cach, 'var(--text-muted)');
    if (!hChan && !hLung && !hLien && !hCach) rhymeHtml = `<p style="font-style:italic;color:#e74c3c;padding:15px 0;text-align:center;">Bài thơ không sử dụng vần.</p>`;

    const tier1 = `<div style="margin-bottom:20px;"><strong>Thể thơ:</strong> ${report.form.form} <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note}</span></div>${rhymeHtml}`;
    
    const tier2 = !report.symbols.length
        ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng đặc biệt.</p>`
        : report.symbols.map(s => `<div class="symbol-row" style="padding:8px 0;">
            <span class="symbol-keyword">${escapeHTML(s.keyword)}</span>
            <span class="symbol-meaning"><em style="font-size:0.8rem;">[${escapeHTML(s.type)}]</em> ${escapeHTML(s.mean)}</span>
            <button type="button" class="volume-link" data-route-encyclopedia="true" 
                data-route-volume="${escapeHTML(s.vol)}" 
                data-route-section="${escapeHTML(s.sec)}" 
                data-route-group="triet-thuyet">Xem Bách Khoa</button>
        </div>`).join('');
        
    const tier3 = report.questions.map(q => {
        const formatted = q.replace(/\(Xem Quyển ([IVXLCDM]+), mục ([\d.]+)\)/g, (_, v, sec) => 
            `(<button type="button" class="volume-link" data-route-encyclopedia="true" 
                data-route-volume="${escapeHTML(v)}" 
                data-route-section="${escapeHTML(sec)}" 
                data-route-group="triet-thuyet">Xem Bách Khoa</button>)`
        );
        return `<div class="question-item" style="display:flex;gap:8px;padding:8px 0;"><div>${ICONS.question}</div><div style="line-height:1.6;">${formatted}</div></div>`;
    }).join('');

    panel.innerHTML = `
        <div class="result-step tier-0"><div class="tier-label">TẦNG 0</div><div class="step-title">Bóc tách thanh điệu</div>${tier0}<p class="tier-note">B: không dấu, huyền. T: sắc, hỏi, ngã, nặng.</p></div>
        <div class="result-step tier-1"><div class="tier-label">TẦNG 1</div><div class="step-title">Thể thơ & Vần</div>${tier1}</div>
        <div class="result-step tier-2"><div class="tier-label">TẦNG 2</div><div class="step-title">Biểu tượng · Điển tích</div>${tier2}</div>
        <div class="result-step tier-3"><div class="tier-label">TẦNG 3</div><div class="step-title">Câu hỏi mở</div>${tier3}</div>
    `;
}

// =====================================================================
// PHẦN 3: LOAD DATA & DANH NGÔN
// =====================================================================
async function loadAllData() {
    try {
        const safeFetch = async (url, fallback = []) => {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (e) {
                console.warn(`[SYSTEM] Lỗi tải file ${url}:`, e);
                return fallback; 
            }
        };

        const results = await Promise.all([
            safeFetch('./data/data-ly-thuyet.json', []),
            safeFetch('./data/data-tac-gia.json', []),
            safeFetch('./data/data-tac-pham.json', []),
            safeFetch('./data/data-danh-ngon.json', []), 
            safeFetch('./data/data-loi-binh.json', {}),
            safeFetch('./data/data-tu-dien.json', { symbols: {}, dienTich: {}, hanViet: {} }),
            safeFetch('./data/data-the-loai.json', {}),
            safeFetch('./data/data-van-khi.json', { config: {}, advice: {} }),
            safeFetch('./data/data-tu-dien-the-loai.json', [])
        ]);

        APP_DATA.THEORY_DATA = results[0];
        APP_DATA.AUTHOR_DATA = results[1];
        APP_DATA.WORKS_DATA  = results[2];
        APP_DATA.QUOTES_DATA = results[3];
        APP_DATA.COMMENTARY_DATA = results[4];
        
        APP_DATA.DICTIONARY_DATA = results[5];
        APP_DATA.CATEGORY_NAMES = results[6];
        APP_DATA.FORTUNE_CONFIG = results[7].config || {};
        APP_DATA.FORTUNE_ADVICE = results[7].advice || {};
        APP_DATA.THE_LOAI_DATA = results[8];

        STATE.GLOBAL_INDEX.clear(); 
        STATE.GLOBAL_INDEX_BY_KEY.clear(); 
        STATE.GLOBAL_RECORDS.length = 0;
        
        const addToIndex = (arr, group) => {
            if (!Array.isArray(arr)) return;
            arr.forEach(item => {
                if (!item?.id) return;
                if (!item?.title && !item?.name) return; 
                
                const key = `${group}:${item.id}`;
                const record = { key, id: item.id, group, type: group, data: item };
                if (STATE.GLOBAL_INDEX_BY_KEY.has(key)) return;
                STATE.GLOBAL_INDEX_BY_KEY.set(key, record);
                STATE.GLOBAL_RECORDS.push(record);
                if (!STATE.GLOBAL_INDEX.has(item.id)) STATE.GLOBAL_INDEX.set(item.id, record);
            });
        };
        addToIndex(APP_DATA.THEORY_DATA, 'triet-thuyet');
        addToIndex(APP_DATA.AUTHOR_DATA, 'ky-tai');
        addToIndex(APP_DATA.WORKS_DATA, 'tinh-hoa');
        addToIndex(APP_DATA.THE_LOAI_DATA, 'the-loai');

        initMainFilters();
        
        if (APP_DATA.QUOTES_DATA && APP_DATA.QUOTES_DATA.length > 0) {
            renderRandomQuote();
            if (STATE.quoteIntervalId) clearInterval(STATE.quoteIntervalId);
            STATE.quoteIntervalId = setInterval(renderRandomQuote, 6000);
        } else {
            const qContainer = document.getElementById('daily-quote-container');
            if (qContainer) qContainer.innerHTML = `<p style="text-align:center; font-style:italic; color:var(--text-muted); padding: 20px;">Không có dữ liệu danh ngôn.</p>`;
        }

        triggerAsyncSearchIndex();

    } catch (err) {
        console.error("[SYSTEM] Lỗi nghiêm trọng khi tải dữ liệu:", err);
    } finally {
        initWaterCanvas();
        initDewdrops();
    }
}

function renderRandomQuote() { 
    const c = document.getElementById('daily-quote-container');
    if (!c || APP_DATA.QUOTES_DATA.length === 0) return; 
    c.style.opacity = 0;
    setTimeout(() => {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * APP_DATA.QUOTES_DATA.length); } while (APP_DATA.QUOTES_DATA.length > 1 && newIndex === STATE.currentQuoteIndex);
        STATE.currentQuoteIndex = newIndex;
        const quote = APP_DATA.QUOTES_DATA[STATE.currentQuoteIndex];
        
        let statusBadge = '';
        if (quote.verificationStatus) {
            const statusMap = {
                'verified': { text: 'Nguyên văn', color: '#10b981' },
                'translated': { text: 'Bản dịch', color: '#3b82f6' },
                'attributed': { text: 'Tương truyền', color: '#8bb8a8' },
                'needs-review': { text: 'Cần kiểm chứng', color: '#a36b6b' },
                'author-declared': { text: 'Văn Đạo', color: '#d4c4a8' }
            };
            const statusInfo = statusMap[quote.verificationStatus] || { text: 'Khác', color: '#6a7c76' };
            statusBadge = `<span style="display: inline-block; margin-top: 12px; padding: 3px 10px; border-radius: 4px; border: 1px solid ${statusInfo.color}; color: ${statusInfo.color}; font-size: 0.65rem; font-family: var(--font-body); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${statusInfo.text}</span>`;
        }

        c.innerHTML = `<p class="quote-text">${quote.text}</p><p class="quote-author">— ${quote.author} —</p>${statusBadge}`;
        c.style.opacity = 1;
    }, 500);
}

// =====================================================================
// PHẦN 4: BÓI THƠ (FATE MODAL)
// =====================================================================
function determineFortuneByContext(work) {
    const author = (work.author || '').toLowerCase();
    const era = (work.era || '').toLowerCase();
    const genres = (work.the_loai || []).join(' ').toLowerCase();

    if (author.includes('hồ xuân hương') || author.includes('nguyễn du') || author.includes('nam cao') || author.includes('vũ trọng phụng')) {
        return Math.random() > 0.4 ? 'tieu-hung' : 'binh-hoa';
    }
    if (author.includes('hồ chí minh') || author.includes('tố hữu') || author.includes('phạm tiến duật') || author.includes('chính hữu')) {
        return Math.random() > 0.5 ? 'dai-cat' : 'trung-cat';
    }
    if (author.includes('nguyễn trãi') || author.includes('lý thường kiệt') || author.includes('trần quốc tuấn')) {
        return 'dai-cat';
    }
    if (era.includes('kháng chiến') || era.includes('194') || era.includes('195') || era.includes('196') || era.includes('197')) {
        return Math.random() > 0.4 ? 'tieu-hung' : 'trung-cat';
    }
    if (era.includes('tk 19') || era.includes('tk 18') || era.includes('trung đại') || era.includes('nhà')) {
        return Math.random() > 0.5 ? 'binh-hoa' : 'trung-cat';
    }
    if (genres.includes('truyện ngắn') || genres.includes('tiểu thuyết')) {
        return Math.random() > 0.5 ? 'tieu-cat' : 'tieu-hung';
    }
    if (genres.includes('thơ đường luật') || genres.includes('thơ mới') || genres.includes('lục bát')) {
        return Math.random() > 0.5 ? 'binh-hoa' : 'trung-cat';
    }

    const random = Math.random();
    if (random < 0.1) return 'dai-cat';
    if (random < 0.3) return 'trung-cat';
    if (random < 0.6) return 'tieu-cat';
    if (random < 0.8) return 'binh-hoa';
    if (random < 0.95) return 'tieu-hung';
    return 'dai-hung';
}

function generateBridgeText(work, fortuneKey) {
    const title = work.title;
    const author = work.author;
    const genre = (work.the_loai && work.the_loai[0]) || 'Văn học';
    
    const bridges = {
        'dai-cat': `Vận khí hanh thông, và dường như duyên lành đưa bạn đến với "${title}" của ${author} để tiếp thêm sức mạnh cho những dự định lớn lao.`,
        'trung-cat': `Mọi sự đang trên đà thuận lợi. Tác phẩm ${genre} "${title}" của ${author} như một lời cổ vũ nhẹ nhàng cho những nỗ lực của bạn.`,
        'tieu-cat': `Một chút may mắn ghé thăm. Hãy để "${title}" của ${author} mang đến cho bạn những phút giây thư thái và niềm vui từ những điều giản dị.`,
        'binh-hoa': `Ngày hôm nay như mặt hồ phẳng lặng. Thật hợp để bạn tĩnh tâm cùng "${title}" của ${author} và chiêm nghiệm về những giá trị bình dị.`,
        'tieu-hung': `Dẫu có chút gợn sóng trên mặt hồ tâm trí, nhưng "${title}" của ${author} sẽ là một người bạn đồng hành, nhắc bạn giữ sự điềm tĩnh và nhìn sâu vào bên trong.`,
        'dai-hung': `Trang đời hôm nay có chút bão giông. Hãy để "${title}" của ${author} làm chỗ dựa tinh thần, nhắc bạn rằng nghịch cảnh chính là chất liệu làm nên bản lĩnh.`
    };
    return bridges[fortuneKey] || "";
}

function getSmartExcerpt(html) {
    if (!html) return '';
    const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.length > 200 ? plain.slice(0, 200) + '...' : plain;
}

async function randomPoem() {
    const validWorks = APP_DATA.WORKS_DATA.filter(w => w.desc && w.desc.trim() !== '');
    if (!validWorks || validWorks.length === 0) {
        alert("Kho tàng văn học đang được tải, vui lòng thử lại sau giây lát.");
        return;
    }

    const overlay = document.getElementById('fate-modal-overlay');
    const loadingEl = document.getElementById('fate-loading');
    const resultEl = document.getElementById('fate-result');
    
    overlay.style.display = 'flex';
    void overlay.offsetWidth; 
    overlay.classList.add('show');
    
    loadingEl.classList.remove('hidden');
    resultEl.classList.remove('show');

    const randomWork = validWorks[Math.floor(Math.random() * validWorks.length)];
    const fortuneKey = determineFortuneByContext(randomWork);
    const fortuneInfo = APP_DATA.FORTUNE_CONFIG[fortuneKey] || { name: 'Bình Hòa', color: '#6a7c76' };
    
    let excerpt = randomWork.desc;
    try {
        const res = await fetch(`./data/tac-pham/${encodeURIComponent(randomWork.id)}.json`);
        if (res.ok) {
            const data = await res.json();
            if (data.content) {
                const plainTextCheck = data.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (plainTextCheck.length > 50 && !plainTextCheck.includes('đang được Văn Đạo hiệu đính')) {
                    excerpt = `"${getSmartExcerpt(data.content)}"`; 
                }
            }
        }
    } catch (e) { console.log("Lỗi tải excerpt"); }

    const fortuneData = APP_DATA.COMMENTARY_DATA[fortuneKey];
    const adviceText = fortuneData?.advice || "";
    const pool = fortuneData?.commentaries || ["Một ngày bình yên để đọc và ngẫm."];
    const commentaryText = pool[Math.floor(Math.random() * pool.length)];

    const badge = document.getElementById('fate-badge');
    badge.textContent = `Vận Khí: ${fortuneInfo.name}`;
    badge.style.color = fortuneInfo.color;
    badge.style.borderColor = fortuneInfo.color;
    
    document.getElementById('fate-title').textContent = randomWork.title;
    document.getElementById('fate-author').textContent = `— ${randomWork.author} —`;
    document.getElementById('fate-excerpt').innerHTML = excerpt;
    
    const bridgeText = generateBridgeText(randomWork, fortuneKey);
    
    let adviceHtml = '';
    if (adviceText) {
        const parts = adviceText.split('Tránh:');
        const nenText = parts[0] ? parts[0].replace('Nên:', '').trim() : '';
        const tranhText = parts[1] ? parts[1].trim() : '';

        if (tranhText) {
            adviceHtml = `
                <div style="margin-bottom: 8px;">
                    <strong style="color: var(--accent-text);">Nên:</strong> <span style="color: var(--text-main);">${nenText}</span>
                </div>
                <div>
                    <strong style="color: #a36b6b;">Tránh:</strong> <span style="color: var(--text-muted);">${tranhText}</span>
                </div>
            `;
        } else {
            adviceHtml = `<div><strong style="color: var(--accent-text);">Lời khuyên:</strong> ${adviceText}</div>`;
        }
    }

    document.getElementById('fate-commentary').innerHTML = `
        <p style="margin-bottom: 15px; color: var(--accent-text); font-style: italic;">${bridgeText}</p>
        <p style="margin-bottom: 15px;">${commentaryText}</p>
        <div style="background: rgba(139, 184, 168, 0.05); padding: 12px 16px; border-radius: 8px; border-left: 2px solid ${fortuneInfo.color}; font-size: 0.95rem; line-height: 1.6;">
            ${adviceHtml}
        </div>
    `;

    document.getElementById('fate-goto-btn').onclick = () => {
        overlay.classList.remove('show');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
        gotoEncyclopediaById({
            id: randomWork.id,
            group: 'tinh-hoa',
            title: randomWork.title,
            author: randomWork.author
        });
    };

    setTimeout(() => {
        loadingEl.classList.add('hidden');
        resultEl.classList.add('show');
    }, 1200);
}

// =====================================================================
// PHẦN 5: XUẤT CÁC HÀM RA WINDOW TOÀN CỤC
// (Để index.html có thể gọi bằng sự kiện onclick)
// =====================================================================
window.executePipeline = executePipeline;
window.randomPoem = randomPoem;
window.switchView = switchView;
window.toggleMobileMenu = toggleMobileMenu;
window.gotoEncyclopediaById = gotoEncyclopediaById;
window.filterMainCategory = filterMainCategory;
window.filterSubGenre = filterSubGenre;
window.filterEncyclopediaGroup = filterEncyclopediaGroup;
window.searchEncyclopedia = searchEncyclopedia;
window.changePage = changePage;

window.handleSearchInput = function() {
    const input = document.getElementById('encyclopedia-search');
    const clearBtn = document.getElementById('clear-search-btn');
    if (!input || !clearBtn) return;
    if (input.value.length > 0) clearBtn.classList.add('show');
    else clearBtn.classList.remove('show');
};

window.clearSearch = function() {
    const input = document.getElementById('encyclopedia-search');
    const clearBtn = document.getElementById('clear-search-btn');
    if (!input) return;
    input.value = ''; 
    if (clearBtn) clearBtn.classList.remove('show'); 
    input.focus(); 
    searchEncyclopedia(); 
};

window.auditWorksData = async function() {
    console.log("%c[AUDIT] KIỂM TRA TÁC PHẨM", "color:#8bb8a8;font-weight:bold;");
    let ok = 0, empty = 0, err = 0;
    for (const w of APP_DATA.WORKS_DATA) {
        try {
            const res = await fetch(`./data/tac-pham/${encodeURIComponent(w.id)}.json`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            const clean = (d.content || '').replace(/<[^>]*>/g, '').trim();
            if (clean.length > 100 && !clean.includes('đang được Văn Đạo hiệu đính')) ok++;
            else empty++;
        } catch { err++; }
    }
    console.log(`[RESULT] ${ok} CÓ | ${empty} RỖNG | ${err} LỖI`);
};

window.auditAuthorsData = async function() {
    console.log("%c[AUDIT] KIỂM TRA TÁC GIẢ", "color:#8bb8a8;font-weight:bold;");
    let ok = 0, empty = 0, err = 0;
    for (const a of APP_DATA.AUTHOR_DATA) {
        try {
            const res = await fetch(`./data/tac-gia/${encodeURIComponent(a.id)}.json`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            const clean = (d.content || '').replace(/<[^>]*>/g, '').trim();
            if (clean.length > 100 && !clean.includes('đang được Văn Đạo hiệu đính')) ok++;
            else empty++;
        } catch { err++; }
    }
    console.log(`[RESULT] ${ok} CÓ | ${empty} RỖNG | ${err} LỖI`);
};

// =====================================================================
// PHẦN 6: KHỞI CHẠY (BOOTSTRAP) VÀ GẮN SỰ KIỆN
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 6.1. Gắn sự kiện cho các nút Bói Thơ (Fate Modal)
    document.getElementById('draw-literary-fate-btn')?.addEventListener('click', randomPoem);
    document.getElementById('fate-close-btn')?.addEventListener('click', () => {
        const o = document.getElementById('fate-modal-overlay');
        o.classList.remove('show');
        setTimeout(() => o.style.display = 'none', 300);
    });
    document.getElementById('fate-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'fate-modal-overlay') {
            e.target.classList.remove('show');
            setTimeout(() => e.target.style.display = 'none', 300);
        }
    });

    // 6.2. Splash Screen & Load Data
    const splash = document.getElementById('jade-splash');
    const status = document.getElementById('bootStatusText');
    const qc = document.querySelector('.boot-quote');
    const qt = document.getElementById('splash-quote-text');

    await new Promise(r => setTimeout(r, 800));
    if (status) status.textContent = "Đang kết nối tri thức...";
    const t0 = Date.now();
    try { await loadAllData(); }
    catch (e) { console.error(e); if (status) status.textContent = "Kết nối yếu..."; await new Promise(r => setTimeout(r, 1000)); }

    if (APP_DATA.QUOTES_DATA.length && qc && qt) {
        const q = APP_DATA.QUOTES_DATA[Math.floor(Math.random() * APP_DATA.QUOTES_DATA.length)];
        qt.innerHTML = `&ldquo;${q.text}&rdquo; <br><span style="font-size:0.8rem;opacity:0.7;margin-top:8px;display:inline-block;">— ${q.author} —</span>`;
        qc.classList.add('show');
    }

    const minSplash = 5000;
    const remaining = Math.max(0, minSplash - (Date.now() - t0));
    if (status) status.textContent = "Sẵn sàng trải nghiệm...";
    await new Promise(r => setTimeout(r, remaining));

    if (splash) {
        const silkOverlay = document.getElementById('silkTransition');
        if (silkOverlay) {
            silkOverlay.classList.remove('entering', 'leaving', 'active');
            void silkOverlay.offsetWidth;
            silkOverlay.classList.add('active', 'entering');
        }
        splash.classList.add('leaving'); 
        setTimeout(() => {
            splash.remove();
            const homeView = document.getElementById('view-home');
            if (homeView) homeView.classList.add('elegant-fade-in');
        }, 500); 
        setTimeout(() => {
            if (silkOverlay) silkOverlay.classList.remove('active', 'entering');
        }, 1000);
    }

    // 6.3. Khôi phục bản nháp (nếu có)
    const draft = localStorage.getItem('vandao_draft_poem');
    if (draft) {
        const pi = document.getElementById('poemInput');
        if (pi) pi.value = draft;
        localStorage.removeItem('vandao_draft_poem');
    }

    // 6.4. Gắn sự kiện Tìm kiếm
    document.getElementById('search-input')?.addEventListener('input', debounce(() => { STATE.currentPage = 1; renderHeritage(); }, 300));
    
    const encyclopediaSearchInput = document.getElementById('encyclopedia-search');
    if (encyclopediaSearchInput) {
        const debouncedSearch = debounce(searchEncyclopedia, 300);
        setCancelSearch(debouncedSearch.cancel);
        encyclopediaSearchInput.addEventListener('input', debouncedSearch);
    }

    // 6.5. Xử lý URL params (chuyển tab nếu có)
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab && ['heritage', 'encyclopedia', 'analyze'].includes(initialTab)) {
        setTimeout(() => switchView(initialTab), 500); 
        history.replaceState(null, '', window.location.pathname);
    }

    // 6.6. Sự kiện click chung toàn cục (Routing, đóng menu)
    document.addEventListener('click', e => {
        const routeControl = e.target.closest('[data-route-encyclopedia="true"]');
        if (routeControl) {
            e.preventDefault();
            const route = {};
            if (routeControl.dataset.routeId) route.id = routeControl.dataset.routeId;
            if (routeControl.dataset.routeGroup) route.group = routeControl.dataset.routeGroup;
            if (routeControl.dataset.routeTitle) route.title = routeControl.dataset.routeTitle;
            if (routeControl.dataset.routeAuthor) route.author = routeControl.dataset.routeAuthor;
            if (routeControl.dataset.routeVolume) route.volume = routeControl.dataset.routeVolume;
            if (routeControl.dataset.routeSection) route.section = routeControl.dataset.routeSection;
            if (routeControl.dataset.routeQuery) route.query = routeControl.dataset.routeQuery;
            if (routeControl.dataset.routeAnchor) route.anchor = routeControl.dataset.routeAnchor;
            if (routeControl.dataset.routeHash) route.hash = routeControl.dataset.routeHash;
            if (routeControl.dataset.routeHref) route.href = routeControl.dataset.routeHref;
            if (routeControl.dataset.routeKey) route.key = routeControl.dataset.routeKey;
            if (routeControl.dataset.routeValue) route.value = routeControl.dataset.routeValue;
            gotoEncyclopediaById(route);
            return;
        }

        const navMenu = document.getElementById('navMenu');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        if (navMenu?.classList.contains('show') && !navMenu.contains(e.target) && !menuBtn?.contains(e.target)) {
            navMenu.classList.remove('show');
            menuBtn?.setAttribute('aria-expanded', 'false');
        }
    });

    // 6.7. Logic cho Settings Dialog (Tủ Sách Offline)
    const settingsDialog = document.getElementById('settings-dialog');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (settingsDialog && btnOpenSettings && btnCloseSettings) {
        btnOpenSettings.addEventListener('click', () => {
            if (typeof settingsDialog.showModal === 'function') settingsDialog.showModal();
            else settingsDialog.setAttribute('open', '');
        });
        btnCloseSettings.addEventListener('click', () => {
            if (typeof settingsDialog.close === 'function') settingsDialog.close();
            else settingsDialog.removeAttribute('open');
        });
        settingsDialog.addEventListener('click', (e) => {
            const dialogDimensions = settingsDialog.getBoundingClientRect();
            if (e.clientX < dialogDimensions.left || e.clientX > dialogDimensions.right || e.clientY < dialogDimensions.top || e.clientY > dialogDimensions.bottom) {
                if (typeof settingsDialog.close === 'function') settingsDialog.close();
                else settingsDialog.removeAttribute('open');
            }
        });
    }

    // 6.8. NỐI SỰ KIỆN CHO CÁC NÚT TẢI OFFLINE (MỚI BỔ SUNG)
    const btnOfflineStart = document.getElementById('offline-btn-start');
    const btnOfflineCancel = document.getElementById('offline-btn-cancel');
    const btnOfflineClear = document.getElementById('offline-btn-clear');
    const progressSection = document.getElementById('offline-progress-section');
    const progressBar = document.getElementById('offline-progress-bar');
    const progressText = document.getElementById('offline-progress-text');
    const progressPercent = document.getElementById('offline-progress-percent');

    if (btnOfflineStart) {
        btnOfflineStart.addEventListener('click', async () => {
            btnOfflineStart.disabled = true;
            btnOfflineStart.textContent = "Đang tải...";
            if (progressSection) progressSection.style.display = 'block';
            if (btnOfflineCancel) btnOfflineCancel.style.display = 'block';

            const result = await downloadAllOffline((percent, completed, total, failed) => {
                if (progressBar) progressBar.style.width = `${percent}%`;
                if (progressPercent) progressPercent.textContent = `${percent}%`;
                if (progressText) progressText.textContent = `Đã tải ${completed}/${total} file`;
            });

            btnOfflineStart.disabled = false;
            btnOfflineStart.textContent = "Tải Toàn Bộ";
            if (btnOfflineCancel) btnOfflineCancel.style.display = 'none';

            if (result.success) {
                alert(`Tải hoàn tất! Thành công: ${result.total - result.failed} file. Lỗi: ${result.failed} file.`);
                if (progressSection) progressSection.style.display = 'none';
            } else {
                alert("Quá trình tải bị gián đoạn hoặc gặp lỗi.");
            }
        });
    }

    if (btnOfflineCancel) {
        btnOfflineCancel.addEventListener('click', () => {
            cancelDownload(); 
            btnOfflineStart.disabled = false;
            btnOfflineStart.textContent = "Tải Toàn Bộ";
            btnOfflineCancel.style.display = 'none';
        });
    }

    if (btnOfflineClear) {
        btnOfflineClear.addEventListener('click', async () => {
            if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu Offline?")) {
                await clearOfflineData();
                alert("Đã xóa dữ liệu Offline thành công!");
                if (progressSection) progressSection.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
            }
        });
    }

    // 6.9. Khởi tạo sự kiện cho Bách Khoa (Accordion)
    bindEncyclopediaEvents();
});
