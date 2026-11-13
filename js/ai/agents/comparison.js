/**
 * ==========================================================
 * VĂN ĐẠO AI - COMPARISON AGENT (js/ai/agents/comparison.js)
 * Vị trí: js/ai/agents/comparison.js
 * Version: 1.0.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - So sánh khách quan giữa 2 Tác giả, 2 Tác phẩm, hoặc 1 Tác giả & 1 Tác phẩm.
 * - Trích xuất 2 thực thể từ câu hỏi (ngăn cách bởi "và", "với").
 * - Sử dụng DataHub để lấy dữ liệu (Offline-First).
 * ==========================================================
 */

import { DataHub } from '../../network/data-hub.js';
import { resolveAndFetch } from '../core.js';
import { normalizeRouteText } from '../../utils.js';

export const ComparisonAgent = {
    async compare(input) {
        if (!input) return { answer: 'Bạn muốn so sánh hai đối tượng nào?', source: 'comparison' };

        // 1. Tách câu hỏi thành 2 phần (dựa trên từ khóa "và", "với")
        // Loại bỏ các từ rác: "so sánh", "giữa", "compare"
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

        // 2. Dịch tên thành ID
        const target1 = DataHub.resolveIdFromQuery(entity1Name);
        const target2 = DataHub.resolveIdFromQuery(entity2Name);

        if (!target1 || !target2) {
            const missing = !target1 ? entity1Name : entity2Name;
            return { 
                answer: `Không tìm thấy dữ liệu cho "${missing}" trong hệ thống để thực hiện so sánh.`, 
                source: 'comparison' 
            };
        }

        // 3. Lấy dữ liệu chi tiết
        const data1 = await resolveAndFetch(target1.id);
        const data2 = await resolveAndFetch(target2.id);

        if (!data1 || !data2) {
            return { answer: 'Lỗi khi tải dữ liệu để so sánh.', source: 'comparison' };
        }

        // 4. Phân tích và tạo bảng so sánh
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

        // Trường hợp 1: So sánh 2 Tác giả
        if (g1 === 'ky-tai' && g2 === 'ky-tai') {
            const author1 = r1.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            const author2 = r2.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            
            // Lấy thời đại (Dựa trên tác phẩm)
            const works1 = DataHub.getGraph(r1.id)?.works || [];
            const works2 = DataHub.getGraph(r2.id)?.works || [];
            const era1 = works1.length > 0 ? works1[0].era : 'Không rõ';
            const era2 = works2.length > 0 ? works2[0].era : 'Không rõ';

            answer += `• **Thời đại:** ${author1} (${era1}) | ${author2} (${era2})\n`;
            answer += `• **Số tác phẩm:** ${works1.length} | ${works2.length}\n`;
            answer += `• **Tác phẩm tiêu biểu:** ${works1.slice(0,2).map(w=>w.title).join(', ') || 'N/A'} | ${works2.slice(0,2).map(w=>w.title).join(', ') || 'N/A'}\n`;
            
            detail = 'Cả hai đều là những tác giả có đóng góp quan trọng cho nền văn học.';
        }
        // Trường hợp 2: So sánh 2 Tác phẩm
        else if (g1 === 'tinh-hoa' && g2 === 'tinh-hoa') {
            answer += `• **Tác giả:** ${r1.author} | ${r2.author}\n`;
            answer += `• **Thời kỳ:** ${r1.era || 'N/A'} | ${r2.era || 'N/A'}\n`;
            answer += `• **Thể loại:** ${(r1.the_loai||[]).join(', ')} | ${(r2.the_loai||[]).join(', ')}\n`;
            answer += `• **Nội dung chính:** ${r1.desc || 'Chưa rõ'} | ${r2.desc || 'Chưa rõ'}\n`;
            
            detail = 'Việc so sánh hai tác phẩm giúp thấy được sự đa dạng trong phong cách và chủ đề của văn học.';
        }
        // Trường hợp 3: So sánh 1 Tác giả & 1 Tác phẩm
        else {
            const authorRecord = g1 === 'ky-tai' ? r1 : r2;
            const workRecord = g1 === 'tinh-hoa' ? r1 : r2;
            const authorName = authorRecord.title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
            const workAuthor = (workRecord.author || '').toLowerCase().trim();
            
            const isMatch = workAuthor.includes(authorName.toLowerCase());
            
            answer += `• **Mối quan hệ:** ${isMatch ? `Có, "${authorName}" là tác giả của tác phẩm "${workRecord.title}".` : `Không tìm thấy liên kết trực tiếp giữa "${authorName}" và "${workRecord.title}".`}\n`;
            if (isMatch) {
                answer += `• **Thời kỳ:** Tác phẩm thuộc ${workRecord.era || 'Không rõ'}.\n`;
            }
            detail = 'Bạn có thể sử dụng tính năng "Tác phẩm liên quan" để khám phá thêm.';
        }

        return {
            answer: answer.trim(),
            detail: detail,
            source: 'comparison',
            meta: metaList
        };
    }
};

// =====================================================================
// [THÊM MỚI v7.0.0] AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
/**
 * Metadata tự mô tả của ComparisonAgent.
 * Chuyên trách so sánh 2 tác giả, 2 tác phẩm, hoặc 1 tác giả + 1 tác phẩm.
 *
 * CƠ CHẾ HOẠT ĐỘNG:
 * - Tách input thành 2 phần dựa trên từ nối "và" / "với".
 * - Dùng DataHub.resolveIdFromQuery() để dịch tên thành ID.
 * - So sánh dựa trên group:
 *     1. Cả 2 là 'ky-tai'  → So sánh 2 tác giả.
 *     2. Cả 2 là 'tinh-hoa' → So sánh 2 tác phẩm.
 *     3. Hỗn hợp            → So sánh 1 tác giả & 1 tác phẩm.
 *
 * LƯU Ý VỀ INTENT:
 * - InputAI có logic đặc biệt ưu tiên 'compare-entities' TRƯỚC KHI
 *   duyệt qua DynamicIntentPatterns, vì intent này cần cấu trúc
 *   "X và Y" (2 thực thể), không thể nhận diện chỉ bằng 1 từ khóa.
 * - Vì vậy các từ khóa dưới đây chủ yếu đóng vai trò "dự phòng"
 *   khi InputAI không match được cấu trúc đặc biệt.
 */
ComparisonAgent.agentInfo = {
    // ---- Định danh ----
    key: 'comparison',
    name: 'So Sánh AI',
    description: 'Chuyên trách so sánh 2 tác giả, 2 tác phẩm.',

    // ---- Năng lực ----
    capabilities: {
        'compare-entities': 'compare'           // "So sánh Nguyễn Du và Nam Cao"
    },

    // ---- Loại dữ liệu có thể đọc ----
    canRead: ['work', 'author'],

    // ---- Agent được phép ủy thác ----
    canDelegate: ['literature', 'knowledge'],

    // ---- Từ khóa nhận diện Intent ----
    intentPatterns: {
        'compare-entities': ['so sanh', 'compare', 'khac nhau', 'tuong dong', 'giong']
    }
};
