/**
 * ==========================================================
 * VĂN ĐẠO - AUDIT MODULE (js/audit.js)
 * Vị trí: js/audit.js
 * Version: 4.0.2 (Text-Only Logs)
 * ==========================================================
 * CHỨC NĂNG:
 * - Chẩn đoán File Tĩnh (JS, CSS, JSON) -> Phát hiện 404, lỗi cú pháp.
 * - Chẩn đoán Mạng lưới (DataHub, AgentRegistry, VDBus) -> Phát hiện đứt gãy.
 * - Chẩn đoán Dữ liệu (Index vs Detail) -> Phát hiện mồ côi, thiếu file.
 * - Chẩn đoán AI (Toàn bộ Pipeline) -> Test tất cả các Intent.
 * 
 * TRIẾT LÝ:
 * - Chẩn đoán phải chi tiết mới bóc thuốc đúng bệnh.
 * - Sử dụng text thuần và màu sắc Console, không dùng icon/emoji.
 * 
 * CÁCH DÙNG: Mở Console (F12), gõ: window.audit()
 * ==========================================================
 */

import { APP_DATA, STATE } from './config.js';
import { DataHub, AgentRegistry, VDBus } from './network/index.js';

// ==========================================================
// PHẦN 1: DANH SÁCH FILE TĨNH CẦN CHECK
// ==========================================================
const STATIC_ASSETS = {
    css: [
        '../css/variables.css', '../css/base.css', '../css/components.css', 
        '../css/layouts.css', '../css/reader.css'
    ],
    js: [
        '../js/config.js', '../js/utils.js', '../js/search.js', '../js/render.js', 
        '../js/router.js', '../js/offline.js', '../js/audit.js', '../js/ask-dao.js', '../js/main.js',
        '../js/ai.js', '../js/ai/core.js', '../js/ai/input-ai.js', 
        '../js/ai/master.js', '../js/ai/output-ai.js',
        '../js/ai/agents/index.js', '../js/ai/agents/literature.js', 
        '../js/ai/agents/poetics.js', '../js/ai/agents/analysis.js', 
        '../js/ai/agents/fortune-ai.js', '../js/ai/agents/knowledge.js',
        '../js/ai/agents/history.js', '../js/ai/agents/praiser.js', '../js/ai/agents/critic.js',
        '../js/network/data-hub.js', '../js/network/bus.js', '../js/network/index.js'
    ],
    json: [
        '../data/data-ly-thuyet.json', '../data/data-tac-gia.json', '../data/data-tac-pham.json',
        '../data/data-danh-ngon.json', '../data/data-loi-binh.json', '../data/data-tu-dien.json',
        '../data/data-the-loai.json', '../data/data-van-khi.json', '../data/data-tu-dien-the-loai.json',
        '../data/manifests/index.json', '../data/manifests/node-triet-thuyet.json', 
        '../data/manifests/node-ky-tai.json', '../data/manifests/node-tinh-hoa.json', '../data/manifests/node-the-loai.json'
    ]
};

// ==========================================================
// PHẦN 2: UTILITIES & CONSOLE LOGGING
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

