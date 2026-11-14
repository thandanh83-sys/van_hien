/**
 * ==========================================================
 * VĂN ĐẠO AI - ANALYSIS AGENT (js/ai/agents/analysis.js)
 * Vị trí: js/ai/agents/analysis.js
 * Version: 2.0.0 (Literary Engine Integration)
 * ==========================================================
 * TRIẾT LÝ THIẾT KẾ:
 * - Sử dụng LiteraryEngine để bóc tách ngữ cảnh (câu thơ trung tâm,
 *   nhịp điệu Bằng/Trắc).
 * - Kết hợp cùng PraiserAgent và CriticAgent để tạo ra một bài
 *   bình giảng đa chiều, có hồn.
 * - Không cắt chuỗi vô hồn, không đánh giá chung chung.
 * ==========================================================
 */

import { LiteraryEngine } from '../literary-engine.js';
import { PraiserAgent } from './praiser.js';
import { CriticAgent } from './critic.js';
import { normalizeRouteText } from '../../utils.js';

// ==========================================================
// 1. HÀM PHÂN TÍCH CHÍNH (Dùng chung cho cả Agent và Facade)
// ==========================================================
export function analyzeWork(work = {}) {
    if (!work) return { themes: [], commentaryText: 'Không có dữ liệu.', evidence: {}, strength: 'Yếu' };

    // 1. Gom văn bản để phân tích
    const sourceText = [work.title, work.author, work.desc, work.description, work.content].filter(Boolean).join('\n');
    
    // 2. Bóc tách ngữ cảnh qua Literary Engine
    const ctx = LiteraryEngine.analyzeContext(sourceText, work.title);

    // 3. Lấy cảm nhận từ Praiser và Critic
    const praise = PraiserAgent.analyze(sourceText, work.title);
    const critique = CriticAgent.analyze(sourceText, work.title);

    // 4. Tổng hợp báo cáo
    let commentaryText = '';
    
    if (ctx.isValid) {
        commentaryText = `Tác phẩm được phân tích dựa trên câu thơ trung tâm: <i>"${ctx.coreLine}"</i> (nằm ở ${ctx.context.positionText}). `;
        
        // Nhận xét nhịp điệu
        if (ctx.prosody.rhythmType === 'gentle') {
            commentaryText += `Nhịp thơ mang nhiều thanh Bằng, tạo cảm giác êm đềm, tĩnh tại. `;
        } else if (ctx.prosody.rhythmType === 'intense') {
            commentaryText += `Nhịp thơ dồn dập với nhiều thanh Trắc, thể hiện những cảm xúc mãnh liệt, trăn trở. `;
        } else {
            commentaryText += `Sự đan xen hài hòa giữa Bằng và Trắc tạo nên một nhạc điệu uyển chuyển. `;
        }

        // Nhận xét từ Praiser và Critic
        commentaryText += `<br><br><b>Điểm sáng:</b> ${praise.commentary}`;
        commentaryText += `<br><br><b>Điểm cần lưu ý:</b> ${critique.commentary}`;
    } else {
        commentaryText = 'Chưa có đủ nội dung để phân tích chi tiết.';
    }

    // Đánh giá độ mạnh của tín hiệu
    let strength = 'Vừa';
    if (ctx.isValid && ctx.prosody.total > 5) strength = 'Mạnh';

    return {
        themes: work.the_loai || [],
        commentaryText,
        evidence: { context: ctx },
        strength
    };
}

// ==========================================================
// 2. EXPORT AGENT OBJECT (Dùng cho MasterAI)
// ==========================================================
export const AnalysisAgent = {
    async analyze(input) {
        // Nếu input là ID hoặc tên tác phẩm
        let work = null;
        
        if (typeof input === 'string') {
            // Giả lập lấy dữ liệu (thực tế nên gọi DataHub)
            // Trong ngữ cảnh MasterAI, input thường là object đã có sẵn content
            work = { title: input, content: input };
        } else if (typeof input === 'object') {
            work = input;
        }

        const result = analyzeWork(work);
        return { 
            answer: result.commentaryText, 
            detail: `Mức độ nhận diện: ${result.strength}`, 
            source: 'analysis',
            _raw: result 
        };
    }
};

// =====================================================================
// AGENT INFO - Tự mô tả metadata cho Auto-Registry
// =====================================================================
AnalysisAgent.agentInfo = {
    key: 'analysis',
    name: 'Phân Tích AI',
    description: 'Chuyên trách Đọc hiểu văn bản, Tìm chủ đề, Biểu tượng.',
    capabilities: {
        'analyze-work': 'analyze'
    },
    canRead: ['work', 'author', 'symbol', 'allusion', 'term'],
    canDelegate: ['poetics', 'literature'],
    intentPatterns: {
        'analyze-work': ['phan tich', 'binh giang', 'cam nhan', 'danh gia', 'binh luan', 'mo xe']
    }
};
