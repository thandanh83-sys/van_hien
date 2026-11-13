import { APP_DATA } from '../../config.js';
import { VDSearchEngine } from '../../search.js';

export const LiteratureAgent = {
    async search(query) {
        const results = VDSearchEngine.search(query);
        const works = Array.isArray(APP_DATA.WORKS_DATA) ? APP_DATA.WORKS_DATA : [];
        const authors = Array.isArray(APP_DATA.AUTHOR_DATA) ? APP_DATA.AUTHOR_DATA : [];
        if (results.length > 0) {
            const topResults = results.slice(0, 5).map(r => {
                const idx = works.find(w => w.id === r.id) || authors.find(a => a.id === r.id);
                return { id: r.id, _group: r.group, title: idx ? (idx.title || idx.name) : r.id };
            });
            return { answer: `Tìm thấy ${results.length} mục`, detail: 'Nhấn để xem chi tiết', source: 'search-engine', meta: topResults };
        }
        return { answer: 'Không có kết quả.', source: 'search-engine' };
    },
    async findAuthor(title) {
        const top = VDSearchEngine.search(title).find(r => r.group === 'tinh-hoa');
        if (top) {
            const work = APP_DATA.WORKS_DATA.find(w => w.id === top.id);
            if (work) return { answer: `Tác giả: ${work.author}`, detail: `"${work.title}"`, source: 'local-data', meta: [work] };
        }
        return { answer: `Không tìm thấy tác phẩm "${title}".`, source: 'local-data' };
    },
    async summarize(title) {
        const top = VDSearchEngine.search(title).find(r => r.group === 'tinh-hoa');
        if (top) {
            const work = APP_DATA.WORKS_DATA.find(w => w.id === top.id);
            if (work) return { answer: work.desc || 'Chưa có tóm tắt.', detail: `"${work.title}"`, source: 'local-data', meta: [work] };
        }
        return { answer: `Không tìm thấy tác phẩm "${title}".`, source: 'local-data' };
    },
    async getWorkInfo(title) {
        const top = VDSearchEngine.search(title).find(r => r.group === 'tinh-hoa');
        if (top) {
            const work = APP_DATA.WORKS_DATA.find(w => w.id === top.id);
            if (work) return { ok: true, data: work };
        }
        return { ok: false, answer: `Không tìm thấy "${title}".`, source: 'local-data' };
    },
    async recommend(genre) {
        let works = APP_DATA.WORKS_DATA || [];
        if (genre) works = works.filter(w => (w.the_loai && w.the_loai.join(' ').toLowerCase().includes(genre)));
        for (let i = works.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [works[i], works[j]] = [works[j], works[i]];
        }
        const selected = works.slice(0, 4);
        if (selected.length > 0) return { answer: `Gợi ý: ${selected.map(w => w.title).join(' · ')}`, source: 'local-data', meta: selected };
        return { answer: 'Chưa có tác phẩm phù hợp.', source: 'local-data' };
    },
    async defineGenre(query) {
        const genre = APP_DATA.THE_LOAI_DATA.find(g => g.name.toLowerCase().includes(query.toLowerCase()));
        if (genre) return { answer: genre.description, detail: `Thể loại: ${genre.name}`, source: 'local-data', meta: [genre] };
        return { answer: 'Không có trong từ điển.', source: 'local-data' };
    }
};