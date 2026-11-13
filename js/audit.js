/**
 * ==========================================================
 * VĂN ĐẠO - AUDIT MODULE (js/audit.js)
 * Vị trí: js/audit.js
 * Version: 4.0.3 (Absolute Path Resolution)
 * ==========================================================
 * CHỨC NĂNG:
 * - Chẩn đoán File Tĩnh (JS, CSS, JSON).
 * - Chẩn đoán Mạng lưới (DataHub, AgentRegistry, VDBus).
 * - Chẩn đoán Dữ liệu (Index vs Detail).
 * - Chẩn đoán AI (Toàn bộ Pipeline).
 * 
 * CÁCH DÙNG: Mở Console (F12), gõ: window.audit()
 * ==========================================================
 */

import { APP_DATA, STATE } from './config.js';
import { DataHub, AgentRegistry, VDBus } from './network/index.js';

// =====================================================================
// TÍNH TOÁN ĐƯỜNG DẪN GỐC (BASE URL)
// File audit.js nằm trong thư mục /js/, nên lùi 1 cấp (../) là gốc dự án.
// =====================================================================
const BASE_URL = new URL('../', import.meta.url).href;

// =====================================================================
// PHẦN 1: DANH SÁCH FILE TĨNH (Đường dẫn tính từ gốc dự án)
// =====================================================================
const STATIC_ASSETS = {
    css: [
        'css/variables.css', 'css/base.css', 'css/components.css', 
        'css/layouts.css', 'css/reader.css'
    ],
    js: [
        'js/config.js', 'js/utils.js', 'js/search.js', 'js/render.js', 
        'js/router.js', 'js/offline.js', 'js/audit.js', 'js/ask-dao.js', 'js/main.js',
        'js/ai.js', 'js/ai/core.js', 'js/ai/input-ai.js', 
        'js/ai/master.js', 'js/ai/output-ai.js',
        'js/ai/agents/index.js', 'js/ai/agents/literature.js', 
        'js/ai/agents/poetics.js', 'js/ai/agents/analysis.js', 
        'js/ai/agents/fortune-ai.js', 'js/ai/agents/knowledge.js',
        'js/ai/agents/history.js', 'js/ai/agents/praiser.js', 'js/ai/agents/critic.js',
        'js/network/data-hub.js', 'js/network/bus.js', 'js/network/index.js'
    ],
    json: [
        'data/data-ly-thuyet.json', 'data/data-tac-gia.json', 'data/data-tac-pham.json',
        'data/data-danh-ngon.json', 'data/data-loi-binh.json', 'data/data-tu-dien.json',
        'data/data-the-loai.json', 'data/data-van-khi.json', 'data/data-tu-dien-the-loai.json',
        'data/manifests/index.json', 'data/manifests/node-triet-thuyet.json', 
        'data/manifests/node-ky-tai.json', 'data/manifests/node-tinh-hoa.json', 'data/manifests/node-the-loai.json'
    ]
};

// =====================================================================
// PHẦN 2: UTILITIES (Công cụ hỗ trợ)
// =====================================================================
async function checkFile(relativePath) {
    const absoluteUrl = new URL(relativePath, BASE_URL).href;
    try {
        const res = await fetch(absoluteUrl, { method: 'HEAD' });
        return { ok: res.ok, url: absoluteUrl, status: res.status };
    } catch (err) {
        return { ok: false, url: absoluteUrl, error: err.message };
    }
}

async function fetchJson(relativePath) {
    const absoluteUrl = new URL(relativePath, BASE_URL).href;
    try {
        const res = await fetch(absoluteUrl);
        if (!res.ok) return { data: null, error: `HTTP ${res.status}`, url: absoluteUrl };
        const data = await res.json();
        return { data, error: null, url: absoluteUrl };
    } catch (err) {
        return { data: null, error: err.message, url: absoluteUrl };
    }
}

