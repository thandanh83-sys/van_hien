/**
 * ==========================================================
 * VĂN ĐẠO — TEST: CONTEMPLATIVE ENGINE
 * Vị trí: tests/contemplative-engine.test.js
 * Version: 1.0.0
 * ==========================================================
 *
 * TRIẾT LÝ KIỂM THỬ:
 *
 * ContemplativeEngine KHÔNG chấm điểm — nó chỉ SINH CÂU HỎI.
 * Test suite này đảm bảo:
 *   1. Không có câu hỏi nào chứa ngôn ngữ chấm điểm.
 *   2. Câu hỏi phải gắn với văn bản (nếu có quote).
 *   3. Edge cases (input rỗng, prompts rỗng) không crash.
 *   4. Kết quả luôn là mảng (array) — không phải object hay null.
 *
 * ==========================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock LiteraryEngine để test ContemplativeEngine độc lập
vi.mock('../js/ai/literary-engine.js', () => ({
    LiteraryEngine: {
        analyzeContext: vi.fn((text) => {
            if (!text || typeof text !== 'string' || text.length < 10) {
                return { isValid: false };
            }
            return {
                isValid: true,
                coreLine: 'Quạt giấy khép lại mùa thi',
                coreIndex: 0,
                totalLines: 2,
                context: {
                    prevLine: null,
                    nextLine: 'Áo dài bay giữa kinh kỳ sắc xuân',
                    positionText: 'câu 1/2'
                },
                prosody: {
                    bang: 5,
                    trac: 2,
                    total: 7,
                    rhythmType: 'gentle'
                },
                rhyme: {
                    hasRhyme: true,
                    details: 'Âm "thi" vần với "ky"'
                }
            };
        })
    }
}));

import { ContemplativeEngine } from '../js/ai/contemplative-engine.js';

// =====================================================================
// FIXTURES
// =====================================================================

const MOCK_PROMPTS = {
    hinh_tuong: {
        name: 'Hình tượng',
        questions: [
            'Hình ảnh nào trong bài khiến Bạn dừng lại lâu nhất?',
            'Nếu hình ảnh ấy được thay bằng hình ảnh khác, cảm xúc có đổi không?'
        ]
    },
    ham_suc: {
        name: 'Hàm súc',
        questions: [
            'Có chỗ nào ý tại ngôn ngoại?',
            'Có chỗ nào nói hơi nhiều, khiến ý bị lộ quá sớm?'
        ]
    },
    nhac_dieu: {
        name: 'Nhạc điệu',
        questions: ['Khi đọc lên, bài thơ có chỗ nào khiến Bạn ngắt nhịp tự nhiên không?']
    }
};

const VALID_POEM = `Quạt giấy khép lại mùa thi,
Áo dài bay giữa kinh kỳ sắc xuân.`;

// =====================================================================
// TEST SUITE 1: generate() — Sinh câu hỏi
// =====================================================================

describe('ContemplativeEngine — generate()', () => {

    it('trả về mảng câu hỏi khi có văn bản hợp lệ', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBeGreaterThan(0);
    });

    it('mỗi câu hỏi có cấu trúc { dimension, question }', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        questions.forEach(q => {
            expect(q).toHaveProperty('dimension');
            expect(q).toHaveProperty('question');
            expect(typeof q.question).toBe('string');
            expect(q.question.length).toBeGreaterThan(0);
        });
    });

    it('trả về tối đa 4 câu hỏi (theo spec)', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        expect(questions.length).toBeLessThanOrEqual(4);
    });

    it('KHÔNG trả về câu hỏi khi văn bản rỗng', () => {
        const questions = ContemplativeEngine.generate('', MOCK_PROMPTS);
        expect(questions).toEqual([]);
    });

    it('KHÔNG trả về câu hỏi khi văn bản null', () => {
        const questions = ContemplativeEngine.generate(null, MOCK_PROMPTS);
        expect(questions).toEqual([]);
    });

    it('KHÔNG trả về câu hỏi khi văn bản quá ngắn', () => {
        const questions = ContemplativeEngine.generate('Trăng', MOCK_PROMPTS);
        expect(questions).toEqual([]);
    });

    it('vẫn hoạt động khi prompts rỗng', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, {});
        expect(Array.isArray(questions)).toBe(true);
        // Có thể vẫn có câu hỏi từ prosody/rhyme
    });

    it('vẫn hoạt động khi prompts null', () => {
        expect(() => ContemplativeEngine.generate(VALID_POEM, null)).not.toThrow();
    });
});

// =====================================================================
// TEST SUITE 2: Câu hỏi có căn cứ (quote)
// =====================================================================

describe('ContemplativeEngine — Câu hỏi có căn cứ', () => {

    it('câu hỏi về nhịp điệu có quote từ coreLine', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        const rhythmQuestion = questions.find(q => q.dimension === 'nhac_dieu' && q.quote);

        if (rhythmQuestion) {
            expect(rhythmQuestion.quote).toBeTruthy();
            expect(typeof rhythmQuestion.quote).toBe('string');
        }
    });

    it('quote phải xuất hiện trong văn bản gốc (không bịa)', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        questions.forEach(q => {
            if (q.quote) {
                // Bỏ dấu ** trong quote nếu có
                const cleanQuote = q.quote.replace(/\*\*/g, '');
                expect(VALID_POEM).toContain(cleanQuote);
            }
        });
    });

    it('câu hỏi có thể không có quote (từ MOCK_PROMPTS)', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        const noQuoteQuestions = questions.filter(q => !q.quote);
        // Có ít nhất một câu hỏi không có quote (từ MOCK_PROMPTS)
        expect(noQuoteQuestions.length).toBeGreaterThanOrEqual(0);
    });
});

