/**
 * ==========================================================
 * VĂN ĐẠO - AUDIT MODULE (js/audit.js)
 * Vị trí: js/audit.js
 * Version: 1.2.1 (AI Doctor Edition)
 * ==========================================================
 * CHỨC NĂNG:
 * - Chẩn đoán File Tĩnh (JS, CSS, JSON).
 * - Chẩn đoán Mạng lưới (Manifests, MotherNode).
 * - Chẩn đoán Dữ liệu (404, JSON lỗi, File rỗng, Thiếu Schema).
 * - Chẩn đoán AI (Test Input AI, Master AI, Các Agent).
 * 
 * CÁCH DÙNG: Mở Console (F12), gõ: window.audit()
 * ==========================================================
 */

import { APP_DATA } from './config.js';
import { MotherNode } from './network/mother.js';

// ==========================================================
// PHẦN 1: DANH SÁCH FILE TĨNH CẦN CHECK (Đã cập nhật AI)
// ==========================================================
const STATIC_ASSETS = [
    // CSS
    './css/variables.css', './css/base.css', './css/components.css', './css/layouts.css', './css/reader.css',
    
    // JS Core
    './js/config.js', './js/utils.js', './js/search.js', './js/render.js', 
    './js/router.js', './js/offline.js', './js/audit.js', './js/ask-dao.js', './js/main.js',
    
    // JS AI Multi-Agent (Hệ thống mới)
    './js/ai.js', './js/ai/core.js', './js/ai/input-ai.js', 
    './js/ai/master.js', './js/ai/output-ai.js',
    './js/ai/agents/literature.js', './js/ai/agents/poetics.js', 
    './js/ai/agents/analysis.js', './js/ai/agents/fortune-ai.js',

    // JS Network
    './js/network/mother.js', './js/network/bus.js', './js/network/index.js',

    // JSON Index
    './data/data-ly-thuyet.json', './data/data-tac-gia.json', './data/data-tac-pham.json',
    './data/data-danh-ngon.json', './data/data-loi-binh.json', './data/data-tu-dien.json',
    './data/data-the-loai.json', './data/data-van-khi.json', './data/data-tu-dien-the-loai.json',

    // Manifests
    './data/manifests/index.json', './data/manifests/node-triet-thuyet.json', 
    './data/manifests/node-ky-tai.json', './data/manifests/node-tinh-hoa.json', './data/manifests/node-the-loai.json'
];

// ==========================================================
// PHẦN 2: UTILITIES (Hàm tiện ích)
// ==========================================================
async function safeHeadCheck(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch { return false; }
}

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
// PHẦN 3: KHÁM FILE TĨNH
// ==========================================================
export async function auditStaticFiles() {
    console.log("%c[BÁC SĨ] 1. Kiểm tra File Tĩnh (JS, CSS, JSON)...", "color: #2c3e38; font-weight: bold; font-size: 14px;");
    
    const missingFiles = [];
    const jsErrors = [];
    let validFiles = 0;

    for (const url of STATIC_ASSETS) {
        const exists = await safeHeadCheck(url);
        if (!exists) {
            missingFiles.push({ file: url, reason: '404 hoặc lỗi kết nối' });
            continue;
        }
        if (url.endsWith('.js')) {
            try {
                await import(url);
            } catch (err) {
                jsErrors.push({ file: url, error: err.message });
                continue;
            }
        }
        validFiles++;
    }

    console.log(`[KẾT QUẢ] Hợp lệ: ${validFiles}/${STATIC_ASSETS.length} file.`);
    
    if (missingFiles.length > 0) {
        console.group("%c[LỖI 404] File bị thiếu", "color: #e74c3c; font-weight: bold;");
        console.table(missingFiles);
        console.groupEnd();
    }
    if (jsErrors.length > 0) {
        console.group("%c[LỖI CÚ PHÁP JS] Code sai → sập trang", "color: #e74c3c; font-weight: bold;");
        console.table(jsErrors);
        console.groupEnd();
    }
    if (missingFiles.length === 0 && jsErrors.length === 0) {
        console.log("%c[HOÀN HẢO] Toàn bộ file tĩnh OK.", "color: #2ecc71; font-weight: bold;");
    }

    return { missingFiles, jsErrors, validFiles };
}

