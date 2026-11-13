/**
 * ==========================================================
 * VĂN ĐẠO AI - MATH UTILS (js/ai/math-utils.js)
 * Vị trí: js/ai/math-utils.js
 * Version: 1.0.0 (Advanced String & Set Algorithms)
 * ==========================================================
 * CHỨC NĂNG:
 * - Cung cấp các thuật toán đo lường độ tương đồng (Similarity).
 * - Levenshtein Distance: Đo khoảng cách ký tự (Sửa lỗi chính tả).
 * - Dice Coefficient: Đo độ tương đồng dựa trên cặp ký tự (Bigrams).
 * - Jaccard Similarity: Đo độ tương đồng giữa 2 tập hợp từ khóa.
 * ==========================================================
 */

export const MathUtils = {
    // =================================================================
    // 1. LEVENSHTEIN DISTANCE (Khoảng cách chỉnh sửa)
    // =================================================================
    /**
     * Tính khoảng cách giữa 2 chuỗi (số phép biến đổi ít nhất để biến a thành b).
     * Ví dụ: "keu" và "kieu" có khoảng cách = 1 (thêm chữ 'i').
     * 
     * @param {string} a - Chuỗi thứ nhất
     * @param {string} b - Chuỗi thứ hai
     * @returns {number} - Khoảng cách (0 là giống hệt)
     */
    levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));

        for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // Thay thế
                        matrix[i][j - 1] + 1,     // Chèn
                        matrix[i - 1][j] + 1      // Xóa
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    },

    // =================================================================
    // 2. DICE COEFFICIENT (Hệ số Dice)
    // =================================================================
    /**
     * Đo độ tương đồng giữa 2 chuỗi dựa trên các cặp ký tự liên tiếp (Bigrams).
     * Rất hiệu quả với tiếng Việt vì nó bắt được cả trật tự từ.
     * Ví dụ: "truyen kieu" và "truyen keu" có độ tương đồng rất cao.
     * 
     * @param {string} str1 
     * @param {string} str2 
     * @returns {number} - Điểm từ 0.0 đến 1.0 (1.0 là giống hệt)
     */
    diceCoefficient(str1, str2) {
        if (str1 === str2) return 1.0;
        if (str1.length < 2 || str2.length < 2) return 0.0;

        const getBigrams = (str) => {
            const bigrams = new Set();
            for (let i = 0; i < str.length - 1; i++) {
                bigrams.add(str.substring(i, i + 2));
            }
            return bigrams;
        };

        const bigrams1 = getBigrams(str1);
        const bigrams2 = getBigrams(str2);
        
        let intersection = 0;
        for (const bigram of bigrams1) {
            if (bigrams2.has(bigram)) intersection++;
        }

        return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
    },

    // =================================================================
    // 3. JACCARD SIMILARITY (Hệ số Jaccard)
    // =================================================================
    /**
     * Đo độ tương đồng giữa 2 tập hợp (Sets).
     * Thường dùng để so sánh tập từ khóa của câu hỏi với tập từ khóa của Intent.
     * 
     * @param {Set} setA 
     * @param {Set} setB 
     * @returns {number} - Điểm từ 0.0 đến 1.0
     */
    jaccardSimilarity(setA, setB) {
        if (setA.size === 0 && setB.size === 0) return 1.0;
        if (setA.size === 0 || setB.size === 0) return 0.0;

        let intersection = 0;
        for (const item of setA) {
            if (setB.has(item)) intersection++;
        }

        const union = setA.size + setB.size - intersection;
        return intersection / union;
    },

    // =================================================================
    // 4. NORMALIZE SCORE (Chuẩn hóa điểm số)
    // =================================================================
    /**
     * Đưa một giá trị về khoảng [0, 1] dựa trên min/max.
     */
    normalizeScore(value, min, max) {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    }
};
