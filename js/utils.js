/**
 * ==========================================================
 * VĂN ĐẠO - UTILS MODULE (js/utils.js)
 * Vị trí: js/utils.js
 * Version: 1.0.10 (Custom Modal UI)
 * ==========================================================
 * CHỨC NĂNG:
 * - Các hàm tiện ích xử lý chuỗi, tiếng Việt.
 * - Custom Modal (showAlert, showConfirm) thay thế window.alert/confirm.
 * ==========================================================
 */

/**
 * 1. Chống spam sự kiện (Debounce)
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
 * 2. Xóa dấu tiếng Việt
 */
export function removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

/**
 * 3. Chuẩn hóa văn bản để tìm kiếm
 */
export function normalizeRouteText(value) {
    return removeAccents(String(value ?? '').normalize('NFKC').toLocaleLowerCase('vi'))
        .replace(/[’'`]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

/**
 * 4. Chuẩn hóa ID
 */
export function normalizeRouteId(value) {
    return normalizeRouteText(value).replace(/\s+/g, '-');
}

/**
 * 5. Phân loại nhóm
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
 * 6. Lấy tên rút gọn của tác giả
 */
export function getRecordTitleAlias(item, group) {
    if (group === 'the-loai') return String(item?.name || '').trim();
    const title = String(item?.title || '').trim();
    if (group === 'ky-tai') return title.replace(/^Chân Dung Tác Giả:\s*/i, '').trim();
    return title;
}

/**
 * 7. Mã hóa HTML (Chống XSS)
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
 * 8. Highlight từ khóa tìm kiếm
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
 * 9. Định dạng lại nội dung HTML
 */
export function formatContent(html) {
    if (!html) return '';
    let formatted = html.replace(/([IVX]+\.)\s/g, '<br><br><strong style="color:var(--accent-text);">$1</strong> ');
    formatted = formatted.replace(/^<strong>(.*?)<\/strong>/, '$1');
    formatted = formatted.replace(/^<b>(.*?)<\/b>/, '$1');
    return formatted;
}

// ==========================================================
// 10. CUSTOM MODAL (Thay thế alert/confirm mặc định)
// ==========================================================

/**
 * Hiển thị hộp thoại xác nhận (Trả về Promise<boolean>)
 */
export function showConfirm(message, title = 'Xác nhận') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-modal-overlay');
        const modal = document.getElementById('custom-modal');
        const titleEl = document.getElementById('custom-modal-title');
        const msgEl = document.getElementById('custom-modal-message');
        const btnCancel = document.getElementById('custom-modal-cancel');
        const btnConfirm = document.getElementById('custom-modal-confirm');

        if (!overlay) return resolve(window.confirm(message));

        titleEl.textContent = title;
        msgEl.textContent = message;
        btnCancel.style.display = 'block';
        btnConfirm.textContent = 'Đồng ý'; // Reset text
        
        overlay.style.display = 'flex';
        void overlay.offsetWidth;
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';

        const close = (result) => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
            resolve(result);
        };

        btnConfirm.onclick = () => close(true);
        btnCancel.onclick = () => close(false);
    });
}

/**
 * Hiển thị hộp thoại thông báo
 */
export function showAlert(message, title = 'Thông báo') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-modal-overlay');
        const modal = document.getElementById('custom-modal');
        const titleEl = document.getElementById('custom-modal-title');
        const msgEl = document.getElementById('custom-modal-message');
        const btnCancel = document.getElementById('custom-modal-cancel');
        const btnConfirm = document.getElementById('custom-modal-confirm');

        if (!overlay) return resolve(window.alert(message));

        titleEl.textContent = title;
        msgEl.textContent = message;
        btnCancel.style.display = 'none';
        btnConfirm.textContent = 'Đóng';
        
        overlay.style.display = 'flex';
        void overlay.offsetWidth;
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';

        const close = () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
            btnConfirm.onclick = null;
            resolve();
        };

        btnConfirm.onclick = close;
    });
}