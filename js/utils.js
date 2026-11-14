/**
 * ==========================================================
 * VĂN ĐẠO - UTILS MODULE (js/utils.js)
 * Vị trí: js/utils.js
 * Version: 2.1.0 (Standardized Text Processing & Dialog Modals)
 * ==========================================================
 * CHỨC NĂNG:
 * - Các hàm tiện ích xử lý chuỗi, tiếng Việt (không dấu, chuẩn hóa).
 * - Custom Modal (showAlert, showConfirm) sử dụng thẻ <dialog> HTML5
 *   để đảm bảo luôn nổi lên trên cùng (Top Layer), không bị kẹt dưới
 *   các thành phần khác như Settings Dialog.
 * - Hỗ trợ tự động đóng (auto-close) cho showAlert.
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
 * 2. Xóa dấu tiếng Việt (VD: "Nguyễn Du" -> "Nguyen Du")
 */
export function removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

/**
 * 3. Chuẩn hóa văn bản để tìm kiếm (Xóa dấu, lowercase, gộp khoảng trắng)
 */
export function normalizeRouteText(value) {
    return removeAccents(String(value ?? '').normalize('NFKC').toLocaleLowerCase('vi'))
        .replace(/[’'`]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

/**
 * 4. Chuẩn hóa ID (VD: "Nguyễn Du" -> "nguyen-du")
 */
export function normalizeRouteId(value) {
    return normalizeRouteText(value).replace(/\s+/g, '-');
}

/**
 * 5. Phân loại nhóm (Group)
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
 * 6. Lấy tên rút gọn của thực thể (VD: Bỏ "Chân Dung Tác Giả:" khỏi tiêu đề)
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
    return String(str).replace(/[&<>'"]/g, tag => ({ 
        '&': '&amp;', 
        '<': '&lt;', 
        '>': '&gt;', 
        "'": '&#39;', 
        '"': '&quot;' 
    }[tag]));
}

/**
 * 8. Highlight từ khóa tìm kiếm (Bọc từ khóa trong thẻ <mark>)
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
 * 9. Định dạng lại nội dung HTML (Thêm khoảng trống cho dễ đọc)
 */
export function formatContent(html) {
    if (!html) return '';
    let formatted = html.replace(/([IVX]+\.)\s/g, '<br><br><strong style="color:var(--accent-text);">$1</strong> ');
    formatted = formatted.replace(/^<strong>(.*?)<\/strong>/, '$1');
    formatted = formatted.replace(/^<b>(.*?)<\/b>/, '$1');
    return formatted;
}

// ==========================================================
// 10. CUSTOM MODAL (Sử dụng thẻ <dialog> HTML5)
// ==========================================================

/**
 * Hiển thị hộp thoại xác nhận (Trả về Promise<boolean>)
 * Sử dụng <dialog>.showModal() để đảm bảo luôn nằm trên Top Layer.
 */
export function showConfirm(message, title = 'Xác nhận') {
    return new Promise((resolve) => {
        const dialog = document.getElementById('custom-modal-overlay');
        const titleEl = document.getElementById('custom-modal-title');
        const msgEl = document.getElementById('custom-modal-message');
        const btnCancel = document.getElementById('custom-modal-cancel');
        const btnConfirm = document.getElementById('custom-modal-confirm');

        if (!dialog) return resolve(window.confirm(message));

        titleEl.textContent = title;
        msgEl.textContent = message;
        btnCancel.style.display = 'block';
        btnConfirm.textContent = 'Đồng ý'; 
        
        dialog.showModal();

        const close = (result) => {
            dialog.close();
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
 * @param {string} message - Nội dung
 * @param {string} title - Tiêu đề
 * @param {number} autoCloseMs - Thời gian tự động đóng (ms). Mặc định 0 là không đóng.
 */
export function showAlert(message, title = 'Thông báo', autoCloseMs = 0) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('custom-modal-overlay');
        const titleEl = document.getElementById('custom-modal-title');
        const msgEl = document.getElementById('custom-modal-message');
        const btnCancel = document.getElementById('custom-modal-cancel');
        const btnConfirm = document.getElementById('custom-modal-confirm');

        if (!dialog) return resolve(window.alert(message));

        titleEl.textContent = title;
        msgEl.textContent = message;
        btnCancel.style.display = 'none';
        btnConfirm.textContent = 'Đóng';
        
        dialog.showModal();

        let timer;
        if (autoCloseMs > 0) {
            timer = setTimeout(() => close(), autoCloseMs);
        }

        const close = () => {
            clearTimeout(timer);
            dialog.close();
            btnConfirm.onclick = null;
            resolve();
        };

        btnConfirm.onclick = close;
    });
}