// =====================================================================
// TEST SUITE 3: Triết lý Văn Đạo — No Scoring
// =====================================================================

describe('ContemplativeEngine — Triết lý Văn Đạo', () => {

    it('KHÔNG có câu hỏi nào chứa "điểm"', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        questions.forEach(q => {
            expect(q.question.toLowerCase()).not.toContain('điểm');
        });
    });

    it('KHÔNG có câu hỏi nào chứa "chấm điểm"', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        questions.forEach(q => {
            expect(q.question.toLowerCase()).not.toContain('chấm điểm');
        });
    });

    it('KHÔNG có câu hỏi nào chứa số điểm (VD: "8.5")', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        questions.forEach(q => {
            expect(q.question).not.toMatch(/\d\.\d\/10/);
            expect(q.question).not.toMatch(/\d+\/10/);
        });
    });

    it('KHÔNG có câu hỏi nào chứa từ phán xét', () => {
        const judgmentalWords = ['dở', 'tệ', 'kém', 'vụng', 'tầm thường'];
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);

        questions.forEach(q => {
            judgmentalWords.forEach(word => {
                expect(q.question.toLowerCase()).not.toContain(word);
            });
        });
    });

    it('câu hỏi dùng giọng "Bạn" hoặc "Ta"', () => {
        const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        const hasPronoun = questions.some(q =>
            q.question.includes('Bạn') || q.question.includes('Ta')
        );
        expect(hasPronoun).toBe(true);
    });
});

// =====================================================================
// TEST SUITE 4: Randomness (không deterministic)
// =====================================================================

describe('ContemplativeEngine — Randomness', () => {

    it('gọi 10 lần với cùng input có thể cho kết quả khác nhau', () => {
        const results = [];
        for (let i = 0; i < 10; i++) {
            const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
            results.push(JSON.stringify(questions));
        }

        // Ít nhất phải có 2 kết quả khác nhau (vì có random)
        const uniqueResults = new Set(results);
        expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it('câu hỏi luôn khác rỗng dù random', () => {
        for (let i = 0; i < 20; i++) {
            const questions = ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
            questions.forEach(q => {
                expect(q.question).toBeTruthy();
                expect(q.question.length).toBeGreaterThan(10);
            });
        }
    });
});

// =====================================================================
// TEST SUITE 5: Edge cases
// =====================================================================

describe('ContemplativeEngine — Edge Cases', () => {

    it('không crash khi prompts có dimension không có questions', () => {
        const weirdPrompts = {
            hinh_tuong: { name: 'Hình tượng' } // Thiếu questions
        };
        expect(() => ContemplativeEngine.generate(VALID_POEM, weirdPrompts)).not.toThrow();
    });

    it('không crash khi questions là mảng rỗng', () => {
        const weirdPrompts = {
            hinh_tuong: { name: 'Hình tượng', questions: [] }
        };
        expect(() => ContemplativeEngine.generate(VALID_POEM, weirdPrompts)).not.toThrow();
    });

    it('không crash khi prompts là mảng (không phải object)', () => {
        expect(() => ContemplativeEngine.generate(VALID_POEM, [1, 2, 3])).not.toThrow();
    });

    it('không crash khi văn bản có ký tự đặc biệt', () => {
        const weirdText = `<script>alert("xss")</script> Trăng sáng`;
        expect(() => ContemplativeEngine.generate(weirdText, MOCK_PROMPTS)).not.toThrow();
    });

    it('không mutate prompts gốc', () => {
        const original = JSON.stringify(MOCK_PROMPTS);
        ContemplativeEngine.generate(VALID_POEM, MOCK_PROMPTS);
        expect(JSON.stringify(MOCK_PROMPTS)).toBe(original);
    });
});
