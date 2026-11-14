/**
 * ==========================================================
 * VĂN ĐẠO — MAIN ENTRY POINT
 * Vị trí: js/main.js
 * Version: 7.0.0 (Contemplative UI — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. KHÔNG CHẤM ĐIỂM (No Scoring):
 *    - Không có UI nào hiển thị điểm số.
 *    - Chỉ có câu hỏi chiêm nghiệm và lời gợi mở.
 *    - Tier 4 của executePipeline đổi từ "Praiser/Critic" sang
 *      "Khúc Tán Thưởng" và "Lời Gợi Mở".
 *
 * 2. TÁCH BIỆT LOGIC VÀ RENDER:
 *    - main.js: điều phối, nạp dữ liệu, xử lý sự kiện.
 *    - render.js: render UI (showToast, renderContemplativeQuestions...).
 *    - ai.js: chỉ là facade, không chứa logic.
 *
 * 3. GRACEFUL DEGRADATION:
 *    - Nếu ContemplativeEngine chưa sẵn sàng → dùng POETRY_ANALYZER cũ.
 *    - Nếu KhucTanThuongAgent lỗi → fallback câu mặc định.
 *    - Nếu GoiMoAgent lỗi → fallback câu mặc định.
 *
 * 4. TIẾN TRÌNH TẢI (Progressive Loading):
 *    - Tầng 1 (Critical): danh ngôn + tác phẩm → UI hiện ngay.
 *    - Tầng 2 (Background): lý thuyết, tác giả, từ điển, contemplative...
 *
 * 5. TƯƠNG THÍCH NGƯỢC:
 *    - Tất cả hàm cũ vẫn export ra window.
 *    - Chỉ THÊM hàm mới, không XÓA.
 *    - `criticCommentary` vẫn được giữ làm alias cho `goiMoCommentary`.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v6.1.0: Solid AI UI & Progressive Loading.
 * - v7.0.0: Contemplative UI. Tích hợp ContemplativeEngine, KhucTanThuongAgent,
 *           GoiMoAgent. Bỏ hoàn toàn CriticAgent/PraiserAgent.
 *
 * ==========================================================
 */

// =====================================================================
// 1. IMPORTS
// =====================================================================

import { APP_DATA, STATE, ICONS, isContemplativeReady } from './config.js';
import { debounce, escapeHTML, showAlert, showConfirm } from './utils.js';
import {
    switchView, toggleMobileMenu, gotoEncyclopediaById, setCancelSearch
} from './router.js';
import {
    initMainFilters, renderHeritage, searchEncyclopedia,
    bindEncyclopediaEvents, filterEncyclopediaGroup,
    filterMainCategory, filterSubGenre, renderEncyclopedia,
    changePage, findSymbols,
    // [v3.0.0 - NEW]
    showToast, renderContemplativeQuestions, renderCopyButton, renderSkeleton
} from './render.js';
import { triggerAsyncSearchIndex } from './search.js';
import {
    downloadAllOffline, clearOfflineData, cancelDownload, checkStorageSize
} from './offline.js';
import {
    AIDispatcher, analyzeWork, calculateFortune, synthesizeDynamicFortune,
    MasterAI, OutputAI, LiteraryEngine, Identity
} from './ai.js';

// [v8.0.0 - NEW] Thay PraiserAgent/CriticAgent
import { KhucTanThuongAgent } from './ai/agents/khuc-tan-thuong.js';
import { GoiMoAgent } from './ai/agents/goi-mo.js';

import { runFullDiagnosis } from './audit.js';
import { bootstrapNetwork, DataHub, AgentRegistry } from './network/index.js';
import { handleSmartSearch, resetSearchState } from './ask-dao.js';

// =====================================================================
// 2. HELPER: SVG SPARKLE ICON
// =====================================================================
function sparkleSvg(size = 12, color = 'currentColor') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:6px; flex-shrink:0;" aria-hidden="true" focusable="false"><path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>`;
}

// =====================================================================
// 3. HIỆU ỨNG NỀN (CANVAS SÓNG NƯỚC & HẠT SƯƠNG)
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

    for (let i = 0; i < 20; i++) {
        const d = document.createElement('div');
        d.className = 'dewdrop';
        const size = Math.random() * 3 + 3;
        const dur = Math.random() * 20 + 25;
        const delay = -(Math.random() * dur);
        d.style.cssText = `width: ${size}px; height: ${size}px; left: ${Math.random() * 100}vw; animation-duration: ${dur}s; animation-delay: ${delay}s;`;
        container.appendChild(d);
    }
}