function logGroup(title, color = '#2c3e38') {
    console.group(`%c${title}`, `color: ${color}; font-weight: bold; font-size: 14px;`);
}
function logError(msg) { console.error(`%c[LỖI] %c${msg}`, 'color: #e74c3c; font-weight: bold;', 'color: inherit;'); }
function logWarning(msg) { console.warn(`%c[CẢNH BÁO] %c${msg}`, 'color: #f39c12; font-weight: bold;', 'color: inherit;'); }
function logSuccess(msg) { console.log(`%c[OK] %c${msg}`, 'color: #2ecc71; font-weight: bold;', 'color: inherit;'); }
function logAdvice(msg) { console.log(`%c[GỢI Ý] %c${msg}`, 'color: #3498db; font-weight: bold;', 'color: #7f8c8d; font-style: italic;'); }

// =====================================================================
// PHẦN 3: KHÁM FILE TĨNH
// =====================================================================
export async function auditStaticFiles() {
    logGroup('[BÁC SĨ] 1. Kiểm tra File Tĩnh (CSS, JS, JSON)...');
    console.log(`[HỆ THỐNG] Đường dẫn gốc: ${BASE_URL}`);
    
    const missingFiles = [];
    let validFiles = 0;
    const totalFiles = STATIC_ASSETS.css.length + STATIC_ASSETS.js.length + STATIC_ASSETS.json.length;

    // Gộp chung CSS và JSON để check tồn tại
    const allUrlsToCheck = [...STATIC_ASSETS.css, ...STATIC_ASSETS.json, ...STATIC_ASSETS.js];

    for (const relPath of allUrlsToCheck) {
        const result = await checkFile(relPath);
        if (!result.ok) {
            missingFiles.push({ file: relPath, status: result.status || result.error });
        } else {
            validFiles++;
        }
    }

    if (missingFiles.length > 0) {
        logError(`Thiếu ${missingFiles.length} file.`);
        console.table(missingFiles);
        logAdvice('Kiểm tra lại đường dẫn và đảm bảo file đã được push lên GitHub.');
    } else {
        logSuccess(`Toàn bộ ${totalFiles} file tĩnh đều tồn tại trên Server.`);
    }

    return { missingFiles, validFiles, totalFiles };
}

// =====================================================================
// PHẦN 4: KHÁM MẠNG LƯỚI
// =====================================================================
export async function auditNetwork() {
    logGroup('[BÁC SĨ] 2. Kiểm tra Mạng Lưới (DataHub & AgentRegistry)...');
    const errors = [];

    try {
        const testMeta = DataHub.getMetadata('truyen-kieu');
        if (!testMeta) errors.push({ node: 'DataHub', error: 'Không lấy được Metadata của "truyen-kieu".' });
        
        const testGraph = DataHub.getGraph('truyen-kieu');
        if (!testGraph || !testGraph.author) errors.push({ node: 'DataHub', error: 'Không xây dựng được Graph cho "truyen-kieu".' });

        if (errors.length === 0) logSuccess('DataHub: Metadata và Graph hoạt động tốt.');
    } catch (err) {
        errors.push({ node: 'DataHub', error: err.message });
    }

    try {
        const agentKeys = AgentRegistry.getAllAgentKeys();
        if (agentKeys.length === 0) {
            errors.push({ node: 'AgentRegistry', error: 'Không có Agent nào được đăng ký.' });
        } else {
            const { AgentMap } = await import('./ai/agents/index.js');
            const missingInMap = agentKeys.filter(k => !AgentMap[k]);
            if (missingInMap.length > 0) {
                errors.push({ node: 'AgentRegistry', error: `Thiếu trong AgentMap: ${missingInMap.join(', ')}` });
            } else {
                logSuccess(`AgentRegistry: ${agentKeys.length} agents hoạt động tốt.`);
            }
        }
    } catch (err) {
        errors.push({ node: 'AgentRegistry', error: err.message });
    }

    if (errors.length > 0) {
        logError(`Mạng lưới gặp ${errors.length} sự cố.`);
        console.table(errors);
    }
    return { errors };
}

