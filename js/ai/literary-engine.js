/**
 * ==========================================================
 * VĂN ĐẠO AI - LITERARY REASONING ENGINE
 * Vị trí: js/ai/literary-engine.js
 * Version: 1.0.0 (Context-Aware Analysis)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * 1. Không cắt chuỗi vô hồn: Thay vì lấy 40 ký tự đầu tiên, Engine này
 *    phân tích cấu trúc bài thơ để tìm ra "Câu thơ trung tâm" (câu dài nhất
 *    và có ý nghĩa nhất).
 * 2. Bóc tách ngữ cảnh (Context): Cung cấp thông tin về câu trước, câu sau,
 *    vị trí của câu thơ trong bài để Agent có cái nhìn toàn cảnh.
 * 3. Phân tích Thanh điệu (Prosody): Đếm số lượng Bằng/Trắc để đưa ra
 *    nhận xét về nhịp điệu (êm đềm hay dồn nén).
 * 4. Hoàn toàn Đồng bộ (Sync): Chạy bằng Regex và JS thuần, không gọi
 *    mạng, không dùng async/await, giúp tích hợp dễ dàng mọi nơi.
 * ==========================================================
 */

export const LiteraryEngine = {
    /**
     * Phân tích văn bản thô và trả về Gói ngữ cảnh (Context Package).
     * 
     * @param {string} rawText - Văn bản người dùng nhập (bài thơ, đoạn văn).
     * @returns {Object} Gói ngữ cảnh bao gồm coreLine, context, prosody.
     */
    analyzeContext(rawText) {
        if (!rawText || typeof rawText !== 'string') {
            return this._getEmptyPackage();
        }

        // 1. Tách dòng, loại bỏ dòng trống
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length === 0) {
            return this._getEmptyPackage();
        }

        // 2. Tìm "Câu thơ trung tâm" (Core Line)
        // Ưu tiên câu dài nhất (trên 10 ký tự) để tránh lấy nhầm tiêu đề hoặc từ đơn lẻ
        let coreIndex = 0;
        let maxLength = 0;
        
        lines.forEach((line, idx) => {
            // Loại bỏ các dòng có vẻ như là tiêu đề (chứa ít từ, toàn viết hoa)
            const isTitle = line === line.toUpperCase() && line.length < 30;
            if (!isTitle && line.length > maxLength) {
                maxLength = line.length;
                coreIndex = idx;
            }
        });

        // Fallback: Nếu không tìm thấy câu nào > 10 ký tự, lấy câu đầu tiên
        if (maxLength < 10 && lines.length > 0) {
            coreIndex = 0;
        }

        const coreLine = lines[coreIndex];

        // 3. Lấy ngữ cảnh (câu trước, câu sau)
        const prevLine = coreIndex > 0 ? lines[coreIndex - 1] : null;
        const nextLine = coreIndex < lines.length - 1 ? lines[coreIndex + 1] : null;

        // 4. Phân tích Thanh điệu (Bằng/Trắc) của câu trung tâm
        const prosody = this._analyzeProsody(coreLine);

        return {
            isValid: true,
            rawText,
            coreLine,
            coreIndex,
            totalLines: lines.length,
            context: {
                prevLine,
                nextLine,
                positionText: `câu ${coreIndex + 1}/${lines.length}`
            },
            prosody
        };
    },

    /**
     * Phân tích thanh điệu của một câu thơ.
     * Trả về số lượng chữ Bằng, Trắc và nhận xét sơ bộ.
     * 
     * @param {string} line - Câu thơ cần phân tích.
     * @returns {Object} { bang, trac, rhythmType, description }
     */
    _analyzeProsody(line) {
        if (!line) return { bang: 0, trac: 0, rhythmType: 'unknown', description: '' };

        // Tách thành các từ (chữ)
        const words = line.match(/[\p{L}\p{N}]+/gu) || [];
        let bang = 0;
        let trac = 0;

        words.forEach(word => {
            // Chuẩn hóa NFD để kiểm tra dấu thanh
            const nfd = word.normalize('NFD');
            
            // Thanh Huyền (\u0300) và Không dấu là Bằng
            // Thanh Sắc (\u0301), Hỏi (\u0309), Ngã (\u0303), Nặng (\u0323) là Trắc
            if (nfd.includes('\u0301') || nfd.includes('\u0309') || nfd.includes('\u0303') || nfd.includes('\u0323')) {
                trac++;
            } else {
                bang++;
            }
        });

        // Nhận xét nhịp điệu dựa trên tỷ lệ Bằng/Trắc
        let rhythmType = 'balanced';
        let description = '';

        if (bang > trac * 1.5) {
            rhythmType = 'gentle';
            description = 'Câu thơ nghiêng về thanh Bằng, tạo cảm giác êm đềm, trải dài và tĩnh tại.';
        } else if (trac > bang * 1.5) {
            rhythmType = 'intense';
            description = 'Câu thơ nặng về thanh Trắc, dồn nén cảm xúc, tạo ra những nhịp gấp gáp, trăn trở.';
        } else {
            rhythmType = 'balanced';
            description = 'Sự đan xen hài hòa giữa Bằng và Trắc tạo nên một nhịp điệu cân bằng, uyển chuyển.';
        }

        return { bang, trac, total: words.length, rhythmType, description };
    },

    /**
     * Trả về gói ngữ cảnh rỗng (an toàn) khi không có dữ liệu.
     */
    _getEmptyPackage() {
        return {
            isValid: false,
            rawText: '',
            coreLine: '',
            coreIndex: -1,
            totalLines: 0,
            context: { prevLine: null, nextLine: null, positionText: '' },
            prosody: { bang: 0, trac: 0, rhythmType: 'unknown', description: '' }
        };
    }
};