// =====================================================================
// 4. THI PHÁP HỌC (POETRY ANALYZER) — Giữ nguyên, không đổi
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
            return {
                lineNum: i + 1,
                text: line,
                count: syl.length,
                pattern: syl.map(getTone).join(' - '),
                lastSyllable: syl[syl.length - 1] || ''
            };
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
                result.chan.push({ text: `Câu ${i + 1} & Câu ${j + 1} ("${lastSyl[i]}" - "${lastSyl[j]}")`, isMatch: match, rhyme: rhymeParts[i] });
            }

        for (let i = 0; i < lines.length - 1; i++) {
            const ep = rhymeParts[i];
            const nw = lines[i + 1].text.match(/[\p{L}\p{N}]+/gu) || [];
            for (let k = 0; k < nw.length - 1; k++) {
                if (getRhymePart(nw[k]) === ep && ep !== '') {
                    result.lung.push({ text: `Cuối câu ${i + 1} vần với chữ ${k + 1} câu ${i + 2} ("${nw[k]}")`, isMatch: true, rhyme: ep });
                }
            }
        }

        for (let i = 0; i < lines.length - 1; i += 2) {
            const m = rhymeParts[i] === rhymeParts[i + 1] && rhymeParts[i] !== '';
            result.lien.push({ text: `Câu ${i + 1} & Câu ${i + 2}`, isMatch: m, rhyme: rhymeParts[i] });
        }

        for (let i = 0; i < lines.length - 2; i += 2) {
            const m = rhymeParts[i] === rhymeParts[i + 2] && rhymeParts[i] !== '';
            result.cach.push({ text: `Câu ${i + 1} & Câu ${i + 3}`, isMatch: m, rhyme: rhymeParts[i] });
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

// =====================================================================
// 5. EXECUTE PIPELINE — Phân tích Thi Pháp Học (v7.0.0)
// =====================================================================
/**
 * Pipeline phân tích bài thơ do người dùng nhập.
 *
 * Cấu trúc 5 tầng (KHÔNG chấm điểm):
 * ─────────────────────────────────────────────────────
 * Tầng 0: Thanh điệu & Nhịp điệu (Bằng/Trắc)
 * Tầng 1: Thể thơ & Vần
 * Tầng 2: Biểu tượng & Điển tích
 * Tầng 3: Gợi mở chiêm nghiệm (POETRY_ANALYZER + ContemplativeEngine)
 * Tầng 4: Khúc Tán Thưởng (từ KhucTanThuongAgent)
 * Tầng 5: Lời Gợi Mở (từ GoiMoAgent)
 * ─────────────────────────────────────────────────────
 *
 * [v7.0.0] Thay đổi so với v6.1.0:
 * - Thêm tầng 3 dùng ContemplativeEngine (nếu có).
 * - Tách tầng 4 cũ (Praiser/Critic) thành 2 tầng mới:
 *   + Tầng 4: Khúc Tán Thưởng
 *   + Tầng 5: Lời Gợi Mở
 * - Thêm nút copy cho mỗi tầng cảm thụ.
 * - KHÔNG còn bất kỳ điểm số nào.
 *
 * @returns {Promise<void>}
 */
async function executePipeline() {
    const input = document.getElementById('poemInput');
    const panel = document.getElementById('results-panel');
    if (!input || !panel) return;

    const raw = input.value;
    if (!raw.trim()) {
        panel.innerHTML = `
            <div class="result-step" style="border-left-color:var(--accent-gold);">
                <p style="font-style:italic;color:var(--text-muted);text-align:center;">
                    Mời Bạn nhập một bài thơ — ta sẽ cùng ngắm.
                </p>
            </div>
        `;
        return;
    }

    // ---- Bước 1: Phân tích cấu trúc ----
    const report = POETRY_ANALYZER.generateReport(raw);
    if (!report) { panel.innerHTML = ''; return; }

    // ---- Bước 2: Phân tích cảm thụ (2 agents mới) ----
    const workName = 'Bài thơ của Bạn';
    let praise = { commentary: '' };
    let goiMo = { commentary: '' };

    try {
        praise = KhucTanThuongAgent.analyze(raw, workName);
    } catch (err) {
        console.warn('[MAIN] KhucTanThuongAgent lỗi:', err);
        praise.commentary = 'Cần thêm thời gian để cảm nhận trọn vẹn vẻ đẹp của bài thơ.';
    }

    try {
        goiMo = GoiMoAgent.analyze(raw, workName);
    } catch (err) {
        console.warn('[MAIN] GoiMoAgent lỗi:', err);
        goiMo.commentary = 'Có một chiều sâu ta muốn cùng Bạn đào thêm, nhưng cần đọc chậm hơn.';
    }

    // ---- Bước 3: Câu hỏi chiêm nghiệm (dynamic import ContemplativeEngine) ----
    let contemplativeQuestions = [];
    try {
        const mod = await import('./ai/contemplative-engine.js');
        if (mod && mod.ContemplativeEngine) {
            const prompts = APP_DATA.CONTEMPLATIVE_PROMPTS || {};
            contemplativeQuestions = mod.ContemplativeEngine.generate(raw, prompts) || [];
        }
    } catch (err) {
        // ContemplativeEngine chưa sẵn sàng — graceful degradation
        // Dùng tạm câu hỏi từ POETRY_ANALYZER
        console.info('[MAIN] ContemplativeEngine chưa sẵn sàng, dùng câu hỏi cơ bản.');
    }

    // ---- Bước 4: Chuẩn bị câu hỏi cho tầng 3 ----
    // Gộp câu hỏi cấu trúc (POETRY_ANALYZER) và câu hỏi chiêm nghiệm (ContemplativeEngine)
    const structuralQuestions = report.questions.map(q => ({ question: q, quote: null }));
    const allQuestions = [...structuralQuestions, ...contemplativeQuestions].slice(0, 6);

    // ---- Bước 5: Xây dựng HTML cho từng tầng ----

    // Tầng 0: Thanh điệu & Nhịp điệu (KHÔNG đổi)
    const tier0 = `
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(139,184,168,0.05); border-radius: 8px; border: 1px dashed var(--border-color);">
            <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; font-family: var(--font-body); font-weight: bold;">Bài thơ của Bạn</div>
            <div style="font-style: italic; line-height: 1.8; white-space: pre-wrap; color: var(--text-main); font-size: 1.1rem;">${escapeHTML(raw)}</div>
        </div>
    ` + report.bangTrac.map(l =>
        `<div class="line-row" style="border-bottom:none!important;padding:8px 0;">
            <span style="color:var(--text-muted);font-size:0.85rem;min-width:30px;">${String(l.lineNum).padStart(2, '0')}</span>
            <span style="flex:1;text-align:center;padding:0 10px;">${escapeHTML(l.text)}</span>
            <span class="pattern-text">${escapeHTML(l.pattern)}</span>
        </div>`
    ).join('');

    // Tầng 1: Thể thơ & Vần
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
                <span style="flex:1;min-width:220px;line-height:1.5;">Câu ${Array.from(d.cauSet).sort((a, b) => a - b).join(', ')}</span>
                <span style="color:${color};font-weight:700;">${ICONS.check} cùng vần [${escapeHTML(r)}]</span>
            </li>`
        ).join('');
        return `<div style="margin-bottom:24px;">
            <strong style="display:block;margin-bottom:12px;color:${color};font-size:0.85rem;text-transform:uppercase;">${title}</strong>
            <ul style="padding-left:0;list-style:none;margin:0;">${list}</ul>
        </div>`;
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
    if (!hChan && !hLung && !hLien && !hCach) {
        rhymeHtml = `<p style="font-style:italic;color:var(--text-muted);padding:15px 0;text-align:center;">Chưa tìm thấy vần rõ ràng — đây có thể là thơ tự do.</p>`;
    }

    const tier1 = `
        <div style="margin-bottom:20px;">
            <strong>Thể thơ:</strong> ${report.form.form}
            <span style="color:var(--text-muted);font-size:0.85rem;"> — ${report.form.note}</span>
        </div>
        ${rhymeHtml}
    `;

    // Tầng 2: Biểu tượng & Điển tích
    const tier2 = !report.symbols.length
        ? `<p style="font-style:italic;color:var(--text-muted);">Không phát hiện biểu tượng đặc biệt.</p>`
        : report.symbols.map(s => `<div class="symbol-row" style="padding:8px 0;">
            <span class="symbol-keyword">${escapeHTML(s.keyword)}</span>
            <span class="symbol-meaning"><em style="font-size:0.8rem;">[${escapeHTML(s.type)}]</em> ${escapeHTML(s.mean)}</span>
        </div>`).join('');

    // Tầng 3: Gợi mở chiêm nghiệm
    const tier3 = allQuestions.length > 0
        ? renderContemplativeQuestions(allQuestions)
        : `<p style="font-style:italic;color:var(--text-muted);text-align:center;padding:20px 0;">
            Chưa có gợi mở nào. Mời Bạn đọc chậm lại và tự cảm nhận.
        </p>`;

    // Tầng 4: Khúc Tán Thưởng (từ KhucTanThuongAgent)
    const tier4 = `
        <div style="background: #ffffff; padding: 18px; border-radius: 10px; border-left: 4px solid var(--accent); box-shadow: 0 4px 15px rgba(0,0,0,0.06);">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:6px; font-weight:700; color: var(--accent-text); text-transform:uppercase; font-size:0.8rem;">
                    ${sparkleSvg(12, 'var(--accent-text)')} Khúc Tán Thưởng
                </div>
                ${renderCopyButton(praise.commentary || '', 'Chép')}
            </div>
            <p style="font-style: italic; color: var(--text-main); line-height: 1.7; margin-bottom: 0; font-size: 1.05rem;">
                ${praise.commentary || 'Cần thêm thời gian để cảm nhận trọn vẹn vẻ đẹp của bài thơ.'}
            </p>
        </div>
    `;

    // Tầng 5: Lời Gợi Mở (từ GoiMoAgent)
    const tier5 = `
        <div style="background: #ffffff; padding: 18px; border-radius: 10px; border-left: 4px solid #a36b6b; box-shadow: 0 4px 15px rgba(0,0,0,0.06);">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:6px; font-weight:700; color: #a36b6b; text-transform:uppercase; font-size:0.8rem;">
                    ${sparkleSvg(12, '#a36b6b')} Lời Gợi Mở
                </div>
                ${renderCopyButton(goiMo.commentary || '', 'Chép')}
            </div>
            <p style="font-style: italic; color: var(--text-main); line-height: 1.7; margin-bottom: 0; font-size: 1.05rem;">
                ${goiMo.commentary || 'Có một chiều sâu ta muốn cùng Bạn đào thêm, nhưng cần đọc chậm hơn.'}
            </p>
        </div>
    `;

    // ---- Bước 6: Ghép tất cả vào panel ----
    panel.innerHTML = `
        <div class="result-step" style="border-left-color: var(--text-muted);">
            <div class="step-title">Thanh điệu &amp; Nhịp điệu</div>
            ${tier0}
        </div>

        <div class="result-step" style="border-left-color: var(--accent);">
            <div class="step-title">Thể thơ &amp; Vần</div>
            ${tier1}
        </div>

        <div class="result-step" style="border-left-color: var(--accent-gold);">
            <div class="step-title">Biểu tượng &amp; Điển tích</div>
            ${tier2}
        </div>

        <div class="result-step" style="border-left-color: #8b5a2b;">
            <div class="step-title">Gợi mở chiêm nghiệm</div>
            ${tier3}
        </div>

        <div class="result-step" style="border-left-color: var(--accent-text); background: #ffffff !important; box-shadow: 0 10px 30px rgba(26, 82, 50, 0.08);">
            <div class="step-title">Góc Nhìn Từ Văn Đạo</div>
            <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
                ${tier4}
                ${tier5}
            </div>
        </div>
    `;
}

// =====================================================================
// 6. LOAD DATA (PROGRESSIVE LOADING)
// =====================================================================

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

function buildGlobalIndex() {
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
}

async function loadAllData() {
    try {
        // -------------------------------------------------------------
        // TẦNG 1: CRITICAL (Tải ngay để hiển thị UI)
        // -------------------------------------------------------------
        const [quotes, works] = await Promise.all([
            safeFetch('./data/data-danh-ngon.json', []),
            safeFetch('./data/data-tac-pham.json', [])
        ]);

        APP_DATA.QUOTES_DATA = quotes;
        APP_DATA.WORKS_DATA = works;

        // Render UI ngay khi có dữ liệu Tầng 1
        initMainFilters();
        if (quotes.length > 0) {
            renderRandomQuote();
            if (STATE.quoteIntervalId) clearInterval(STATE.quoteIntervalId);
            STATE.quoteIntervalId = setInterval(renderRandomQuote, 6000);
        } else {
            const qContainer = document.getElementById('daily-quote-container');
            if (qContainer) qContainer.innerHTML = `<p style="text-align:center; font-style:italic; color:var(--text-muted); padding: 20px;">Không có dữ liệu danh ngôn.</p>`;
        }

        // -------------------------------------------------------------
        // TẦNG 2: NON-CRITICAL (Tải ngầm — không chặn UI)
        // -------------------------------------------------------------
        requestIdleCallback(async () => {
            console.log("[SYSTEM] Bắt đầu tải dữ liệu tầng 2 (Background)...");
            const results = await Promise.all([
                safeFetch('./data/data-ly-thuyet.json', []),
                safeFetch('./data/data-tac-gia.json', []),
                safeFetch('./data/data-loi-binh.json', {}),
                safeFetch('./data/data-the-loai.json', {}),
                safeFetch('./data/data-van-khi.json', { config: {}, advice: {} }),
                safeFetch('./data/data-tu-dien-the-loai.json', []),
                // [v4.0.0 - NEW] Bộ câu hỏi chiêm nghiệm
                safeFetch('./data/contemplative-prompts.json', {})
            ]);

            APP_DATA.THEORY_DATA = results[0];
            APP_DATA.AUTHOR_DATA = results[1];
            APP_DATA.COMMENTARY_DATA = results[2];
            APP_DATA.CATEGORY_NAMES = results[3];
            APP_DATA.FORTUNE_CONFIG = results[4].config || {};
            APP_DATA.FORTUNE_ADVICE = results[4].advice || {};
            APP_DATA.THE_LOAI_DATA = results[5];
            APP_DATA.CONTEMPLATIVE_PROMPTS = results[6] || {};

            // Xây dựng Index & Network
            buildGlobalIndex();
            await bootstrapNetwork();

            triggerAsyncSearchIndex();

            // Log trạng thái Contemplative
            if (isContemplativeReady()) {
                const dimCount = Object.keys(APP_DATA.CONTEMPLATIVE_PROMPTS).length;
                console.log(`[SYSTEM] Contemplative Prompts: ${dimCount} chiều kích đã sẵn sàng.`);
            } else {
                console.info(`[SYSTEM] Contemplative Prompts chưa sẵn sàng — dùng câu hỏi cơ bản.`);
            }

            console.log("[SYSTEM] Đã tải xong toàn bộ dữ liệu ngầm.");
        });

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
        do {
            newIndex = Math.floor(Math.random() * APP_DATA.QUOTES_DATA.length);
        } while (APP_DATA.QUOTES_DATA.length > 1 && newIndex === STATE.currentQuoteIndex);
        STATE.currentQuoteIndex = newIndex;
        const quote = APP_DATA.QUOTES_DATA[STATE.currentQuoteIndex];

        c.innerHTML = `<p class="quote-text">${quote.text}</p><p class="quote-author">${quote.author}</p>`;
        c.style.opacity = 1;
    }, 500);
}

// =====================================================================
// 7. BÓI THƠ (FATE MODAL) — v4.0.0 Contemplative
// =====================================================================
/**
 * Bói thơ: chọn ngẫu nhiên một tác phẩm + tính vận khí + hiển thị 3 góc nhìn.
 *
 * 3 góc nhìn (không chấm điểm):
 * 1. Lời chiêm nghiệm thiền vị (từ fortune_texts)
 * 2. Khúc Tán Thưởng (từ KhucTanThuongAgent.getQuickComment)
 * 3. Lời Gợi Mở (từ GoiMoAgent.getQuickComment)
 */
async function randomPoem() {
    const validWorks = APP_DATA.WORKS_DATA.filter(work => work && work.id);
    if (!validWorks.length) {
        return showAlert('Kho tác phẩm chưa có nội dung đủ để tạo gợi ý đọc.', 'Thông báo');
    }

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

    loadingEl?.classList.remove('hidden');
    resultEl.classList.remove('show');

    const randomWork = validWorks[Math.floor(Math.random() * validWorks.length)];

    // Tải nội dung chi tiết (nếu có)
    let fullContent = randomWork.content || '';
    try {
        const detail = await DataHub.getDetail(randomWork.id);
        if (detail && detail.content) {
            fullContent = detail.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
    } catch (e) {
        console.warn("Không tải được chi tiết:", e);
    }

    const enhancedWork = { ...randomWork, content: fullContent };

    // Tính vận khí + tổng hợp 3 góc nhìn
    const analysis = analyzeWork(enhancedWork);
    const fortuneKey = calculateFortune();
    const aiResult = synthesizeDynamicFortune(enhancedWork, fortuneKey, analysis);
    const fortuneInfo = aiResult.fortuneInfo;

    loadingEl?.classList.add('hidden');
    resultEl.classList.add('show');

    // Cập nhật badge vận khí
    if (badge) {
        badge.textContent = `Vận khí: ${fortuneInfo.name}`;
        badge.style.color = fortuneInfo.color;
        badge.style.borderColor = fortuneInfo.color;
    }

    // Cập nhật tiêu đề
    if (titleEl) {
        titleEl.innerHTML = `
            <span style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 8px; font-family: var(--font-body); text-transform: uppercase; letter-spacing: 2px;">Bạn đã bốc được</span>
            ${randomWork.title}
            <span style="font-size: 1rem; color: var(--accent-text); display: block; margin-top: 5px; font-family: var(--font-body); font-style: italic;">— ${randomWork.author} —</span>
        `;
    }

    // Cập nhật trích đoạn
    if (excerptEl) {
        const excerpt = randomWork.desc || randomWork.description || (fullContent ? fullContent.substring(0, 100) + '...' : '');
        excerptEl.textContent = `“${excerpt}”`;
    }

    // Cập nhật phần bình luận (3 góc nhìn)
    if (commentaryEl) {
        // [v4.0.0] Dùng goiMoCommentary (mới), fallback về criticCommentary (cũ)
        const goiMoText = aiResult.goiMoCommentary || aiResult.criticCommentary || '';

        commentaryEl.innerHTML = `
            <div style="margin-bottom:18px; color:var(--accent-text); font-style:italic; line-height:1.8;">
                ${aiResult.bridgeText}
            </div>
            <div style="margin-bottom:18px; padding:15px; border-radius:10px; background:rgba(139,184,168,0.07);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:700; color:${fortuneInfo.color}; text-transform:uppercase; font-size:0.8rem;">
                    ${sparkleSvg(12, fortuneInfo.color)} Lời bình
                </div>
                <p style="margin:0; line-height:1.8;">${aiResult.fortuneReflection}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                <div style="background: rgba(139, 184, 168, 0.05); padding: 12px 15px; border-radius: 8px; border-left: 3px solid var(--accent);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:5px;">
                        <div style="font-weight:700; color: var(--accent-text); text-transform:uppercase; font-size:0.75rem;">
                            ${sparkleSvg(11, 'var(--accent-text)')} Khúc Tán Thưởng
                        </div>
                        ${renderCopyButton(aiResult.praiseCommentary || '', 'Chép')}
                    </div>
                    <p style="margin:0; line-height:1.6; font-size:0.95rem;">${aiResult.praiseCommentary}</p>
                </div>
                <div style="background: rgba(163, 107, 107, 0.05); padding: 12px 15px; border-radius: 8px; border-left: 3px solid #a36b6b;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:5px;">
                        <div style="font-weight:700; color: #a36b6b; text-transform:uppercase; font-size:0.75rem;">
                            ${sparkleSvg(11, '#a36b6b')} Lời Gợi Mở
                        </div>
                        ${renderCopyButton(goiMoText, 'Chép')}
                    </div>
                    <p style="margin:0; line-height:1.6; font-size:0.95rem;">${goiMoText}</p>
                </div>
            </div>
            <div style="background:rgba(139,184,168,0.05); padding:15px; border-radius:8px; border-left:3px solid ${fortuneInfo.color}; font-size:0.95rem; line-height:1.7;">
                <div style="font-weight:700; color:var(--accent-text); margin-bottom:10px; text-transform:uppercase; font-size:0.8rem;">
                    ${sparkleSvg(12, 'var(--accent-text)')} Lời khuyên
                </div>
                ${aiResult.adviceHtml}
            </div>
        `;
    }

    // Nút "Đọc toàn bộ tác phẩm"
    if (gotoBtn) {
        gotoBtn.innerHTML = `Đọc toàn bộ tác phẩm ${ICONS.arrowRight}`;
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
// 8. TRIGGER SMART SEARCH
// =====================================================================
window.triggerSmartSearch = (inputId, containerId, filterBarId, paginationId) => {
    const config = {
        inputId, containerId, filterBarId, paginationId,
        fallbackRenderFn: () => { STATE.currentPage = 1; renderHeritage(); }
    };
    handleSmartSearch(config);
};

// =====================================================================
// 9. MẠNG LƯỚI TRI THỨC (NETWORK STATUS)
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
        const totalRecords = STATE.GLOBAL_RECORDS.length;

        const nodes = [
            { id: 'triet-thuyet', label: 'Triết Thuyết', status: 'online' },
            { id: 'ky-tai', label: 'Kỳ Tài', status: 'online' },
            { id: 'tinh-hoa', label: 'Tinh Hoa', status: 'online' },
            { id: 'the-loai', label: 'Thể Loại', status: 'online' }
        ];

        if (dotsEl) {
            dotsEl.innerHTML = nodes.map(n =>
                `<span class="network-dot ${n.status}" title="${n.label}"></span>`
            ).join('');
        }

        if (summaryEl) {
            summaryEl.textContent = `${totalRecords} thực thể trong mạng lưới`;
        }

        if (nodesEl) {
            nodesEl.innerHTML = nodes.map(n => {
                const statusText = n.status === 'online' ? 'Sẵn sàng' : 'Lỗi';
                return `
                    <div class="network-node-row">
                        <span class="network-dot ${n.status}"></span>
                        <span class="network-node-label">${n.label}</span>
                        <span class="network-node-status ${n.status}">${statusText}</span>
                    </div>
                `;
            }).join('');
        }

        if (timestampEl) {
            timestampEl.textContent = `Cập nhật lần cuối: ${new Date().toLocaleTimeString('vi-VN')}`;
        }
    } catch (err) {
        if (summaryEl) summaryEl.textContent = 'Lỗi kiểm tra dữ liệu';
        if (nodesEl) nodesEl.innerHTML = `<p style="color:#a36b6b;font-size:0.85rem;">Không thể đọc dữ liệu.</p>`;
    }
}

// =====================================================================
// 10. XUẤT CÁC HÀM RA WINDOW TOÀN CỤC
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

window.handleSearchInput = function (inputId = 'encyclopedia-search', btnId = 'clear-search-btn') {
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(btnId);
    if (!input || !clearBtn) return;
    if (input.value.length > 0) clearBtn.classList.add('show');
    else clearBtn.classList.remove('show');
};

window.clearSearch = function (inputId = 'encyclopedia-search', btnId = 'clear-search-btn', type = 'encyclopedia') {
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(btnId);
    if (!input) return;

    input.value = '';
    if (clearBtn) clearBtn.classList.remove('show');

    import('./ask-dao.js').then(m => {
        if (type === 'heritage') {
            m.resetSearchState({
                inputId: inputId,
                containerId: 'heritage-grid',
                btnId: btnId,
                filterBarId: 'main-filter-bar',
                paginationId: 'pagination-container',
                fallbackRenderFn: () => { STATE.currentPage = 1; renderHeritage(); }
            });
        } else {
            m.resetSearchState({
                inputId: inputId,
                containerId: 'encyclopedia-container',
                btnId: btnId,
                filterBarId: 'encyclopedia-filter-bar',
                paginationId: 'encyclopedia-pagination',
                fallbackRenderFn: renderEncyclopedia
            });
        }
    });
};

// =====================================================================
// 11. KHỞI CHẠY (BOOTSTRAP) VÀ GẮN SỰ KIỆN
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 11.1. Sự kiện Bói Thơ
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

    // 11.2. Splash Screen & Load Data
    const splash = document.getElementById('jade-splash');
    const status = document.getElementById('bootStatusText');
    const qc = document.querySelector('.boot-quote');
    const qt = document.getElementById('splash-quote-text');

    await new Promise(r => setTimeout(r, 800));
    if (status) status.textContent = "Đang kết nối tri thức...";
    const t0 = Date.now();
    try {
        await loadAllData();
    } catch (e) {
        console.error(e);
        if (status) status.textContent = "Kết nối yếu...";
        await new Promise(r => setTimeout(r, 1000));
    }

    if (APP_DATA.QUOTES_DATA.length && qc && qt) {
        const q = APP_DATA.QUOTES_DATA[Math.floor(Math.random() * APP_DATA.QUOTES_DATA.length)];
        qt.innerHTML = `&ldquo;${q.text}&rdquo; <br><span style="font-size:0.8rem;opacity:0.7;margin-top:8px;display:inline-block;">— ${q.author} —</span>`;
        qc.classList.add('show');
    }

    const minSplash = 4000;
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

    // 11.3. Khôi phục bản nháp
    const draft = localStorage.getItem('vandao_draft_poem');
    if (draft) {
        const pi = document.getElementById('poemInput');
        if (pi) pi.value = draft;
        localStorage.removeItem('vandao_draft_poem');
    }

    // 11.4. Sự kiện Tìm kiếm / Hỏi Đạo
    const setupSearchEvents = (inputId, containerId, filterBarId, paginationId, fallbackFn, btnId) => {
        const input = document.getElementById(inputId);
        if (!input) return;

        const config = {
            inputId,
            containerId,
            btnId,
            filterBarId,
            paginationId,
            fallbackRenderFn: fallbackFn
        };

        input.addEventListener('input', debounce(() => {
            if (!input.value.trim()) {
                resetSearchState(config);
            } else {
                fallbackFn();
            }
        }, 300));

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSmartSearch(config);
            }
        });
    };

    setupSearchEvents(
        'search-input', 'heritage-grid', 'main-filter-bar', 'pagination-container',
        () => { STATE.currentPage = 1; renderHeritage(); }, 'clear-search-btn-heritage'
    );

    setupSearchEvents(
        'encyclopedia-search', 'encyclopedia-container', 'encyclopedia-filter-bar', 'encyclopedia-pagination',
        () => { searchEncyclopedia(); }, 'clear-search-btn'
    );

    // 11.5. Xử lý URL params
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    if (initialTab && ['heritage', 'encyclopedia', 'analyze'].includes(initialTab)) {
        setTimeout(() => switchView(initialTab), 500);
        history.replaceState(null, '', window.location.pathname);
    }

    // 11.6. Xử lý click điều hướng
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

    // 11.7. Settings Dialog
    const settingsDialog = document.getElementById('settings-dialog');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (settingsDialog && btnOpenSettings && btnCloseSettings) {
        btnOpenSettings.addEventListener('click', () => {
            settingsDialog.showModal();
            checkStorageSize();
            setTimeout(() => refreshNetworkStatus(true), 200);
        });
        btnCloseSettings.addEventListener('click', () => {
            settingsDialog.close();
        });
        settingsDialog.addEventListener('click', (e) => {
            const dialogDimensions = settingsDialog.getBoundingClientRect();
            if (e.clientX < dialogDimensions.left || e.clientX > dialogDimensions.right || e.clientY < dialogDimensions.top || e.clientY > dialogDimensions.bottom) {
                settingsDialog.close();
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

    // 11.8. NÚT TẢI OFFLINE
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
                await showAlert(`Tải hoàn tất! Thành công: ${result.total - result.failed} file. Lỗi: ${result.failed} file.`, 'Hoàn tất', 3000);
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
                await showAlert("Đã xóa dữ liệu Offline thành công!", "Thành công", 2000);
                if (progressSection) progressSection.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
            }
        });
    }

    // 11.9. Khởi tạo sự kiện cho Bách Khoa
    bindEncyclopediaEvents();

    // 11.10. Log triết lý Văn Đạo
    console.log(
        `%c[TRIẾT LÝ VĂN ĐẠO] Không chấm điểm văn chương. Mỗi bài thơ đều có hồn, nét đẹp riêng.`,
        'color: #c9a96e; font-style: italic; font-weight: bold; padding: 6px 12px;'
    );
});
