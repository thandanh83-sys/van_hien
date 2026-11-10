// ============================================================
// VĂN ĐẠO ENGINE - REGRESSION TEST (THI PHÁP HỌC)
// File: test-poem.js
// Tác giả: Văn Đạo
// Mô tả: Kiểm thử tự động bộ máy phân tích thi pháp (POETRY_ANALYZER).
// Tuân thủ quy tắc: 100% Text, KHÔNG dùng Emoji/Icon Unicode.
// ============================================================

(function() {
    const CASES = [
        {
            id: 'luc-bat-2-cau',
            name: 'Lục bát tiêu chuẩn (2 câu)',
            input: 'Trăm năm trong cõi người ta\nChữ tài chữ mệnh khéo là ghét nhau',
            expect: { form: 'Lục bát', lineCount: 2, counts: [6, 8] }
        },
        {
            id: 'luc-bat-4-cau',
            name: 'Lục bát kéo dài (4 câu)',
            input: 'Trăm năm trong cõi người ta\nChữ tài chữ mệnh khéo là ghét nhau\nTrải qua một cuộc bể dâu\nNhững điều trông thấy mà đau đớn lòng',
            expect: { form: 'Lục bát', lineCount: 4, counts: [6, 8, 6, 8] }
        },
        {
            id: 'luc-bat-bien-the',
            name: 'Lục bát biến thể (6-8-6)',
            input: 'Quạt giấy khép lại mùa thi\nÁo dài bay giữa kinh kỳ sắc xuân\nThầy cô tựa ánh trăng ngần',
            expect: { form: 'Hình thức sáu-tám (biến thể)' } // 3 câu không theo chu kỳ chẵn
        },
        {
            id: 'that-ngon-tu-tuyet',
            name: 'Thất ngôn tứ tuyệt (4 câu)',
            input: 'Bước tới Đèo Ngang bóng xế tà\nCỏ cây chen đá lá chen hoa\nLom khom dưới núi tiều vài chú\nLác đác bên sông rợ mấy nhà',
            expect: { form: 'Thất ngôn tứ tuyệt', lineCount: 4, counts: [7, 7, 7, 7] }
        },
        {
            id: 'that-ngon-bat-cu',
            name: 'Thất ngôn bát cú (8 câu)',
            input: 'Bước tới Đèo Ngang bóng xế tà\nCỏ cây chen đá lá chen hoa\nLom khom dưới núi tiều vài chú\nLác đác bên sông rợ mấy nhà\nNhớ nước đau lòng con quốc quốc\nThương nhà mỏi miệng cái gia gia\nDừng chân đứng lại trời non nước\nMột mảnh tình riêng ta với ta',
            expect: { form: 'Thất ngôn bát cú Đường luật', lineCount: 8, counts: [7,7,7,7,7,7,7,7] }
        },
        {
            id: 'ngu-ngon-tu-tuyet',
            name: 'Ngũ ngôn tứ tuyệt (5 chữ)',
            input: 'Một hai ba bốn năm\nSáu bảy tám chín mười\nTrăng sáng soi đầu núi\nGío thổi lá rơi rơi',
            expect: { form: 'Thơ 5 chữ', lineCount: 4, counts: [5, 5, 5, 5] }
        },
        {
            id: 'tu-do-ngan-dai',
            name: 'Thơ tự do (số chữ ngắn dài đan xen)',
            input: 'Tôi viết bài thơ không vần\nCho em đọc lúc trời đang mưa\nBảy chữ mỗi dòng nhưng không phải thơ Đường\nVì có dòng dài dòng ngắn',
            expect: { form: 'Thơ tự do hoặc biến thể', lineCount: 4, counts: [7, 8, 12, 7] }
        },
        {
            id: 'that-ngon-2-cau',
            name: 'Thơ 7 chữ (2 câu lẻ)',
            input: 'Nhất bất nhị tam tứ ngũ liên\nThập niên sinh tử lưỡng mang nhiên',
            expect: { form: 'Thất ngôn (2 câu)', lineCount: 2, counts: [7, 7] }
        }
    ];

    window.runPoemTests = function() {
        // Kiểm tra xem bộ máy phân tích đã được nạp chưa
        if (typeof POETRY_ANALYZER === 'undefined') {
            console.error('[LỖI] POETRY_ANALYZER chưa được nạp. Hãy kiểm tra lại file script.js.');
            return { ok: 0, total: 0 };
        }

        console.log('%c------------------------------------------------------', 'color: #00bcd4;');
        console.log('%c  VĂN ĐẠO - KIỂM THỬ BỘ MÁY THI PHÁP (REGRESSION TEST)', 'color: #ffc107; font-weight: bold;');
        console.log('%c------------------------------------------------------', 'color: #00bcd4;');

        let ok = 0;
        let fail = 0;

        for (const tc of CASES) {
            try {
                const got = POETRY_ANALYZER.generateReport(tc.input);
                const fails = [];

                // 1. Kiểm tra Thể thơ
                if (tc.expect.form && got.form.form !== tc.expect.form) {
                    fails.push(`Thể thơ: Kỳ vọng "${tc.expect.form}" | Nhận "${got.form.form}"`);
                }

                // 2. Kiểm tra Số câu
                if (tc.expect.lineCount && got.bangTrac.length !== tc.expect.lineCount) {
                    fails.push(`Số câu: Kỳ vọng ${tc.expect.lineCount} | Nhận ${got.bangTrac.length}`);
                }

                // 3. Kiểm tra Số chữ mỗi câu
                if (tc.expect.counts) {
                    const actual = got.bangTrac.map(l => l.count);
                    const match = tc.expect.counts.length === actual.length &&
                                  tc.expect.counts.every((c, i) => c === actual[i]);
                    if (!match) {
                        fails.push(`Số chữ: Kỳ vọng [${tc.expect.counts}] | Nhận [${actual}]`);
                    }
                }

                // Xuất kết quả
                if (fails.length === 0) {
                    ok++;
                    console.log(`[PASS] ${tc.id} - ${tc.name}`);
                } else {
                    fail++;
                    console.error(`[FAIL] ${tc.id} - ${tc.name}`);
                    fails.forEach(msg => console.warn(`       -> ${msg}`));
                }

            } catch (e) {
                fail++;
                console.error(`[ERROR] ${tc.id} - ${tc.name}`);
                console.warn(`        -> Lỗi: ${e.message}`);
            }
        }

        console.log('%c------------------------------------------------------', 'color: #00bcd4;');
        const statusColor = fail === 0 ? '#4caf50' : '#f44336';
        console.log(`%cKẾT QUẢ: ${ok}/${CASES.length} PASS | ${fail} FAIL`, `color: ${statusColor}; font-weight: bold;`);
        
        if (fail === 0) {
            console.log('%cHệ thống phân tích thi pháp hoạt động hoàn hảo.', 'color: #90a4ae;');
        } else {
            console.log('%cCần kiểm tra lại thuật toán trong POETRY_ANALYZER.', 'color: #90a4ae;');
        }
        console.log('%c------------------------------------------------------', 'color: #00bcd4;');

        return { ok: ok, total: CASES.length, fail: fail };
    };

    // Tự động chạy thông báo hướng dẫn khi nạp file
    console.log('%c[VĂN ĐẠO] File test-poem.js đã sẵn sàng. Gõ "runPoemTests()" để bắt đầu.', 'color: #ffc107;');

})();