// =====================================================================
// PHẦN 5: KHÁM DỮ LIỆU CHI TIẾT (TÁC GIẢ & TÁC PHẨM)
// =====================================================================
export async function auditDataIntegrity() {
    logGroup('[BÁC SĨ] 3. Kiểm tra Toàn vẹn Dữ liệu (Tác giả & Tác phẩm)...');
    const issues = { works: [], authors: [] };

    // 1. Kiểm tra Tác phẩm
    console.log(`[ĐANG QUÉT] ${APP_DATA.WORKS_DATA.length} Tác phẩm...`);
    for (const item of APP_DATA.WORKS_DATA) {
        if (!item.id) continue;
        // Đường dẫn tới file json chi tiết
        const relPath = `data/tac-pham/${encodeURIComponent(item.id)}.json`;
        const { data, error } = await fetchJson(relPath);
        
        if (error) {
            issues.works.push({ id: item.id, title: item.title, error });
        } else {
            const cleanText = (data.content || '').replace(/<[^>]*>/g, '').trim();
            // Kiểm tra file có nội dung thực sự không (dài hơn 50 ký tự)
            if (cleanText.length < 50) {
                issues.works.push({ id: item.id, title: item.title, error: 'File rỗng hoặc chưa có nội dung (content).' });
            }
        }
    }

    // 2. Kiểm tra Tác giả
    console.log(`[ĐANG QUÉT] ${APP_DATA.AUTHOR_DATA.length} Tác giả...`);
    for (const item of APP_DATA.AUTHOR_DATA) {
        if (!item.id) continue;
        const relPath = `data/tac-gia/${encodeURIComponent(item.id)}.json`;
        const { data, error } = await fetchJson(relPath);
        
        if (error) {
            issues.authors.push({ id: item.id, title: item.title, error });
        } else {
            const cleanText = (data.content || '').replace(/<[^>]*>/g, '').trim();
            if (cleanText.length < 50) {
                issues.authors.push({ id: item.id, title: item.title, error: 'File rỗng hoặc chưa có nội dung (content).' });
            }
        }
    }

    // Báo cáo
    if (issues.works.length > 0) {
        logError(`Có ${issues.works.length} Tác phẩm bị lỗi (thiếu file hoặc rỗng).`);
        console.table(issues.works.slice(0, 10)); // Chỉ hiện 10 lỗi đầu tiên cho đỡ rối
        if (issues.works.length > 10) console.log(`... và ${issues.works.length - 10} lỗi khác.`);
        logAdvice('Chạy tool auto_fill_content.py hoặc split_works.py để bổ sung file.');
    }
    if (issues.authors.length > 0) {
        logError(`Có ${issues.authors.length} Tác giả bị lỗi (thiếu file hoặc rỗng).`);
        console.table(issues.authors.slice(0, 10));
        logAdvice('Chạy tool split_authors.py để bổ sung file.');
    }

    if (issues.works.length === 0 && issues.authors.length === 0) {
        logSuccess('Toàn vẹn dữ liệu: 100% file JSON chi tiết đều tồn tại và có nội dung.');
    }

    return issues;
}

