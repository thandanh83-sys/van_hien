/**
 * ==========================================================
 * VĂN ĐẠO - AUDIT MODULE (js/audit.js)
 * Chức năng: Bác Sĩ Toàn Diện (Toàn bộ JS, CSS, JSON).
 * Giúp phát hiện chính xác file nào đang làm sập toàn bộ hệ thống.
 * TUYỆT ĐỐI KHÔNG EMOJI - CHỈ DÙNG TEXT & SVG.
 * ==========================================================
 */

import { APP_DATA } from './config.js';

// Kho SVG dùng cho UI (nếu sau này cần hiển thị)
export const AUDIT_SVG = {
    ok: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4c4a8" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a85858" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
};

// Danh sách các file tĩnh cần kiểm tra (JS, CSS, JSON gốc)
const STATIC_ASSETS = [
    // CSS
    './css/variables.css', './css/base.css', './css/components.css', './css/layouts.css', './css/reader.css',
    // JS (Lưu ý: Không check main.js vì đây là file đang chạy)
    './js/config.js', './js/utils.js', './js/search.js', './js/render.js', 
    './js/router.js', './js/offline.js', './js/ai.js',
    // JSON Index
    './data/data-ly-thuyet.json', './data/data-tac-gia.json', './data/data-tac-pham.json',
    './data/data-danh-ngon.json', './data/data-loi-binh.json', './data/data-tu-dien.json',
    './data/data-the-loai.json', './data/data-van-khi.json', './data/data-tu-dien-the-loai.json'
];

/**
 * BÁC SĨ 1: KIỂM TRA TOÀN BỘ FILE TĨNH (JS, CSS, JSON INDEX)
 * Tự động phát hiện file bị thiếu (404) hoặc JS bị lỗi cú pháp.
 */
export async function auditStaticFiles() {
    console.log("%c[BÁC SĨ] BẮT ĐẦU KIỂM TRA FILE TĨNH (JS, CSS, JSON)...", "color: #2c3e38; font-weight: bold; font-size: 14px;");
    
    let missingFiles = [];
    let jsSyntaxErrors = [];
    let validFiles = 0;

    for (const url of STATIC_ASSETS) {
        try {
            // 1. Kiểm tra file có tồn tại không (404)
            const res = await fetch(url, { method: 'HEAD' }); 
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            // 2. Nếu là file JS, thử import động để check lỗi cú pháp/import bên trong
            if (url.endsWith('.js')) {
                try {
                    // Thêm timestamp để ép trình duyệt không dùng cache khi check
                    await import(url + '?t=' + Date.now());
                } catch (err) {
                    jsSyntaxErrors.push({ file: url, error: err.message });
                    continue;
                }
            }
            validFiles++;
        } catch (err) {
            missingFiles.push({ file: url, error: "Không tìm thấy hoặc lỗi kết nối" });
        }
    }

    // In báo cáo
    console.log(`[KẾT QUẢ FILE TĨNH] Hợp lệ: ${validFiles} file.`);
    
    if (missingFiles.length > 0) {
        console.group("%c[LỖI 404] FILE BỊ THIẾU HOẶC SAI ĐƯỜNG DẪN", "color: #e74c3c; font-weight: bold;");
        console.table(missingFiles);
        console.groupEnd();
    }

    if (jsSyntaxErrors.length > 0) {
        console.group("%c[LỖI CÚ PHÁP JS] CODE SAI KHIẾN SẬP TRANG", "color: #e74c3c; font-weight: bold;");
        console.table(jsSyntaxErrors);
        console.groupEnd();
    }

    if (missingFiles.length === 0 && jsSyntaxErrors.length === 0) {
        console.log("%c[HOÀN HẢO] Toàn bộ file JS/CSS/JSON Index đều hoạt động tốt.", "color: #2ecc71;");
    }
}

