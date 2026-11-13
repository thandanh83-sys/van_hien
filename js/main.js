/**
 * ==========================================================
 * VĂN ĐẠO - MAIN ENTRY POINT (js/main.js)
 * Vị trí: js/main.js
 * Version: 1.2.0 (Multi-Agent Integration)
 * ==========================================================
 * CHỨC NĂNG:
 * - Khởi chạy App, quản lý Splash Screen, hiệu ứng nền.
 * - Load dữ liệu từ JSON vào APP_DATA.
 * - Xử lý Thi Pháp Học (Tích hợp Tầng 4: AI Analysis).
 * - Xử lý Bói Thơ (Tích hợp Fortune Agent + Analysis Agent).
 * - Gắn sự kiện Tìm kiếm (Master AI), Cài đặt (Network/Offline).
 * - Sử dụng Custom Modal (showAlert, showConfirm) thay thế alert/confirm.
 * ==========================================================
 */

// =====================================================================
// 1. IMPORTS
// =====================================================================
import { APP_DATA, STATE, ICONS } from './config.js';
import { debounce, escapeHTML, showAlert, showConfirm } from './utils.js';
import { switchView, toggleMobileMenu, gotoEncyclopediaById, setCancelSearch } from './router.js';
import { 
    initMainFilters, renderHeritage, searchEncyclopedia, 
    bindEncyclopediaEvents, filterEncyclopediaGroup, 
    filterMainCategory, filterSubGenre, renderEncyclopedia, 
    changePage, findSymbols 
} from './render.js';
import { VDSearchEngine, triggerAsyncSearchIndex } from './search.js';
import { downloadAllOffline, clearOfflineData, cancelDownload, checkStorageSize } from './offline.js';
// [MULTI-AGENT] Import từ Facade AI (js/ai.js)
import { AIDispatcher, analyzeWork, calculateFortune, synthesizeDynamicFortune } from './ai.js';
import { runFullDiagnosis } from './audit.js';
import { MotherNode, bootstrapNetwork } from './network/index.js';
import { handleSmartSearch, resetSearchState } from './ask-dao.js';

// =====================================================================
// 2. HIỆU ỨNG NỀN (CANVAS SÓNG NƯỚC & HẠT SƯƠNG)
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
    
    // Tạo 20 hạt sương nhỏ, sáng, tinh tế
    for (let i = 0; i < 20; i++) {
        const d = document.createElement('div');
        d.className = 'dewdrop';
        const size = Math.random() * 3 + 3; 
        const dur = Math.random() * 20 + 25; 
        const delay = -(Math.random() * dur);
        
        d.style.cssText = `
            width: ${size}px; height: ${size}px;
            left: ${Math.random() * 100}vw;
            animation-duration: ${dur}s;
            animation-delay: ${delay}s;
        `;
        container.appendChild(d);
    }
}