// =====================================================================
// PHẦN 6: KHÁM SỨC KHỎE AI
// =====================================================================
export async function auditAIPipeline() {
    logGroup('[BÁC SĨ] 4. Chạy Test AI (Input -> Master -> Agents -> Output)...');
    const testCases = [
        { input: "Ai viết Truyện Kiều?", expectedType: "find-author-of", expectedKeyword: "Nguyễn Du" },
        { input: "Tóm tắt Chí Phèo", expectedType: "summarize-work", expectedKeyword: "Chí Phèo" },
        { input: "Ý nghĩa của trăng", expectedType: "explain-symbol", expectedKeyword: "trăng" },
        { input: "Tiểu sử Nguyễn Du", expectedType: "find-author-info", expectedKeyword: "Nguyễn Du" },
        { input: "Nguyễn Du có những tác phẩm nào?", expectedType: "list-author-works", expectedKeyword: "Nguyễn Du" },
        { input: "Tác phẩm nào giống Truyện Kiều?", expectedType: "find-related", expectedKeyword: "Truyện Kiều" },
        { input: "Tác phẩm thời nhà Lê", expectedType: "find-works-by-era", expectedKeyword: "Lê" },
        { input: "Truyện Kiều viết thời nào?", expectedType: "get-historical-context", expectedKeyword: "TK 19" }
    ];

    const results = [];
    try {
        const { MasterAI } = await import('./ai/master.js');
        const { OutputAI } = await import('./ai/output-ai.js');
        const dummyContainer = document.createElement('div');

        for (const tc of testCases) {
            const intent = MasterAI.parseIntent(tc.input);
            const isIntentCorrect = intent.type === tc.expectedType;
            
            let result = null;
            let isOutputOk = false;

            if (intent.type !== 'search') {
                result = await MasterAI.dispatch(intent);
                try {
                    OutputAI.render(dummyContainer, result, tc.input);
                    isOutputOk = dummyContainer.innerHTML.includes(tc.expectedKeyword);
                } catch (e) {
                    isOutputOk = false;
                }
            }

            const combinedResult = result ? [result.answer, result.detail, ...(result.meta || []).map(m => m.title)].join(' ') : '';
            const isResultOk = combinedResult.includes(tc.expectedKeyword);

            results.push({
                'Câu hỏi': tc.input.substring(0, 20) + '...',
                'Intent': intent.type,
                'Khớp Type': isIntentCorrect ? 'ĐÚNG' : 'SAI',
                'Khớp Data': isResultOk ? 'ĐÚNG' : 'SAI',
                'Render HTML': isOutputOk ? 'ĐÚNG' : 'SAI'
            });
        }

        console.table(results);
        
        const failed = results.filter(r => r['Khớp Type'] === 'SAI' || r['Khớp Data'] === 'SAI' || r['Render HTML'] === 'SAI').length;
        if (failed === 0) logSuccess('AI Pipeline hoạt động chính xác 100%.');
        else {
            logError(`Có ${failed}/${results.length} test cases thất bại.`);
            logAdvice('Kiểm tra lại InputAI, Agent tương ứng, hoặc OutputAI.');
        }

    } catch (err) {
        logError(`Lỗi khởi tạo AI: ${err.message}`);
        results.push({ 'Câu hỏi': 'Init', 'Intent': 'Error', 'Khớp Type': 'SAI', 'Khớp Data': 'SAI', 'Render HTML': 'SAI' });
    }

    return results;
}

// =====================================================================
// PHẦN 7: CHẨN ĐOÁN TOÀN DIỆN
// =====================================================================
export async function runFullDiagnosis() {
    console.clear();
    console.log(
        "%c=== BỆNH VIỆN VĂN ĐẠO — CHẨN ĐOÁN TOÀN DIỆN v4.0.3 ===",
        "background: linear-gradient(135deg, #2c3e38, #557a6f); color: #d4c4a8; font-size: 16px; font-weight: bold; padding: 10px 20px; border-radius: 8px;"
    );

    const startTime = performance.now();

    const staticResult = await auditStaticFiles();
    console.log("\n" + "─".repeat(60) + "\n");

    const networkResult = await auditNetwork();
    console.log("\n" + "─".repeat(60) + "\n");

    const dataResult = await auditDataIntegrity();
    console.log("\n" + "─".repeat(60) + "\n");

    const aiResult = await auditAIPipeline();
    console.log("\n" + "─".repeat(60) + "\n");

    const duration = Math.round(performance.now() - startTime);
    
    const totalErrors = 
        staticResult.missingFiles.length + 
        networkResult.errors.length + 
        dataResult.works.length + 
        dataResult.authors.length +
        aiResult.filter(r => r['Khớp Type'] === 'SAI' || r['Render HTML'] === 'SAI').length;

    if (totalErrors === 0) {
        console.log(
            `%c[✓] CHẨN ĐOÁN HOÀN TẤT — Hệ thống hoàn hảo (${duration}ms)`,
            "background: #2ecc71; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    } else {
        console.log(
            `%c[✗] CHẨN ĐOÁN HOÀN TẤT — ${totalErrors} vấn đề cần khắc phục (${duration}ms)`,
            "background: #e74c3c; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    }

    return { static: staticResult, network: networkResult, data: dataResult, ai: aiResult, duration };
}

export default {
    auditStaticFiles,
    auditNetwork,
    auditDataIntegrity,
    auditAIPipeline,
    runFullDiagnosis
};
