/**
 * ==========================================================
 * VĂN ĐẠO - AUDIT MODULE (js/audit.js)
 * Vị trí: js/audit.js
 * Version: 4.0.4 (Modular Testing & Path Resolved)
 * ==========================================================
 * CHỨC NĂNG:
 * - Chẩn đoán File Tĩnh (JS, CSS, JSON) -> Phát hiện 404, lỗi cú pháp.
 * - Chẩn đoán Mạng lưới (DataHub, AgentRegistry, VDBus) -> Phát hiện đứt gãy.
 * - Chẩn đoán Dữ liệu (Index vs Detail) -> Phát hiện mồ côi, thiếu file.
 * - Chẩn đoán AI (Toàn bộ Pipeline) -> Test tất cả các Intent.
 * 
 * HƯỚNG DẪN SỬ DỤNG (Mở Console F12, gõ):
 * ---------------------------------------------------------
 * 1. Khám TỔNG QUÁT toàn bộ hệ thống:
 *    window.audit()
 * 
 * 2. Khám FILE TĨNH (JS, CSS, JSON):
 *    window.auditStaticFiles()
 * 
 * 3. Khám MẠNG LƯỚI (DataHub, AgentRegistry):
 *    window.auditNetwork()
 * 
 * 4. Khám DỮ LIỆU TÁC PHẨM (Chỉ quét file tác phẩm):
 *    window.auditWorks()
 * 
 * 5. Khám DỮ LIỆU TÁC GIẢ (Chỉ quét file tác giả):
 *    window.auditAuthors()
 * 
 * 6. Test AI với một câu hỏi cụ thể:
 *    window.auditSingleQuery("Ai viết Truyện Kiều?")
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
// PHẦN 1: DANH SÁCH FILE TĨNH
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
// PHẦN 2: UTILITIES & LOGGING
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
function logError(msg) { 
    console.error(`%c[LỖI] %c${msg}`, 'color: #e74c3c; font-weight: bold;', 'color: inherit;'); 
}
function logWarning(msg) { 
    console.warn(`%c[CẢNH BÁO] %c${msg}`, 'color: #f39c12; font-weight: bold;', 'color: inherit;'); 
}
function logSuccess(msg) { 
    console.log(`%c[OK] %c${msg}`, 'color: #2ecc71; font-weight: bold;', 'color: inherit;'); 
}
function logAdvice(msg) {
    console.log(`%c[GỢI Ý] %c${msg}`, 'color: #3498db; font-weight: bold;', 'color: #7f8c8d; font-style: italic;');
}

// =====================================================================
// PHẦN 3: CÁC HÀM KHÁM CHUYÊN KHOA (Gọi riêng lẻ)
// =====================================================================

// 3.1 Khám File Tĩnh (CSS, JS, JSON)
export async function auditStaticFiles() {
    logGroup('[BÁC SĨ] KHÁM FILE TĨNH (CSS, JS, JSON)...');
    console.log(`[HỆ THỐNG] Đường dẫn gốc: ${BASE_URL}`);
    
    const missingFiles = [];
    const allUrls = [...STATIC_ASSETS.css, ...STATIC_ASSETS.js, ...STATIC_ASSETS.json];

    for (const relPath of allUrls) {
        const result = await checkFile(relPath);
        if (!result.ok) {
            missingFiles.push({ file: relPath, status: result.status || result.error });
        }
    }

    if (missingFiles.length > 0) {
        logError(`Thiếu ${missingFiles.length} file.`);
        console.table(missingFiles);
        logAdvice('Kiểm tra lại đường dẫn, đảm bảo file đã được push lên GitHub.');
    } else {
        logSuccess(`Toàn bộ ${allUrls.length} file tĩnh đều tồn tại trên Server.`);
    }
    return { missingFiles };
}

// 3.2 Khám Mạng Lưới (DataHub & AgentRegistry)
export async function auditNetwork() {
    logGroup('[BÁC SĨ] KHÁM MẠNG LƯỚI (DataHub & AgentRegistry)...');
    const errors = [];

    // Kiểm tra DataHub
    try {
        const testMeta = DataHub.getMetadata('truyen-kieu');
        if (!testMeta) errors.push({ node: 'DataHub', error: 'Không lấy được Metadata của "truyen-kieu".' });
        
        const testGraph = DataHub.getGraph('truyen-kieu');
        if (!testGraph || !testGraph.author) errors.push({ node: 'DataHub', error: 'Không xây dựng được Graph cho "truyen-kieu".' });

        if (errors.length === 0) logSuccess('DataHub: Metadata và Graph hoạt động tốt.');
    } catch (err) {
        errors.push({ node: 'DataHub', error: err.message });
    }

    // Kiểm tra AgentRegistry
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

// 3.3 Khám Tác Phẩm (Chỉ quét Tác phẩm)
export async function auditWorks() {
    logGroup('[BÁC SĨ] KHÁM DỮ LIỆU TÁC PHẨM...');
    console.log(`[ĐANG QUÉT] ${APP_DATA.WORKS_DATA.length} Tác phẩm...`);
    const issues = [];

    for (const item of APP_DATA.WORKS_DATA) {
        if (!item.id) continue;
        const relPath = `data/tac-pham/${encodeURIComponent(item.id)}.json`;
        const { data, error } = await fetchJson(relPath);
        
        if (error) {
            issues.push({ id: item.id, title: item.title, error });
        } else {
            const cleanText = (data.content || '').replace(/<[^>]*>/g, '').trim();
            if (cleanText.length < 50) {
                issues.push({ id: item.id, title: item.title, error: 'File rỗng hoặc thiếu content' });
            }
        }
    }

    if (issues.length > 0) {
        logError(`Có ${issues.length} Tác phẩm bị lỗi.`);
        console.table(issues.slice(0, 10)); // Hiện 10 lỗi đầu
        if (issues.length > 10) console.log(`... và ${issues.length - 10} lỗi khác.`);
        logAdvice('Chạy tool auto_fill_content.py để bổ sung file rỗng.');
    } else {
        logSuccess('Tất cả Tác phẩm đều có file JSON chi tiết và đầy đủ nội dung.');
    }
    return { issues };
}

// 3.4 Khám Tác Giả (Chỉ quét Tác giả)
export async function auditAuthors() {
    logGroup('[BÁC SĨ] KHÁM DỮ LIỆU TÁC GIẢ...');
    console.log(`[ĐANG QUÉT] ${APP_DATA.AUTHOR_DATA.length} Tác giả...`);
    const issues = [];

    for (const item of APP_DATA.AUTHOR_DATA) {
        if (!item.id) continue;
        const relPath = `data/tac-gia/${encodeURIComponent(item.id)}.json`;
        const { data, error } = await fetchJson(relPath);
        
        if (error) {
            issues.push({ id: item.id, title: item.title, error });
        } else {
            const cleanText = (data.content || '').replace(/<[^>]*>/g, '').trim();
            if (cleanText.length < 50) {
                issues.push({ id: item.id, title: item.title, error: 'File rỗng hoặc thiếu content' });
            }
        }
    }

    if (issues.length > 0) {
        logError(`Có ${issues.length} Tác giả bị lỗi.`);
        console.table(issues.slice(0, 10));
        if (issues.length > 10) console.log(`... và ${issues.length - 10} lỗi khác.`);
        logAdvice('Chạy tool split_authors.py để bổ sung file.');
    } else {
        logSuccess('Tất cả Tác giả đều có file JSON chi tiết và đầy đủ nội dung.');
    }
    return { issues };
}

// 3.5 Khám AI (Toàn bộ Pipeline)
export async function auditAIPipeline() {
    logGroup('[BÁC SĨ] KHÁM SỨC KHỎE AI (Pipeline)...');
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
        if (failed === 0) {
            logSuccess('AI Pipeline hoạt động chính xác 100%.');
        } else {
            logError(`Có ${failed}/${results.length} test cases thất bại.`);
            logAdvice('Kiểm tra lại InputAI (nhận diện), Agent tương ứng (xử lý), hoặc OutputAI (render).');
        }

    } catch (err) {
        logError(`Lỗi khởi tạo AI: ${err.message}`);
        results.push({ 'Câu hỏi': 'Init', 'Intent': 'Error', 'Khớp Type': 'SAI', 'Khớp Data': 'SAI', 'Render HTML': 'SAI' });
    }

    return results;
}

// 3.6 Test 1 câu hỏi duy nhất
export async function auditSingleQuery(query) {
    logGroup(`[BÁC SĨ] TEST CÂU HỎI: "${query}"`);
    try {
        const { MasterAI } = await import('./ai/master.js');
        const intent = MasterAI.parseIntent(query);
        console.log('[1] Phân tích Intent:', intent);
        
        if (intent.type === 'search') {
            logWarning('Đây là câu hỏi tìm kiếm thông thường, không gọi Agent.');
            return;
        }

        const result = await MasterAI.dispatch(intent);
        console.log('[2] Kết quả từ Agent:', result);
        logSuccess('Hoàn tất test.');
    } catch (err) {
        logError(`Lỗi test: ${err.message}`);
    }
}

// =====================================================================
// PHẦN 4: KHÁM TỔNG QUÁT (Gọi tất cả)
// =====================================================================
export async function runFullDiagnosis() {
    console.clear();
    console.log(
        "%c=== BỆNH VIỆN VĂN ĐẠO — CHẨN ĐOÁN TOÀN DIỆN v4.0.4 ===",
        "background: linear-gradient(135deg, #2c3e38, #557a6f); color: #d4c4a8; font-size: 16px; font-weight: bold; padding: 10px 20px; border-radius: 8px;"
    );

    const startTime = performance.now();

    const staticResult = await auditStaticFiles();
    console.log("\n" + "─".repeat(60) + "\n");

    const networkResult = await auditNetwork();
    console.log("\n" + "─".repeat(60) + "\n");

    const worksResult = await auditWorks();
    console.log("\n" + "─".repeat(60) + "\n");

    const authorsResult = await auditAuthors();
    console.log("\n" + "─".repeat(60) + "\n");

    const aiResult = await auditAIPipeline();
    console.log("\n" + "─".repeat(60) + "\n");

    const duration = Math.round(performance.now() - startTime);
    
    const totalErrors = 
        staticResult.missingFiles.length + 
        networkResult.errors.length + 
        worksResult.issues.length + 
        authorsResult.issues.length +
        aiResult.filter(r => r['Khớp Type'] === 'SAI' || r['Render HTML'] === 'SAI').length;

    if (totalErrors === 0) {
        console.log(
            `%c[✓] CHẨN ĐOÁN HOÀN TẤT — Hệ thống khỏe mạnh (${duration}ms)`,
            "background: #2ecc71; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    } else {
        console.log(
            `%c[✗] CHẨN ĐOÁN HOÀN TẤT — ${totalErrors} vấn đề cần khắc phục (${duration}ms)`,
            "background: #e74c3c; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    }

    return { static: staticResult, network: networkResult, works: worksResult, authors: authorsResult, ai: aiResult, duration };
}

// =====================================================================
// PHẦN 5: XUẤT RA WINDOW TOÀN CỤC (Để gõ trong Console)
// =====================================================================
window.audit = runFullDiagnosis;
window.auditStaticFiles = auditStaticFiles;
window.auditNetwork = auditNetwork;
window.auditWorks = auditWorks;
window.auditAuthors = auditAuthors;
window.auditAIPipeline = auditAIPipeline;
window.auditSingleQuery = auditSingleQuery;

export default {
    runFullDiagnosis, 
    auditStaticFiles, 
    auditNetwork, 
    auditWorks, 
    auditAuthors, 
    auditAIPipeline, 
    auditSingleQuery
};