// ==========================================================
// PHẦN 3: KHÁM FILE TĨNH (STATIC FILES)
// ==========================================================
export async function auditStaticFiles() {
    logGroup('[BÁC SĨ] 1. Kiểm tra File Tĩnh (CSS, JS, JSON)...');
    
    const missingFiles = [];
    const jsErrors = [];
    let validFiles = 0;
    const totalFiles = STATIC_ASSETS.css.length + STATIC_ASSETS.js.length + STATIC_ASSETS.json.length;

    // Check CSS & JSON (Chỉ cần tồn tại)
    for (const url of [...STATIC_ASSETS.css, ...STATIC_ASSETS.json]) {
        const exists = await safeHeadCheck(url);
        if (!exists) missingFiles.push({ file: url, reason: '404 hoặc lỗi kết nối' });
        else validFiles++;
    }

    // Check JS (Tồn tại + Không lỗi cú pháp)
    for (const url of STATIC_ASSETS.js) {
        const exists = await safeHeadCheck(url);
        if (!exists) {
            missingFiles.push({ file: url, reason: '404 hoặc lỗi kết nối' });
            continue;
        }
        try {
            await import(url);
            validFiles++;
        } catch (err) {
            jsErrors.push({ file: url, error: err.message });
        }
    }

    if (missingFiles.length > 0) {
        logError(`Thiếu ${missingFiles.length} file.`);
        console.table(missingFiles);
        logAdvice('Kiểm tra lại đường dẫn, đảm bảo file tồn tại trong thư mục tương ứng.');
    }
    if (jsErrors.length > 0) {
        logError(`Có ${jsErrors.length} file JS bị lỗi cú pháp.`);
        console.table(jsErrors);
        logAdvice('Mở file bị lỗi, kiểm tra dấu ngoặc, dấu phẩy, hoặc lỗi import/export.');
    }
    
    if (missingFiles.length === 0 && jsErrors.length === 0) {
        logSuccess(`Toàn bộ ${totalFiles} file tĩnh đều hợp lệ.`);
    }

    return { missingFiles, jsErrors, validFiles, totalFiles };
}

// ==========================================================
// PHẦN 4: KHÁM MẠNG LƯỚI (DATAHUB & AGENTS)
// ==========================================================
export async function auditNetwork() {
    logGroup('[BÁC SĨ] 2. Kiểm tra Mạng Lưới (DataHub & AgentRegistry)...');
    
    const errors = [];

    // 1. Kiểm tra DataHub
    try {
        const testMeta = DataHub.getMetadata('truyen-kieu');
        if (!testMeta || testMeta.id !== 'truyen-kieu') {
            errors.push({ node: 'DataHub', error: 'Không lấy được Metadata của "truyen-kieu".' });
        }
        
        const testDetail = await DataHub.getDetail('truyen-kieu');
        if (!testDetail || !testDetail.title) {
            errors.push({ node: 'DataHub', error: 'Không lấy được Detail của "truyen-kieu".' });
        }

        const testGraph = DataHub.getGraph('truyen-kieu');
        if (!testGraph || !testGraph.author) {
            errors.push({ node: 'DataHub', error: 'Không xây dựng được Graph cho "truyen-kieu".' });
        }

        if (errors.length === 0) logSuccess('DataHub: Metadata, Detail, Graph đều hoạt động tốt.');
    } catch (err) {
        errors.push({ node: 'DataHub', error: err.message });
    }

    // 2. Kiểm tra AgentRegistry
    try {
        const agentKeys = AgentRegistry.getAllAgentKeys();
        if (agentKeys.length === 0) {
            errors.push({ node: 'AgentRegistry', error: 'Không có Agent nào được đăng ký.' });
        } else {
            const { AgentMap } = await import('../js/ai/agents/index.js');
            const missingInMap = agentKeys.filter(k => !AgentMap[k]);
            if (missingInMap.length > 0) {
                errors.push({ node: 'AgentRegistry', error: `Các Agent sau có trong Registry nhưng thiếu trong AgentMap: ${missingInMap.join(', ')}` });
            } else {
                logSuccess(`AgentRegistry: ${agentKeys.length} agents đã đăng ký và ánh xạ đầy đủ.`);
            }
        }
    } catch (err) {
        errors.push({ node: 'AgentRegistry', error: err.message });
    }

    // 3. Kiểm tra VDBus
    if (!VDBus.isActive) {
        logWarning('VDBus: Không hoạt động (có thể trình duyệt không hỗ trợ BroadcastChannel).');
    } else {
        logSuccess(`VDBus: Hoạt động (${VDBus.adapterName}).`);
    }

    if (errors.length > 0) {
        logError(`Mạng lưới gặp ${errors.length} sự cố.`);
        console.table(errors);
        logAdvice('Kiểm tra file js/network/data-hub.js và js/ai/agents/index.js.');
    }

    return { errors };
}

