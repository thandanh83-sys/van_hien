/**
 * ==========================================================
 * VĂN ĐẠO - MAIN ENTRY POINT (js/main.js)
 * Đã sửa: Xóa import thừa, tối ưu sự kiện Offline.
 * ==========================================================
 */

import { APP_DATA, STATE, ICONS } from './config.js';
import { debounce, escapeHTML } from './utils.js';
import { switchView, toggleMobileMenu, gotoEncyclopediaById, setCancelSearch } from './router.js';
import { 
    initMainFilters, renderHeritage, searchEncyclopedia, 
    bindEncyclopediaEvents, filterEncyclopediaGroup, 
    filterMainCategory, filterSubGenre, renderEncyclopedia, 
    changePage, findSymbols 
} from './render.js';
import { VDSearchEngine, triggerAsyncSearchIndex } from './search.js';
import { downloadAllOffline, clearOfflineData, cancelDownload, checkStorageSize } from './offline.js';
import { calculateFortune, generateBridgeText, synthesizeCommentary } from './ai.js';

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
// PHẦN 2: THI PHÁP HỌC (POETRY ANALYZER)
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

// ĐÃ XÓA HOÀN TOÀN NHÃN "NGUYÊN VĂN"
function renderRandomQuote() { 
    const c = document.getElementById('daily-quote-container');
    if (!c || APP_DATA.QUOTES_DATA.length === 0) return; 
    c.style.opacity = 0;
    setTimeout(() => {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * APP_DATA.QUOTES_DATA.length); } while (APP_DATA.QUOTES_DATA.length > 1 && newIndex === STATE.currentQuoteIndex);
        STATE.currentQuoteIndex = newIndex;
        const quote = APP_DATA.QUOTES_DATA[STATE.currentQuoteIndex];

        c.innerHTML = `<p class="quote-text">${quote.text}</p><p class="quote-author">— ${quote.author} —</p>`;
        c.style.opacity = 1;
    }, 500);
}

// =====================================================================
// PHẦN 4: BÓI THƠ (TÍCH HỢP AI NỘI BỘ - 0MS)
// =====================================================================
function randomPoem() {
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
    
    loadingEl.classList.add('hidden');
    resultEl.classList.add('show');

    const randomWork = validWorks[Math.floor(Math.random() * validWorks.length)];
    const fortuneKey = calculateFortune(randomWork); 
    const fortuneInfo = APP_DATA.FORTUNE_CONFIG[fortuneKey] || { name: 'Bình Hòa', color: '#6a7c76' };
    
    const bridgeText = generateBridgeText(randomWork, fortuneKey); 
    const { commentaryText, adviceHtml } = synthesizeCommentary(randomWork, fortuneKey); 

    const badge = document.getElementById('fate-badge');
    badge.textContent = `Vận Khí: ${fortuneInfo.name}`;
    badge.style.color = fortuneInfo.color;
    badge.style.borderColor = fortuneInfo.color;
    
    document.getElementById('fate-title').textContent = randomWork.title;
    document.getElementById('fate-author').textContent = `— ${randomWork.author} —`;
    document.getElementById('fate-excerpt').innerHTML = `"${randomWork.desc}"`;

    let adviceWrapper = '';
    if (adviceHtml) {
        adviceWrapper = `
            <div style="background: rgba(139, 184, 168, 0.05); padding: 12px 16px; border-radius: 8px; border-left: 2px solid ${fortuneInfo.color}; font-size: 0.95rem; line-height: 1.6; margin-top: 15px;">
                ${adviceHtml}
            </div>
        `;
    }

    document.getElementById('fate-commentary').innerHTML = `
        <p style="margin-bottom: 15px; color: var(--accent-text); font-style: italic;">${bridgeText}</p>
        <p style="margin-bottom: 15px;">${commentaryText}</p>
        ${adviceWrapper}
    `;

    const authorObj = APP_DATA.AUTHOR_DATA.find(a => a.title.includes(randomWork.author));
    if (authorObj) {
        document.getElementById('fate-commentary').innerHTML += `
            <div style="text-align: center; margin-top: 15px; font-size: 0.9rem;">
                <button data-route-encyclopedia="true" data-route-id="${authorObj.id}" data-route-group="ky-tai" class="volume-link" style="font-size: 0.9rem;">
                    Khám phá hồ sơ tác giả ${randomWork.author} →
                </button>
            </div>
        `;
    }

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
}

// =====================================================================
// PHẦN 5: XUẤT CÁC HÀM RA WINDOW TOÀN CỤC
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

// =====================================================================
// PHẦN 6: KHỞI CHẠY (BOOTSTRAP) VÀ GẮN SỰ KIỆN
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 6.1. Gắn sự kiện cho các nút Bói Thơ
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
        }, 500); 
        setTimeout(() => {
            if (silkOverlay) silkOverlay.classList.remove('active', 'entering');
        }, 1000);
    }

    const draft = localStorage.getItem('vandao_draft_poem');
    if (draft) {
        const pi = document.getElementById('poemInput');
        if (pi) pi.value = draft;
        localStorage.removeItem('vandao_draft_poem');
    }

    document.getElementById('search-input')?.addEventListener('input', debounce(() => { STATE.currentPage = 1; renderHeritage(); }, 300));
    
    const encyclopediaSearchInput = document.getElementById('encyclopedia-search');
    if (encyclopediaSearchInput) {
        const debouncedSearch = debounce(searchEncyclopedia, 300);
        setCancelSearch(debouncedSearch.cancel);
        encyclopediaSearchInput.addEventListener('input', debouncedSearch);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab && ['heritage', 'encyclopedia', 'analyze'].includes(initialTab)) {
        setTimeout(() => switchView(initialTab), 500); 
        history.replaceState(null, '', window.location.pathname);
    }

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

    const settingsDialog = document.getElementById('settings-dialog');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (settingsDialog && btnOpenSettings && btnCloseSettings) {
        btnOpenSettings.addEventListener('click', () => {
            if (typeof settingsDialog.showModal === 'function') settingsDialog.showModal();
            else settingsDialog.setAttribute('open', '');
            checkStorageSize(); // Cập nhật dung lượng khi mở
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
                alert(result.message || "Quá trình tải bị gián đoạn hoặc gặp lỗi.");
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

    bindEncyclopediaEvents();
});
