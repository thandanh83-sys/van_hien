/**
 * ==========================================================
 * VĂN ĐẠO AI - LITERARY REASONING ENGINE
 * Vị trí: js/ai/literary-engine.js
 * Version: 2.0.0 (Deep Context & Prosody Analysis)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * 1. Không cắt chuỗi vô hồn: Sử dụng bộ lọc Stopwords để loại bỏ
 *    các từ rác (ai, là, gì, thế nào). Chỉ chọn câu thơ thực sự.
 * 2. Phân tích Thanh điệu (Prosody): Đếm số lượng Bằng (Ngang, Huyền)
 *    và Trắc (Sắc, Hỏi, Ngã, Nặng) để hiểu nhịp điệu cảm xúc.
 * 3. Phân tích Ngữ cảnh (Context): Lấy câu trước, câu sau để AI
 *    có cái nhìn toàn cảnh, không đánh giá câu thơ một cách cục bộ.
 * ==========================================================
 */

import { isStopword } from './nlp-tools.js';

export const LiteraryEngine = {
    /**
     * Bóc tách gói ngữ cảnh từ văn bản thô.
     * 
     * @param {string} rawText - Văn bản người dùng nhập.
     * @param {string} workTitle - Tên tác phẩm (nếu có).
     * @returns {Object} Gói ngữ cảnh (Context Package).
     */
    analyzeContext(rawText, workTitle = '') {
        if (!rawText || typeof rawText !== 'string') {
            return this._getEmptyPackage();
        }

        // 1. Tách dòng và làm sạch
        const rawLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // 2. Lọc bỏ các dòng rác (quá ngắn hoặc chứa toàn stopwords)
        const validLines = rawLines.filter(line => {
            if (line.length < 5) return false; // Quá ngắn (như "ai")
            const words = line.split(/\s+/);
            const meaningfulWords = words.filter(w => !isStopword(w) && w.length > 1);
            return meaningfulWords.length > 0; // Phải có ít nhất 1 từ có nghĩa
        });

        // Nếu không có dòng nào hợp lệ, lấy tạm dòng dài nhất bất chấp
        const linesToUse = validLines.length > 0 ? validLines : [rawLines.reduce((a, b) => a.length > b.length ? a : b, '')];

        // 3. Tìm "Câu thơ trung tâm" (Core Line)
        // Ưu tiên câu dài nhất trong các dòng hợp lệ
        let coreIndex = 0;
        let maxLength = 0;
        linesToUse.forEach((line, idx) => {
            if (line.length > maxLength) {
                maxLength = line.length;
                coreIndex = idx;
            }
        });

        const coreLine = linesToUse[coreIndex];

        // 4. Lấy ngữ cảnh (câu trước, câu sau)
        const prevLine = coreIndex > 0 ? linesToUse[coreIndex - 1] : null;
        const nextLine = coreIndex < linesToUse.length - 1 ? linesToUse[coreIndex + 1] : null;

        // 5. Phân tích Thanh điệu và Vần
        const prosody = this._analyzeProsody(coreLine);
        const rhyme = this._findRhyme(coreLine, nextLine);

        return {
            isValid: true,
            workTitle,
            coreLine,
            coreIndex,
            totalLines: linesToUse.length,
            context: {
                prevLine,
                nextLine,
                positionText: `câu ${coreIndex + 1}/${linesToUse.length}`
            },
            prosody,
            rhyme
        };
    },

    /**
     * Phân tích thanh điệu (Bằng/Trắc) của một câu thơ.
     */
    _analyzeProsody(line) {
        if (!line) return { bang: 0, trac: 0, rhythmType: 'unknown' };

        // Tách thành các từ (chữ)
        const words = line.match(/[\p{L}\p{N}]+/gu) || [];
        let bang = 0;
        let trac = 0;

        words.forEach(word => {
            const nfd = word.normalize('NFD');
            // Thanh Sắc (\u0301), Hỏi (\u0309), Ngã (\u0303), Nặng (\u0323) là Trắc
            if (nfd.includes('\u0301') || nfd.includes('\u0309') || nfd.includes('\u0303') || nfd.includes('\u0323')) {
                trac++;
            } else {
                bang++; // Ngang hoặc Huyền
            }
        });

        let rhythmType = 'balanced';
        if (bang > trac * 1.5) rhythmType = 'gentle';
        else if (trac > bang * 1.5) rhythmType = 'intense';

        return { bang, trac, total: words.length, rhythmType };
    },

    /**
     * Tìm vần điệu sơ bộ (chỉ kiểm tra âm cuối).
     */
    _findRhyme(line1, line2) {
        if (!line1 || !line2) return { hasRhyme: false, details: '' };
        
        const getLastSyllable = (l) => {
            const words = l.match(/[\p{L}\p{N}]+/gu) || [];
            return words[words.length - 1] || '';
        };

        const w1 = getLastSyllable(line1);
        const w2 = getLastSyllable(line2);
        
        if (!w1 || !w2) return { hasRhyme: false, details: '' };

        // So sánh âm tiết cuối (đơn giản hóa, không cần chính xác tuyệt đối)
        const normalize = (w) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const hasRhyme = normalize(w1) === normalize(w2) || normalize(w1).slice(-1) === normalize(w2).slice(-1);

        return { 
            hasRhyme, 
            details: hasRhyme ? `Âm "${w1}" vần với "${w2}"` : '' 
        };
    },

    _getEmptyPackage() {
        return {
            isValid: false,
            workTitle: '',
            coreLine: '',
            coreIndex: -1,
            totalLines: 0,
            context: { prevLine: null, nextLine: null, positionText: '' },
            prosody: { bang: 0, trac: 0, rhythmType: 'unknown' },
            rhyme: { hasRhyme: false, details: '' }
        };
    }
};
