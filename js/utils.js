/**
 * ==========================================================
 * VĂN ĐẠO - UTILS MODULE (js/utils.js)
 * Chức năng: Các hàm tiện ích xử lý chuỗi, tiếng Việt, định dạng.
 * ==========================================================
 */

/**
 * 1. Chống spam sự kiện (Debounce) - Thường dùng cho ô tìm kiếm
 */
export function debounce(func, wait) {
    let timeout;
    const debounced = function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
    debounced.cancel = () => { clearTimeout(timeout); timeout = null; };
    return debounced;
}

/**
 * 2. Xóa dấu tiếng Việt (VD: "Nguyễn Trãi" -> "Nguyen Trai")
 */
export function removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

/**
 * 3. Chuẩn hóa văn bản để tìm kiếm (Viết thường, xóa dấu, xóa ký tự đặc biệt)
 */
export function normalizeRouteText(value) {
    return removeAccents(String(value ?? '').normalize('NFKC').toLocaleLowerCase('vi'))
        .replace(/[’'`]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

/**
 * 4. Chuẩn hóa ID (Dùng để tạo ID cho thẻ HTML)
 */
export function normalizeRouteId(value) {
    return normalizeRouteText(value).replace(/\s+/g, '-');
}

/**
 * 5. Phân loại nhóm (Dùng cho Router định tuyến)
 */
export function normalizeRouteGroup(value) {
    const key = normalizeRouteId(value);
    const aliases = {
        'triet-thuyet': 'triet-thuyet', 'ly-thuyet': 'triet-thuyet', 'theory': 'triet-thuyet',
        'ky-tai': 'ky-tai', 'tac-gia': 'ky-tai', 'author': 'ky-tai', 'authors': 'ky-tai',
        'tinh-hoa': 'tinh-hoa', 'tac-pham': 'tinh-hoa', 'work': 'tinh-hoa', 'works': 'tinh-hoa', 'heritage': 'tinh-hoa',
        'the-loai': 'the-loai', 'genre': 'the-loai', 'genres': 'the-loai'
    };
    return aliases[key] || null;
}

/**
 * 6. Lấy tên rút gọn của tác giả (Bỏ chữ "Chân Dung Tác Giả:")
 */
export function getRecordTitleAlias(item, group) {
    if (group === 'the-loai') return String(item?.name || '').trim();
    const title = String(item?.title || '').trim();
    if (group === 'ky-tai') return title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
    return title;
}

/**
 * 7. Mã hóa HTML (Chống lỗi XSS khi render dữ liệu)
 */
export function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({ 
        '&': '&amp;', 
        '<': '&lt;', 
        '>': '&gt;', 
        "'": '&#39;', 
        '"': '&quot;' 
    }[tag]));
}

/**
 * 8. Highlight từ khóa tìm kiếm (Bôi đậm chữ khớp)
 */
export function highlightText(text, tokens) {
    if (!text || !tokens?.length) return escapeHTML(text);
    return text.split(/(\s+)/).map(word => {
        const clean = removeAccents(word.toLowerCase());
        if (tokens.some(t => clean.includes(t)) && word.trim()) {
            return `<mark>${escapeHTML(word)}</mark>`;
        }
        return escapeHTML(word);
    }).join('');
}

/**
 * 9. Định dạng lại nội dung HTML (Chèn khoảng trống cho các mục La Mã I, II, III...)
 */
export function formatContent(html) {
    if (!html) return '';
    let formatted = html.replace(/([IVX]+\.)\s/g, '<br><br><strong style="color:var(--accent-text);">$1</strong> ');
    formatted = formatted.replace(/^<strong>(.*?)<\/strong>/, '$1');
    formatted = formatted.replace(/^<b>(.*?)<\/b>/, '$1');
    return formatted;
}
