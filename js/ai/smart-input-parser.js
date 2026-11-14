/**
 * ==========================================================
 * VĂN ĐẠO AI - SMART INPUT PARSER (BỘ GIẢI MÃ OMNIBOX)
 * Vị trí: js/ai/smart-input-parser.js
 * Version: 2.1.0 (Factoid vs Deep Query Routing)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * 1. Phân luồng thông minh (Omnibox Routing):
 *    - Nếu hỏi "ai viết truyện kiều" -> Factoid (Trả lời ngắn).
 *    - Nếu hỏi "phân tích truyện kiều" -> Deep Query (Gọi Pipeline đa chiều).
 *    - Nếu gõ "truyện kiều" -> Search (Tìm danh sách).
 * 2. Bóc tách từ khóa cốt lõi (coreKeyword): Tự động loại bỏ các từ thừa
 *    (ai viết, tác giả của, tóm tắt, giúp tôi...) để tìm kiếm chính xác.
 * 3. Nhận diện Cảm xúc (Mood) và Ý định (Intent).
 * ==========================================================
 */

import { normalizeRouteText } from '../utils.js';

// =====================================================================
// I. TỪ ĐIỂN NGỮ NGHĨA (SEMANTIC DICTIONARY)
// =====================================================================
const SEMANTIC_DICTIONARY = {
  moods: {
    'buon': ['buồn', 'sầu', 'cô đơn', 'nhớ', 'khóc', 'bi thương', 'hoài niệm', 'tâm trạng'],
    'hao-hung': ['hào hùng', 'mạnh mẽ', 'kiêu hãnh', 'chiến đấu', 'yêu nước', 'bi tráng'],
    'vui': ['vui', 'tươi sáng', 'yêu đời', 'hài hước', 'trào phúng', 'châm biếm'],
    'tinh-yeu': ['yêu', 'tình', 'lãng mạn', 'tương tư', 'hẹn thề', 'chia ly']
  },
  intents: {
    // Factoid: Trả lời ngắn gọn, chính xác (KHÔNG chạy Pipeline)
    'factoid': [
      'ai viet', 'tac gia cua', 'cua ai', 'la ai', 'tom tat', 'noi dung chinh', 
      'bao nhieu cau', 'nam nao', 'thoi nao', 'the loai gi'
    ],
    // Deep Query: Kích hoạt Hội đồng chuyên gia (Pipeline)
    'analyze': ['phân tích', 'cảm nhận', 'bình giảng', 'ý nghĩa', 'nghệ thuật', 'đánh giá', 'bình luận', 'mở bài'],
    'compare': ['so sánh', 'khác gì', 'giống gì', 'đặt cạnh', 'đối chiếu'],
    'recommend': ['gợi ý', 'tìm giúp', 'có bài nào', 'đọc gì', 'tác phẩm nào', 'tương tự', 'giới thiệu'],
    'fortune': ['gieo quẻ', 'ngẫu nhiên', 'chọn giúp', 'tâm sự', 'mệt mỏi', 'chán', 'bói']
  }
};

export const SmartInputParser = {
  /**
   * Hàm phân tích chuỗi đầu vào.
   * @param {string} rawInput - Chuỗi người dùng gõ.
   * @returns {Object} Kết quả phân tích: { raw, normalized, coreKeyword, intent, mood, isDeepQuery, isFactoid }
   */
  parse(rawInput) {
    const cleanText = String(rawInput || '').trim();
    const normText = normalizeRouteText(cleanText);
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    // -----------------------------------------------------------------
    // 1. NHẬN DIỆN Ý ĐỊNH (INTENT)
    // -----------------------------------------------------------------
    let detectedIntent = 'search'; // Mặc định là tìm kiếm
    
    for (const [intent, keywords] of Object.entries(SEMANTIC_DICTIONARY.intents)) {
      if (keywords.some(kw => normText.includes(normalizeRouteText(kw)))) {
        detectedIntent = intent;
        break; // Ưu tiên từ khóa xuất hiện trước trong từ điển
      }
    }

    // Nếu là câu dài (>= 5 từ) hoặc có dấu '?' mà chưa rõ ý định -> Tự động nâng cấp thành Analyze
    if (detectedIntent === 'search' && (wordCount >= 5 || cleanText.includes('?'))) {
      detectedIntent = 'analyze';
    }

    // -----------------------------------------------------------------
    // 2. NHẬN DIỆN CẢM XÚC ẨN (MOOD)
    // -----------------------------------------------------------------
    let detectedMood = null;
    for (const [moodKey, synonyms] of Object.entries(SEMANTIC_DICTIONARY.moods)) {
      if (synonyms.some(syn => normText.includes(normalizeRouteText(syn)))) {
        detectedMood = moodKey;
        break;
      }
    }

    // -----------------------------------------------------------------
    // 3. BÓC TÁCH TỪ KHÓA CỐT LÕI (CORE KEYWORD)
    // -----------------------------------------------------------------
    // Loại bỏ các từ đệm, từ hỏi để tìm kiếm chính xác hơn.
    const stopWords = [
      'phan tich', 'cam nhan', 'tim giup', 'co bai nao', 've', 'cua', 'tac pham', 
      'bai tho', 'goi y', 'hay', 'cho toi', 'ai viet', 'tac gia cua', 'cua ai', 
      'tom tat', 'noi dung chinh', 'la gi', 'la ai', 'giup toi', 'hay la'
    ];
    
    let coreKeyword = normText;
    stopWords.forEach(sw => {
      const regex = new RegExp(`\\b${sw}\\b`, 'g');
      coreKeyword = coreKeyword.replace(regex, '').trim();
    });

    // Dọn dẹp khoảng trắng thừa
    coreKeyword = coreKeyword.replace(/\s+/g, ' ').trim();

    // Nếu sau khi lọc mà không còn gì, trả về nguyên bản normText
    if (!coreKeyword) coreKeyword = normText;

    // -----------------------------------------------------------------
    // 4. XÁC ĐỊNH LOẠI TRUY VẤN
    // -----------------------------------------------------------------
    return {
      raw: cleanText,                     // Chuỗi gốc
      normalized: normText,               // Chuỗi đã bỏ dấu
      coreKeyword: coreKeyword,           // Từ khóa chính để tra cứu
      intent: detectedIntent,             // 'search' | 'factoid' | 'analyze' | 'compare' | 'recommend' | 'fortune'
      mood: detectedMood,                 // 'buon' | 'hao-hung' | 'vui' | 'tinh-yeu' | null
      isDeepQuery: ['analyze', 'compare', 'recommend'].includes(detectedIntent),
      isFactoid: detectedIntent === 'factoid'
    };
  }
};
