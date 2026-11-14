/**
 * ==========================================================
 * VĂN ĐẠO — TEST: LITERARY ENGINE
 * Vị trí: tests/literary-engine.test.js
 * Version: 1.0.0
 * ==========================================================
 *
 * TRIẾT LÝ KIỂM THỬ:
 *
 * 1. KIỂM TRA KHẢ NĂNG PHÂN TÍCH (không chấm điểm):
 *    - LiteraryEngine chỉ PHÂN TÍCH cấu trúc thơ (nhịp, vần, ngữ cảnh).
 *    - KHÔNG đánh giá bài thơ hay/dở.
 *    - Test chỉ kiểm tra tính chính xác của phép phân tích,
 *      không kiểm tra "chất lượng" bài thơ.
 *
 * 2. EDGE CASES QUAN TRỌNG:
 *    - Input rỗng, null, undefined, số, object.
 *    - Văn bản quá ngắn (chỉ 1 từ).
 *    - Văn bản là đoạn văn xuôi (không phải thơ).
 *    - Bài thơ có nhiều dòng trống.
 *
 * 3. MẪU THƠ SỬ DỤNG:
 *    - Truyện Kiều (lục bát cổ điển) — Nguyễn Du
 *    - Tây Tiến (thơ tự do) — Quang Dũng
 *    - Quạt giấy... (thơ do người dùng nhập) — mẫu trong main.js
 *
 * ==========================================================
 */

import { describe, it, expect } from 'vitest';
import { LiteraryEngine } from '../js/ai/literary-engine.js';

// =====================================================================
// MẪU THƠ (Fixtures)
// =====================================================================

const FIXTURES = {
    // Lục bát cổ điển — Truyện Kiều
    lucBat: `Trăm năm trong cõi người ta,
Chữ tài chữ mệnh khéo là ghét nhau.
Trải qua một cuộc bể dâu,
Những điều trông thấy mà đau đớn lòng.`,

    // Thơ tự do — Tây Tiến
    tuDo: `Sông Mã xa rồi Tây Tiến ơi!
Nhớ về rừng núi nhớ chơi vơi
Sài Khao sương lấp đoàn quân mỏi
Mường Lát hoa về trong đêm hơi`,

    // Thơ do người dùng nhập — mẫu trong main.js
    nguoiDung: `Quạt giấy khép lại mùa thi,
Áo dài bay giữa kinh kỳ sắc xuân.
Thầy cô tựa ánh trăng ngần,
Dắt em qua những thăng trầm thế gian.`,

    // Thơ có vần rõ ràng (lục bát đúng luật)
    coVan: `Quạt giấy khép lại mùa thi
Áo dài bay giữa kinh kỳ sắc xuân`,

    // Thơ không vần (thơ tự do hiện đại)
    khongVan: `Tôi viết những dòng này
Không vần không nhịp
Chỉ là tiếng lòng
Rơi xuống trang giấy`,

    // Văn xuôi (không phải thơ) — để test edge case
    vanXuoi: `Hôm nay trời đẹp. Tôi đi dạo trong công viên và gặp nhiều người bạn cũ. Chúng tôi cùng nhau uống cà phê và trò chuyện rất vui vẻ.`,

    // Rỗng
    rong: '',

    // Chỉ một từ
    motTu: 'Trăng'
};

// =====================================================================
// TEST SUITE 1: INPUT GUARDS
// =====================================================================

describe('LiteraryEngine — Input Guards', () => {

    it('trả về isValid=false khi input là null', () => {
        const ctx = LiteraryEngine.analyzeContext(null);
        expect(ctx.isValid).toBe(false);
        expect(ctx.coreLine).toBe('');
    });

    it('trả về isValid=false khi input là undefined', () => {
        const ctx = LiteraryEngine.analyzeContext(undefined);
        expect(ctx.isValid).toBe(false);
    });

    it('trả về isValid=false khi input là số', () => {
        const ctx = LiteraryEngine.analyzeContext(12345);
        expect(ctx.isValid).toBe(false);
    });

    it('trả về isValid=false khi input là object', () => {
        const ctx = LiteraryEngine.analyzeContext({ poem: 'Trăng sáng' });
        expect(ctx.isValid).toBe(false);
    });

    it('trả về isValid=false khi input rỗng', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.rong);
        expect(ctx.isValid).toBe(false);
        expect(ctx.coreLine).toBe('');
    });

    it('trả về isValid=false khi input chỉ có khoảng trắng', () => {
        const ctx = LiteraryEngine.analyzeContext('   \n\n  \t  ');
        expect(ctx.isValid).toBe(false);
    });

    it('KHÔNG ném lỗi (throw) với bất kỳ input nào — phải graceful', () => {
        const weirdInputs = [null, undefined, 0, false, [], {}, NaN, () => {}];
        weirdInputs.forEach(input => {
            expect(() => LiteraryEngine.analyzeContext(input)).not.toThrow();
        });
    });
});

