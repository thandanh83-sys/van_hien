/**
 * ==========================================================
 * VĂN ĐẠO AI - MATH UTILS (js/ai/math-utils.js)
 * Vị trí: js/ai/math-utils.js
 * Version: 2.0.0 (Semantic Vector Space & Cosine Similarity)
 * ==========================================================
 * CHỨC NĂNG:
 * - Cung cấp các thuật toán đo lường độ tương đồng (Similarity).
 * - [MỚI] calculateSimilarity: Đo độ tương đồng ngữ nghĩa (dựa trên tập từ khóa).
 * - Levenshtein Distance, Dice Coefficient, Jaccard Similarity.
 * ==========================================================
 */

export const MathUtils = {
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
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    },

    diceCoefficient(str1, str2) {
        if (str1 === str2) return 1.0;
        if (str1.length < 2 || str2.length < 2) return 0.0;
        const getBigrams = (str) => {
            const bigrams = new Set();
            for (let i = 0; i < str.length - 1; i++) bigrams.add(str.substring(i, i + 2));
            return bigrams;
        };
        const bigrams1 = getBigrams(str1);
        const bigrams2 = getBigrams(str2);
        let intersection = 0;
        for (const bigram of bigrams1) if (bigrams2.has(bigram)) intersection++;
        return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
    },

    jaccardSimilarity(setA, setB) {
        if (setA.size === 0 && setB.size === 0) return 1.0;
        if (setA.size === 0 || setB.size === 0) return 0.0;
        let intersection = 0;
        for (const item of setA) if (setB.has(item)) intersection++;
        const union = setA.size + setB.size - intersection;
        return intersection / union;
    },

    /**
     * [MỚI] Tính độ tương đồng ngữ nghĩa (Cosine Similarity đơn giản hóa).
     * Dùng để tìm kiếm mờ (Fuzzy Search) dựa trên tập từ khóa.
     * @param {Array<string>} queryTokens 
     * @param {Array<string>} docTokens 
     * @returns {number} Điểm từ 0.0 đến 1.0
     */
    calculateSimilarity(queryTokens, docTokens) {
        const setA = new Set(queryTokens);
        const setB = new Set(docTokens);
        let intersection = 0;
        setA.forEach(token => {
            if (setB.has(token)) intersection++;
        });
        // Công thức Cosine/Jaccard đơn giản hóa cho tốc độ < 1ms
        return intersection / Math.sqrt(setA.size * setB.size || 1);
    },

    normalizeScore(value, min, max) {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    }
};
