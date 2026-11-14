/**
 * ==========================================================
 * VĂN ĐẠO AI - OUTPUT AI (js/ai/output-ai.js)
 * Vị trí: js/ai/output-ai.js
 * Version: 6.0.1 (Living Intelligence Expression)
 * ==========================================================
 * TRIẾT LÝ:
 * - Không chỉ hiển thị dữ liệu, mà biểu đạt nó với phong thái Nho - Đạo - Phật.
 * - Sử dụng DialogueEngine để tạo lời dẫn (Intro) và câu hỏi gợi mở (Socratic).
 * - Tự động nhận diện HTML để render đúng cách (không bị lỗi khi Agent trả về thẻ <b>, <i>).
 * ==========================================================
 */

import { escapeHTML } from '../utils.js';
import { DialogueEngine } from './dialogue-engine.js';
import { Identity } from './identity.js';

export const OutputAI = {
    render(container, result, query) {
        if (!container) return;

        // 1. Xử lý khi không có câu trả lời
        if (!result || !result.answer) {
            container.innerHTML = `
                <div class="ask-result ask-error">
                    <div class="ask-source">
                        <span class="ask-source-dot" style="background: #a36b6b; box-shadow: 0 0 0 2px rgba(163, 107, 107, 0.2);"></span>
                        Hư không
                    </div>
                    <div class="ask-query">Hỏi: "${escapeHTML(query)}"</div>
                    <div class="ask-answer" style="color: var(--text-muted); font-style: italic;">
                        Pháp giới bao la, duyên chưa tụ nên tri thức này hiện chưa hiển lộ. Mong ${Identity.pronouns.user} lượng thứ.
                    </div>
                </div>
            `;
            return;
        }

        // 2. Gọi Dialogue Engine để lấy linh hồn của câu trả lời
        const dialogue = DialogueEngine.processConversation(query, result);

        // 3. Xây dựng Meta List (Cơ duyên gặp gỡ)
        let metaList = '';
        if (result.meta && Array.isArray(result.meta) && result.meta.length > 0) {
            const validMetas = result.meta.filter(m => m && m.id && (m.title || m.name));
            if (validMetas.length > 0) {
                metaList = `
                    <div class="ask-meta-wrapper">
                        <div class="ask-meta-title">Cơ duyên gặp gỡ (Chạm để xem chi tiết)</div>
                        <div class="ask-meta-list">
                            ${validMetas.map(m => {
                                const title = m.title || m.name || m.id;
                                let group = m._group || 'tinh-hoa';
                                
                                // [ĐÃ SỬA LỖI] Ép kiểu String() trước khi dùng .startsWith()
                                if (String(m.id).startsWith('tac-gia')) group = 'ky-tai';
                                else if (String(m.id).startsWith('quyen')) group = 'triet-thuyet';
                                else if (String(m.id).startsWith('the-loai')) group = 'the-loai';

                                const subText = m.author ? `Tác giả: ${m.author}` : (m.era ? `Thời kỳ: ${m.era}` : '');

                                return `
                                    <button type="button" class="ask-meta-item"
                                        data-route-encyclopedia="true"
                                        data-route-id="${escapeHTML(m.id)}"
                                        data-route-group="${escapeHTML(group)}"
                                        data-route-title="${escapeHTML(title)}"
                                        data-route-author="${escapeHTML(m.author || '')}">
                                        <span class="meta-title">${escapeHTML(title)}</span>
                                        ${subText ? `<span class="meta-sub">${escapeHTML(subText)}</span>` : ''}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }

        // 4. Định dạng nội dung (Hỗ trợ HTML)
        const isHtml = /<[a-z][\s\S]*>/i.test(result.answer);
        const formattedAnswer = isHtml ? result.answer : result.answer.replace(/\n/g, '<br>');
        
        const formattedDetail = result.detail 
            ? (isHtml ? result.detail : result.detail.replace(/\n/g, '<br>')) 
            : '';

        // 5. Render HTML cuối cùng
        container.innerHTML = `
            <div class="ask-result">
                <div class="ask-source">
                    <span class="ask-source-dot"></span>
                    ${escapeHTML(result.source || 'Tri thức')}
                </div>
                
                <div class="ask-query">Hỏi: "${escapeHTML(query)}"</div>
                
                <div class="ask-intro">
                    ${dialogue.intro}
                </div>
                
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
                
                ${metaList}

                ${dialogue.followUp}

                <div class="ask-outro">
                    ${dialogue.outro}
                </div>
            </div>
        `;
    },

    renderLoading(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="ask-loading" style="padding: 40px 20px;">
                <div class="spinner"></div>
                <p style="font-family: var(--font-body); font-size: 1.1rem; color: var(--text-muted); font-style: italic; margin-top: 20px;">
                    ${Identity.pronouns.self} đang lắng nghe và chiêm nghiệm...
                </p>
            </div>
        `;
    },

    renderError(container, message) {
        if (!container) return;
        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-source" style="background: rgba(163, 107, 107, 0.1); color: #a36b6b;">
                    <span class="ask-source-dot" style="background: #a36b6b;"></span>
                    Cảnh báo
                </div>
                <div class="ask-answer" style="color: #a36b6b;">
                    ${Identity.philosophy.humility}
                </div>
                <div class="ask-detail" style="border-top-color: rgba(163, 107, 107, 0.3);">
                    Chi tiết kỹ thuật: ${escapeHTML(message)}
                </div>
            </div>
        `;
    }
};