// ==========================================================
// PHẦN 4: KHÁM MẠNG LƯỚI (NETWORK)
// ==========================================================
export async function auditNetwork() {
    console.log("%c[BÁC SĨ] 2. Kiểm tra Mạng Lưới...", "color: #2c3e38; font-weight: bold; font-size: 14px;");
    
    const result = { indexOk: false, manifestsFailed: [], health: [] };

    const { data: index, error: indexErr } = await safeJsonCheck('./data/manifests/index.json');
    if (indexErr) {
        console.error('[NETWORK] index.json lỗi:', indexErr);
    } else {
        result.indexOk = true;
        console.log(`[NETWORK] index.json OK: ${(index.nodes || []).length} nodes.`);
    }

    if (index && index.nodes) {
        for (const node of index.nodes) {
            const url = `./data/manifests/${node.manifest}`;
            const { error } = await safeJsonCheck(url);
            if (error) result.manifestsFailed.push({ nodeId: node.id, url, error });
        }
    }

    try {
        result.health = await MotherNode.healthCheck(true);
        const online = result.health.filter(h => h.status === 'online').length;
        console.log(`[NETWORK] Health: ${online}/${result.health.length} node online.`);
    } catch (err) {
        console.error('[NETWORK] Health check lỗi:', err.message);
    }

    if (result.manifestsFailed.length > 0) {
        console.group("%c[NETWORK LỖI] Manifest không tải được", "color: #e74c3c; font-weight: bold;");
        console.table(result.manifestsFailed);
        console.groupEnd();
    } else if (result.indexOk) {
        console.log("%c[NETWORK HOÀN HẢO] Manifests + Health OK.", "color: #2ecc71; font-weight: bold;");
    }
    return result;
}

// ==========================================================
// PHẦN 5: KHÁM DỮ LIỆU CHI TIẾT (SCHEMA & CONTENT)
// ==========================================================
export async function auditData(type = 'work') {
    const isWork = type === 'work';
    const dataList = isWork ? APP_DATA.WORKS_DATA : APP_DATA.AUTHOR_DATA;
    const folder = isWork ? 'tac-pham' : 'tac-gia';
    const label = isWork ? 'TÁC PHẨM' : 'TÁC GIẢ';

    console.log(`%c[BÁC SĨ] 3. Kiểm tra chi tiết ${label}...`, "color: #2c3e38; font-weight: bold; font-size: 14px;");

    const errors404 = [];
    const errorsJSON = [];
    const errorsSchema = [];
    const emptyFiles = [];
    let validCount = 0;

    for (const item of (dataList || [])) {
        if (!item.id) continue;
        const url = `./data/${folder}/${encodeURIComponent(item.id)}.json`;
        const { data, error } = await safeJsonCheck(url);

        if (error) {
            if (error.includes('404')) errors404.push({ id: item.id, name: item.title || item.name });
            else errorsJSON.push({ id: item.id, name: item.title || item.name, error });
            continue;
        }

        // Check Schema (Cấu trúc)
        if (isWork && (!data.title || !data.author)) {
            errorsSchema.push({ id: item.id, error: 'Thiếu title hoặc author' });
            continue;
        }

        // Check Nội dung
        const content = data.content || '';
        const cleanText = content.replace(/<[^>]*>/g, '').trim();

        if (cleanText.length < 50 || cleanText.includes('đang được Văn Đạo hiệu đính')) {
            emptyFiles.push({ id: item.id, name: item.title || item.name });
        } else {
            validCount++;
        }
    }

    console.log(`[${label}] Có nội dung: ${validCount}/${dataList.length} file.`);
    
    if (errors404.length > 0) {
        console.group(`%c[LỖI 404] Thiếu file ${label} (${errors404.length})`, "color: #e74c3c; font-weight: bold;");
        console.table(errors404); console.groupEnd();
    }
    if (errorsJSON.length > 0) {
        console.group(`%c[LỖI JSON] File ${label} hỏng (${errorsJSON.length})`, "color: #e74c3c; font-weight: bold;");
        console.table(errorsJSON); console.groupEnd();
    }
    if (errorsSchema.length > 0) {
        console.group(`%c[LỖI SCHEMA] File ${label} sai cấu trúc (${errorsSchema.length})`, "color: #e74c3c; font-weight: bold;");
        console.table(errorsSchema); console.groupEnd();
    }
    if (emptyFiles.length > 0) {
        console.group(`%c[CẢNH BÁO] File ${label} rỗng (${emptyFiles.length})`, "color: #f39c12; font-weight: bold;");
        console.table(emptyFiles); console.groupEnd();
    }

    return { total: dataList.length, validCount, errors404, errorsJSON, errorsSchema, emptyFiles };
}

