/**
 * ==========================================================
 * VĂN ĐẠO AI - FORTUNE AGENT (js/ai/agents/fortune.js)
 * Vị trí: js/ai/agents/fortune.js
 * Version: 3.5.0 (Quick Comment Integration)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tính toán vận khí (Bói thơ) theo thuật toán ngẫu nhiên có trọng số.
 * - Tổng hợp 4 góc nhìn: Phân tích + Tán thưởng + Phê bình + Chiêm nghiệm.
 * - [MỚI] Sử dụng hàm getQuickComment() thay vì analyze() để câu trả lời
 *   ngắn gọn, vui vẻ, phù hợp với tính năng gieo quẻ.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { escapeHTML } from '../../utils.js';
import { FORTUNE_LEVELS, FORTUNE_MAP } from '../core.js';
import { PraiserAgent } from './praiser.js';
import { CriticAgent } from './critic.js';

/**
 * Tính toán vận khí ngẫu nhiên có trọng số.
 */
export function calculateFortune() {
    const totalWeight = FORTUNE_LEVELS.reduce((sum, level) => sum + level.weight, 0);
    let random = Math.random() * totalWeight;
    for (const level of FORTUNE_LEVELS) {
        if (random < level.weight) return level.key;
        random -= level.weight;
    }
    return 'binh-hoa';
}

/**
 * Lấy thông tin chi tiết của một mức vận khí.
 */
export function getFortuneInfo(fortuneKey) {
    return FORTUNE_MAP[fortuneKey] || FORTUNE_MAP['binh-hoa'];
}

/**
 * Tổng hợp 4 góc nhìn thành một kết quả Fortune hoàn chỉnh.
 */
export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa', analysisResult = null) {
    const fortune = getFortuneInfo(fortuneKey);
    const validKey = fortune.key; 
    
    // [SỬA] Dùng hàm nhận xét nhanh thay vì phân tích sâu để giao diện gọn gàng
    const praiseCommentary = PraiserAgent.getQuickComment(work);
    const criticCommentary = CriticAgent.getQuickComment(work);

    const commentaryData = APP_DATA.COMMENTARY_DATA[validKey] || {};
    const nen = commentaryData.nen || 'Thuận theo tự nhiên.';
    const tranh = commentaryData.tranh || 'Tránh nóng vội.';
    const commentaries = commentaryData.commentaries || [];
    const randomCommentary = commentaries.length > 0 ? commentaries[Math.floor(Math.random() * commentaries.length)] : 'Vạn sự tùy duyên.';

    const bridgeText = `Trong kho tàng văn học, bạn gặp được tác phẩm "${work.title}". Đây là một cơ duyên. Dưới đây là lời chiêm nghiệm dành riêng cho bạn hôm nay:`;

    const adviceHtml = `
        <div style="margin-bottom: 10px;"><span style="color: var(--accent-text); font-weight: 700;">Nên:</span> ${escapeHTML(nen)}</div>
        <div><span style="color: #a36b6b; font-weight: 700;">Tránh:</span> ${escapeHTML(tranh)}</div>
    `;

    return {
        fortuneInfo: fortune,
        bridgeText: escapeHTML(bridgeText),
        fortuneReflection: escapeHTML(randomCommentary),
        praiseCommentary: praiseCommentary, 
        criticCommentary: criticCommentary, 
        adviceHtml,
        strength: 'Vừa',
        evidence: { themes: [], symbols: [] }
    };
}

// =====================================================================
// AGENT OBJECT CHO MASTER AI
// =====================================================================
export const FortuneAgent = {
    async getFortune(query) {
        return { 
            answer: 'Vui lòng sử dụng nút "Một bài thơ cho hôm nay" ở Trang Chủ để gieo quẻ vận khí.', 
            detail: 'Tính năng Bói thơ sử dụng thuật toán ngẫu nhiên có trọng số, kết hợp với 4 góc nhìn AI.',
            source: 'fortune' 
        };
    }
};

// =====================================================================
// AGENT INFO
// =====================================================================
FortuneAgent.agentInfo = {
    key: 'fortune',
    name: 'Vận Khí AI',
    description: 'Chuyên trách Bói thơ, Vận khí, Nên/Tránh.',
    capabilities: {
        'fortune': 'getFortune'
    },
    canRead: ['work', 'author'],
    canDelegate: [],
    intentPatterns: {
        'fortune': ['boi', 'van khi', 'gieo que', 'xin que']
    }
};
