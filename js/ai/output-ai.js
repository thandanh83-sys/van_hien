/**
 * ==========================================================
 * VĂN ĐẠO — OUTPUT AI (Bộ hiển thị kết quả AI)
 * Vị trí: js/ai/output-ai.js
 * Version: 7.0.0 (Contemplative Renderer — No Scoring)
 * ==========================================================
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. BIỂU ĐẠT, KHÔNG PHÁN XÉT (Express, Not Judge):
 *    - OutputAI không hiển thị điểm số, không xếp hạng.
 *    - Chỉ hiển thị câu trả lời, tiểu dẫn, cơ duyên gặp gỡ,
 *      câu hỏi gợi mở (Socratic), lời kết.
 *    - "Điểm" duy nhất được phép xuất hiện là trong các câu
 *      trích dẫn văn bản (không phải điểm đánh giá).
 *
 * 2. TỰ CHỨA (Self-Contained):
 *    - Copy button & Toast được implement NỘI BỘ, không import
 *      từ render.js — tránh circular dependency & đảm bảo
 *      hoạt động ngay cả khi render.js chưa load.
 *    - Fallback đầy đủ: nếu DialogueEngine/Identity lỗi,
 *      vẫn render được nội dung chính.
 *
 * 3. BẠCH NGỌC (Jade Palette):
 *    - Không neon, không emoji, không gradient rực rỡ.
 *    - Chỉ dùng CSS variables: --accent, --accent-gold,
 *      --text-main, --text-muted, --border-color.
 *    - Font: var(--font-body) — Times New Roman.
 *
 * 4. XỬ LÝ KẾT QUẢ ĐA DẠNG (Robust Result Handling):
 *    - result.answer (chuẩn)
 *    - result.commentary (từ thematic results — legacy)
 *    - result.answer rỗng → hiển thị empty state
 *    - result null/undefined → hiển thị error state
 *
 * 5. TƯƠNG THÍCH NGƯỢC (Backward Compatible):
 *    - Giữ nguyên signature: render(container, result, query).
 *    - Giữ nguyên renderLoading(container).
 *    - Giữ nguyên renderError(container, message).
 *    - Meta list xử lý đúng mọi loại group (ky-tai, tinh-hoa,
 *      triet-thuyet, the-loai).
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v6.0.1: Living Intelligence Expression.
 * - v7.0.0: Contemplative Renderer.
 *   - [NEW] Toast nội bộ (Bạch Ngọc style).
 *   - [NEW] Copy button cho từng meta item.
 *   - [NEW] Source label mapping (Việt hóa tên nguồn).
 *   - [NEW] Fallback khi DialogueEngine lỗi.
 *   - [NEW] Guard chống trùng lặp meta (cùng id).
 *   - [BỎ] Không còn bất kỳ hiển thị điểm nào.
 *
 * ==========================================================
 */

import { escapeHTML } from '../utils.js';
import { DialogueEngine } from './dialogue-engine.js';
import { Identity } from './identity.js';

// =====================================================================
// PHẦN 1: HẰNG SỐ & HELPER NỘI BỘ
// =====================================================================

/**
 * Bảng ánh xạ source key → nhãn hiển thị tiếng Việt.
 * Dùng để thay thế các key kỹ thuật (VD: 'master-pipeline')
 * bằng nhãn thân thiện (VD: 'Hội đồng chuyên gia').
 */
const SOURCE_LABELS = Object.freeze({
    // ---- Core ----
    'local-data':           'Dữ liệu cục bộ',
    'dictionary':           'Từ điển',
    'search-engine':        'Tìm kiếm',
    'agent-guided-search':  'Tìm kiếm gợi mở',
    'factoid':              'Tra cứu nhanh',
    'smart-recommendation': 'Gợi ý',

    // ---- AI Agents ----
    'analysis':        'Phân tích',
    'master-pipeline': 'Hội đồng chuyên gia',
    'character':       'Nhân vật',
    'comparison':      'So sánh',
    'history':         'Lịch sử',
    'knowledge':       'Tri thức',
    'literature':      'Văn học',
    'poetics':         'Thi pháp',
    'translation':     'Dịch thuật',
    'fortune':         'Vận khí',
    'khuc-tan-thuong': 'Khúc Tán Thưởng',
    'goi-mo':          'Lời Gợi Mở',

    // ---- Fallback ----
    'error': 'Chưa rõ',
    'unknown': 'Tri thức'
});

/**
 * SVG icon cho dot trạng thái (không emoji).
 */
const DOT_SVG = `<span class="ask-source-dot" aria-hidden="true"></span>`;

