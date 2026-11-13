/**
 * ==========================================================
 * VĂN ĐẠO AI - OUTPUT AI (js/ai/output-ai.js)
 * Vị trí: js/ai/output-ai.js
 * Version: 2.0.0 (Thiền Vị & Nho Phong)
 * ==========================================================
 * CHỨC NĂNG:
 * - Định dạng kết quả từ Master AI thành HTML hiển thị.
 * - Khoác lên câu trả lời phong thái "Văn Đạo": Trang trọng, từ bi (Phật),
 *   và đậm chất trí thức/quân tử (Nho).
 * - Tự động tạo "Lời dẫn" (Intro) phù hợp với ngữ cảnh câu hỏi.
 * - Render danh sách các mục liên quan (Meta) thành các nút bấm tinh tế.
 * ==========================================================
 */

import { escapeHTML } from '../utils.js';

// =====================================================================
// KHO TÀNG NGÔN TỪ (Lời dẫn & Kết luận mang âm hưởng Nho - Phật)
// =====================================================================
const PHRASES = {
    // Lời dẫn chung
    intro: [
        "Đạo là nước, tri thức là thuyền. Mời bạn bước lên chuyến đò tri thức này:",
        "Nhân duyên đưa đẩy, mời bạn cùng ta mở cuốn sách này ra:",
        "Văn dĩ tải đạo. Mỗi câu chữ đều chuyên chở một tầng nghĩa. Đây là những gì ta tìm thấy:",
        "Nhất tự thiên kim. Sự học là con đường sáng. Ta xin dâng lên bạn những tri thức sau:",
        "Vạn pháp tùy duyên. Bạn đã hỏi, ta xin đáp lời bằng tất cả tấm lòng:"
    ],
    // Lời dẫn khi hỏi về tác giả
    introAuthor: [
        "Thi nhân là người thắp đuốc giữa đêm trường. Về tác giả này, ta có đôi lời:",
        "Văn như kỳ nhân. Để hiểu tác phẩm, ta phải tìm về cội nguồn của sự sáng tạo:",
        "Mỗi tác giả là một vì sao trên bầu trời văn học. Đây là ánh sáng của riêng họ:"
    ],
    // Lời dẫn khi hỏi về tác phẩm
    introWork: [
        "Văn chương là tấm gương phản chiếu hồn người. Về tác phẩm này:",
        "Nhất thủ hảo thi, thiên cổ truyền tụng. Một áng văn hay muôn đời còn mãi:",
        "Đọc một cuốn sách hay như trò chuyện với người xưa. Về tác phẩm này:"
    ],
    // Lời dẫn khi hỏi về biểu tượng/thi pháp
    introPoetics: [
        "Thi trung hữu họa, thi trung hữu nhạc. Hình ảnh trong thơ là những ẩn ngữ của tâm hồn:",
        "Một chữ đắt giá hơn ngàn vàng. Đằng sau những hình ảnh thơ là cả một tầng văn hóa:",
        "Biểu tượng là cầu nối giữa hữu hình và vô hình. Đây là ý nghĩa của hình tượng bạn hỏi:"
    ],
    // Lời kết chung
    outro: [
        "Học rộng để có nhiều chân trời, học sâu để thấu bản chất.",
        "Trí tuệ là ngọn đèn soi rọi bóng đêm vô minh.",
        "Tri thức là hạt giống của hạnh phúc. Chúc bạn gieo được nhiều quả ngọt.",
        "Biển học mênh mông, lấy sự khiêm nhường làm bến bờ.",
        "Nhất tâm bất loạn, vạn sự tùy duyên. Chúc bạn an nhiên trên con đường học đạo.",
        "Tĩnh lặng là cội nguồn của mọi sáng tạo tinh thần."
    ],
    // Thông báo lỗi (Mang tính từ bi, tránh làm người dùng hoang mang)
    error: [
        "Pháp giới bao la, duyên chưa tụ nên tri thức này hiện chưa hiển lộ. Mong bạn lượng thứ.",
        "Vạn vật đều vô thường, đôi khi dữ liệu chưa đủ duyên để ta tìm thấy. Hãy thử một hướng khác nhé.",
        "Trong cái rủi lại có cái may. Dữ liệu này chưa có, nhưng ta luôn sẵn lòng tìm hiểu cùng bạn."
    ]
};