// ==========================================================
// PHẦN 6: KHÁM SỨC KHỎE AI (MULTI-AGENT)
// ==========================================================
export async function auditAI() {
    console.log("%c[BÁC SĨ] 4. Chạy Test AI (Input -> Master -> Agents)...", "color: #2c3e38; font-weight: bold; font-size: 14px;");
    
    const results = [];
    
    try {
        // Import động MasterAI để không bị vòng lặp import
        const { MasterAI } = await import('./ai/master.js');
        
        const testCases = [
            { input: "Ai viết Truyện Kiều?", expectedType: "find-author-of", expectedKeyword: "Nguyễn Du" },
            { input: "Tóm tắt Chí Phèo", expectedType: "summarize-work", expectedKeyword: "Chí Phèo" },
            { input: "Ý nghĩa của trăng", expectedType: "explain-symbol", expectedKeyword: "trăng" },
            { input: "Gợi ý truyện ngắn", expectedType: "recommend", expectedKeyword: "Gợi ý" }
        ];

        for (const tc of testCases) {
            const intent = MasterAI.parseIntent(tc.input);
            
            // Test 1: Xem Input AI nhận diện đúng Intent không
            const isIntentCorrect = intent.type === tc.expectedType;
            
            // Test 2: Xem Master AI trả về kết quả
            let result = null;
            if (intent.type !== 'search') {
                result = await MasterAI.dispatch(intent);
            }

            // [FIX] Kiểm tra cả answer, detail và meta (vì có câu trả lời nằm ở detail)
            let combinedResult = '';
            if (result) {
                combinedResult = [
                    result.answer || '',
                    result.detail || '',
                    ...(result.meta || []).map(m => m.title || m.name || '')
                ].join(' ');
            }
            const isResultOk = combinedResult.includes(tc.expectedKeyword);

            results.push({
                'Câu hỏi': tc.input,
                'Intent': intent.type,
                'Trạng thái': (isIntentCorrect && isResultOk) ? '✅ PASS' : '❌ FAIL',
                'Kết quả trả về': result ? (result.answer || '').substring(0, 30) + '...' : 'Lỗi/Không có'
            });
        }

        console.table(results);
        
        const passed = results.filter(r => r['Trạng thái'] === '✅ PASS').length;
        if (passed === results.length) {
            console.log("%c[HOÀN HẢO] Hệ thống AI hoạt động chính xác 100%.", "color: #2ecc71; font-weight: bold;");
        } else {
            console.warn(`[CẢNH BÁO] Chỉ có ${passed}/${results.length} test cases PASS. Cần kiểm tra lại AI.`);
        }

    } catch (err) {
        console.error("[AI LỖI] Không thể chạy test AI:", err.message);
        results.push({ 'Câu hỏi': 'Init', 'Intent': 'Error', 'Trạng thái': '❌ FAIL', 'Kết quả trả về': err.message });
    }

    return results;
}

// ==========================================================
// PHẦN 7: CHẨN ĐOÁN TOÀN DIỆN
// ==========================================================
export async function runFullDiagnosis() {
    console.clear();
    console.log(
        "%c=== BỆNH VIỆN VĂN ĐẠO — CHẨN ĐOÁN TOÀN DIỆN v1.2.1 ===",
        "background: linear-gradient(135deg, #2c3e38, #557a6f); color: #d4c4a8; font-size: 16px; font-weight: bold; padding: 10px 20px; border-radius: 8px;"
    );

    const startTime = performance.now();

    // 1. Khám Tĩnh
    const staticResult = await auditStaticFiles();
    console.log("\n" + "─".repeat(50) + "\n");

    // 2. Khám Mạng
    const networkResult = await auditNetwork();
    console.log("\n" + "─".repeat(50) + "\n");

    // 3. Khám Dữ Liệu
    const worksResult = await auditData('work');
    console.log("\n" + "─".repeat(50) + "\n");
    
    const authorsResult = await auditData('author');
    console.log("\n" + "─".repeat(50) + "\n");

    // 4. Khám AI
    const aiResult = await auditAI();
    console.log("\n" + "─".repeat(50) + "\n");

    // Tổng kết
    const duration = Math.round(performance.now() - startTime);
    const totalErrors = 
        staticResult.missingFiles.length + 
        staticResult.jsErrors.length + 
        networkResult.manifestsFailed.length + 
        worksResult.errors404.length + worksResult.errorsJSON.length + worksResult.errorsSchema.length +
        authorsResult.errors404.length + authorsResult.errorsJSON.length + authorsResult.errorsSchema.length;

    if (totalErrors === 0) {
        console.log(
            `%c[✓] CHẨN ĐOÁN HOÀN TẤT — Hệ thống khỏe mạnh (${duration}ms)`,
            "background: #2ecc71; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    } else {
        console.log(
            `%c[✗] CHẨN ĐOÁN HOÀN TẤT — ${totalErrors} lỗi cần sửa (${duration}ms)`,
            "background: #e74c3c; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    }

    return { static: staticResult, network: networkResult, works: worksResult, authors: authorsResult, ai: aiResult, duration };
}

// ==========================================================
// PHẦN 8: EXPORT DEFAULT
// ==========================================================
export default {
    auditStaticFiles,
    auditNetwork,
    auditData,
    auditAI,
    runFullDiagnosis
};