/**
 * ==========================================================
 * VĂN ĐẠO - AUDIT MODULE (js/audit.js)
 * Vị trí: js/audit.js
 * Version: 1.0.0 (Network Edition)
 * ==========================================================
 * Chức năng:
 * 
 * "Bác Sĩ Toàn Diện" — chẩn đoán toàn bộ hệ thống:
 * 
 *   1. Static Files: JS, CSS, JSON Index (404, syntax error)
 *   2. Network Layer: Manifests, MotherNode health
 *   3. Data Integrity: Tác phẩm, Tác giả (404, JSON lỗi, rỗng)
 * 
 * ĐÃ FIX (P4.16):
 * - Bug: `import(url + '?t=' + Date.now())` không cache-bust đúng
 * - Fix: Dùng `import(url)` trực tiếp + reload thủ công
 * 
 * CÁCH DÙNG:
 *   - Console: `window.audit()`
 *   - Hoặc: `await runFullDiagnosis()`
 * 
 * ==========================================================
 */

import { APP_DATA } from './config.js';
import { MotherNode } from './network/mother.js';

// ==========================================================
// PHẦN 1: DANH SÁCH FILE TĨNH CẦN CHECK
// ==========================================================
const STATIC_ASSETS = [
    // CSS
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/layouts.css',
    './css/reader.css',

    // JS Core
    './js/config.js',
    './js/utils.js',
    './js/search.js',
    './js/render.js',
    './js/router.js',
    './js/offline.js',
    './js/ai.js',
    './js/ask-dao.js',

    // JS Network
    './js/network/mother.js',
    './js/network/bus.js',
    './js/network/index.js',

    // JSON Index
    './data/data-ly-thuyet.json',
    './data/data-tac-gia.json',
    './data/data-tac-pham.json',
    './data/data-danh-ngon.json',
    './data/data-loi-binh.json',
    './data/data-tu-dien.json',
    './data/data-the-loai.json',
    './data/data-van-khi.json',
    './data/data-tu-dien-the-loai.json',

    // Manifests
    './data/manifests/index.json',
    './data/manifests/node-triet-thuyet.json',
    './data/manifests/node-ky-tai.json',
    './data/manifests/node-tinh-hoa.json',
    './data/manifests/node-the-loai.json'
];

// ==========================================================
// PHẦN 2: UTILITIES
// ==========================================================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Fetch HEAD an toàn
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function safeHeadCheck(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Fetch + parse JSON an toàn
 * @param {string} url
 * @returns {Promise<{data, error}>}
 */
async function safeJsonCheck(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
        const data = await res.json();
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err.message };
    }
}

// ==========================================================
// PHẦN 3: AUDIT - STATIC FILES
// ==========================================================

/**
 * Kiểm tra toàn bộ file tĩnh (JS, CSS, JSON Index, Manifests)
 * 
 * [FIX P4.16] Bỏ `?t=Date.now()` khi dynamic import
 */
export async function auditStaticFiles() {
    console.log(
        "%c[BÁC SĨ] Kiểm tra File Tĩnh...",
        "color: #2c3e38; font-weight: bold; font-size: 14px;"
    );

    const missingFiles = [];
    const jsSyntaxErrors = [];
    const cssLoadErrors = [];
    let validFiles = 0;

    for (const url of STATIC_ASSETS) {
        // Bước 1: Check tồn tại
        const exists = await safeHeadCheck(url);
        if (!exists) {
            missingFiles.push({ file: url, reason: '404 hoặc kết nối lỗi' });
            continue;
        }

        // Bước 2: Nếu là JS → test import (chỉ import, không execute)
        if (url.endsWith('.js')) {
            try {
                // [FIX P4.16] Import trực tiếp, không thêm query
                await import(url);
            } catch (err) {
                jsSyntaxErrors.push({
                    file: url,
                    error: err.message
                });
                continue;
            }
        }

        validFiles++;
    }

    // Báo cáo
    console.log(`[FILE TĨNH] Hợp lệ: ${validFiles}/${STATIC_ASSETS.length} file.`);

    if (missingFiles.length > 0) {
        console.group(
            "%c[LỖI 404] File bị thiếu",
            "color: #e74c3c; font-weight: bold;"
        );
        console.table(missingFiles);
        console.groupEnd();
    }

    if (jsSyntaxErrors.length > 0) {
        console.group(
            "%c[LỖI CÚ PHÁP JS] Code sai → sập trang",
            "color: #e74c3c; font-weight: bold;"
        );
        console.table(jsSyntaxErrors);
        console.groupEnd();
    }

    if (missingFiles.length === 0 && jsSyntaxErrors.length === 0) {
        console.log(
            "%c[HOÀN HẢO] Toàn bộ file tĩnh OK.",
            "color: #2ecc71; font-weight: bold;"
        );
    }

    return { validFiles, missingFiles, jsSyntaxErrors, total: STATIC_ASSETS.length };
}

