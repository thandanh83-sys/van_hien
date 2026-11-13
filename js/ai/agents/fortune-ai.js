/**
 * ==========================================================
 * VĂN ĐẠO AI - FORTUNE AGENT (js/ai/agents/fortune.js)
 * Vị trí: js/ai/agents/fortune.js
 * Version: 1.2.0 (Multi-Agent Specialist)
 * ==========================================================
 * CHỨC NĂNG:
 * - Quản lý 6 bậc vận khí (Đại Cát -> Đại Hung).
 * - Rút quẻ ngẫu nhiên có trọng số (Weighted Random).
 * - Tổng hợp câu dẫn (Bridge), Lời chiêm nghiệm, Lời khuyên.
 * - Kết nối với kết quả Phân tích (Analysis) để làm điểm tựa.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { escapeHTML } from '../../utils.js';

// ==========================================================
// 1. KHAI BÁO 6 BẬC VẬN KHÍ (Tĩnh)
// ==========================================================
const FORTUNE_LEVELS = [
    { 
        key: 'dai-cat', 
        weight: 10, 
        name: 'Đại cát', 
        color: '#b89552', 
        advice: 'Chủ động nắm bắt cơ hội, lấy lòng nhân hậu và sự khiêm nhường làm gốc. Tránh kiêu ngạo, tự mãn hoặc xem thuận lợi nhất thời là điều hiển nhiên.' 
    },
    { 
        key: 'trung-cat', 
        weight: 18, 
        name: 'Trung cát', 
        color: '#8eaa91', 
        advice: 'Kiên trì, làm việc có kế hoạch và giữ chữ tín. Tránh nóng vội, chủ quan hoặc bỏ dở việc đang làm.' 
    },
    { 
        key: 'tieu-cat', 
        weight: 22, 
        name: 'Tiểu cát', 
        color: '#9baf85', 
        advice: 'Trân trọng điều bình dị, chăm chút việc nhỏ và giữ tâm thế biết ơn. Tránh xem nhẹ những điều nhỏ bé.' 
    },
    { 
        key: 'binh-hoa', 
        weight: 24, 
        name: 'Bình hòa', 
        color: '#778c85', 
        advice: 'Giữ sự điều độ, suy xét thấu đáo và làm tốt việc trước mắt. Tránh cố cưỡng cầu kết quả.' 
    },
    { 
        key: 'tieu-hung', 
        weight: 16, 
        name: 'Tiểu hung', 
        color: '#ad876d', 
        advice: 'Kiểm tra lại kế hoạch, lắng nghe ý kiến đáng tin cậy. Tránh quyết định bốc đồng, hấp tấp.' 
    },
    { 
        key: 'dai-hung', 
        weight: 10, 
        name: 'Đại hung', 
        color: '#9c7777', 
        advice: 'Thận trọng, rà soát những điều quan trọng và ưu tiên sự an toàn. Tránh liều lĩnh, cố chấp khi chưa đủ thông tin.' 
    }
];

// Tạo Map tra cứu nhanh (O(1))
const FORTUNE_MAP = Object.fromEntries(FORTUNE_LEVELS.map(item => [item.key, item]));

// ==========================================================
// 2. CÁC HÀM XỬ LÝ VẬN KHÍ
// ==========================================================

/**
 * Rút ngẫu nhiên 1 quẻ dựa trên trọng số (Weighted Random)
 * @returns {string} Mã quẻ (VD: 'dai-cat', 'binh-hoa')
 */
export function calculateFortune() {
    const totalWeight = FORTUNE_LEVELS.reduce((sum, item) => sum + item.weight, 0);
    let draw = Math.random() * totalWeight;
    
    for (const item of FORTUNE_LEVELS) {
        draw -= item.weight;
        if (draw < 0) return item.key;
    }
    return 'binh-hoa'; // Fallback an toàn
}

/**
 * Lấy thông tin chi tiết của một quẻ (ưu tiên dữ liệu từ JSON nếu có)
 * @param {string} key - Mã quẻ
 * @returns {Object} Thông tin quẻ (tên, màu sắc, lời khuyên tĩnh)
 */
export function getFortuneInfo(key = 'binh-hoa') {
    // Chuẩn hóa key: Nếu key không hợp lệ, tự động trả về Bình Hòa
    const validKey = FORTUNE_MAP[key] ? key : 'binh-hoa';
    const fallback = FORTUNE_MAP[validKey];
    
    // Lấy dữ liệu cấu hình từ file data-van-khi.json (nếu có để ghi đè)
    const saved = APP_DATA.FORTUNE_CONFIG?.[validKey] || {};
    
    return { 
        ...fallback, 
        ...saved, 
        key: validKey, 
        name: saved.name || fallback.name, 
        color: saved.color || fallback.color 
    };
}

// ==========================================================
// 3. CÁC HÀM TẠO VĂN BẢN ĐỘNG (Linh hoạt theo tác phẩm)
// ==========================================================

/**
 * Tạo câu dẫn (Bridge) kết nối Vận Khí với Tác Phẩm
 */
function generateBridgeText(work, fortune, mainTheme) {
    const title = work.title || 'trang sách';
    const author = work.author || 'tác giả';
    const fName = fortune.name.toLowerCase();
    
    let bridgeText = `Duyên lành đưa bạn đến với "${title}" của ${author} trong một ngày vận khí ${fName}. `;
    
    if (fortune.key === 'dai-cat') {
        bridgeText += `Trang sách mở ra như một lời chúc phúc, hãy đón nhận bằng tâm thế rộng mở.`;
    } else if (fortune.key === 'trung-cat' || fortune.key === 'tieu-cat') {
        bridgeText += `Mọi sự đang diễn ra êm đềm, thật hợp để bạn tĩnh tâm chiêm nghiệm về "${mainTheme}".`;
    } else if (fortune.key === 'binh-hoa') {
        bridgeText += `Ngày hôm nay như mặt hồ phẳng lặng, rất thích hợp để lắng lòng cùng "${mainTheme}".`;
    } else {
        bridgeText += `Dẫu ngoài kia có chút gợn sóng, nhưng trang sách này sẽ là một chốn bình yên để bạn tựa vào.`;
    }
    return bridgeText;
}

