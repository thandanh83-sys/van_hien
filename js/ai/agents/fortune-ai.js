/**
 * ==========================================================
 * VĂN ĐẠO AI - FORTUNE AGENT (js/ai/agents/fortune-ai.js)
 * Chức năng: Quản lý 6 bậc vận khí và tổng hợp Bói Thơ
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { escapeHTML } from '../../utils.js';
import { FORTUNE_LEVELS, FORTUNE_MAP } from '../core.js';

// ==========================================================
// 1. HÀM TÍNH TOÁN VẬN KHÍ
// ==========================================================

/**
 * Rút ngẫu nhiên 1 quẻ dựa trên trọng số (Weighted Random)
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
 */
export function getFortuneInfo(key = 'binh-hoa') {
    const validKey = FORTUNE_MAP[key] ? key : 'binh-hoa';
    const fallback = FORTUNE_MAP[validKey];
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
// 2. HÀM TỔNG HỢP BÓI THƠ (SYNTHESIS)
// ==========================================================

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

export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa', analysisResult = null) {
    const fortune = getFortuneInfo(fortuneKey);
    
    const mainTheme = (analysisResult && analysisResult.themes && analysisResult.themes.length > 0) 
        ? analysisResult.themes[0] : 'nhân sinh';
        
    const mainSymbol = (analysisResult && analysisResult.evidence && analysisResult.evidence.symbols && analysisResult.evidence.symbols.length > 0) 
        ? analysisResult.evidence.symbols[0].keyword : null;

    // 1. Tạo câu dẫn
    const bridgeText = generateBridgeText(work, fortune, mainTheme);

    // 2. Tạo lời chiêm nghiệm
    const commentaryData = APP_DATA.COMMENTARY_DATA?.[fortune.key] || {};
    const commentaries = Array.isArray(commentaryData.commentaries) ? commentaryData.commentaries : [];
    const fortuneReflection = commentaries.length > 0 
        ? commentaries[Math.floor(Math.random() * commentaries.length)] 
        : `Lời chiêm nghiệm cho vận khí ${fortune.name}: Hãy giữ tâm thế bình thản trước mọi biến động.`;

    // 3. Tạo lời khuyên
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
// 3. EXPORT AGENT OBJECT
// ==========================================================
export const FortuneAgent = {
    calculateFortune,
    getFortuneInfo,
    synthesizeDynamicFortune
};