// ==========================================================
// PHẦN 4: AUDIT - NETWORK LAYER
// ==========================================================

/**
 * Kiểm tra Network Layer: manifests + health
 */
export async function auditNetwork() {
    console.log(
        "%c[BÁC SĨ] Kiểm tra Network Layer...",
        "color: #2c3e38; font-weight: bold; font-size: 14px;"
    );

    const result = {
        indexOk: false,
        manifestsOk: [],
        manifestsFailed: [],
        health: []
    };

    // 1. Check index
    const { data: index, error: indexErr } = await safeJsonCheck('./data/manifests/index.json');
    if (indexErr) {
        console.error('[NETWORK] index.json lỗi:', indexErr);
    } else {
        result.indexOk = true;
        const nodeCount = (index.nodes || []).length;
        const routeCount = Object.keys(index.routing || {}).length;
        console.log(`[NETWORK] index.json OK: ${nodeCount} nodes, ${routeCount} routing entries.`);
    }

    // 2. Check từng manifest
    if (index && index.nodes) {
        for (const node of index.nodes) {
            const url = `./data/manifests/${node.manifest}`;
            const { data, error } = await safeJsonCheck(url);
            if (error) {
                result.manifestsFailed.push({ nodeId: node.id, url, error });
            } else {
                result.manifestsOk.push({ nodeId: node.id, label: data.label, endpoint: data.endpoint });
            }
        }
    }

    // 3. Health check
    try {
        result.health = await MotherNode.healthCheck(true);
        const online = result.health.filter(h => h.status === 'online').length;
        console.log(`[NETWORK] Health: ${online}/${result.health.length} node online.`);
    } catch (err) {
        console.error('[NETWORK] Health check lỗi:', err.message);
    }

    // Báo cáo
    if (result.manifestsFailed.length > 0) {
        console.group(
            "%c[NETWORK LỖI] Manifest không tải được",
            "color: #e74c3c; font-weight: bold;"
        );
        console.table(result.manifestsFailed);
        console.groupEnd();
    } else if (result.indexOk) {
        console.log(
            "%c[NETWORK HOÀN HẢO] Manifests + Health OK.",
            "color: #2ecc71; font-weight: bold;"
        );
    }

    return result;
}

// ==========================================================
// PHẦN 5: AUDIT - DATA INTEGRITY
// ==========================================================

/**
 * Kiểm tra dữ liệu chi tiết (tác phẩm / tác giả)
 * @param {'work'|'author'} type
 */