// =====================================================================
// 3. THI PHÁP HỌC (POETRY ANALYZER & AI INTEGRATION)
// =====================================================================
const POETRY_ANALYZER = (() => {
    function getTone(s) {
        const nfd = s.normalize('NFD');
        return (nfd.includes('\u0301') || nfd.includes('\u0303') || nfd.includes('\u0309') || nfd.includes('\u0323')) ? 'T' : 'B';
    }
    function getRhymePart(word) {
        if (!word) return '';
        const decomposed = word.toLowerCase().normalize('NFD');
        const clean = decomposed.replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '').normalize('NFC');
        const vowels = 'aăâeêioôơuưy';
        const pattern = new RegExp(`[${vowels}]+[^${vowels}]*$`, 'u');
        const match = clean.match(pattern);
        return match ? match[0] : clean.slice(-2);
    }
    function analyzeBangTrac(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length);
        return lines.map((line, i) => {
            const syl = line.match(/[\p{L}\p{N}]+/gu) || [];
            return { lineNum: i + 1, text: line, count: syl.length, pattern: syl.map(getTone).join(' - '), lastSyllable: syl[syl.length - 1] || '' };
        });
    }
    function detectForm(lines) {
        const counts = lines.map(line => line.count);
        const n = counts.length;
        if (!n) return { form: 'Chưa xác định', confidence: 'thấp', note: 'Không có câu thơ để phân tích.' };
        const uniform = counts.every(count => count === counts[0]);
        const c = counts[0];
        if (n === 2 && c === 7) return { form: 'Thất ngôn (2 câu)', confidence: 'trung bình', note: '2 câu × 7 tiếng' };
        if (n === 4 && c === 7) return { form: 'Có dạng thất ngôn tứ tuyệt', confidence: 'trung bình', note: '4 câu × 7 tiếng' };
        if (n === 8 && c === 7) return { form: 'Có dạng thất ngôn bát cú', confidence: 'trung bình', note: '8 câu × 7 tiếng' };
        if (n >= 2 && counts[0] === 6 && counts[1] === 8) {
            const strict = n % 2 === 0 && counts.every((value, index) => value === (index % 2 === 0 ? 6 : 8));
            if (strict) return { form: 'Có dạng lục bát', confidence: 'trung bình', note: 'Luân phiên 6-8 đều' };
            return { form: 'Hình thức sáu-tám (biến thể)', confidence: 'trung bình', note: 'Có câu 6-8' };
        }
        if (!uniform) return { form: 'Thơ tự do hoặc biến thể', confidence: 'thấp', note: `Số tiếng: ${counts.join(' - ')}` };
        return { form: `Thơ ${c} tiếng`, confidence: 'trung bình', note: `${n} câu × ${c} tiếng` };
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
        const questions = [];
        if (form.confidence !== 'cao') questions.push(`Bài được nhận diện là "${form.form}" (độ tin cậy ${form.confidence}).`);
        const hasChanRhyme = rhymes.details.chan.some(item => item.isMatch);
        if (!hasChanRhyme) questions.push('Phép dò chưa nhận diện được vần chân rõ ràng.');
        if (symbols.length) questions.push(`"${symbols[0].keyword}" xuất hiện — gợi nghĩa nào?`);
        questions.push('Điều gì ở bài thơ này là "của riêng" tác giả?');
        return questions.slice(0, 5);
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
        `<div class="line-row" style="border-bottom:none!important;padding:8px 0;"><span style="color:var(--text-muted);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2,'0')}</span><span style="flex:1;text-align:center;padding:0 10px;">${escapeHTML(l.text)}</span><span class="pattern-text">${escapeHTML(l.pattern)}</span></div>`
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
                <span style="flex:1;min-width:220px;line-height:1.5;">Câu ${Array.from(d.cauSet).sort((a,b)=>a-b).join(', ')}</span>
                <span style="color:${color};font-weight:700;">${ICONS.check} cùng vần [${escapeHTML(r)}]</span>
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
    if (!hChan && !hLung && !hLien && !hCach) rhymeHtml = `<p style="font-style:italic;color:#e74c3c;padding:15px 0;text-align:center;">Chưa tìm thấy vần rõ ràng.</p>`;

    const tier1 = `<div style="margin-bottom:20px;"><strong>Thể thơ:</strong> ${report.form.form} <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note}</span></div>${rhymeHtml}`;
    
    const tier2 = !report.symbols.length
        ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng đặc biệt.</p>`
        : report.symbols.map(s => `<div class="symbol-row" style="padding:8px 0;">
            <span class="symbol-keyword">${escapeHTML(s.keyword)}</span>
            <span class="symbol-meaning"><em style="font-size:0.8rem;">[${escapeHTML(s.type)}]</em> ${escapeHTML(s.mean)}</span>
        </div>`).join('');
        
    const tier3 = report.questions.map(q => {
        return `<div class="question-item" style="display:flex;gap:8px;padding:8px 0;"><div>${ICONS.question}</div><div style="line-height:1.6;">${q}</div></div>`;
    }).join('');

    panel.innerHTML = `
        <div class="result-step tier-0"><div class="tier-label">TẦNG 0</div><div class="step-title">Bóc tách thanh điệu</div>${tier0}</div>
        <div class="result-step tier-1"><div class="tier-label">TẦNG 1</div><div class="step-title">Thể thơ & Vần</div>${tier1}</div>
        <div class="result-step tier-2"><div class="tier-label">TẦNG 2</div><div class="step-title">Biểu tượng · Điển tích</div>${tier2}</div>
        <div class="result-step tier-3"><div class="tier-label">TẦNG 3</div><div class="step-title">Câu hỏi mở</div>${tier3}</div>
        
        <!-- TẦNG 4: AI BÌNH LUẬN -->
        <div class="result-step tier-4">
            <div class="tier-label">TẦNG 4</div>
            <div class="step-title">Cảm nhận từ AI</div>
            <div id="ai-poetry-analysis" style="font-style: italic; color: var(--accent-text); padding: 10px;">
                <div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0 10px 0 0; display: inline-block; vertical-align: middle;"></div> Đang cảm nhận...
            </div>
        </div>
    `;

    // Gọi Analysis Agent phân tích (Thông qua Facade ai.js)
    analyzeWork({ content: raw, title: 'Bài thơ chưa đặt tên', author: 'Khuyết danh' }).then(analysis => {
        const aiDiv = document.getElementById('ai-poetry-analysis');
        if (aiDiv) {
            aiDiv.innerHTML = `
                <p style="margin-bottom: 10px;">${escapeHTML(analysis.commentaryText)}</p>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-style: normal;">
                    <strong>Chủ đề:</strong> ${analysis.themes.length ? analysis.themes.join(', ') : 'Chưa rõ'}
                </div>
            `;
        }
    });
}

// =====================================================================
// 4. LOAD DATA & NETWORK
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

        await bootstrapNetwork();

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

        c.innerHTML = `<p class="quote-text">${quote.text}</p><p class="quote-author">${quote.author}</p>`;
        c.style.opacity = 1;
    }, 500);
}

// =====================================================================
// 5. BÓI THƠ (FATE MODAL)
// =====================================================================
function randomPoem() {
    const validWorks = APP_DATA.WORKS_DATA.filter(work => work && (work.desc || work.description || work.content));
    if (!validWorks.length) return showAlert('Kho tác phẩm chưa có nội dung đủ để tạo gợi ý đọc.', 'Thông báo');

    const overlay = document.getElementById('fate-modal-overlay');
    const loadingEl = document.getElementById('fate-loading');
    const resultEl = document.getElementById('fate-result');
    const badge = document.getElementById('fate-badge');
    const titleEl = document.getElementById('fate-title');
    const excerptEl = document.getElementById('fate-excerpt');
    const commentaryEl = document.getElementById('fate-commentary');
    const gotoBtn = document.getElementById('fate-goto-btn');

    if (!overlay || !resultEl) return;

    overlay.style.display = 'flex';
    void overlay.offsetWidth;
    overlay.classList.add('show');
    loadingEl?.classList.add('hidden');
    resultEl.classList.add('show');

    const randomWork = validWorks[Math.floor(Math.random() * validWorks.length)];
    
    // [MULTI-AGENT] Phân tích và Bói toán
    const analysis = analyzeWork(randomWork);
    const fortuneKey = calculateFortune();
    const aiResult = synthesizeDynamicFortune(randomWork, fortuneKey, analysis);
    const fortuneInfo = aiResult.fortuneInfo;

    if (badge) {
        badge.textContent = `Vận khí: ${fortuneInfo.name}`;
        badge.style.color = fortuneInfo.color;
        badge.style.borderColor = fortuneInfo.color;
    }

    if (titleEl) titleEl.textContent = randomWork.title || 'Tác phẩm';

    if (excerptEl) {
        const excerpt = randomWork.desc || randomWork.description || randomWork.content || '';
        excerptEl.textContent = `“${excerpt}”`;
    }

    if (commentaryEl) {
        commentaryEl.innerHTML = `
            <div style="margin-bottom:18px; color:var(--accent-text); font-style:italic; line-height:1.8;">
                ${aiResult.bridgeText}
            </div>
            <div style="margin-bottom:18px; padding:15px; border-radius:10px; background:rgba(139,184,168,0.07);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:700; color:${fortuneInfo.color}; text-transform:uppercase; font-size:0.8rem;">✦ Lời chiêm nghiệm</div>
                <p style="margin:0; line-height:1.8;">${aiResult.fortuneReflection}</p>
            </div>
            <div style="margin-bottom:15px;">
                <div style="font-weight:700; color:var(--accent-text); margin-bottom:7px; text-transform:uppercase; font-size:0.8rem;">Lời bình văn học</div>
                <p style="margin:0; line-height:1.8;">${aiResult.literaryCommentary}</p>
            </div>
            <div style="background:rgba(139,184,168,0.05); padding:15px; border-radius:8px; border-left:3px solid ${fortuneInfo.color}; font-size:0.95rem; line-height:1.7; margin-top:20px;">
                <div style="font-weight:700; color:var(--accent-text); margin-bottom:10px; text-transform:uppercase; font-size:0.8rem;">Lời khuyên</div>
                ${aiResult.adviceHtml}
            </div>
        `;
    }

    if (gotoBtn) {
        gotoBtn.innerHTML = `Đọc toàn bộ tác phẩm &rarr;`;
        gotoBtn.onclick = () => {
            overlay.classList.remove('show');
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
            gotoEncyclopediaById({
                id: randomWork.id,
                group: 'tinh-hoa',
                title: randomWork.title,
                author: randomWork.author
            });
        };
    }
}

// =====================================================================
// 6. MẠNG LƯỚI TRI THỨC (NETWORK STATUS)
// =====================================================================
async function refreshNetworkStatus(forceRefresh = false) {
    const dotsEl = document.getElementById('network-dots');
    const summaryEl = document.getElementById('network-summary-text');
    const nodesEl = document.getElementById('network-nodes');
    const timestampEl = document.getElementById('network-timestamp');
    if (!nodesEl) return;

    if (summaryEl) summaryEl.textContent = 'Đang kiểm tra...';
    if (dotsEl) dotsEl.innerHTML = '';

    try {
        const health = await MotherNode.healthCheck(forceRefresh);
        const online = health.filter(h => h.status === 'online').length;
        const total = health.length;

        if (dotsEl) {
            dotsEl.innerHTML = health.map(n => 
                `<span class="network-dot ${n.status}" title="${escapeHTML(n.label)}"></span>`
            ).join('');
        }
        if (summaryEl) summaryEl.textContent = `${online}/${total} phân khu đang hoạt động`;

        if (nodesEl) {
            nodesEl.innerHTML = health.map(n => {
                const label = n.label
                    .replace('triet-thuyet', 'Triết Thuyết')
                    .replace('ky-tai', 'Kỳ Tài')
                    .replace('tinh-hoa', 'Tinh Hoa')
                    .replace('the-loai', 'Thể Loại');
                const statusText = n.status === 'online' ? 'Hoạt động' : (n.status === 'offline' ? 'Ngoại tuyến' : 'Lỗi');
                return `
                    <div class="network-node-row">
                        <span class="network-dot ${n.status}"></span>
                        <span class="network-node-label">${escapeHTML(label)}</span>
                        <span class="network-node-status ${n.status}">${statusText}</span>
                    </div>
                `;
            }).join('');
        }
        if (timestampEl) {
            timestampEl.textContent = `Kiểm tra lần cuối: ${new Date().toLocaleTimeString('vi-VN')}`;
        }
    } catch (err) {
        if (summaryEl) summaryEl.textContent = 'Lỗi kiểm tra mạng';
        if (nodesEl) nodesEl.innerHTML = `<p style="color:#a36b6b;font-size:0.85rem;">Không thể kết nối mạng lưới.</p>`;
    }
}

// =====================================================================
// 7. XUẤT CÁC HÀM RA WINDOW TOÀN CỤC
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
window.audit = runFullDiagnosis;

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
    
    // Reset trạng thái tìm kiếm
    import('./ask-dao.js').then(m => {
        m.resetSearchState({
            inputId: 'encyclopedia-search',
            filterBarId: 'encyclopedia-filter-bar',
            paginationId: 'encyclopedia-pagination',
            fallbackRenderFn: renderEncyclopedia
        });
    });
};

// =====================================================================
// 8. KHỞI CHẠY (BOOTSTRAP) VÀ GẮN SỰ KIỆN
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 8.1. Sự kiện Bói Thơ
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

    // 8.2. Splash Screen & Load Data
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
        setTimeout(() => { splash.remove(); }, 500); 
        setTimeout(() => {
            if (silkOverlay) silkOverlay.classList.remove('active', 'entering');
        }, 1000);
    }

    // 8.3. Khôi phục bản nháp
    const draft = localStorage.getItem('vandao_draft_poem');
    if (draft) {
        const pi = document.getElementById('poemInput');
        if (pi) pi.value = draft;
        localStorage.removeItem('vandao_draft_poem');
    }

    // 8.4. Sự kiện Tìm kiếm (Gộp Hỏi Đạo cho cả 2 View)
    const heritageSearchConfig = {
        inputId: 'search-input',
        containerId: 'heritage-grid',
        filterBarId: 'main-filter-bar',
        paginationId: 'pagination-container',
        fallbackRenderFn: () => { STATE.currentPage = 1; renderHeritage(); }
    };

    const encyclopediaSearchConfig = {
        inputId: 'encyclopedia-search',
        containerId: 'encyclopedia-container',
        filterBarId: 'encyclopedia-filter-bar',
        paginationId: 'encyclopedia-pagination',
        fallbackRenderFn: () => { searchEncyclopedia(); }
    };

    const heritageInput = document.getElementById('search-input');
    if (heritageInput) {
        heritageInput.addEventListener('input', debounce(() => {
            if (heritageInput.value.length > 0) document.getElementById('clear-search-btn')?.classList.add('show');
            else document.getElementById('clear-search-btn')?.classList.remove('show');
            heritageSearchConfig.fallbackRenderFn();
        }, 300));
        heritageInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); handleSmartSearch(heritageSearchConfig); }
        });
    }

    const encyclopediaInput = document.getElementById('encyclopedia-search');
    if (encyclopediaInput) {
        const debouncedSearch = debounce(() => {
            if (encyclopediaInput.value.length > 0) document.getElementById('clear-search-btn')?.classList.add('show');
            else document.getElementById('clear-search-btn')?.classList.remove('show');
            encyclopediaSearchConfig.fallbackRenderFn();
        }, 300);
        setCancelSearch(debouncedSearch.cancel);
        encyclopediaInput.addEventListener('input', debouncedSearch);
        encyclopediaInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); handleSmartSearch(encyclopediaSearchConfig); }
        });
    }

    // 8.5. Xử lý URL params
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab && ['heritage', 'encyclopedia', 'analyze'].includes(initialTab)) {
        setTimeout(() => switchView(initialTab), 500); 
        history.replaceState(null, '', window.location.pathname);
    }

    // 8.6. Sự kiện click toàn cục
    document.addEventListener('click', e => {
        // Bắt sự kiện nút Hỏi AI trong bài đọc
        const aiBtn = e.target.closest('[data-ai-action="summarize-work"]');
        if (aiBtn) {
            e.preventDefault();
            const title = aiBtn.dataset.workTitle;
            const resultDiv = document.getElementById('ai-inline-result');
            
            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `<div class="ask-loading" style="padding: 20px;"><div class="spinner"></div><p>AI đang đọc tác phẩm...</p></div>`;
                
                import('./ai.js').then(async ({ AIDispatcher }) => {
                    const result = await AIDispatcher.dispatch({ type: 'summarize-work', query: title });
                    resultDiv.innerHTML = `
                        <div class="ask-result" style="margin-top: 0;">
                            <div class="ask-answer" style="font-size: 1rem;">${escapeHTML(result.answer)}</div>
                            ${result.detail ? `<div class="ask-detail">${escapeHTML(result.detail)}</div>` : ''}
                        </div>
                    `;
                });
            }
            return;
        }

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

    // 8.7. Settings Dialog & Network
    const settingsDialog = document.getElementById('settings-dialog');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (settingsDialog && btnOpenSettings && btnCloseSettings) {
        btnOpenSettings.addEventListener('click', () => {
            if (typeof settingsDialog.showModal === 'function') settingsDialog.showModal();
            else settingsDialog.setAttribute('open', '');
            checkStorageSize(); 
            setTimeout(() => refreshNetworkStatus(true), 200);
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

    document.getElementById('network-refresh-btn')?.addEventListener('click', () => {
        const btn = document.getElementById('network-refresh-btn');
        if (btn) {
            btn.style.transform = 'rotate(180deg)';
            setTimeout(() => btn.style.transform = '', 300);
        }
        refreshNetworkStatus(true);
    });

    // 8.8. NÚT TẢI OFFLINE (Sử dụng Custom Modal)
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
                await showAlert(`Tải hoàn tất! Thành công: ${result.total - result.failed} file. Lỗi: ${result.failed} file.`, 'Hoàn tất');
                if (progressSection) progressSection.style.display = 'none';
            } else {
                await showAlert(result.message || "Quá trình tải bị gián đoạn hoặc gặp lỗi.", 'Lỗi');
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
            const isConfirmed = await showConfirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu Offline?", "Xóa dữ liệu");
            if (isConfirmed) {
                await clearOfflineData();
                await showAlert("Đã xóa dữ liệu Offline thành công!", "Thành công");
                if (progressSection) progressSection.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
            }
        });
    }

    // 8.9. Khởi tạo sự kiện cho Bách Khoa (Accordion)
    bindEncyclopediaEvents();
});