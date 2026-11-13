/**
 * ==========================================================
 * VĂN ĐẠO AI - FORTUNE AGENT (js/ai/agents/fortune-ai.js)
 * ==========================================================
 */

import { APP_DATA } from '../../config.js';
import { escapeHTML } from '../../utils.js';
import { FORTUNE_LEVELS, FORTUNE_MAP } from '../core.js';

// [MỚI] Import 2 chuyên gia đánh giá
import { PraiserAgent } from './praiser.js';
import { CriticAgent } from './critic.js';

// ... (Giữ nguyên các hàm calculateFortune, getFortuneInfo)

export function synthesizeDynamicFortune(work = {}, fortuneKey = 'binh-hoa', analysisResult = null) {
    const fortune = getFortuneInfo(fortuneKey);
    const validKey = fortune.key; 
    
    const analysis = analysisResult || { themes: [], evidence: { symbols: [] } };
    
    // [MỚI] Gọi 2 Agent Tán thưởng & Phê bình
    const textToAnalyze = [work.title, work.desc, work.content].filter(Boolean).join(' ');
    const praiseResult = PraiserAgent.analyze(textToAnalyze);
    const criticResult = CriticAgent.analyze(textToAnalyze);

    // ... (Giữ nguyên logic generateBridgeText, generateDynamicAdvice, adviceHtml)

    return {
        fortuneInfo: fortune,
        bridgeText: escapeHTML(bridgeText),
        fortuneReflection: escapeHTML(fortuneReflection),
        
        // [MỚI] Trả về 2 góc nhìn mới
        praiseCommentary: praiseResult.commentary,
        criticCommentary: criticResult.commentary,
        
        // (Giữ nguyên các trường cũ như adviceHtml, literaryCommentary...)
        literaryCommentary: escapeHTML(analysis.commentaryText),
        adviceHtml,
        strength: analysis.strength || 'Yếu',
        evidence: analysis.evidence || { themes: [], symbols: [] }
    };
}