export async function auditData(type = 'work') {
    const isWork = type === 'work';
    const dataList = isWork ? APP_DATA.WORKS_DATA : APP_DATA.AUTHOR_DATA;
    const folder = isWork ? 'tac-pham' : 'tac-gia';
    const label = isWork ? 'TÁC PHẨM' : 'TÁC GIẢ';

    console.log(
        `%c[BÁC SĨ] Kiểm tra chi tiết ${label}...`,
        "color: #2c3e38; font-weight: bold; font-size: 14px;"
    );

    const errors404 = [];
    const errorsJSON = [];
    const emptyFiles = [];
    const validFiles = [];
    let validCount = 0;

    for (const item of dataList) {
        if (!item.id) continue;

        const url = `./data/${folder}/${encodeURIComponent(item.id)}.json`;
        const { data, error } = await safeJsonCheck(url);

        if (error) {
            if (error.includes('404')) {
                errors404.push({ id: item.id, name: item.title || item.name, path: url });
            } else {
                errorsJSON.push({ id: item.id, name: item.title || item.name, error });
            }
            continue;
        }

        // Check nội dung có thật không
        const content = data.content || '';
        const cleanText = content.replace(/<[^>]*>/g, '').trim();

        if (cleanText.length < 50 || cleanText.includes('đang được Văn Đạo hiệu đính')) {
            emptyFiles.push({ id: item.id, name: item.title || item.name });
        } else {
            validCount++;
            validFiles.push(item.id);
        }
    }

    // Báo cáo
    console.log(`[${label}] Có nội dung: ${validCount}/${dataList.length} file.`);

    if (errors404.length > 0) {
        console.group(
            `%c[LỖI 404] Thiếu file ${label} (${errors404.length})`,
            "color: #e74c3c; font-weight: bold;"
        );
        console.table(errors404);
        console.groupEnd();
    }

    if (errorsJSON.length > 0) {
        console.group(
            `%c[LỖI JSON] File ${label} hỏng (${errorsJSON.length})`,
            "color: #e74c3c; font-weight: bold;"
        );
        console.table(errorsJSON);
        console.groupEnd();
    }

    if (emptyFiles.length > 0) {
        console.group(
            `%c[CẢNH BÁO] File ${label} rỗng (${emptyFiles.length})`,
            "color: #f39c12; font-weight: bold;"
        );
        console.table(emptyFiles);
        console.groupEnd();
    }

    return {
        type,
        total: dataList.length,
        validCount,
        errors404,
        errorsJSON,
        emptyFiles
    };
}

// ==========================================================
// PHẦN 6: FULL DIAGNOSIS
// ==========================================================

/**
 * Chạy toàn bộ chẩn đoán
 * 
 * @returns {Promise<Object>} Báo cáo tổng hợp
 */
export async function runFullDiagnosis() {
    console.clear();

    console.log(
        "%c=== BỆNH VIỆN VĂN ĐẠO — CHẨN ĐOÁN TOÀN DIỆN ===",
        "background: linear-gradient(135deg, #2c3e38, #557a6f); color: #d4c4a8; font-size: 16px; font-weight: bold; padding: 10px 20px; border-radius: 8px;"
    );
    console.log(
        "%c[LƯU Ý] Nếu trang trắng hoặc sập, hãy xem kỹ bảng LỖI CÚ PHÁP JS.",
        "color: #8bb8a8; font-style: italic;"
    );

    const startTime = performance.now();
    const report = {
        timestamp: new Date().toISOString(),
        static: null,
        network: null,
        works: null,
        authors: null,
        duration: 0
    };

    // 1. Static files
    report.static = await auditStaticFiles();
    console.log("\n" + "─".repeat(50) + "\n");

    // 2. Network
    report.network = await auditNetwork();
    console.log("\n" + "─".repeat(50) + "\n");

    // 3. Works data
    report.works = await auditData('work');
    console.log("\n" + "─".repeat(50) + "\n");

    // 4. Authors data
    report.authors = await auditData('author');
    console.log("\n" + "─".repeat(50) + "\n");

    // Tổng kết
    report.duration = Math.round(performance.now() - startTime);

    const totalErrors =
        (report.static?.missingFiles?.length || 0) +
        (report.static?.jsSyntaxErrors?.length || 0) +
        (report.network?.manifestsFailed?.length || 0) +
        (report.works?.errors404?.length || 0) +
        (report.works?.errorsJSON?.length || 0) +
        (report.authors?.errors404?.length || 0) +
        (report.authors?.errorsJSON?.length || 0);

    if (totalErrors === 0) {
        console.log(
            `%c[✓] CHẨN ĐOÁN HOÀN TẤT — Hệ thống khỏe mạnh (${report.duration}ms)`,
            "background: #2ecc71; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    } else {
        console.log(
            `%c[✗] CHẨN ĐOÁN HOÀN TẤT — ${totalErrors} lỗi cần sửa (${report.duration}ms)`,
            "background: #e74c3c; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    }

    return report;
}

// ==========================================================
// PHẦN 7: EXPORT DEFAULT
// ==========================================================
export default {
    auditStaticFiles,
    auditNetwork,
    auditData,
    runFullDiagnosis
};