/**
 * SVG icon cho copy button (bút lông).
 */
const COPY_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;

/**
 * SVG icon cho toast success / error.
 */
const TOAST_ICONS = Object.freeze({
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
});

// =====================================================================
// PHẦN 2: HELPER — COPY & TOAST (tự chứa)
// =====================================================================

/**
 * Copy text vào clipboard, có fallback cho trình duyệt cũ.
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        document.body.appendChild(ta);
        try {
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            ok ? resolve() : reject(new Error('execCommand copy thất bại'));
        } catch (err) {
            document.body.removeChild(ta);
            reject(err);
        }
    });
}

/**
 * Hiển thị toast thông báo — Bạch Ngọc style, không emoji.
 *
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration - ms (mặc định 2200)
 */
function showLocalToast(message, type = 'success', duration = 2200) {
    // Container dùng chung
    let container = document.getElementById('vd-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'vd-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10001;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            align-items: center;
        `;
        document.body.appendChild(container);
    }

    const accentColor = type === 'error'
        ? 'var(--color-error, #c0392b)'
        : (type === 'info' ? 'var(--accent-gold, #c9a96e)' : 'var(--accent, #2e8b57)');

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #ffffff;
        color: var(--text-main, #112a20);
        font-family: var(--font-body, 'Times New Roman', serif);
        font-size: 0.95rem;
        font-style: italic;
        padding: 12px 22px;
        border-radius: 999px;
        border: 1px solid var(--border-color, rgba(46,139,87,0.25));
        border-left: 3px solid ${accentColor};
        box-shadow: 0 8px 25px rgba(26, 82, 50, 0.12);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        display: flex;
        align-items: center;
        gap: 10px;
        pointer-events: auto;
        max-width: 90vw;
    `;

    toast.innerHTML = `
        <span style="color:${accentColor};flex-shrink:0;">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// =====================================================================
// PHẦN 3: OUTPUT AI — BỘ RENDERER CHÍNH
// =====================================================================

export const OutputAI = {

    // =================================================================
    // 1. RENDER CHÍNH — Được gọi từ MasterAI.processQuery
    // =================================================================
    /**
     * Render kết quả AI vào container.
     *
     * @param {HTMLElement} container - Phần tử đích
     * @param {Object} result - Kết quả từ Agent
     *        { answer, detail, source, meta, ... }
     * @param {string} query - Câu hỏi gốc của người dùng
     */
    render(container, result, query) {
        if (!container) return;

        // -----------------------------------------------------------------
        // GUARD 1: result null/undefined
        // -----------------------------------------------------------------
        if (!result || typeof result !== 'object') {
            this.renderError(container, 'Agent không trả về kết quả.');
            return;
        }

        // -----------------------------------------------------------------
        // GUARD 2: result.answer rỗng — thử fallback sang commentary
        // -----------------------------------------------------------------
        let answerRaw = result.answer;
        if (!answerRaw || (typeof answerRaw === 'string' && !answerRaw.trim())) {
            answerRaw = result.commentary;
        }

        if (!answerRaw || (typeof answerRaw === 'string' && !answerRaw.trim())) {
            this._renderEmpty(container, query);
            return;
        }

        // -----------------------------------------------------------------
        // BƯỚC 1: Xử lý hội thoại qua DialogueEngine (có guard)
        // -----------------------------------------------------------------
        let dialogue = { intro: '', followUp: '', outro: '' };
        try {
            dialogue = DialogueEngine.processConversation(query || '', result);
        } catch (err) {
            console.warn('[OUTPUT-AI] DialogueEngine lỗi, dùng fallback:', err);
            dialogue = {
                intro: this._fallbackIntro(result.source),
                followUp: '',
                outro: this._fallbackOutro()
            };
        }

        // -----------------------------------------------------------------
        // BƯỚC 2: Nhãn nguồn (source label)
        // -----------------------------------------------------------------
        const sourceKey = String(result.source || 'unknown').toLowerCase().trim();
        const sourceLabel = SOURCE_LABELS[sourceKey] || result.source || 'Tri thức';

        // -----------------------------------------------------------------
        // BƯỚC 3: Format nội dung (HTML vs plain text)
        // -----------------------------------------------------------------
        const isHtml = /<[a-z][\s\S]*>/i.test(String(answerRaw));
        const formattedAnswer = isHtml
            ? String(answerRaw)
            : escapeHTML(answerRaw).replace(/\n/g, '<br>');

        const detailRaw = result.detail || '';
        const formattedDetail = detailRaw
            ? (isHtml ? String(detailRaw) : escapeHTML(detailRaw).replace(/\n/g, '<br>'))
            : '';

        // -----------------------------------------------------------------
        // BƯỚC 4: Meta list (cơ duyên gặp gỡ)
        // -----------------------------------------------------------------
        const metaListHtml = this._renderMetaList(result.meta);

        // -----------------------------------------------------------------
        // BƯỚC 5: Ghép HTML cuối cùng
        // -----------------------------------------------------------------
        container.innerHTML = `
            <div class="ask-result">
                <div class="ask-source">
                    ${DOT_SVG}
                    ${escapeHTML(sourceLabel)}
                </div>

                <div class="ask-query">Hỏi: "${escapeHTML(query || '')}"</div>

                ${dialogue.intro ? `<div class="ask-intro">${dialogue.intro}</div>` : ''}

                <div class="ask-answer">
                    ${formattedAnswer}
                </div>

                ${formattedDetail ? `
                    <div class="ask-detail-box">
                        <div class="ask-detail-label">Tiểu dẫn</div>
                        <div class="ask-detail-content">
                            ${formattedDetail}
                        </div>
                    </div>
                ` : ''}

                ${metaListHtml}

                ${dialogue.followUp || ''}

                ${dialogue.outro ? `<div class="ask-outro">${dialogue.outro}</div>` : ''}
            </div>
        `;

        // -----------------------------------------------------------------
        // BƯỚC 6: Gắn sự kiện cho các nút copy meta item
        // -----------------------------------------------------------------
        this._bindCopyButtons(container);
    },

    // =================================================================
    // 2. RENDER META LIST — Cơ duyên gặp gỡ
    // =================================================================
    /**
     * Render danh sách meta items (nút bấm dẫn đến thực thể).
     *
     * @private
     * @param {Array} meta - Mảng các thực thể { id, title, author, era, ... }
     * @returns {string} HTML
     */
    _renderMetaList(meta) {
        if (!Array.isArray(meta) || meta.length === 0) return '';

        // Lọc & chống trùng lặp
        const seen = new Set();
        const validMetas = [];

        for (const m of meta) {
            if (!m || !m.id) continue;
            if (!m.title && !m.name) continue;
            const key = String(m.id);
            if (seen.has(key)) continue;
            seen.add(key);
            validMetas.push(m);
        }

        if (validMetas.length === 0) return '';

        // Render từng item
        const itemsHtml = validMetas.map(m => {
            const title = m.title || m.name || m.id;
            const group = this._resolveMetaGroup(m);
            const subText = this._resolveMetaSubText(m);
            const safeId = escapeHTML(m.id);
            const safeTitle = escapeHTML(title);
            const safeGroup = escapeHTML(group);
            const safeAuthor = escapeHTML(m.author || '');

            return `
                <button type="button"
                        class="ask-meta-item"
                        data-route-encyclopedia="true"
                        data-route-id="${safeId}"
                        data-route-group="${safeGroup}"
                        data-route-title="${safeTitle}"
                        data-route-author="${safeAuthor}">
                    <span class="meta-title">${safeTitle}</span>
                    ${subText ? `<span class="meta-sub">${escapeHTML(subText)}</span>` : ''}
                </button>
            `;
        }).join('');

        return `
            <div class="ask-meta-wrapper">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                    <div class="ask-meta-title">Cơ duyên gặp gỡ (chạm để xem chi tiết)</div>
                    <button type="button"
                            class="output-ai-copy-all"
                            data-copy-all="true"
                            title="Chép toàn bộ danh sách"
                            style="
                                background: rgba(255,255,255,0.9);
                                border: 1px solid var(--border-color);
                                border-radius: var(--radius-sm);
                                padding: 4px 10px;
                                font-family: var(--font-body);
                                font-size: 0.72rem;
                                font-style: italic;
                                color: var(--text-muted);
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                gap: 4px;
                                opacity: 0;
                                transition: all 0.3s var(--ease-silk);
                            ">
                        ${COPY_SVG} Chép tất cả
                    </button>
                </div>
                <div class="ask-meta-list">
                    ${itemsHtml}
                </div>
            </div>
        `;
    },

    /**
     * Xác định group của meta item từ id.
     * @private
     */
    _resolveMetaGroup(m) {
        if (m._group) return String(m._group);

        const idStr = String(m.id || '');
        if (idStr.startsWith('tac-gia')) return 'ky-tai';
        if (idStr.startsWith('quyen')) return 'triet-thuyet';
        if (idStr.startsWith('the-loai')) return 'the-loai';
        return 'tinh-hoa';
    },

    /**
     * Xác định sub text (dòng phụ) cho meta item.
     * @private
     */
    _resolveMetaSubText(m) {
        if (m.author) return `Tác giả: ${m.author}`;
        if (m.era) return `Thời kỳ: ${m.era}`;
        if (m.nationality) return `Quốc tịch: ${m.nationality}`;
        return '';
    },

    // =================================================================
    // 3. BIND COPY BUTTONS
    // =================================================================
    /**
     * Gắn sự kiện cho các nút copy trong container.
     *
     * @private
     * @param {HTMLElement} container
     */
    _bindCopyButtons(container) {
        if (!container) return;

        // 3.1. Nút "Chép tất cả" (cho meta list)
        const copyAllBtn = container.querySelector('.output-ai-copy-all');
        if (copyAllBtn) {
            // Hiện nút khi hover wrapper (dùng CSS class nếu có, fallback inline)
            const wrapper = copyAllBtn.closest('.ask-meta-wrapper');
            if (wrapper) {
                wrapper.addEventListener('mouseenter', () => {
                    copyAllBtn.style.opacity = '1';
                });
                wrapper.addEventListener('mouseleave', () => {
                    copyAllBtn.style.opacity = '0';
                });
            }

            copyAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Thu thập toàn bộ meta items
                const items = container.querySelectorAll('.ask-meta-item');
                const lines = [];
                items.forEach(btn => {
                    const title = btn.querySelector('.meta-title')?.textContent || '';
                    const sub = btn.querySelector('.meta-sub')?.textContent || '';
                    if (title) {
                        lines.push(sub ? `- ${title} (${sub})` : `- ${title}`);
                    }
                });

                if (lines.length === 0) {
                    showLocalToast('Không có gì để chép.', 'info');
                    return;
                }

                const text = lines.join('\n');
                const originalHtml = copyAllBtn.innerHTML;

                copyToClipboard(text)
                    .then(() => {
                        copyAllBtn.innerHTML = `${COPY_SVG} Đã chép`;
                        copyAllBtn.style.color = 'var(--accent)';
                        copyAllBtn.style.borderColor = 'var(--accent)';
                        showLocalToast(`Đã chép ${lines.length} mục.`, 'success');

                        setTimeout(() => {
                            copyAllBtn.innerHTML = originalHtml;
                            copyAllBtn.style.color = '';
                            copyAllBtn.style.borderColor = '';
                        }, 1800);
                    })
                    .catch(() => {
                        showLocalToast('Trình duyệt từ chối sao chép.', 'error');
                    });
            });
        }
    },

    // =================================================================
    // 4. RENDER LOADING — Trạng thái đang xử lý
    // =================================================================
    /**
     * Hiển thị trạng thái đang tải — Bạch Ngọc style.
     *
     * @param {HTMLElement} container
     */
    renderLoading(container) {
        if (!container) return;

        const pronounsSelf = (Identity && Identity.pronouns && Identity.pronouns.self) || 'Ta';

        container.innerHTML = `
            <div class="ask-loading" style="padding: 40px 20px;">
                <div class="spinner"></div>
                <p style="
                    font-family: var(--font-body);
                    font-size: 1.05rem;
                    color: var(--text-muted);
                    font-style: italic;
                    margin-top: 20px;
                    text-align: center;
                    line-height: 1.7;
                ">
                    ${pronounsSelf} đang lắng nghe và chiêm nghiệm...
                </p>
            </div>
        `;
    },

    // =================================================================
    // 5. RENDER ERROR — Trạng thái lỗi
    // =================================================================
    /**
     * Hiển thị trạng thái lỗi — Bạch Ngọc style.
     *
     * @param {HTMLElement} container
     * @param {string} message - Thông điệp lỗi (kỹ thuật)
     */
    renderError(container, message) {
        if (!container) return;

        const humility = (Identity && Identity.philosophy && Identity.philosophy.humility)
            || 'Khiêm nhường trước văn chương làm nên phong thái.';

        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-source" style="background: rgba(163, 107, 107, 0.1); color: #a36b6b;">
                    <span class="ask-source-dot" style="background: #a36b6b; box-shadow: 0 0 0 2px rgba(163, 107, 107, 0.2);" aria-hidden="true"></span>
                    Cảnh báo
                </div>
                <div class="ask-answer" style="color: #a36b6b; font-style: italic;">
                    ${humility}
                </div>
                <div class="ask-detail-box" style="border-left-color: #a36b6b; background: rgba(163, 107, 107, 0.04);">
                    <div class="ask-detail-label" style="color: #a36b6b;">Chi tiết kỹ thuật</div>
                    <div class="ask-detail-content">
                        ${escapeHTML(message || 'Đã xảy ra lỗi không xác định.')}
                    </div>
                </div>
            </div>
        `;
    },

    // =================================================================
    // 6. RENDER EMPTY — Trạng thái rỗng (không có câu trả lời)
    // =================================================================
    /**
     * Hiển thị trạng thái "hư không" — khi không có câu trả lời.
     *
     * @private
     * @param {HTMLElement} container
     * @param {string} query
     */
    _renderEmpty(container, query) {
        if (!container) return;

        const pronounsUser = (Identity && Identity.pronouns && Identity.pronouns.user) || 'Bạn';

        container.innerHTML = `
            <div class="ask-result ask-error" style="border-left-color: var(--text-muted);">
                <div class="ask-source" style="background: rgba(74, 107, 93, 0.08); color: var(--text-muted);">
                    <span class="ask-source-dot" style="background: var(--text-muted); box-shadow: 0 0 0 2px rgba(74, 107, 93, 0.15);" aria-hidden="true"></span>
                    Hư không
                </div>
                <div class="ask-query">Hỏi: "${escapeHTML(query || '')}"</div>
                <div class="ask-answer" style="color: var(--text-muted); font-style: italic;">
                    Pháp giới bao la, duyên chưa tụ nên tri thức này hiện chưa hiển lộ.
                    Mong ${pronounsUser} lượng thứ.
                </div>
            </div>
        `;
    },

    // =================================================================
    // 7. FALLBACK INTRO / OUTRO (khi DialogueEngine lỗi)
    // =================================================================
    /**
     * Lời dẫn dự phòng (khi DialogueEngine không khả dụng).
     * @private
     */
    _fallbackIntro(source) {
        const pronounsSelf = (Identity && Identity.pronouns && Identity.pronouns.self) || 'Ta';
        const pronounsUser = (Identity && Identity.pronouns && Identity.pronouns.user) || 'Bạn';

        const intros = {
            'dictionary': `Ngôn từ là nhà của hiện hữu. Mời ${pronounsUser} cùng bóc tách:`,
            'analysis': `Đứng trước cái đẹp, ngôn từ đôi khi trở nên bất lực. Nhưng xin mượn lời:`,
            'master-pipeline': `Đứng trước một tác phẩm văn học, cái nhìn đơn chiều không bao giờ đủ. ${pronounsSelf} đã triệu tập các chuyên gia để cùng chiêm nghiệm:`,
            'default': `Càn khôn bao la, ${pronounsSelf} xin góp đôi lời về điều ${pronounsUser} hỏi:`
        };

        return intros[source] || intros['default'];
    },

    /**
     * Lời kết dự phòng (khi DialogueEngine không khả dụng).
     * @private
     */
    _fallbackOutro() {
        const philosophy = (Identity && Identity.philosophy) || {};
        const options = [
            philosophy.reasoning,
            philosophy.empathy,
            philosophy.humility,
            'Học để hiểu sâu hơn, không chỉ để biết nhiều hơn.',
            'Văn chương là tấm gương soi chiếu tâm hồn người đọc.'
        ].filter(Boolean);

        const picked = options[Math.floor(Math.random() * options.length)];
        return `— ${picked} —`;
    }
};

