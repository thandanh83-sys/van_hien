/**
 * ==========================================================
 * VĂN ĐẠO AI - SMART INPUT PARSER (BỘ GIẢI MÃ NGỮ NGHĨA)
 * Vị trí: js/ai/smart-input-parser.js
 * Version: 1.0.0 (Unified Semantic Parser)
 * ==========================================================
 * CHỨC NĂNG:
 * - Hiểu ý định (Intent), Cảm xúc ẩn (Mood), và Thể loại từ câu hỏi.
 * - Làm sạch từ khóa (coreKeyword) để tra cứu chính xác hơn.
 * - Tự động phân luồng: Gõ từ khóa ngắn -> Search, Gõ câu dài -> Ask Dạo.
 * ==========================================================
 */

import { normalizeRouteText } from '../utils.js';

// Từ điển ánh xạ ngữ nghĩa đời thường -> Dữ liệu Tàng thư
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

    // 1. Nhận diện Ý định (Intent)
    let detectedIntent = 'search'; // Mặc định là tìm kiếm nhanh
    for (const [intent, keywords] of Object.entries(SEMANTIC_DICTIONARY.intents)) {
      if (keywords.some(kw => normText.includes(normalizeRouteText(kw)))) {
        detectedIntent = intent;
        break;
      }
    }

    // Nếu câu dài (>= 5 từ) hoặc có dấu hỏi '?' -> Tự động nâng cấp thành Ask Dạo
    if (detectedIntent === 'search' && (wordCount >= 5 || cleanText.includes('?'))) {
      detectedIntent = 'analyze';
    }

    // 2. Nhận diện Cảm xúc ẩn (Mood)
    let detectedMood = null;
    for (const [moodKey, synonyms] of Object.entries(SEMANTIC_DICTIONARY.moods)) {
      if (synonyms.some(syn => normText.includes(normalizeRouteText(syn)))) {
        detectedMood = moodKey;
        break;
      }
    }

    // 3. Làm sạch từ khóa cốt lõi (Loại bỏ từ thừa để Search chính xác hơn)
    const stopWords = ['phan tich', 'cam nhan', 'tim giup', 'co bai nao', 've', 'cua', 'tac pham', 'bai tho', 'goi y', 'hay', 'cho toi'];
    let coreKeyword = normText;
    stopWords.forEach(sw => {
      coreKeyword = coreKeyword.replace(new RegExp(`\\b${sw}\\b`, 'g'), '').trim();
    });

    return {
      raw: cleanText,
      normalized: normText,
      coreKeyword: coreKeyword || normText, // Từ khóa tinh gọn để tra DataHub
      intent: detectedIntent,               // 'search' | 'analyze' | 'compare' | 'recommend' | 'fortune'
      mood: detectedMood,                   // 'buon' | 'hao-hung' | 'vui' | 'tinh-yeu' | null
      isDeepQuery: detectedIntent !== 'search'
    };
  }
};
