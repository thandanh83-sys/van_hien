import { getDictionaryIndex } from '../core.js';
import { normalizeRouteText } from '../../utils.js';

export const PoeticsAgent = {
    async explainSymbol(keyword) {
        const allEntries = getDictionaryIndex();
        const q = normalizeRouteText(keyword);
        const found = allEntries.find(item => item.normalizedKeyword.includes(q));
        
        if (found) return { answer: found.mean, detail: `[${found.type}] ${found.keyword}`, source: 'dictionary' };
        return { answer: `Không tìm thấy giải nghĩa cho "${keyword}".`, source: 'dictionary' };
    }
};