/**
 * Tạo Lời Khuyên động (Dynamic Advice) dựa trên Vận Khí + Chủ Đề
 */
function generateDynamicAdvice(work, fortune, mainTheme, mainSymbol) {
    let advice = "";
    
    if (fortune.key === 'dai-cat') {
        advice = `Vận khí đang rực rỡ, hãy dùng cảm hứng từ chủ đề "${mainTheme}" của tác phẩm để chủ động gieo duyên lành.`;
    } else if (fortune.key === 'tieu-hung' || fortune.key === 'dai-hung') {
        advice = `Khi vận khí có chút trắc trở, hãy mượn sự tĩnh tại và bài học về "${mainTheme}" trong tác phẩm để làm điểm tựa.`;
    } else {
        advice = `Hãy kết hợp sự thong dong của vận khí ${fortune.name.toLowerCase()} với những chiêm nghiệm về "${mainTheme}" trong trang sách.`;
    }

    if (mainSymbol) {
        advice += ` Đặc biệt, hãy để hình ảnh "${mainSymbol}" đánh thức những suy ngẫm sâu kín trong bạn.`;
    }
    return advice;
}

// ==========================================================
// 4. HÀM TỔNG HỢP CHÍNH (SYNTHESIS)
// ==========================================================

/**
 * Tổng hợp Bói Thơ: Lấy quẻ + Tác phẩm + Phân tích -> Trả về dữ liệu hoàn chỉnh
 * @param {Object} work - Tác phẩm (từ APP_DATA.WORKS_DATA)
 * @param {String} fortuneKey - Mã quẻ (dai-cat, binh-hoa...)
 * @param {Object} analysisResult - Kết quả từ AnalysisAgent
 * @returns {Object} Dữ liệu đã được format để UI hiển thị
 */
export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa', analysisResult = null) {
    const fortune = getFortuneInfo(fortuneKey);
    
    // Trích xuất dữ liệu từ AnalysisAgent (nếu có)
    const mainTheme = (analysisResult && analysisResult.themes && analysisResult.themes.length > 0) 
        ? analysisResult.themes[0] 
        : 'nhân sinh';
        
    const mainSymbol = (analysisResult && analysisResult.evidence && analysisResult.evidence.symbols && analysisResult.evidence.symbols.length > 0) 
        ? analysisResult.evidence.symbols[0].keyword 
        : null;

    // 1. Tạo câu dẫn (Bridge)
    const bridgeText = generateBridgeText(work, fortune, mainTheme);

    // 2. Tạo lời chiêm nghiệm (Lấy ngẫu nhiên từ JSON)
    const commentaryData = APP_DATA.COMMENTARY_DATA?.[fortune.key] || {};
    const commentaries = Array.isArray(commentaryData.commentaries) ? commentaryData.commentaries : [];
    const fortuneReflection = commentaries.length > 0 
        ? commentaries[Math.floor(Math.random() * commentaries.length)] 
        : `Lời chiêm nghiệm cho vận khí ${fortune.name}: Hãy giữ tâm thế bình thản trước mọi biến động.`;

    // 3. Xử lý Lời khuyên (Tách Nên / Tránh)
    const dynamicAdvice = generateDynamicAdvice(work, fortune, mainTheme, mainSymbol);
    
    let nenText = "", tranhText = "";
    if (fortune.advice) {
        const matchNen = fortune.advice.match(/Nên:(.*?)(?=Tránh:|$)/i);
        const matchTranh = fortune.advice.match(/Tránh:(.*)/i);
        nenText = matchNen ? matchNen[1].trim() : '';
        tranhText = matchTranh ? matchTranh[1].trim() : '';
        if (!nenText && !tranhText) nenText = fortune.advice.trim();
    }

    let adviceHtml = '';
    if (nenText) adviceHtml += `<div style="margin-bottom:8px;"><strong style="color:var(--accent-text);">Nên:</strong> <span style="color:var(--text-main);">${escapeHTML(nenText)}</span></div>`;
    if (tranhText) adviceHtml += `<div style="margin-bottom:10px;"><strong style="color:#a36b6b;">Tránh:</strong> <span style="color:var(--text-muted);">${escapeHTML(tranhText)}</span></div>`;
    
    adviceHtml += `
        <div style="border-top:1px dashed rgba(128,128,128,0.2); padding-top:10px; margin-top:10px;">
            <strong style="color:var(--accent-text);">Gợi ý đọc:</strong>
            <span style="color:var(--text-main);">${escapeHTML(dynamicAdvice)}</span>
        </div>
    `;

    // 4. Trả về object hoàn chỉnh
    return {
        fortuneInfo: fortune,
        bridgeText: escapeHTML(bridgeText),
        fortuneReflection: escapeHTML(fortuneReflection),
        literaryCommentary: escapeHTML(analysisResult ? analysisResult.commentaryText : ''),
        adviceHtml,
        strength: analysisResult ? analysisResult.strength : 'Yếu',
        evidence: analysisResult ? analysisResult.evidence : { themes: [], symbols: [] }
    };
}

// ==========================================================
// 5. EXPORT AGENT OBJECT (Dành cho Master AI)
// ==========================================================
export const FortuneAgent = {
    calculateFortune,
    getFortuneInfo,
    synthesizeDynamicFortune
};