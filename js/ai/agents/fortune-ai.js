/**
 * ==========================================================
 * VĂN ĐẠO AI - FORTUNE AGENT (js/ai/agents/fortune-ai.js)
 * Vị trí: js/ai/agents/fortune-ai.js
 * Version: 3.2.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Cung cấp FortuneAgent cho MasterAI điều phối.
 * - Chứa các hàm tính toán vận khí, sinh lời bình, và tổng hợp 4 góc nhìn.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { escapeHTML } from '../../utils.js';
import { FORTUNE_LEVELS, FORTUNE_MAP } from '../core.js';

// [MỚI] Import 2 chuyên gia đánh giá
import { PraiserAgent } from './praiser.js';
import { CriticAgent } from './critic.js';

// =====================================================================
// 1. CÁC HÀM TÍNH TOÁN (Dùng cho Bói thơ ở Trang chủ)
// =====================================================================

/**
 * Tính toán vận khí ngẫu nhiên dựa trên trọng số (Weighted Random)
 */
export function calculateFortune() {
    const totalWeight = FORTUNE_LEVELS.reduce((sum, level) => sum + level.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const level of FORTUNE_LEVELS) {
        if (random < level.weight) return level.key;
        random -= level.weight;
    }
    return 'binh-hoa'; // Fallback
}

/**
 * Lấy thông tin chi tiết của một mức vận khí
 */
export function getFortuneInfo(fortuneKey) {
    return FORTUNE_MAP[fortuneKey] || FORTUNE_MAP['binh-hoa'];
}

/**
 * Tổng hợp 4 góc nhìn: Vận khí + Tán thưởng + Phê bình + Lời khuyên
 */
export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa', analysisResult = null) {
    const fortune = getFortuneInfo(fortuneKey);
    const validKey = fortune.key; 
    
    const analysis = analysisResult || { themes: [], evidence: { symbols: [] } };
    
    // Gọi 2 Agent Tán thưởng & Phê bình
    const textToAnalyze = [work.title, work.desc, work.content].filter(Boolean).join(' ');
    const praiseResult = PraiserAgent.analyze(textToAnalyze);
    const criticResult = CriticAgent.analyze(textToAnalyze);

    // Lấy dữ liệu lời bình từ APP_DATA
    const commentaryData = APP_DATA.COMMENTARY_DATA[validKey] || {};
    const nen = commentaryData.nen || 'Thuận theo tự nhiên.';
    const tranh = commentaryData.tranh || 'Tránh nóng vội.';
    
    // Random một lời bình
    const commentaries = commentaryData.commentaries || [];
    const randomCommentary = commentaries.length > 0 
        ? commentaries[Math.floor(Math.random() * commentaries.length)] 
        : 'Vạn sự tùy duyên.';

    // Tạo câu dẫn
    const bridgeText = `Trong kho tàng văn học, bạn gặp được tác phẩm "${work.title}". Đây là một cơ duyên. Dưới đây là lời chiêm nghiệm dành riêng cho bạn hôm nay:`;

    // Tạo HTML lời khuyên (Nên / Tránh)
    const adviceHtml = `
        <div style="margin-bottom: 10px;">
            <span style="color: var(--accent-text); font-weight: 700;">Nên:</span> ${escapeHTML(nen)}
        </div>
        <div>
            <span style="color: #a36b6b; font-weight: 700;">Tránh:</span> ${escapeHTML(tranh)}
        </div>
    `;

    return {
        fortuneInfo: fortune,
        bridgeText: escapeHTML(bridgeText),
        fortuneReflection: escapeHTML(randomCommentary),
        
        praiseCommentary: praiseResult.commentary,
        criticCommentary: criticResult.commentary,
        
        literaryCommentary: escapeHTML(analysis.commentaryText || ''),
        adviceHtml,
        strength: analysis.strength || 'Yếu',
        evidence: analysis.evidence || { themes: [], symbols: [] }
    };
}

// =====================================================================
// 2. ĐỐI TƯỢNG AGENT (Dành cho Plugin Architecture)
// =====================================================================
export const FortuneAgent = {
    /**
     * Hàm xử lý khi MasterAI gọi Intent 'fortune'
     * Hiện tại, tính năng Bói thơ được xử lý qua Modal riêng, 
     * nên khi gõ lệnh hỏi AI, ta sẽ hướng dẫn người dùng ra Trang Chủ.
     */
    async getFortune(query) {
        return { 
            answer: 'Vui lòng sử dụng nút "Một bài thơ cho hôm nay" ở Trang Chủ để gieo quẻ vận khí.', 
            detail: 'Tính năng Bói thơ sử dụng thuật toán ngẫu nhiên có trọng số, kết hợp với 4 góc nhìn AI (Vận khí, Tán thưởng, Phê bình, Lời khuyên).',
            source: 'fortune' 
        };
    }
};