// ==========================================================
// PHẦN 5: KHÁM DỮ LIỆU CHI TIẾT (INDEX VS DETAIL)
// ==========================================================
export async function auditDataIntegrity() {
    logGroup('[BÁC SĨ] 3. Kiểm tra Toàn vẹn Dữ liệu (Index vs Detail)...');

    const issues = {
        works: { orphans: [], ghosts: [], empty: [] },
        authors: { orphans: [], ghosts: [], empty: [] }
    };

    // 1. Tác phẩm
    for (const item of APP_DATA.WORKS_DATA) {
        if (!item.id) continue;
        const url = `../data/tac-pham/${encodeURIComponent(item.id)}.json`;
        const { data, error } = await safeJsonCheck(url);
        
        if (error) {
            issues.works.orphans.push({ id: item.id, title: item.title, error });
        } else {
            const cleanText = (data.content || '').replace(/<[^>]*>/g, '').trim();
            if (cleanText.length < 50) issues.works.empty.push({ id: item.id, title: item.title });
        }
    }

    // 2. Tác giả
    for (const item of APP_DATA.AUTHOR_DATA) {
        if (!item.id) continue;
        const url = `../data/tac-gia/${encodeURIComponent(item.id)}.json`;
        const { data, error } = await safeJsonCheck(url);
        
        if (error) {
            issues.authors.orphans.push({ id: item.id, title: item.title, error });
        } else {
            const cleanText = (data.content || '').replace(/<[^>]*>/g, '').trim();
            if (cleanText.length < 50) issues.authors.empty.push({ id: item.id, title: item.title });
        }
    }

    // Báo cáo
    if (issues.works.orphans.length > 0) {
        logError(`Có ${issues.works.orphans.length} Tác phẩm trong Index nhưng THIẾU file JSON chi tiết.`);
        console.table(issues.works.orphans);
        logAdvice('Chạy tool split_works.py hoặc kiểm tra lại file Master.');
    }
    if (issues.authors.orphans.length > 0) {
        logError(`Có ${issues.authors.orphans.length} Tác giả trong Index nhưng THIẾU file JSON chi tiết.`);
        console.table(issues.authors.orphans);
        logAdvice('Chạy tool split_authors.py hoặc kiểm tra lại file Master.');
    }
    
    if (issues.works.empty.length > 0) logWarning(`Có ${issues.works.empty.length} Tác phẩm bị rỗng nội dung (chưa có content).`);
    if (issues.authors.empty.length > 0) logWarning(`Có ${issues.authors.empty.length} Tác giả bị rỗng nội dung (chưa có content).`);

    if (issues.works.orphans.length === 0 && issues.authors.orphans.length === 0) {
        logSuccess('Toàn vẹn dữ liệu: 100% file chi tiết đều tồn tại.');
    }

    return issues;
}

// ==========================================================
// PHẦN 6: KHÁM SỨC KHỎE AI (PIPELINE)
// ==========================================================
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
        const { MasterAI } = await import('../js/ai/master.js');
        const { OutputAI } = await import('../js/ai/output-ai.js');
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

// ==========================================================
// PHẦN 7: CHẨN ĐOÁN TOÀN DIỆN
// ==========================================================
export async function runFullDiagnosis() {
    console.clear();
    console.log(
        "%c=== BỆNH VIỆN VĂN ĐẠO — CHẨN ĐOÁN TOÀN DIỆN v4.0.2 ===",
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
        staticResult.jsErrors.length + 
        networkResult.errors.length + 
        dataResult.works.orphans.length + 
        dataResult.authors.orphans.length +
        aiResult.filter(r => r['Khớp Type'] === 'SAI' || r['Render HTML'] === 'SAI').length;

    if (totalErrors === 0) {
        console.log(
            `%c[✓] CHẨN ĐOÁN HOÀN TẤT — Hệ thống khỏe mạnh (${duration}ms)`,
            "background: #2ecc71; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    } else {
        console.log(
            `%c[✗] CHẨN ĐOÁN HOÀN TẤT — ${totalErrors} lỗi nghiêm trọng cần sửa (${duration}ms)`,
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
