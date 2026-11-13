import { countWeightedMatches } from '../core.js';
import { normalizeRouteText } from '../../utils.js';
import { findSymbols } from '../../render.js';

const THEME_RULES = [
    { id: 'nature', label: 'thiên nhiên', terms: [{ t: 'trăng', w: 2 }, { t: 'sông', w: 1.5 }, { t: 'núi', w: 1.5 }, { t: 'mây', w: 1 }], commentary: 'Thiên nhiên tạo nên lớp cảnh sắc...' },
    { id: 'homesickness', label: 'quê hương', terms: [{ t: 'cố hương', w: 3 }, { t: 'quê hương', w: 2 }, { t: 'quê', w: 1 }, { t: 'làng', w: 1 }], commentary: 'Gợi mở mối liên hệ với quê hương...' },
    { id: 'humanity', label: 'thân phận', terms: [{ t: 'nhân sinh', w: 2 }, { t: 'phận', w: 2 }, { t: 'nước mắt', w: 1.5 }], commentary: 'Hướng sự chú ý đến thân phận con người...' }
];

export const AnalysisAgent = {
    async analyze(work) {
        const text = normalizeRouteText([work.title, work.desc, work.content].filter(Boolean).join(' '));
        
        const themes = THEME_RULES.map(rule => ({ rule, ...countWeightedMatches(text, rule.terms) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);

        const symbols = findSymbols(text).slice(0, 3);

        let commentary = themes.length ? themes[0].rule.commentary : 'Cần đọc từ chi tiết cụ thể.';
        if (symbols.length > 0) commentary += ` Hình ảnh "${symbols[0].keyword}" xuất hiện cần được đặt trong ngữ cảnh.`;

        let strength = themes.length > 0 ? (themes[0].score >= 6 ? 'Mạnh' : (themes[0].score >= 3 ? 'Vừa' : 'Yếu')) : 'Yếu';

        return { answer: commentary, detail: `Mức độ nhận diện: ${strength}`, source: 'analysis' };
    }
};