// =====================================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// =====================================================================
/**
 * SAU KHI DÙNG output-ai.js v7.0.0, BẠN CẦN:
 *
 * 1. CSS (trong css/components.css hoặc file tương đương):
 *    Thêm hover effect cho nút "Chép tất cả":
 *    .ask-meta-wrapper:hover .output-ai-copy-all {
 *        opacity: 1 !important;
 *    }
 *
 *    (Hiện tại code đã dùng JS mouseenter/mouseleave để hover,
 *    nhưng CSS sẽ tối ưu hơn nếu có.)
 *
 * 2. Không cần sửa gì ở các file khác:
 *    - master.js đã gọi OutputAI.render(container, result, query)
 *    - OutputAI tự xử lý mọi loại result.
 *
 * 3. Kiểm tra sau khi deploy:
 *    - Hỏi AI một câu → kiểm tra có hiển thị đúng không.
 *    - Nếu có meta list → hover vào wrapper → nút "Chép tất cả" hiện ra.
 *    - Bấm "Chép tất cả" → toast "Đã chép N mục." xuất hiện.
 *
 * 4. KHÔNG BAO GIỜ thêm hiển thị điểm số vào file này.
 *    Đó là tư duy của Prompt Evaluator, không phải Văn Đạo.
 *
 * 5. Triết lý cốt lõi:
 *    - Ta — Bạn
 *    - Không phán xét
 *    - Không chấm điểm
 *    - Chỉ chiêm nghiệm, gợi mở, tôn vinh
 */
