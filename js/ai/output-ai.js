/**
 * ==========================================================
 * VĂN ĐẠO AI - OUTPUT AI (js/ai/output-ai.js)
 * Vị trí: js/ai/output-ai.js
 * Version: 3.2.0 (Thiền Vị & Nho Phong - History Edition)
 * ==========================================================
 * CHỨC NĂNG:
 * - Định dạng kết quả từ Master AI thành HTML hiển thị.
 * - Khoác lên câu trả lời phong thái "Văn Đạo": Trang trọng, từ bi, trí thức.
 * - Tự động tạo "Lời dẫn" phù hợp với ngữ cảnh (Đặc biệt là Lịch sử).
 * ==========================================================
 */

import { escapeHTML } from '../utils.js';

// =====================================================================
// KHO TÀNG NGÔN TỪ (Lời dẫn & Kết luận)
// =====================================================================
const PHRASES = {
    intro: [
        "Đạo là nước, tri thức là thuyền. Mời bạn bước lên chuyến đò tri thức này:",
        "Nhân duyên đưa đẩy, mời bạn cùng ta mở cuốn sách này ra:",
        "Văn dĩ tải đạo. Mỗi câu chữ đều chuyên chở một tầng nghĩa. Đây là những gì ta tìm thấy:"
    ],
    introAuthor: [
        "Thi nhân là người thắp đuốc giữa đêm trường. Về tác giả này, ta có đôi lời:",
        "Văn như kỳ nhân. Để hiểu tác phẩm, ta phải tìm về cội nguồn của sự sáng tạo:",
        "Mỗi tác giả là một vì sao trên bầu trời văn học. Đây là ánh sáng của riêng họ:"
    ],
    introWork: [
        "Văn chương là tấm gương phản chiếu hồn người. Về tác phẩm này:",
        "Nhất thủ hảo thi, thiên cổ truyền tụng. Một áng văn hay muôn đời còn mãi:"
    ],
    introPoetics: [
        "Thi trung hữu họa, thi trung hữu nhạc. Hình ảnh trong thơ là những ẩn ngữ của tâm hồn:",
        "Một chữ đắt giá hơn ngàn vàng. Đằng sau những hình ảnh thơ là cả một tầng văn hóa:"
    ],
    // [MỚI] Lời dẫn cho Lịch sử
    introHistory: [
        "Dòng thời gian miên viễn, mỗi tác phẩm là một dấu son của thời đại. Nhìn lại quá khứ, ta thấy:",
        "Lịch sử là tấm gương soi rọi hiện tại. Về bối cảnh này, cổ nhân có ghi chép rằng:",
        "Thời gian trôi qua như nước chảy, nhưng dấu vết của tiền nhân vẫn còn in đậm. Đây là những gì ta tìm thấy:"
    ],
    outro: [
        "Học rộng để có nhiều chân trời, học sâu để thấu bản chất.",
        "Trí tuệ là ngọn đèn soi rọi bóng đêm vô minh.",
        "Tri thức là hạt giống của hạnh phúc. Chúc bạn gieo được nhiều quả ngọt.",
        "Tĩnh lặng là cội nguồn của mọi sáng tạo tinh thần."
    ],
    error: [
        "Pháp giới bao la, duyên chưa tụ nên tri thức này hiện chưa hiển lộ. Mong bạn lượng thứ.",
        "Vạn vật đều vô thường, đôi khi dữ liệu chưa đủ duyên để ta tìm thấy. Hãy thử một hướng khác nhé."
    ]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getIntroBySource = (source) => {
    if (!source) return getRandom(PHRASES.intro);
    const s = source.toLowerCase();
    if (s.includes('history')) return getRandom(PHRASES.introHistory); // [MỚI]
    if (s.includes('knowledge') || s.includes('author')) return getRandom(PHRASES.introAuthor);
    if (s.includes('literature') || s.includes('data')) return getRandom(PHRASES.introWork);
    if (s.includes('dictionary') || s.includes('poetics')) return getRandom(PHRASES.introPoetics);
    return getRandom(PHRASES.intro);
};

// =====================================================================
// HÀM RENDER CHÍNH
// =====================================================================
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
                    <div class="ask-meta-wrapper">
                        <div class="ask-meta-title">Cơ duyên gặp gỡ (Chạm để xem chi tiết)</div>
                        <div class="ask-meta-list">
                            ${validMetas.map(m => {
                                const title = m.title || m.name || m.id;
                                let group = m._group || 'tinh-hoa';
                                if (m.id.startsWith('tac-gia')) group = 'ky-tai';
                                else if (m.id.startsWith('quyen')) group = 'triet-thuyet';
                                else if (m.id.startsWith('the-loai')) group = 'the-loai';

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

        // 3. Xác định nhãn Nguồn tri thức
        const sourceLabels = {
            'local-data': 'Nội bộ Văn Đạo',
            'dictionary': 'Từ điển Thi pháp',
            'search-engine': 'Cỗ máy Tìm kiếm',
            'analysis': 'Thiền ý Phân tích',
            'knowledge': 'Mạng lưới Tri thức',
            'history': 'Dòng thời gian Lịch sử', // [MỚI]
            'master': 'Hệ thống Điều phối',
            'error': 'Cảnh báo'
        };
        const sourceLabel = sourceLabels[result.source] || result.source || 'Vô danh';

        // 4. Tạo Lời dẫn (Intro) và Lời kết (Outro)
        const introText = getIntroBySource(result.source);
        const outroText = getRandom(PHRASES.outro);

        // 5. Định dạng lại nội dung
        const formattedAnswer = result.answer.replace(/\n/g, '<br>');
        const formattedDetail = result.detail ? result.detail.replace(/\n/g, '<br>') : '';

        // 6. Render HTML cuối cùng (Sử dụng Class CSS mới)
        container.innerHTML = `
            <div class="ask-result">
                
                <div class="ask-source">
                    <span class="ask-source-dot"></span>
                    ${escapeHTML(sourceLabel)}
                </div>
                
                <div class="ask-query">Hỏi: "${escapeHTML(query)}"</div>
                
                <div class="ask-intro">
                    ${introText}
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

                <div class="ask-outro">
                    — ${outroText} —
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
                    Đạo đang kết nối nhân duyên tri thức...
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
                    ${getRandom(PHRASES.error)}
                </div>
                <div class="ask-detail" style="border-top-color: rgba(163, 107, 107, 0.3);">
                    Chi tiết kỹ thuật: ${escapeHTML(message)}
                </div>
            </div>
        `;
    }
};
