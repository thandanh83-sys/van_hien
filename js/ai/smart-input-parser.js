/**
 * ==========================================================
 * NGỌC THANH - SMART INPUT PARSER (BỘ GIẢI MÃ OMNIBOX)
 * Vị trí: js/ai/smart-input-parser.js
 * Version: 2.2.0 (Omnibox Routing & Core Keyword Extraction)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * 1. Phân luồng thông minh (Omnibox Routing):
 *    - Nếu hỏi "ai viết truyện kiều" -> Factoid (Trả lời ngắn, gọi thẳng Agent).
 *    - Nếu hỏi "phân tích truyện kiều" -> Deep Query (Gọi Pipeline đa chiều).
 *    - Nếu gõ "truyện kiều" -> Search (Tìm danh sách tác phẩm).
 * 2. Bóc tách từ khóa cốt lõi (coreKeyword): Tự động loại bỏ các từ thừa
 *    (ai viết, tác giả của, tóm tắt, giúp tôi...) để tìm kiếm chính xác.
 * 3. Nhận diện Cảm xúc (Mood) và Ý định (Intent) để phục vụ AI.
 * ==========================================================
 */

// [FIX] Đảm bảo import đúng đường dẫn lùi 1 cấp ra js/utils.js
import { normalizeRouteText } from '../utils.js';

// =====================================================================
// I. TỪ ĐIỂN NGỮ NGHĨA (SEMANTIC DICTIONARY)
// Lưu ý: Tất cả các từ khóa ở đây đều phải viết KHÔNG DẤU (vì normText đã bỏ dấu)
// =====================================================================
const SEMANTIC_DICTIONARY = {
  // 1. Từ điển cảm xúc (Mood)
  moods: {
    'buon': ['buon', 'sau', 'co don', 'nho', 'khoc', 'bi thuong', 'hoai niem', 'tam trang'],
    'hao-hung': ['hao hung', 'manh me', 'kieu hanh', 'chien dau', 'yeu nuoc', 'bi trang'],
    'vui': ['vui', 'tuoi sang', 'yeu doi', 'hai huoc', 'trao phung', 'cham biem'],
    'tinh-yeu': ['yeu', 'tinh', 'lang man', 'tuong tu', 'hen the', 'chia ly']
  },
  
  // 2. Từ điển ý định (Intent)
  intents: {
    // Factoid: Trả lời ngắn gọn, chính xác (KHÔNG chạy Pipeline)
    'factoid': [
      'ai viet', 'tac gia cua', 'cua ai', 'la ai', 'tom tat', 'noi dung chinh', 
      'bao nhieu cau', 'nam nao', 'thoi nao', 'the loai gi'
    ],
    // Deep Query: Kích hoạt Hội đồng chuyên gia (Pipeline)
    'analyze': ['phan tich', 'cam nhan', 'binh giang', 'y nghia', 'nghe thuat', 'danh gia', 'binh luan', 'mo bai'],
    'compare': ['so sanh', 'khac gi', 'giong gi', 'dat canh', 'doi chieu'],
    'recommend': ['goi y', 'tim giup', 'co bai nao', 'doc gi', 'tac pham nao', 'tuong tu', 'gioi thieu'],
    'fortune': ['gieo que', 'ngau nhien', 'chon giup', 'tam su', 'met moi', 'chan', 'boi']
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
    if (!cleanText) {
      return { 
        raw: '', normalized: '', coreKeyword: '', 
        intent: 'search', mood: null, isDeepQuery: false, isFactoid: false 
      };
    }

    // 1. Chuẩn hóa văn bản (Xóa dấu, lowercase)
    const normText = normalizeRouteText(cleanText);
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    // -----------------------------------------------------------------
    // 2. NHẬN DIỆN Ý ĐỊNH (INTENT)
    // -----------------------------------------------------------------
    let detectedIntent = 'search'; // Mặc định là tìm kiếm
    
    for (const [intent, keywords] of Object.entries(SEMANTIC_DICTIONARY.intents)) {
      // Sử dụng normalizeRouteText cho keyword để đảm bảo so khớp chính xác
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
    // 3. NHẬN DIỆN CẢM XÚC ẨN (MOOD)
    // -----------------------------------------------------------------
    let detectedMood = null;
    for (const [moodKey, synonyms] of Object.entries(SEMANTIC_DICTIONARY.moods)) {
      if (synonyms.some(syn => normText.includes(syn))) {
        detectedMood = moodKey;
        break;
      }
    }

    // -----------------------------------------------------------------
    // 4. BÓC TÁCH TỪ KHÓA CỐT LÕI (CORE KEYWORD)
    // -----------------------------------------------------------------
    // Loại bỏ các từ đệm, từ hỏi để tìm kiếm chính xác hơn.
    // Danh sách này đã được viết KHÔNG DẤU để khớp với normText.
    const stopWords = [
      'phan tich', 'cam nhan', 'tim giup', 'co bai nao', 've', 'cua', 'tac pham', 
      'bai tho', 'goi y', 'hay', 'cho toi', 'ai viet', 'tac gia cua', 'cua ai', 
      'tom tat', 'noi dung chinh', 'la gi', 'la ai', 'giup toi', 'hay la',
      'nhu the nao', 'the nao', 'ra sao', 'tai sao', 'vi sao'
    ];
    
    let coreKeyword = normText;
    stopWords.forEach(sw => {
      // Sử dụng regex \b để đảm bảo chỉ xóa nguyên từ, không xóa nhầm chữ con
      const regex = new RegExp(`\\b${sw}\\b`, 'g');
      coreKeyword = coreKeyword.replace(regex, '').trim();
    });

    // Dọn dẹp khoảng trắng thừa
    coreKeyword = coreKeyword.replace(/\s+/g, ' ').trim();

    // Nếu sau khi lọc mà không còn gì (VD: người dùng chỉ gõ "phân tích"),
    // trả về nguyên bản normText để Agent tự xử lý.
    if (!coreKeyword) coreKeyword = normText;

    // -----------------------------------------------------------------
    // 5. XÁC ĐỊNH LOẠI TRUY VẤN VÀ TRẢ VỀ
    // -----------------------------------------------------------------
    return {
      raw: cleanText,                     // Chuỗi gốc (VD: "Phân tích Tây Tiến")
      normalized: normText,               // Chuỗi đã bỏ dấu (VD: "phan tich tay tien")
      coreKeyword: coreKeyword,           // Từ khóa chính để tra cứu (VD: "tay tien")
      intent: detectedIntent,             // 'search' | 'factoid' | 'analyze' | 'compare' | 'recommend' | 'fortune'
      mood: detectedMood,                 // 'buon' | 'hao-hung' | 'vui' | 'tinh-yeu' | null
      
      // Các cờ (flags) tiện ích cho MasterAI
      isDeepQuery: ['analyze', 'compare', 'recommend'].includes(detectedIntent),
      isFactoid: detectedIntent === 'factoid'
    };
  }
};
