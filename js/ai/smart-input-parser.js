/**
 * ==========================================================
 * VĂN ĐẠO AI - SMART INPUT PARSER (js/ai/smart-input-parser.js)
 * Vị trí: js/ai/smart-input-parser.js
 * Version: 2.0.0 (Omnibox Auto-Routing)
 * ==========================================================
 * TRIẾT LÝ:
 * - Phân biệt: Người dùng đang gõ "từ khóa" hay đang "đặt câu hỏi"?
 * - Nếu gõ 1-2 từ ngắn -> Search Mode (Tìm kiếm nhanh).
 * - Nếu gõ câu dài, có dấu '?' hoặc động từ ("phân tích", "cảm nhận") -> Ask Mode (Pipeline).
 * ==========================================================
 */

import { normalizeRouteText } from '../utils.js';

const SEMANTIC_DICTIONARY = {
  moods: {
    'buon': ['buồn', 'sầu', 'cô đơn', 'nhớ', 'khóc', 'bi thương', 'hoài niệm', 'tâm trạng'],
    'hao-hung': ['hào hùng', 'mạnh mẽ', 'kiêu hãnh', 'chiến đấu', 'yêu nước', 'bi tráng'],
    'vui': ['vui', 'tươi sáng', 'yêu đời', 'hài hước', 'trào phúng', 'châm biếm'],
    'tinh-yeu': ['yêu', 'tình', 'lãng mạn', 'tương tư', 'hẹn thề', 'chia ly']
  },
  intents: {
    'compare': ['so sánh', 'khác gì', 'giống gì', 'đặt cạnh', 'đối chiếu'],
    'analyze': ['phân tích', 'cảm nhận', 'bình giảng', 'ý nghĩa', 'nghệ thuật', 'nội dung'],
    'recommend': ['gợi ý', 'tìm giúp', 'có bài nào', 'đọc gì', 'tác phẩm nào', 'tương tự'],
    'fortune': ['gieo quẻ', 'ngẫu nhiên', 'chọn giúp', 'tâm sự', 'mệt mỏi', 'chán']
  }
};

export const SmartInputParser = {
  parse(rawInput) {
    const cleanText = String(rawInput || '').trim();
    const normText = normalizeRouteText(cleanText);
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    let detectedIntent = 'search';
    for (const [intent, keywords] of Object.entries(SEMANTIC_DICTIONARY.intents)) {
      if (keywords.some(kw => normText.includes(normalizeRouteText(kw)))) {
        detectedIntent = intent;
        break;
      }
    }

    // Omnibox Logic: Nếu câu dài (>= 5 từ) hoặc có dấu '?' -> Tự động kích hoạt Pipeline
    if (detectedIntent === 'search' && (wordCount >= 5 || cleanText.includes('?'))) {
      detectedIntent = 'analyze';
    }

    let detectedMood = null;
    for (const [moodKey, synonyms] of Object.entries(SEMANTIC_DICTIONARY.moods)) {
      if (synonyms.some(syn => normText.includes(normalizeRouteText(syn)))) {
        detectedMood = moodKey;
        break;
      }
    }

    const stopWords = ['phan tich', 'cam nhan', 'tim giup', 'co bai nao', 've', 'cua', 'tac pham', 'bai tho', 'goi y', 'hay', 'cho toi'];
    let coreKeyword = normText;
    stopWords.forEach(sw => {
      coreKeyword = coreKeyword.replace(new RegExp(`\\b${sw}\\b`, 'g'), '').trim();
    });

    return {
      raw: cleanText,
      normalized: normText,
      coreKeyword: coreKeyword || normText,
      intent: detectedIntent,
      mood: detectedMood,
      isDeepQuery: detectedIntent !== 'search'
    };
  }
};
