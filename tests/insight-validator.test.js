/**
 * ==========================================================
 * VĂN ĐẠO — TEST: INSIGHT VALIDATOR
 * Vị trí: tests/insight-validator.test.js
 * Version: 1.0.0
 * ==========================================================
 *
 * TRIẾT LÝ KIỂM THỬ:
 *
 * Validator này KHÔNG CHẤM ĐIỂM văn chương — nó chỉ kiểm tra
 * KỶ LUẬT CỦA SỰ TINH TẾ:
 *   1. Không bịa dẫn chứng (evidence phải có trong văn bản gốc).
 *   2. Không phán xét cay nghiệt (không "dở", "tệ", "kém").
 *   3. Không khen sáo rỗng mà không có trích dẫn.
 *
 * Test suite kiểm tra 3 trụ cột này + edge cases.
 *
 * ==========================================================
 */

import { describe, it, expect } from 'vitest';
import { InsightValidator } from '../js/ai/validators/insight-validator.js';

// =====================================================================
// FIXTURES — Văn bản gốc dùng để kiểm tra
// =====================================================================

const ORIGINAL_TEXT = `Quạt giấy khép lại mùa thi,
Áo dài bay giữa kinh kỳ sắc xuân.
Thầy cô tựa ánh trăng ngần,
Dắt em qua những thăng trầm thế gian.`;

const VALID_QUOTE = 'Quạt giấy khép lại mùa thi';
const INVALID_QUOTE = 'Trăng vàng soi bóng cố nhân';

// =====================================================================
// TEST SUITE 1: validateEvidence — Chống bịa dẫn chứng
// =====================================================================