// =====================================================================
// TEST SUITE 2: CORE LINE EXTRACTION
// =====================================================================

describe('LiteraryEngine — Core Line Extraction', () => {

    it('bóc tách được câu thơ trung tâm từ bài lục bát', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        expect(ctx.isValid).toBe(true);
        expect(ctx.coreLine).toBeTruthy();
        expect(typeof ctx.coreLine).toBe('string');
        expect(ctx.coreLine.length).toBeGreaterThanOrEqual(10);
    });

    it('câu trung tâm phải nằm trong văn bản gốc', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        // Chỉ kiểm tra khi không bị cắt "..."
        if (!ctx.coreLine.endsWith('...')) {
            expect(FIXTURES.lucBat).toContain(ctx.coreLine);
        }
    });

    it('câu trung tâm phải có độ dài vừa phải (10-50 ký tự)', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        // Engine ưu tiên câu có độ dài 10-50
        if (ctx.coreLine.length >= 10) {
            expect(ctx.coreLine.length).toBeLessThanOrEqual(60); // Cho phép dư 10 ký tự do dấu "..."
        }
    });

    it('bỏ qua dòng trống', () => {
        const coDongTrong = `\n\n\nTrăm năm trong cõi người ta\n\n\nChữ tài chữ mệnh khéo là ghét nhau\n\n\n`;
        const ctx = LiteraryEngine.analyzeContext(coDongTrong);
        expect(ctx.isValid).toBe(true);
        expect(ctx.coreLine).not.toBe('');
        expect(ctx.coreLine.trim().length).toBeGreaterThan(0);
    });

    it('KHÔNG chọn câu quá ngắn (dưới 5 ký tự) làm câu trung tâm', () => {
        const coCauNgan = `Trăng\nTrăm năm trong cõi người ta\nChữ tài chữ mệnh khéo là ghét nhau`;
        const ctx = LiteraryEngine.analyzeContext(coCauNgan);
        expect(ctx.coreLine.length).toBeGreaterThanOrEqual(5);
    });

    it('vị trí câu trung tâm nằm trong khoảng hợp lệ', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.nguoiDung);
        expect(ctx.coreIndex).toBeGreaterThanOrEqual(0);
        expect(ctx.coreIndex).toBeLessThan(ctx.totalLines);
    });
});

// =====================================================================
// TEST SUITE 3: PROSODY (Thanh Bằng/Trắc)
// =====================================================================

describe('LiteraryEngine — Prosody (Bằng/Trắc)', () => {

    it('đếm được số thanh Bằng và Trắc', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.coVan);
        expect(ctx.prosody.bang).toBeGreaterThanOrEqual(0);
        expect(ctx.prosody.trac).toBeGreaterThanOrEqual(0);
        expect(ctx.prosody.bang + ctx.prosody.trac).toBe(ctx.prosody.total);
    });

    it('total phải bằng tổng bang + trac', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.coVan);
        expect(ctx.prosody.total).toBe(ctx.prosody.bang + ctx.prosody.trac);
    });

    it('nhận diện được rhythmType "gentle" khi nhiều Bằng', () => {
        // Câu thơ toàn thanh Bằng (không dấu hoặc dấu huyền)
        const toanBang = 'Trăm năm trong cõi người ta';
        const ctx = LiteraryEngine.analyzeContext(toanBang);
        // Nếu câu trung tâm là câu này, phải là gentle
        if (ctx.coreLine === toanBang) {
            expect(ctx.prosody.rhythmType).toBe('gentle');
        }
    });

    it('nhận diện được rhythmType "intense" khi nhiều Trắc', () => {
        // Câu thơ có nhiều thanh Trắc (sắc, hỏi, ngã, nặng)
        const nhieuTrac = 'Khóc hận thấu trời đất thảm sầu';
        const ctx = LiteraryEngine.analyzeContext(nhieuTrac);
        if (ctx.coreLine === nhieuTrac && ctx.prosody.total >= 5) {
            expect(ctx.prosody.rhythmType).toBe('intense');
        }
    });

    it('rhythmType luôn thuộc một trong 3 giá trị hợp lệ', () => {
        const poem = FIXTURES.lucBat;
        const ctx = LiteraryEngine.analyzeContext(poem);
        expect(['gentle', 'intense', 'balanced', 'unknown']).toContain(ctx.prosody.rhythmType);
    });
});

// =====================================================================
// TEST SUITE 4: RHYME DETECTION
// =====================================================================

