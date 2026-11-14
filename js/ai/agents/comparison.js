/**
 * ==========================================================
 * VĂN ĐẠO AI - COMPARISON AGENT (js/ai/agents/comparison.js)
 * Vị trí: js/ai/agents/comparison.js
 * Version: 1.1.0 (Search Integration & Common Thread)
 * ==========================================================
 * TRIẾT LÝ:
 * - So sánh khách quan giữa 2 Tác giả, 2 Tác phẩm.
 * - [MỚI] Thêm hàm findCommonThread() phục vụ chế độ Tìm kiếm:
 *   Tự động tìm ra điểm chung (tác giả, cảm xúc, thời đại) giữa một 
 *   danh sách các kết quả để có lời dẫn dắt.
 * ==========================================================
 */

import { DataHub } from '../../network/data-hub.js';
import { resolveAndFetch } from '../core.js';
import { normalizeRouteText } from '../../utils.js';

export const ComparisonAgent = {
    async compare(input) {
        if (!input) return { answer: 'Bạn muốn so sánh hai đối tượng nào?', source: 'comparison' };

        const cleanInput = input.replace(/\b(so sánh|compare|giữa|giua|sự khác nhau|khac nhau)\b/gi, '').trim();
        const parts = cleanInput.split(/\s+(và|với|va|voi)\s+/i);

        if (parts.length < 3) {
            return { 
                answer: 'Vui lòng nhập rõ 2 đối tượng cách nhau bằng chữ "và" hoặc "với". (VD: So sánh Nguyễn Du và Nam Cao)', 
                source: 'comparison' 
            };
        }

        const entity1Name = parts[0].trim();
        const entity2Name = parts[2].trim();

        const target1 = DataHub.resolveIdFromQuery(entity1Name);
        const target2 = DataHub.resolveIdFromQuery(entity2Name);

        if (!target1 || !target2) {
            const missing = !target1 ? entity1Name : entity2Name;
            return { answer: `Không tìm thấy dữ liệu cho "${missing}" trong hệ thống để thực hiện so sánh.`, source: 'comparison' };
        }

        const data1 = await resolveAndFetch(target1.id);
        const data2 = await resolveAndFetch(target2.id);

        if (!data1 || !data2) {
            return { answer: 'Lỗi khi tải dữ liệu để so sánh.', source: 'comparison' };
        }

        return this._buildComparison(data1, data2, entity1Name, entity2Name);
    },

    _buildComparison(data1, data2, name1, name2) {
        const r1 = data1.record;
        const r2 = data2.record;
        const g1 = data1.group;
        const g2 = data2.group;

        let answer = `Bản so sánh khách quan giữa "${name1}" và "${name2}":\n\n`;
        let detail = '';
        const metaList = [r1, r2];

        if (g1 === 'ky-tai' && g2 === 'ky-tai') {
            // So sánh 2 tác giả
            answer += `• **Thời đại:** ${r1.era || 'N/A'} | ${r2.era || 'N/A'}\n`;
            answer += `• **Quốc tịch:** ${r1.nationality || 'N/A'} | ${r2.nationality || 'N/A'}\n`;
            answer += `• **Phong cách:** ${(r1.style || []).join(', ')} | ${(r2.style || []).join(', ')}\n`;
            detail = 'Cả hai đều là những tác giả có đóng góp quan trọng cho nền văn học.';
        }
        else if (g1 === 'tinh-hoa' && g2 === 'tinh-hoa') {
            // So sánh 2 tác phẩm
            answer += `• **Tác giả:** ${r1.author} | ${r2.author}\n`;
            answer += `• **Cảm xúc:** ${(r1.cam_xuc || []).join(', ')} | ${(r2.cam_xuc || []).join(', ')}\n`;
            answer += `• **Thể loại:** ${(r1.the_loai || []).join(', ')} | ${(r2.the_loai || []).join(', ')}\n`;
            detail = 'Việc so sánh hai tác phẩm giúp thấy được sự đa dạng trong phong cách và chủ đề của văn học.';
        }
        else {
            // So sánh tác giả & tác phẩm
            const authorRecord = g1 === 'ky-tai' ? r1 : r2;
            const workRecord = g1 === 'tinh-hoa' ? r1 : r2;
            const authorName = authorRecord.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            const workAuthor = (workRecord.author || '').toLowerCase().trim();
            
            const isMatch = workAuthor.includes(authorName.toLowerCase());
            
            answer += `• **Mối quan hệ:** ${isMatch ? `Có, "${authorName}" là tác giả của tác phẩm "${workRecord.title}".` : `Không tìm thấy liên kết trực tiếp.`}\n`;
            detail = 'Bạn có thể sử dụng tính năng "Tác phẩm liên quan" để khám phá thêm.';
        }

        return { answer: answer.trim(), detail, source: 'comparison', meta: metaList };
    },

    /**
     * [MỚI] Tìm điểm chung giữa một danh sách các kết quả tìm kiếm.
     * Dùng để tạo câu dẫn dắt trong chế độ Search.
     * 
     * @param {Array} results - Mảng các tác phẩm từ DataHub.
     * @returns {string} Câu nhận xét về điểm chung.
     */
    findCommonThread(results) {
        if (!results || results.length === 0) return '';

        // Đếm tần suất xuất hiện của Tác giả, Cảm xúc, Thể loại
        const authorCount = {};
        const moodCount = {};
        const genreCount = {};

        results.forEach(w => {
            if (w.author) authorCount[w.author] = (authorCount[w.author] || 0) + 1;
            if (Array.isArray(w.cam_xuc)) {
                w.cam_xuc.forEach(m => moodCount[m] = (moodCount[m] || 0) + 1);
            }
            if (Array.isArray(w.the_loai)) {
                w.the_loai.forEach(g => genreCount[g] = (genreCount[g] || 0) + 1);
            }
        });

        // Tìm yếu tố xuất hiện nhiều nhất (> 1)
        const getMax = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];

        const topMood = getMax(moodCount);
        const topGenre = getMax(genreCount);
        const topAuthor = getMax(authorCount);

        let thread = '';

        if (topMood && topMood[1] > 1) {
            thread += `Tất cả đều mang chung cảm xúc <b>${topMood[0]}</b>. `;
        }
        if (topGenre && topGenre[1] > 1) {
            thread += `Chúng cùng thuộc thể loại <b>${topGenre[0]}</b>. `;
        }
        if (topAuthor && topAuthor[1] > 1) {
            thread += `Đặc biệt, có ${topAuthor[1]} tác phẩm của cùng tác giả <b>${topAuthor[0]}</b>. `;
        }

        if (!thread) {
            thread = `Dù khác biệt về phong cách, tất cả đều là những viên ngọc quý của văn học.`;
        }

        return thread.trim();
    }
};

// =====================================================================
// AGENT INFO
// =====================================================================
ComparisonAgent.agentInfo = {
    key: 'comparison',
    name: 'So Sánh AI',
    description: 'Chuyên trách so sánh 2 tác giả, 2 tác phẩm.',
    capabilities: {
        'compare-entities': 'compare'
    },
    canRead: ['work', 'author'],
    canDelegate: ['literature', 'knowledge'],
    intentPatterns: {
        'compare-entities': ['so sanh', 'compare', 'khac nhau', 'tuong dong', 'giong']
    }
};
