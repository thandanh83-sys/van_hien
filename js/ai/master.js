/**
 * ==========================================================
 * VĂN ĐẠO AI - MASTER MODULE (js/ai/master.js)
 * Chức năng: Điều phối toàn bộ hệ thống Agent
 * ==========================================================
 */

import { InputAI } from './input-ai.js';
import { OutputAI } from './output-ai.js';
import { LiteratureAgent } from './agents/literature.js';
import { PoeticsAgent } from './agents/poetics.js';
import { AnalysisAgent } from './agents/analysis.js';
import { FortuneAgent } from './agents/fortune.js';

export const MasterAI = {
    /**
     * Hàm xử lý chính (Giao tiếp với UI)
     */
    async processQuery(inputElement, container) {
        const text = inputElement.value.trim();
        if (!text) return;

        // 1. INPUT: Nhận diện ý định
        const intent = InputAI.parseIntent(text);

        // Nếu là tìm kiếm thông thường, Master nhường quyền lại cho UI
        if (intent.type === 'search') {
            return { type: 'search', query: intent.query };
        }

        // 2. HIỂN THỊ LOADING
        OutputAI.renderLoading(container);

        // 3. ORCHESTRATE: Điều phối Agent
        let result = null;
        try {
            switch (intent.type) {
                case 'summarize-work':
                    result = await LiteratureAgent.summarize(intent.query);
                    break;

                case 'find-author-of':
                    result = await LiteratureAgent.findAuthor(intent.query);
                    break;

                case 'explain-symbol':
                    result = await PoeticsAgent.explainSymbol(intent.query);
                    break;

                case 'recommend':
                    result = await LiteratureAgent.recommend(intent.query);
                    break;

                case 'define-genre':
                    result = await LiteratureAgent.defineGenre(intent.query);
                    break;

                case 'analyze-work':
                    // Gọi LiteratureAgent lấy dữ liệu thô, sau đó đưa cho AnalysisAgent
                    const workInfo = await LiteratureAgent.getWorkInfo(intent.query);
                    if (workInfo.ok) {
                        const analysis = await AnalysisAgent.analyze(workInfo.data);
                        result = { ...analysis, meta: [workInfo.data] };
                    } else {
                        result = workInfo;
                    }
                    break;

                case 'fortune':
                    result = { answer: 'Vui lòng sử dụng nút "Một bài thơ" ở Trang Chủ để gieo quẻ.', source: 'master' };
                    break;

                default:
                    result = { answer: 'Tôi chưa hiểu ý bạn.', source: 'master' };
            }
        } catch (err) {
            console.error('[MASTER AI]', err);
            OutputAI.renderError(container, err.message);
            return { type: 'error' };
        }

        // 4. OUTPUT: Phân phối câu trả lời
        OutputAI.render(container, result, text);
        return { type: 'answered' };
    }
};

// Xuất bí danh để tương thích với code cũ nếu chưa muốn đổi
export const AIDispatcher = MasterAI;