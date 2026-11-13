/**
 * ==========================================================
 * VĂN ĐẠO - AI ENGINE (js/ai.js)
 * Đã sửa: Logic tách Nên/Tránh bằng Regex chính xác 100%.
 * ==========================================================
 */

import { APP_DATA } from './config.js';
import { findSymbols } from './render.js';

// 1. TÍNH TOÁN VẬN KHÍ DỰA TRÊN MẠNG LƯỚI TRI THỨC
export function calculateFortune(work) {
    const author = (work.author || '').toLowerCase();
    const era = (work.era || '').toLowerCase();
    const genres = (work.the_loai || []).join(' ').toLowerCase();

    // Luật 1: Tác giả (Ưu tiên cao nhất)
    if (author.includes('hồ chí minh') || author.includes('tố hữu') || author.includes('chính hữu') || author.includes('phạm tiến duật')) {
        return 'dai-cat'; 
    }
    if (author.includes('nguyễn trãi') || author.includes('lý thường kiệt') || author.includes('trần quốc tuấn')) {
        return 'dai-cat'; 
    }
    if (author.includes('hồ xuân hương') || author.includes('nguyễn du') || author.includes('nam cao') || author.includes('vũ trọng phụng')) {
        return Math.random() > 0.3 ? 'tieu-hung' : 'binh-hoa'; 
    }

    // Luật 2: Thời đại
    if (era.includes('kháng chiến') || era.includes('194') || era.includes('195') || era.includes('196') || era.includes('197')) {
        return Math.random() > 0.4 ? 'trung-cat' : 'tieu-hung';
    }
    if (era.includes('tk 19') || era.includes('tk 18') || era.includes('trung đại') || era.includes('nhà')) {
        return Math.random() > 0.5 ? 'binh-hoa' : 'trung-cat';
    }

    // Luật 3: Thể loại
    if (genres.includes('truyện ngắn') || genres.includes('tiểu thuyết') || genres.includes('bi kịch')) {
        return Math.random() > 0.5 ? 'tieu-cat' : 'binh-hoa';
    }
    if (genres.includes('thơ đường luật') || genres.includes('thơ mới') || genres.includes('lục bát')) {
        return Math.random() > 0.4 ? 'trung-cat' : 'binh-hoa';
    }

    // Luật 4: Random cho các trường hợp còn lại
    const random = Math.random();
    if (random < 0.15) return 'dai-cat';
    if (random < 0.4) return 'trung-cat';
    if (random < 0.7) return 'tieu-cat';
    if (random < 0.9) return 'binh-hoa';
    return 'tieu-hung';
}

// 2. PHÂN TÍCH BIỂU TƯỢNG ĐỂ TẠO CÂU DẪN
export function generateBridgeText(work, fortuneKey) {
    const title = work.title;
    const author = work.author;
    
    const textToScan = `${work.title} ${work.desc || ''}`;
    const symbols = findSymbols(textToScan); 
    const mainSymbol = symbols.length > 0 ? symbols[0].keyword : null;

    const bridgeTemplates = {
        'dai-cat': `Vận khí hôm nay rực rỡ như nắng xuân. Duyên lành đưa bạn đến với "${title}" của ${author} để tiếp thêm dũng khí cho những dự định lớn lao.`,
        'trung-cat': `Mọi sự đang trên đà hanh thông. Tác phẩm "${title}" của ${author} như một làn gió mát, cổ vũ nhẹ nhàng cho những nỗ lực bền bỉ của bạn.`,
        'tieu-cat': `Một chút an yên ghé thăm tâm hồn. Hãy để "${title}" của ${author} mang đến cho bạn những phút giây thư thái, tĩnh tại giữa nhịp sống hối hả.`,
        'binh-hoa': `Ngày hôm nay như mặt hồ phẳng lặng. Thật hợp để bạn tĩnh tâm cùng "${title}" của ${author} và chiêm nghiệm về những giá trị bình dị mà sâu sắc.`,
        'tieu-hung': `Dẫu có chút gợn sóng trên mặt hồ tâm trí, nhưng "${title}" của ${author} sẽ là người bạn đồng hành, nhắc bạn giữ sự điềm tĩnh và nhìn sâu vào bên trong.`,
        'dai-hung': `Trang đời hôm nay có chút bão giông. Hãy để "${title}" của ${author} làm chỗ dựa tinh thần, nhắc bạn rằng nghịch cảnh chính là chất liệu tôi luyện nên bản lĩnh.`
    };

    let baseText = bridgeTemplates[fortuneKey] || bridgeTemplates['binh-hoa'];

    if (mainSymbol) {
        baseText += ` Hình ảnh "${mainSymbol}" xuất hiện như một nốt trầm, gợi mở những tầng nghĩa sâu kín về nhân sinh.`;
    }

    return baseText;
}

// 3. TỔNG HỢP LỜI BÌNH & LỜI KHUYÊN (ĐÃ SỬA LỖI REGEX)
export function synthesizeCommentary(work, fortuneKey) {
    const fortuneData = APP_DATA.COMMENTARY_DATA[fortuneKey] || {};
    
    const commentaries = fortuneData.commentaries || ["Tác phẩm chứa đựng nhiều tầng ý nghĩa để chiêm nghiệm."];
    const commentaryText = commentaries[Math.floor(Math.random() * commentaries.length)];
    
    const adviceText = fortuneData.advice || "";
    let adviceHtml = '';
    
    if (adviceText) {
        // SỬA LỖI: Dùng Regex để tách chính xác Nên/Tránh kể cả khi thiếu dấu cách
        const matchNen = adviceText.match(/Nên:(.*?)(?=Tránh:|$)/i);
        const matchTranh = adviceText.match(/Tránh:(.*)/i);
        
        const nenText = matchNen ? matchNen[1].trim() : '';
        const tranhText = matchTranh ? matchTranh[1].trim() : '';

        if (tranhText) {
            adviceHtml = `
                <div style="margin-bottom: 8px;">
                    <strong style="color: var(--accent-text);">Nên:</strong> <span style="color: var(--text-main);">${nenText}</span>
                </div>
                <div>
                    <strong style="color: #a36b6b;">Tránh:</strong> <span style="color: var(--text-muted);">${tranhText}</span>
                </div>
            `;
        } else if (nenText) {
            adviceHtml = `<div><strong style="color: var(--accent-text);">Lời khuyên:</strong> ${nenText}</div>`;
        }
    }

    return { commentaryText, adviceHtml };
}
