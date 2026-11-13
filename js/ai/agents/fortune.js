/**
 * ==========================================================
 * VĂN ĐẠO AI - FORTUNE AGENT (js/ai/agents/fortune-ai.js)
 * Vị trí: js/ai/agents/fortune-ai.js
 * Version: 3.2.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tính toán vận khí (Bói thơ) theo thuật toán ngẫu nhiên có trọng số.
 * - Tổng hợp 4 góc nhìn: Phân tích + Tán thưởng + Phê bình + Chiêm nghiệm.
 * - Export 3 hàm tiện ích riêng (calculateFortune, getFortuneInfo,
 *   synthesizeDynamicFortune) để main.js dùng trực tiếp trong Fate Modal.
 *
 * LƯU Ý QUAN TRỌNG:
 * - File này tên `fortune-ai.js` nhưng key đăng ký là `'fortune'`
 *   (giữ nhất quán với AGENT_CONFIGS cũ và AgentMap['fortune']).
 * - Nhiều hàm export riêng (không nằm trong FortuneAgent) vì
 *   main.js gọi trực tiếp để dựng Fate Modal phức tạp.
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { escapeHTML } from '../../utils.js';
import { FORTUNE_LEVELS, FORTUNE_MAP } from '../core.js';
import { PraiserAgent } from './praiser.js';
import { CriticAgent } from './critic.js';

/**
 * Tính toán vận khí ngẫu nhiên có trọng số.
 * Mỗi mức vận khí có `weight` riêng; tổng weight được dùng
 * để chọn ngẫu nhiên (weighted random).
 *
 * @returns {string} key của mức vận khí (VD: 'dai-cat', 'binh-hoa')
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
 *
 * @param {string} fortuneKey - Key vận khí (VD: 'dai-cat')
 * @returns {Object} Object chứa name, color, weight, advice
 */
export function getFortuneInfo(fortuneKey) {
    return FORTUNE_MAP[fortuneKey] || FORTUNE_MAP['binh-hoa'];
}

/**
 * Tổng hợp 4 góc nhìn thành một kết quả Fortune hoàn chỉnh.
 * Bao gồm:
 *   1. Lời chiêm nghiệm (từ APP_DATA.COMMENTARY_DATA)
 *   2. Góc nhìn Tán thưởng (PraiserAgent)
 *   3. Góc nhìn Phê bình (CriticAgent)
 *   4. Lời khuyên Nên/Tránh (từ core.js FORTUNE_LEVELS)
 *
 * @param {Object} work - Tác phẩm được bói
 * @param {string} fortuneKey - Key vận khí
 * @param {Object} analysisResult - Kết quả từ analyzeWork()
 * @returns {Object} Kết quả đã chuẩn hóa cho UI render
 */
export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa', analysisResult = null) {
    const fortune = getFortuneInfo(fortuneKey);
    const validKey = fortune.key; 
    const analysis = analysisResult || { themes: [], evidence: { symbols: [] } };
    
    const textToAnalyze = [work.title, work.desc, work.content].filter(Boolean).join(' ');
    const praiseResult = PraiserAgent.analyze(textToAnalyze);
    const criticResult = CriticAgent.analyze(textToAnalyze);

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
        praiseCommentary: praiseResult.commentary,
        criticCommentary: criticResult.commentary,
        literaryCommentary: escapeHTML(analysis.commentaryText || ''),
        adviceHtml,
        strength: analysis.strength || 'Yếu',
        evidence: analysis.evidence || { themes: [], symbols: [] }
    };
}

// =====================================================================
// [CỰC KỲ QUAN TRỌNG] AGENT OBJECT CHO MASTER AI
// =====================================================================
/**
 * Agent Object dùng cho MasterAI điều phối.
 * Khi user hỏi trực tiếp "Bói thơ" / "Gieo quẻ", MasterAI sẽ gọi
 * `FortuneAgent.getFortune()`. Tuy nhiên tính năng Bói thơ chính
 * được kích hoạt từ nút trên Trang Chủ (qua randomPoem() trong main.js),
 * nên Agent này chỉ trả về hướng dẫn.
 */
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
// [THÊM MỚI v7.0.0] AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
/**
 * Metadata tự mô tả của FortuneAgent.
 * Chuyên trách Bói thơ, Vận khí, Nên/Tránh.
 *
 * GHI CHÚ QUAN TRỌNG:
 * - `key` là `'fortune'` (KHÔNG phải 'fortune-ai'), giữ tương thích
 *   với AgentMap['fortune'] mà master.js và fortune-ai.js đang dùng.
 * - `intentPatterns` của file này sẽ tự động gộp vào DynamicIntentPatterns,
 *   giúp InputAI nhận diện các câu như "Bói thơ", "Gieo quẻ", "Xin quẻ".
 * - File này còn export 3 hàm tiện ích riêng (calculateFortune,
 *   getFortuneInfo, synthesizeDynamicFortune) dùng cho Fate Modal.
 *   Các hàm này KHÔNG được đưa vào `capabilities` vì không phải
 *   task-endpoint qua MasterAI.
 */
FortuneAgent.agentInfo = {
    // ---- Định danh ----
    key: 'fortune',
    name: 'Vận Khí AI',
    description: 'Chuyên trách Bói thơ, Vận khí, Nên/Tránh.',

    // ---- Năng lực ----
    capabilities: {
        'fortune': 'getFortune'                 // "Bói thơ hôm nay" -> FortuneAgent.getFortune()
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author'],

    // ---- Agent được phép ủy thác ----
    // (Fortune không ủy thác cho ai — mọi thứ đã tự tổng hợp qua 4 góc nhìn)
    canDelegate: [],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'fortune': ['boi', 'van khi', 'gieo que', 'xin que']
    }
};