/**
 * BÁC SĨ 2: KIỂM TRA DỮ LIỆU CHI TIẾT (TÁC PHẨM / TÁC GIẢ)
 * Phát hiện file rỗng, lỗi JSON, hoặc ID trong Index không khớp với file chi tiết.
 */
export async function auditData(type = 'work') {
    const isWork = type === 'work';
    const dataList = isWork ? APP_DATA.WORKS_DATA : APP_DATA.AUTHOR_DATA;
    const folder = isWork ? 'tac-pham' : 'tac-gia';
    const label = isWork ? 'TÁC PHẨM' : 'TÁC GIẢ';

    console.log(`%c[BÁC SĨ] KIỂM TRA CHI TIẾT ${label}...`, "color: #2c3e38; font-weight: bold; font-size: 14px;");

    let errors404 = [];
    let errorsJSON = [];
    let emptyFiles = [];
    let validCount = 0;

    for (const item of dataList) {
        if (!item.id) continue;
        const url = `./data/${folder}/${encodeURIComponent(item.id)}.json`;
        
        try {
            const res = await fetch(url);
            
            // 1. Kiểm tra 404
            if (!res.ok) {
                errors404.push({ id: item.id, name: item.title || item.name, path: url });
                continue;
            }

            // 2. Kiểm tra lỗi cú pháp JSON
            let data;
            try {
                data = await res.json();
            } catch (e) {
                errorsJSON.push({ id: item.id, name: item.title || item.name, error: e.message });
                continue;
            }

            // 3. Kiểm tra rỗng hoặc nội dung mẫu
            const content = data.content || '';
            const cleanText = content.replace(/<[^>]*>/g, '').trim();
            
            if (cleanText.length < 50 || cleanText.includes('đang được Văn Đạo hiệu đính')) {
                emptyFiles.push({ id: item.id, name: item.title || item.name });
            } else {
                validCount++;
            }

        } catch (err) {
            errors404.push({ id: item.id, name: item.title || item.name, error: err.message });
        }
    }

    // In báo cáo
    console.log(`[KẾT QUẢ ${label}] Có nội dung: ${validCount} file.`);
    
    if (errors404.length > 0) {
        console.group(`%c[LỖI 404] THIẾU FILE CHI TIẾT (${errors404.length})`, "color: #e74c3c; font-weight: bold;");
        console.table(errors404);
        console.groupEnd();
    }

    if (errorsJSON.length > 0) {
        console.group(`%c[LỖI JSON] FILE BỊ HỎNG CÚ PHÁP (${errorsJSON.length})`, "color: #e74c3c; font-weight: bold;");
        console.table(errorsJSON);
        console.groupEnd();
    }

    if (emptyFiles.length > 0) {
        console.group(`%c[CẢNH BÁO] FILE RỖNG HOẶC ĐANG HIỆU ĐÍNH (${emptyFiles.length})`, "color: #f39c12; font-weight: bold;");
        console.table(emptyFiles);
        console.groupEnd();
    }
}

/**
 * BÁC SĨ TỔNG: CHẠY TOÀN BỘ CHẨN ĐOÁN
 */
export async function runFullDiagnosis() {
    console.clear();
    console.log("%c=== BỆNH VIỆN VĂN ĐẠO - CHẨN ĐOÁN TOÀN DIỆN ===", "background: #2c3e38; color: #d4c4a8; font-size: 16px; font-weight: bold; padding: 8px;");
    
    console.log("%c[LƯU Ý] Nếu trang web đang trắng xóa hoặc sập, hãy xem kỹ các bảng LỖI CÚ PHÁP JS bên dưới.", "color: #8bb8a8; font-style: italic;");
    
    await auditStaticFiles();
    console.log("\n--------------------------------------------------\n");
    await auditData('work');
    console.log("\n--------------------------------------------------\n");
    await auditData('author');
    
    console.log("%c=== KẾT THÚC CHẨN ĐOÁN ===", "background: #2c3e38; color: #d4c4a8; font-size: 14px; font-weight: bold; padding: 4px;");
}
