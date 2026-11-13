import { analyzeWork } from '../../ai.js'; // Tạm gọi file AI cũ để phân tích

export const AnalysisAgent = {
    async analyze(work) {
        const analysis = analyzeWork(work);
        return { 
            answer: analysis.commentaryText, 
            detail: `Mức độ nhận diện: ${analysis.strength}`, 
            source: 'analysis-agent', 
            meta: [] 
        };
    }
};