// Hàm chọn ngẫu nhiên một câu trong mảng
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Hàm xác định loại "Lời dẫn" dựa trên Source của Agent
const getIntroBySource = (source) => {
    if (!source) return getRandom(PHRASES.intro);
    const s = source.toLowerCase();
    if (s.includes('knowledge') || s.includes('author')) return getRandom(PHRASES.introAuthor);
    if (s.includes('literature') || s.includes('data')) return getRandom(PHRASES.introWork);
    if (s.includes('dictionary') || s.includes('poetics')) return getRandom(PHRASES.introPoetics);
    return getRandom(PHRASES.intro);
};

// =====================================================================
// HÀM RENDER CHÍNH
// =====================================================================
export const OutputAI = {
    /**
     * Render câu trả lời ra màn hình với phong thái Văn Đạo
     * 
     * @param {HTMLElement} container - Khung chứa kết quả
     * @param {Object} result - Dữ liệu từ Master AI { answer, detail, source, meta }
     * @param {string} query - Câu hỏi gốc của người dùng
     */
    render(container, result, query) {
        if (!container) return;

        // 1. Xử lý khi không có câu trả lời (Lỗi hoặc Không tìm thấy)
        if (!result || !result.answer) {
            container.innerHTML = `
                <div class="ask-result ask-error">
                    <div class="ask-source">
                        <span class="ask-source-dot" style="background: #a36b6b; box-shadow: 0 0 0 2px rgba(163, 107, 107, 0.2);"></span>
                        Hư không
                    </div>
                    <div class="ask-query">Hỏi: "${escapeHTML(query)}"</div>
                    <div class="ask-answer" style="color: var(--text-muted); font-style: italic;">
                        ${getRandom(PHRASES.error)}
                    </div>
                </div>
            `;
            return;
        }

        // 2. Xây dựng danh sách Meta (Các tác phẩm/tác giả liên quan)
        let metaList = '';
        if (result.meta && Array.isArray(result.meta) && result.meta.length > 0) {
            const validMetas = result.meta.filter(m => m.id && (m.title || m.name));
            
            if (validMetas.length > 0) {
                metaList = `
                    <div class="ask-meta-wrapper" style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed rgba(139, 184, 168, 0.3);">
                        <div style="font-family: var(--font-body); font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.1em;">
                            Cơ duyên gặp gỡ (Chạm để xem chi tiết)
                        </div>
                        <div class="ask-meta-list" style="border: none; padding: 0;">
                            ${validMetas.map(m => {
                                const title = m.title || m.name || m.id;
                                // Xác định group (Dựa vào tiền tố ID hoặc trường _group)
                                let group = m._group || 'tinh-hoa';
                                if (m.id.startsWith('tac-gia')) group = 'ky-tai';
                                else if (m.id.startsWith('quyen')) group = 'triet-thuyet';
                                else if (m.id.startsWith('the-loai')) group = 'the-loai';

                                // Lấy thông tin phụ (Tác giả hoặc Thời đại)
                                const subText = m.author ? `Tác giả: ${m.author}` : (m.era ? `Thời kỳ: ${m.era}` : '');

                                return `
                                    <button type="button" class="ask-meta-item"
                                        data-route-encyclopedia="true"
                                        data-route-id="${escapeHTML(m.id)}"
                                        data-route-group="${escapeHTML(group)}"
                                        data-route-title="${escapeHTML(title)}"
                                        data-route-author="${escapeHTML(m.author || '')}">
                                        <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
                                            <span style="font-weight: 700; font-size: 0.9rem; color: var(--accent-text);">${escapeHTML(title)}</span>
                                            ${subText ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">${escapeHTML(subText)}</span>` : ''}
                                        </div>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }

        // 3. Xác định nhãn Nguồn tri thức (Source Label)
        const sourceLabels = {
            'local-data': 'Nội bộ Văn Đạo',
            'dictionary': 'Từ điển Thi pháp',
            'search-engine': 'Cỗ máy Tìm kiếm',
            'analysis': 'Thiền ý Phân tích',
            'knowledge': 'Mạng lưới Tri thức',
            'master': 'Hệ thống Điều phối',
            'error': 'Cảnh báo'
        };
        const sourceLabel = sourceLabels[result.source] || result.source || 'Vô danh';

        // 4. Tạo Lời dẫn (Intro) và Lời kết (Outro) dựa trên Source
        const introText = getIntroBySource(result.source);
        const outroText = getRandom(PHRASES.outro);

        // 5. Định dạng lại nội dung (Nếu có thẻ HTML hoặc xuống dòng)
        const formattedAnswer = result.answer.replace(/\n/g, '<br>');
        const formattedDetail = result.detail ? result.detail.replace(/\n/g, '<br>') : '';

        // 6. Render HTML cuối cùng
        container.innerHTML = `
            <div class="ask-result" style="animation: fadeInContent 0.6s var(--ease-silk) forwards;">
                
                <!-- Nhãn nguồn tri thức -->
                <div class="ask-source">
                    <span class="ask-source-dot"></span>
                    ${escapeHTML(sourceLabel)}
                </div>
                
                <!-- Câu hỏi của người dùng -->
                <div class="ask-query">Hỏi: "${escapeHTML(query)}"</div>
                
                <!-- Lời dẫn (Nho/Phật phong) -->
                <div style="font-family: var(--font-body); font-size: 0.9rem; color: var(--accent-text); font-style: italic; margin-bottom: 12px; opacity: 0.9;">
                    ${introText}
                </div>
                
                <!-- Câu trả lời chính -->
                <div class="ask-answer" style="font-size: 1.25rem; line-height: 1.8; color: var(--text-main);">
                    ${formattedAnswer}
                </div>
                
                <!-- Chi tiết bổ sung (Lời bình/Tiểu dẫn) -->
                ${formattedDetail ? `
                <div class="ask-detail" style="background: rgba(139, 184, 168, 0.05); padding: 15px 20px; border-radius: 8px; border-left: 2px solid var(--accent); margin-top: 16px;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; font-weight: 700; letter-spacing: 0.05em;">Tiểu dẫn</div>
                    <div style="font-family: var(--font-body); font-size: 1rem; color: var(--text-muted); line-height: 1.6;">
                        ${formattedDetail}
                    </div>
                </div>
                ` : ''}
                
                <!-- Danh sách Meta (Tác phẩm/Tác giả liên quan) -->
                ${metaList}

                <!-- Lời kết (Nho/Phật phong) -->
                <div style="margin-top: 24px; text-align: right; font-family: var(--font-calligraphy); font-size: 1.5rem; color: var(--accent-gold); opacity: 0.8;">
                    — ${outroText} —
                </div>
                
            </div>
        `;
    },

    /**
     * Hiển thị trạng thái đang tải (Loading) với ngôn từ thiền vị
     */
    renderLoading(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="ask-loading" style="padding: 40px 20px;">
                <div class="spinner"></div>
                <p style="font-family: var(--font-body); font-size: 1.1rem; color: var(--text-muted); font-style: italic; margin-top: 20px;">
                    Đạo đang kết nối nhân duyên tri thức...
                </p>
            </div>
        `;
    },

    /**
     * Hiển thị lỗi (Đã được xử lý ở hàm render chính, nhưng giữ lại để tương thích)
     */
    renderError(container, message) {
        if (!container) return;
        container.innerHTML = `
            <div class="ask-result ask-error">
                <div class="ask-source" style="background: rgba(163, 107, 107, 0.1); color: #a36b6b;">
                    <span class="ask-source-dot" style="background: #a36b6b;"></span>
                    Cảnh báo
                </div>
                <div class="ask-answer" style="color: #a36b6b;">
                    ${getRandom(PHRASES.error)}
                </div>
                <div class="ask-detail" style="border-top-color: rgba(163, 107, 107, 0.3);">
                    Chi tiết kỹ thuật: ${escapeHTML(message)}
                </div>
            </div>
        `;
    }
};