describe('InsightValidator — validateEvidence', () => {

    it('chấp nhận trích dẫn đúng (có trong văn bản gốc)', () => {
        const insight = { quote: VALID_QUOTE, content: 'Đẹp ở chữ "khép"' };
        const result = InsightValidator.validateEvidence(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(true);
    });

    it('chấp nhận trích dẫn đúng dù khác hoa/thường', () => {
        const insight = { quote: VALID_QUOTE.toLowerCase(), content: 'Đẹp' };
        const result = InsightValidator.validateEvidence(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(true);
    });

    it('chấp nhận trích dẫn đúng dù khác khoảng trắng', () => {
        const insight = { quote: 'Quạt giấy   khép  lại mùa thi', content: 'Đẹp' };
        const result = InsightValidator.validateEvidence(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(true);
    });

    it('từ chối trích dẫn bịa (không có trong văn bản gốc)', () => {
        const insight = { quote: INVALID_QUOTE, content: 'Đẹp' };
        const result = InsightValidator.validateEvidence(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('không khớp');
    });

    it('chấp nhận insight không có quote (chỉ content)', () => {
        const insight = { content: 'Một góc nhìn riêng' };
        const result = InsightValidator.validateEvidence(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(true);
    });

    it('không crash khi insight là null', () => {
        expect(() => InsightValidator.validateEvidence(null, ORIGINAL_TEXT)).not.toThrow();
    });

    it('không crash khi originalText là null', () => {
        const insight = { quote: VALID_QUOTE };
        expect(() => InsightValidator.validateEvidence(insight, null)).not.toThrow();
    });

    it('từ chối khi originalText null mà có quote', () => {
        const insight = { quote: VALID_QUOTE };
        const result = InsightValidator.validateEvidence(insight, null);
        expect(result.valid).toBe(false);
    });
});

// =====================================================================
// TEST SUITE 2: validateTone — Chống phán xét cay nghiệt
// =====================================================================

describe('InsightValidator — validateTone', () => {

    it('chấp nhận giọng gợi mở (không phán xét)', () => {
        const insight = { content: 'Ta tự hỏi: nếu đổi chữ "khép" thành "mở" thì sao?' };
        const result = InsightValidator.validateTone(insight);
        expect(result.valid).toBe(true);
    });

    it('từ chối từ "dở"', () => {
        const insight = { content: 'Câu thơ này viết rất dở' };
        const result = InsightValidator.validateTone(insight);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('dở');
    });

    it('từ chối từ "tệ"', () => {
        const insight = { content: 'Bài thơ này thật tệ' };
        const result = InsightValidator.validateTone(insight);
        expect(result.valid).toBe(false);
    });

    it('từ chối từ "kém"', () => {
        const insight = { content: 'Cách diễn đạt còn kém' };
        const result = InsightValidator.validateTone(insight);
        expect(result.valid).toBe(false);
    });

    it('từ chối từ "vụng"', () => {
        const insight = { content: 'Câu chữ còn vụng về' };
        const result = InsightValidator.validateTone(insight);
        expect(result.valid).toBe(false);
    });

    it('từ chối từ "tầm thường"', () => {
        const insight = { content: 'Ý thơ tầm thường' };
        const result = InsightValidator.validateTone(insight);
        expect(result.valid).toBe(false);
    });

    it('từ chối từ "nhạt nhẽo"', () => {
        const insight = { content: 'Bài thơ nhạt nhẽo' };
        const result = InsightValidator.validateTone(insight);
        expect(result.valid).toBe(false);
    });

    it('chấp nhận khi content rỗng (không có gì để phán xét)', () => {
        const insight = { content: '' };
        const result = InsightValidator.validateTone(insight);
        expect(result.valid).toBe(true);
    });

    it('không crash khi insight null', () => {
        expect(() => InsightValidator.validateTone(null)).not.toThrow();
    });
});

// =====================================================================
// TEST SUITE 3: validateSpecificity — Chống khen sáo rỗng
// =====================================================================

describe('InsightValidator — validateSpecificity', () => {

    it('chấp nhận khen CÓ trích dẫn cụ thể', () => {
        const insight = {
            quote: VALID_QUOTE,
            content: `Đẹp ở câu "${VALID_QUOTE}" vì chữ "khép" gợi cả một mùa`
        };
        const result = InsightValidator.validateSpecificity(insight);
        expect(result.valid).toBe(true);
    });

    it('từ chối khen sáo rỗng KHÔNG có trích dẫn', () => {
        const insight = { content: 'Bài thơ này rất hay' };
        const result = InsightValidator.validateSpecificity(insight);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('sáo rỗng');
    });

    it('từ chối "tuyệt vời" không có quote', () => {
        const insight = { content: 'Một bài thơ tuyệt vời' };
        const result = InsightValidator.validateSpecificity(insight);
        expect(result.valid).toBe(false);
    });

    it('từ chối "xuất sắc" không có quote', () => {
        const insight = { content: 'Đây là một tác phẩm xuất sắc' };
        const result = InsightValidator.validateSpecificity(insight);
        expect(result.valid).toBe(false);
    });

    it('chấp nhận "hay" nếu có quote kèm theo', () => {
        const insight = {
            quote: VALID_QUOTE,
            content: `Câu "${VALID_QUOTE}" rất hay ở chữ "khép"`
        };
        const result = InsightValidator.validateSpecificity(insight);
        expect(result.valid).toBe(true);
    });

    it('chấp nhận nhận xét trung tính (không khen, không chê)', () => {
        const insight = { content: 'Câu thơ có cấu trúc lục bát chuẩn' };
        const result = InsightValidator.validateSpecificity(insight);
        expect(result.valid).toBe(true);
    });
});

// =====================================================================
// TEST SUITE 4: validate — Kiểm tra tổng hợp
// =====================================================================

describe('InsightValidator — validate (tổng hợp)', () => {

    it('insight hoàn hảo — pass cả 3 tiêu chí', () => {
        const insight = {
            quote: VALID_QUOTE,
            content: `Ta thấy đẹp ở câu "${VALID_QUOTE}" — chữ "khép" gợi cả một mùa`
        };
        const result = InsightValidator.validate(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(true);
        expect(result.failures).toEqual([]);
    });

    it('insight bịa dẫn chứng — fail', () => {
        const insight = {
            quote: INVALID_QUOTE,
            content: 'Đẹp'
        };
        const result = InsightValidator.validate(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(false);
        expect(result.failures.length).toBeGreaterThan(0);
    });

    it('insight phán xét — fail', () => {
        const insight = {
            quote: VALID_QUOTE,
            content: 'Bài thơ này thật dở'
        };
        const result = InsightValidator.validate(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(false);
    });

    it('insight sáo rỗng — fail', () => {
        const insight = { content: 'Bài thơ rất hay' };
        const result = InsightValidator.validate(insight, ORIGINAL_TEXT);
        expect(result.valid).toBe(false);
    });

    it('failures là mảng và chứa chi tiết lỗi', () => {
        const insight = {
            quote: INVALID_QUOTE,
            content: 'Bài thơ rất tệ'
        };
        const result = InsightValidator.validate(insight, ORIGINAL_TEXT);
        expect(Array.isArray(result.failures)).toBe(true);
        expect(result.failures.length).toBeGreaterThanOrEqual(1);
    });
});

// =====================================================================
// TEST SUITE 5: Triết lý Văn Đạo
// =====================================================================

describe('InsightValidator — Triết lý Văn Đạo', () => {

    it('KHÔNG có method nào chấm điểm', () => {
        expect(InsightValidator.score).toBeUndefined();
        expect(InsightValidator.grade).toBeUndefined();
        expect(InsightValidator.rank).toBeUndefined();
    });

    it('KHÔNG có method nào trả về số điểm', () => {
        const insight = { quote: VALID_QUOTE, content: 'Đẹp' };
        const result = InsightValidator.validate(insight, ORIGINAL_TEXT);
        expect(typeof result.valid).toBe('boolean');
        expect(result.score).toBeUndefined();
    });

    it('reason không chứa từ "điểm"', () => {
        const insight = { content: 'Bài thơ tệ' };
        const result = InsightValidator.validateTone(insight);
        expect(result.reason.toLowerCase()).not.toContain('điểm');
    });
});
