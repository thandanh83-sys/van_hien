import { APP_DATA } from '../../config.js';
import { VDSearchEngine } from '../../search.js';

export const LiteratureAgent = {
    async search(query) {
        const results = VDSearchEngine.search(query);
        const works = Array.isArray(APP_DATA.WORKS_DATA) ? APP_DATA.WORKS_DATA : [];
        const authors = Array.isArray(APP_DATA.AUTHOR_DATA) ? APP_DATA.AUTHOR_DATA : [];
        
        if (results.length > 0) {
            const topResults = results.slice(0, 5).map(r => {
                const record = { id: r.id, _group: r.group };
                const idx = works.find(w => w.id === r.id) || authors.find(a => a.id === r.id);
                if (idx) record.title = idx.title || idx.name;
                return record;
            });
            return { answer: `Tìm thấy ${results.length} mục`, detail: 'Nhấn để xem chi tiết', source: 'search-engine', meta: topResults };
        }
        return { answer: 'Không có kết quả.', source: 'search-engine' };
    },

    async findAuthor(title) {
        const results = VDSearchEngine.search(title);
        const top = results.find(r => r.group === 'tinh-hoa');
        if (top) {
            const work = APP_DATA.WORKS_DATA.find(w => w.id === top.id);
            if (work) return { answer: `Tác giả là: ${work.author}`, detail: `Tác phẩm: "${work.title}"`, source: 'local-data', meta: [work] };
        }
        return { answer: `Không tìm thấy tác phẩm "${title}".`, source: 'local-data' };
    },

    async summarize(title) {
        const results = VDSearchEngine.search(title);
        const top = results.find(r => r.group === 'tinh-hoa');
        if (top) {
            const work = APP_DATA.WORKS_DATA.find(w => w.id === top.id);
            if (work) return { answer: work.desc || 'Chưa có tóm tắt.', detail: `"${work.title}"`, source: 'local-data', meta: [work] };
        }
        return { answer: `Không tìm thấy tác phẩm "${title}".`, source: 'local-data' };
    },

    async recommend(genre) {
        let works = APP_DATA.WORKS_DATA || [];
        if (genre) {
            works = works.filter(w => (w.the_loai && w.the_loai.join(' ').toLowerCase().includes(genre)));
        }
        for (let i = works.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [works[i], works[j]] = [works[j], works[i]];
        }
        const selected = works.slice(0, 4);
        if (selected.length > 0) return { answer: `Gợi ý: ${selected.map(w => w.title).join(' · ')}`, detail: 'Dựa trên sở thích của bạn', source: 'local-data', meta: selected };
        return { answer: 'Rất tiếc, chưa có tác phẩm nào phù hợp.', source: 'local-data' };
    },

    async defineGenre(query) {
        const genre = APP_DATA.THE_LOAI_DATA.find(g => g.name.toLowerCase().includes(query.toLowerCase()));
        if (genre) return { answer: genre.description || 'Không có mô tả.', detail: `Thể loại: ${genre.name}`, source: 'local-data', meta: [genre] };
        return { answer: 'Thể loại không có trong từ điển.', source: 'local-data' };
    }
};