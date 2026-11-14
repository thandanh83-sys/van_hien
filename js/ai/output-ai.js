/**
 * ==========================================================
 * VĂN ĐẠO AI - OUTPUT AI (js/ai/output-ai.js)
 * Vị trí: js/ai/output-ai.js
 * Version: 4.2.0 (Soul Edition & Smart Rendering)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * 1. Ngôn từ có hồn: Lời dẫn (Intro) và Lời kết (Outro) được chia theo
 *    ngữ cảnh (Tác giả, Tác phẩm, Thi pháp, Lịch sử) với giọng văn
 *    Nho - Đạo - Phật, tao nhã và sâu sắc.
 * 2. Trực quan: Tự động phát hiện nếu câu trả lời chứa HTML (như từ
 *    AnalysisAgent) để render đúng cách, không bị lỗi hiển thị.
 * 3. Kết nối: Hiển thị lại các thẻ Meta (Cơ duyên gặp gỡ) để người
 *    dùng có thể click chuyển thẳng đến Bách Khoa để đọc tiếp.
 * ==========================================================
 */

import { escapeHTML } from '../utils.js';

// =====================================================================
// KHO TÀNG NGÔN TỪ (Lời dẫn & Kết luận) - ĐA DẠNG NGỮ CẢNH
// =====================================================================
const PHRASES = {
    intro: [
        "Càn khôn bao la, tri thức là hạt cát. Mời bạn cùng ta mở cuốn sách này:",
        "Có những câu hỏi không cần câu trả lời tuyệt đối, chỉ cần một tia sáng để tự thấu hiểu. Đây là những gì ta tìm thấy:",
        "Văn dĩ tải đạo. Mỗi câu chữ đều là một nhịp thở của tiền nhân. Mời bạn chiêm nghiệm:",
        "Nhân duyên đưa đẩy, mời bạn cùng ta lật mở trang sách này:"
    ],
    introAuthor: [
        "Thi nhân là người thắp đuốc giữa đêm trường. Về tác giả này, cổ nhân có ghi chép rằng:",
        "Văn như kỳ nhân. Để hiểu tác phẩm, ta phải tìm về cội nguồn của sự sáng tạo. Đôi dòng về tác giả:",
        "Mỗi tác giả là một vì sao trên bầu trời văn học. Đây là ánh sáng của riêng họ:",
        "Hồ sơ của một con người cũng chính là hồ sơ của một thời đại. Mời bạn xem qua:"
    ],
    introWork: [
        "Một áng văn hay tựa như dòng suối mát, gột rửa bụi trần. Về tác phẩm này:",
        "Nhất thủ hảo thi, thiên cổ truyền tụng. Một tác phẩm chạm đến triệu trái tim:",
        "Đứng trước cái đẹp, ngôn từ đôi khi trở nên bất lực. Nhưng xin mượn lời để giãi bày:",
        "Tác phẩm không chỉ phản ánh hiện thực mà còn là ngọn đuốc soi đường. Đây là những tầng nghĩa:"
    ],
    introPoetics: [
        "Thi trung hữu họa, thi trung hữu nhạc. Hình ảnh trong thơ là những ẩn ngữ của tâm hồn:",
        "Một chữ đắt giá hơn ngàn vàng. Đằng sau những hình ảnh thơ là cả một tầng văn hóa:",
        "Ngôn ngữ là nhà của hiện hữu. Cùng bóc tách những lớp nghĩa sâu kín:",
        "Thi pháp không phải là khuôn vàng thước ngọc, mà là nghệ thuật chạm khắc tâm hồn:"
    ],
    introHistory: [
        "Dòng thời gian miên viễn, mỗi tác phẩm là một dấu son của thời đại. Nhìn lại quá khứ, ta thấy:",
        "Lịch sử là tấm gương soi rọi hiện tại. Về bối cảnh này, cổ nhân có ghi chép rằng:",
        "Thời gian trôi qua như nước chảy, nhưng dấu vết của tiền nhân vẫn còn in đậm. Đây là những gì ta tìm thấy:"
    ],
    outro: [
        "Học rộng để có nhiều chân trời, học sâu để thấu bản chất.",
        "Tri thức là hạt giống của hạnh phúc. Chúc bạn gieo được nhiều quả ngọt.",
        "Tĩnh lặng là cội nguồn của mọi sáng tạo tinh thần.",
        "Vạn sự tùy duyên, nhưng tri thức thì phải do chính mình cầu lấy."
    ],
    error: [
        "Pháp giới bao la, duyên chưa tụ nên tri thức này hiện chưa hiển lộ. Mong bạn lượng thứ.",
        "Vạn vật đều vô thường, đôi khi dữ liệu chưa đủ duyên để ta tìm thấy. Hãy thử một hướng khác nhé."
    ]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Chọn lời dẫn thông minh dựa vào Nguồn (Source) của dữ liệu
const getIntroBySource = (source) => {
    if (!source) return getRandom(PHRASES.intro);
    const s = source.toLowerCase();
    if (s.includes('history')) return getRandom(PHRASES.introHistory); 
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
            const validMetas = result.meta.filter(m => m && m.id && (m.title || m.name));
            
            if (validMetas.length > 0) {
                metaList = `
                    <div class="ask-meta-wrapper">
                        <div class="ask-meta-title">Cơ duyên gặp gỡ (Chạm để xem chi tiết)</div>
                        <div class="ask-meta-list">
                            ${validMetas.map(m => {
                                const title = m.title || m.name || m.id;
                                let group = m._group || 'tinh-hoa';
                                // Đoán group nếu thiếu
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
            'history': 'Dòng thời gian Lịch sử',
            'master': 'Hệ thống Điều phối',
            'translation': 'Chuyển ngữ',
            'character': 'Nhân vật',
            'comparison': 'Đối chiếu',
            'error': 'Cảnh báo'
        };
        const sourceLabel = sourceLabels[result.source] || result.source || 'Vô danh';

        // 4. Tạo Lời dẫn (Intro) và Lời kết (Outro)
        const introText = getIntroBySource(result.source);
        const outroText = getRandom(PHRASES.outro);

        // 5. Định dạng lại nội dung (Hỗ trợ HTML nếu có)
        // Nếu answer chứa thẻ HTML (như <div>, <strong>, <i>), ta giữ nguyên.
        // Nếu là văn bản thuần, ta thay \n bằng <br>.
        const isHtml = /<[a-z][\s\S]*>/i.test(result.answer);
        const formattedAnswer = isHtml ? result.answer : result.answer.replace(/\n/g, '<br>');
        
        const formattedDetail = result.detail 
            ? (isHtml ? result.detail : result.detail.replace(/\n/g, '<br>')) 
            : '';

        // 6. Render HTML cuối cùng
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