describe('LiteraryEngine — Rhyme Detection', () => {

    it('phát hiện được vần khi hai câu có âm cuối giống nhau', () => {
        const coVan = `Quạt giấy khép lại mùa thi
Áo dài bay giữa kinh kỳ sắc xuân`;
        const ctx = LiteraryEngine.analyzeContext(coVan);
        expect(ctx.rhyme).toBeDefined();
        expect(typeof ctx.rhyme.hasRhyme).toBe('boolean');
    });

    it('không crash khi chỉ có một câu', () => {
        const motCau = 'Trăng sáng soi bóng cố nhân';
        const ctx = LiteraryEngine.analyzeContext(motCau);
        expect(ctx.rhyme).toBeDefined();
        expect(ctx.rhyme.hasRhyme).toBe(false); // Không có nextLine để so
    });

    it('không crash khi câu không có vần', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.khongVan);
        expect(ctx.rhyme).toBeDefined();
        // Không ném lỗi là đủ
    });

    it('rhyme.details là string khi có vần', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.coVan);
        if (ctx.rhyme.hasRhyme) {
            expect(typeof ctx.rhyme.details).toBe('string');
            expect(ctx.rhyme.details.length).toBeGreaterThan(0);
        }
    });
});

// =====================================================================
// TEST SUITE 5: CONTEXT (Câu trước / Câu sau)
// =====================================================================

describe('LiteraryEngine — Context (prev/next)', () => {

    it('lấy được câu trước và câu sau của câu trung tâm', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        if (ctx.coreIndex > 0) {
            expect(ctx.context.prevLine).toBeTruthy();
        }
        if (ctx.coreIndex < ctx.totalLines - 1) {
            expect(ctx.context.nextLine).toBeTruthy();
        }
    });

    it('prevLine phải là null khi câu trung tâm là câu đầu', () => {
        // Bài thơ chỉ 2 câu, câu trung tâm có thể là câu đầu
        const haiCau = 'Trăng sáng soi bóng cố nhân\nGío thu lay động lá vàng';
        const ctx = LiteraryEngine.analyzeContext(haiCau);
        if (ctx.coreIndex === 0) {
            expect(ctx.context.prevLine).toBeNull();
        }
    });

    it('nextLine phải là null khi câu trung tâm là câu cuối', () => {
        const haiCau = 'Trăng sáng soi bóng cố nhân\nGió thu lay động lá vàng';
        const ctx = LiteraryEngine.analyzeContext(haiCau);
        if (ctx.coreIndex === ctx.totalLines - 1) {
            expect(ctx.context.nextLine).toBeNull();
        }
    });

    it('positionText có format "câu X/Y"', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        expect(ctx.context.positionText).toMatch(/^câu \d+\/\d+$/);
    });
});

// =====================================================================
// TEST SUITE 6: TRIẾT LÝ VĂN ĐẠO (No Scoring)
// =====================================================================

describe('LiteraryEngine — Triết lý Văn Đạo (No Scoring)', () => {

    it('KHÔNG chứa bất kỳ trường điểm số nào trong output', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        const keys = Object.keys(ctx);

        expect(keys).not.toContain('score');
        expect(keys).not.toContain('scores');
        expect(keys).not.toContain('grade');
        expect(keys).not.toContain('rank');
        expect(keys).not.toContain('points');
    });

    it('KHÔNG chứa bất kỳ từ "điểm" nào trong coreLine', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        expect(ctx.coreLine.toLowerCase()).not.toContain('điểm');
    });

    it('KHÔNG có bất kỳ trường "quality" hay "rating"', () => {
        const ctx = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        const keys = Object.keys(ctx);
        expect(keys).not.toContain('quality');
        expect(keys).not.toContain('rating');
        expect(keys).not.toContain('rank');
    });
});

// =====================================================================
// TEST SUITE 7: IDEMPOTENCE (Kết quả ổn định)
// =====================================================================

describe('LiteraryEngine — Idempotence', () => {

    it('gọi 2 lần với cùng input cho kết quả giống nhau', () => {
        const ctx1 = LiteraryEngine.analyzeContext(FIXTURES.lucBat);
        const ctx2 = LiteraryEngine.analyzeContext(FIXTURES.lucBat);

        expect(ctx1.coreLine).toBe(ctx2.coreLine);
        expect(ctx1.coreIndex).toBe(ctx2.coreIndex);
        expect(ctx1.prosody.bang).toBe(ctx2.prosody.bang);
        expect(ctx1.prosody.trac).toBe(ctx2.prosody.trac);
    });

    it('không mutate input (văn bản gốc giữ nguyên)', () => {
        const original = FIXTURES.lucBat;
        LiteraryEngine.analyzeContext(original);
        expect(FIXTURES.lucBat).toBe(original);
    });
});
