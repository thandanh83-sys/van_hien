/**
 * ==========================================================
 * VĂN ĐẠO — AUDIT MODULE (Bác sĩ chẩn đoán hệ thống)
 * Vị trí: js/audit.js
 * Version: 5.0.0 (Contemplative Audit — No Scoring)
 * ==========================================================
 *
 * HƯỚNG DẪN SỬ DỤNG (Mở Console F12, gõ trực tiếp):
 * - Khám tổng quát: window.audit()
 * - Khám file tĩnh: window.auditStaticFiles()
 * - Khám mạng lưới: window.auditNetwork()
 * - Khám tác phẩm: window.auditWorks()
 * - Khám tác giả: window.auditAuthors()
 * - Khám AI: window.auditAIPipeline()
 *
 * TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
 *
 * 1. CHẨN ĐOÁN, KHÔNG CHẤM ĐIỂM (Diagnose, Don't Score):
 *    - Audit kiểm tra tính toàn vẹn hệ thống (file, mạng, dữ liệu, AI).
 *    - KHÔNG đánh giá chất lượng văn chương.
 *    - KHÔNG có điểm số cho bài thơ.
 *
 * 2. ĐỒNG BỘ VỚI CONTEMPLATIVE (v5.0.0):
 *    - Test case `criticize-work` → đổi thành `open-depth`.
 *    - Test case `praise-work` → giữ nguyên key, agent đổi sang
 *      `khuc-tan-thuong`.
 *    - Sử dụng `InputAI.parseIntent` thay vì `MasterAI.parseIntent`
 *      để khớp với INTENT_DEFINITIONS (find-author-of, open-depth...).
 *
 * 3. PURE TEXT ICONS:
 *    - Không emoji, không unicode icon.
 *    - Chỉ dùng text thuần: [OK], [FAIL], [LỖI], [GỢI Ý].
 *
 * 4. BÁO CÁO TẬP TRUNG:
 *    - Chỉ in chi tiết khi có lỗi.
 *    - Thành công thì log ngắn gọn.
 *    - Cuối cùng có tổng kết.
 *
 * LỊCH SỬ PHIÊN BẢN:
 * - v4.2.0: Pure Text Icons & Manifest-Driven Diagnostics.
 * - v5.0.0: Contemplative Audit.
 *   - [ĐỔI] Test case `criticize-work` → `open-depth`.
 *   - [ĐỔI] Dùng `InputAI.parseIntent` thay `MasterAI.parseIntent`.
 *   - [ĐỔI] Label `Điểm sáng` / `Điểm cần lưu ý` không còn dùng.
 *   - [THÊM] Test case `open-depth` kiểm tra "Lời Gợi Mở".
 *
 * ==========================================================
 */

import { APP_DATA, STATE } from './config.js';
import { DataHub, AgentRegistry, VDBus } from './network/index.js';

// Tính toán đường dẫn gốc (Từ thư mục js/ lùi ra ngoài 1 cấp)
const BASE_URL = new URL('../', import.meta.url).href;

// ==========================================================
// PHẦN 1: UTILITIES & LOGGING
// ==========================================================
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

// Các hàm Log (Chỉ in chi tiết khi có Lỗi)
function logGroup(title, color = '#2c3e38') {
    console.group(`%c${title}`, `color: ${color}; font-weight: bold; font-size: 14px;`);
}
function logError(msg) {
    console.error(`%c[LỖI] %c${msg}`, 'color: #e74c3c; font-weight: bold;', 'color: inherit;');
}
function logAdvice(msg) {
    console.log(`%c[GỢI Ý] %c${msg}`, 'color: #3498db; font-weight: bold;', 'color: #7f8c8d; font-style: italic;');
}
function logSuccessShort(msg) {
    console.log(`%c[OK] %c${msg}`, 'color: #2ecc71; font-weight: bold;', 'color: inherit;');
}

// ==========================================================
// PHẦN 2: CÁC HÀM KHÁM CHUYÊN KHOA
// ==========================================================

// 2.1 Khám File Tĩnh (Đọc từ Manifest)
export async function auditStaticFiles() {
    logGroup('[BÁC SĨ] KHÁM FILE TĨNH (Theo Manifest)...');
    const missingFiles = [];
    let validFiles = 0;
    let totalFiles = 0;

    try {
        const manifestUrl = new URL('data/manifests/static-assets.json', BASE_URL).href;
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error(`Không tải được static-assets.json (HTTP ${res.status})`);

        const manifest = await res.json();

        // Gộp tất cả các mảng lại thành một danh sách phẳng
        const allUrls = [
            ...(manifest.root || []),
            ...(manifest.css || []),
            ...(manifest.js_core || []),
            ...(manifest.js_ai || []),
            ...(manifest.js_agents || []),
            ...(manifest.js_network || []),
            ...(manifest.json_data || []),
            ...(manifest.json_manifests || []),
            ...(manifest.assets || [])
        ];

        // Loại bỏ trùng lặp
        const uniqueUrls = [...new Set(allUrls)];
        totalFiles = uniqueUrls.length;

        for (const relPath of uniqueUrls) {
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
            logAdvice('Kiểm tra lại đường dẫn, đảm bảo file đã được push lên GitHub.');
        } else {
            logSuccessShort(`Toàn bộ ${totalFiles} file tĩnh đều tồn tại.`);
        }
    } catch (err) {
        logError(`Lỗi tải Manifest: ${err.message}`);
        logAdvice('Hãy chắc chắn file data/manifests/static-assets.json đã tồn tại và đúng cú pháp JSON.');
    }

    return { missingFiles, validFiles, totalFiles };
}

// 2.2 Khám Mạng Lưới
export async function auditNetwork() {
    logGroup('[BÁC SĨ] KHÁM MẠNG LƯỚI (DataHub & AgentRegistry)...');
    const errors = [];

    try {
        const testMeta = DataHub.getMetadata('truyen-kieu');
        if (!testMeta) errors.push({ node: 'DataHub', error: 'Không lấy được Metadata của "truyen-kieu".' });

        const testGraph = DataHub.getGraph('truyen-kieu');
        if (!testGraph || !testGraph.author) errors.push({ node: 'DataHub', error: 'Không xây dựng được Graph cho "truyen-kieu".' });
    } catch (err) {
        errors.push({ node: 'DataHub', error: err.message });
    }

    try {
        const agentKeys = AgentRegistry.getAllAgentKeys();
        if (agentKeys.length === 0) {
            errors.push({ node: 'AgentRegistry', error: 'Không có Agent nào được đăng ký.' });
        } else {
            // Dùng validate() mới của v8.0.0
            if (typeof AgentRegistry.validate === 'function') {
                const validation = AgentRegistry.validate();
                if (validation.invalid.length > 0) {
                    errors.push({
                        node: 'AgentRegistry',
                        error: `Các Agent không hợp lệ: ${validation.invalid.join(', ')}`
                    });
                }
            } else {
                // Fallback nếu chạy với index.js cũ
                const { AgentMap } = await import('./ai/agents/index.js');
                const missingInMap = agentKeys.filter(k => !AgentMap[k]);
                if (missingInMap.length > 0) {
                    errors.push({ node: 'AgentRegistry', error: `Thiếu trong AgentMap: ${missingInMap.join(', ')}` });
                }
            }
        }
    } catch (err) {
        errors.push({ node: 'AgentRegistry', error: err.message });
    }

    if (errors.length > 0) {
        logError(`Mạng lưới gặp ${errors.length} sự cố.`);
        console.table(errors);
    } else {
        logSuccessShort('DataHub và AgentRegistry hoạt động tốt.');
    }
    return { errors };
}

// 2.3 Khám Tác Phẩm
export async function auditWorks() {
    logGroup('[BÁC SĨ] KHÁM DỮ LIỆU TÁC PHẨM...');
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
                issues.push({ id: item.id, title: item.title, error: 'Rỗng hoặc thiếu content' });
            }
        }
    }

    if (issues.length > 0) {
        logError(`Có ${issues.length} Tác phẩm bị lỗi.`);
        console.table(issues);
        logAdvice('Chạy tool auto_fill_content.py để bổ sung file rỗng.');
    } else {
        logSuccessShort(`Tất cả ${APP_DATA.WORKS_DATA.length} Tác phẩm đều hoàn hảo.`);
    }
    return { issues };
}

// 2.4 Khám Tác Giả
export async function auditAuthors() {
    logGroup('[BÁC SĨ] KHÁM DỮ LIỆU TÁC GIẢ...');
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
                issues.push({ id: item.id, title: item.title, error: 'Rỗng hoặc thiếu content' });
            }
        }
    }

    if (issues.length > 0) {
        logError(`Có ${issues.length} Tác giả bị lỗi.`);
        console.table(issues);
        logAdvice('Chạy tool split_authors.py để bổ sung file.');
    } else {
        logSuccessShort(`Tất cả ${APP_DATA.AUTHOR_DATA.length} Tác giả đều hoàn hảo.`);
    }
    return { issues };
}

// 2.5 Khám AI (Toàn bộ Pipeline — v5.0.0 Contemplative)
export async function auditAIPipeline() {
    logGroup('[BÁC SĨ] KHÁM SỨC KHỎE AI (Contemplative Pipeline)...');
    const testCases = [
        // =================================================================
        // NHÓM 1: Văn học & Tác giả
        // =================================================================
        { input: "Ai viết Truyện Kiều?", expectedType: "find-author-of", expectedKeyword: "Nguyễn Du" },
        { input: "Tóm tắt Chí Phèo", expectedType: "summarize-work", expectedKeyword: "Chí Phèo" },
        { input: "Tiểu sử Nguyễn Du", expectedType: "find-author-info", expectedKeyword: "Nguyễn Du" },
        { input: "Nguyễn Du có những tác phẩm nào?", expectedType: "list-author-works", expectedKeyword: "Nguyễn Du" },

        // =================================================================
        // NHÓM 2: Mạng lưới & Lịch sử
        // =================================================================
        { input: "Tác phẩm nào giống Truyện Kiều?", expectedType: "find-related", expectedKeyword: "Truyện Kiều" },
        { input: "Tác phẩm thời nhà Lê", expectedType: "find-works-by-era", expectedKeyword: "Lê" },
        { input: "Truyện Kiều viết thời nào?", expectedType: "get-historical-context", expectedKeyword: "TK 19" },

        // =================================================================
        // NHÓM 3: Thi pháp
        // =================================================================
        { input: "Ý nghĩa của trăng", expectedType: "explain-symbol", expectedKeyword: "trăng" },

        // =================================================================
        // NHÓM 4: Các Agent đặc biệt
        // =================================================================
        { input: "Dịch Truyện Kiều sang tiếng Anh", expectedType: "translate-work", expectedKeyword: "The Tale of Kieu" },
        { input: "Thúy Kiều là ai?", expectedType: "get-character-info", expectedKeyword: "Truyện Kiều" },
        { input: "So sánh Nguyễn Du và Nam Cao", expectedType: "compare-entities", expectedKeyword: "Nguyễn Du" },

        // =================================================================
        // NHÓM 5: Cảm thụ (v5.0.0)
        // =================================================================
        // [v5.0.0 — ĐỔI] Từ "Chê bài thơ này" (criticize-work) → "Gợi mở chiều sâu Tây Tiến" (open-depth)
        // Lý do: Không còn phê bình, chỉ gợi mở.
        { input: "Khen bài thơ Tây Tiến", expectedType: "praise-work", expectedKeyword: "Tây Tiến" },
        { input: "Gợi mở chiều sâu Tây Tiến", expectedType: "open-depth", expectedKeyword: "Lời Gợi Mở" }
    ];

    const results = [];
    const failedCases = [];

    try {
        // [v5.0.0 — ĐỔI] Dùng InputAI.parseIntent (khớp với INTENT_DEFINITIONS)
        // thay vì MasterAI.parseIntent (dùng SmartInputParser).
        const { InputAI } = await import('./ai/input-ai.js');
        const { MasterAI } = await import('./ai/master.js');
        const { OutputAI } = await import('./ai/output-ai.js');
        const dummyContainer = document.createElement('div');

        for (const tc of testCases) {
            // -----------------------------------------------------------------
            // Bước 1: Kiểm tra Intent type
            // -----------------------------------------------------------------
            let intent;
            try {
                intent = InputAI.parseIntent(tc.input);
            } catch (err) {
                failedCases.push({
                    'Câu hỏi': tc.input,
                    'Lỗi': `InputAI.parseIntent: ${err.message}`
                });
                continue;
            }

            const isIntentCorrect = intent.type === tc.expectedType;

            // -----------------------------------------------------------------
            // Bước 2: Dispatch qua MasterAI (nếu intent không phải 'search')
            // -----------------------------------------------------------------
            let result = null;
            let isOutputOk = false;

            if (intent.type !== 'search') {
                try {
                    result = await MasterAI.dispatch(tc.input);  // Truyền raw string
                } catch (err) {
                    result = { answer: `Lỗi dispatch: ${err.message}`, source: 'error' };
                }

                // -----------------------------------------------------------------
                // Bước 3: Render HTML để kiểm tra OutputAI
                // -----------------------------------------------------------------
                try {
                    OutputAI.render(dummyContainer, result, tc.input);
                    isOutputOk = dummyContainer.innerHTML.includes(tc.expectedKeyword);
                } catch (e) {
                    isOutputOk = false;
                }
            }

            // -----------------------------------------------------------------
            // Bước 4: Kiểm tra kết quả có chứa keyword không
            // -----------------------------------------------------------------
            const combinedResult = result
                ? [
                    result.answer || '',
                    result.detail || '',
                    ...(result.meta || []).map(m => m.title || m.name || '')
                ].join(' ')
                : '';
            const isResultOk = combinedResult.includes(tc.expectedKeyword);

            // -----------------------------------------------------------------
            // Bước 5: Ghi nhận kết quả
            // -----------------------------------------------------------------
            if (!isIntentCorrect || !isResultOk || !isOutputOk) {
                failedCases.push({
                    'Câu hỏi': tc.input,
                    'Intent dự kiến': tc.expectedType,
                    'Intent thực tế': intent.type,
                    'Khớp Type': isIntentCorrect ? 'ĐÚNG' : 'SAI',
                    'Khớp Data': isResultOk ? 'ĐÚNG' : 'SAI',
                    'Render HTML': isOutputOk ? 'ĐÚNG' : 'SAI'
                });
            }
        }

        // -----------------------------------------------------------------
        // Bước 6: In báo cáo
        // -----------------------------------------------------------------
        if (failedCases.length > 0) {
            logError(`Có ${failedCases.length}/${testCases.length} test cases thất bại. Chi tiết:`);
            console.table(failedCases);
            logAdvice('Kiểm tra lại InputAI (nhận diện), Agent tương ứng (xử lý), hoặc OutputAI (render).');
        } else {
            logSuccessShort(`AI Pipeline hoạt động chính xác 100% (${testCases.length}/${testCases.length} cases).`);
        }

    } catch (err) {
        logError(`Lỗi khởi tạo AI: ${err.message}`);
    }
    return results;
}

// ==========================================================
// PHẦN 3: KHÁM TỔNG QUÁT
// ==========================================================
export async function runFullDiagnosis() {
    console.clear();
    console.log(
        "%c=== BỆNH VIỆN VĂN ĐẠO - CHẨN ĐOÁN TOÀN DIỆN v5.0.0 ===",
        "background: linear-gradient(135deg, #2c3e38, #557a6f); color: #d4c4a8; font-size: 16px; font-weight: bold; padding: 10px 20px; border-radius: 8px;"
    );

    const staticResult = await auditStaticFiles();
    const networkResult = await auditNetwork();
    const worksResult = await auditWorks();
    const authorsResult = await auditAuthors();
    await auditAIPipeline();

    const totalErrors =
        staticResult.missingFiles.length +
        networkResult.errors.length +
        worksResult.issues.length +
        authorsResult.issues.length;

    console.log("─".repeat(60));
    if (totalErrors === 0) {
        console.log(
            `%c[OK] CHẨN ĐOÁN HOÀN TẤT - Hệ thống khỏe mạnh, không tìm thấy lỗi nào.`,
            "background: #2ecc71; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    } else {
        console.log(
            `%c[FAIL] CHẨN ĐOÁN HOÀN TẤT - Phát hiện ${totalErrors} lỗi ở các phần trên. Hãy bóc thuốc theo hướng dẫn.`,
            "background: #e74c3c; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px;"
        );
    }

    // Log triết lý Văn Đạo
    console.log(
        `%c[TRIẾT LÝ VĂN ĐẠO] Không chấm điểm văn chương. Mỗi bài thơ đều có hồn, nét đẹp riêng.`,
        'color: #c9a96e; font-style: italic; font-weight: bold; padding: 6px 12px;'
    );
}

// ==========================================================
// PHẦN 4: XUẤT RA WINDOW
// ==========================================================
window.audit = runFullDiagnosis;
window.auditStaticFiles = auditStaticFiles;
window.auditNetwork = auditNetwork;
window.auditWorks = auditWorks;
window.auditAuthors = auditAuthors;
window.auditAIPipeline = auditAIPipeline;

export default {
    runFullDiagnosis,
    auditStaticFiles,
    auditNetwork,
    auditWorks,
    auditAuthors,
    auditAIPipeline
};

// ==========================================================
// GHI CHÚ CHO NGƯỜI BẢO TRÌ
// ==========================================================
/**
 * SAU KHI DÙNG audit.js v5.0.0:
 *
 * 1. Đã thay đổi:
 *    - Test case "Chê bài thơ này" (criticize-work) → "Gợi mở chiều sâu Tây Tiến" (open-depth)
 *    - `MasterAI.parseIntent` → `InputAI.parseIntent` (khớp với INTENT_DEFINITIONS)
 *    - `MasterAI.dispatch(intent)` → `MasterAI.dispatch(tc.input)` (truyền raw string)
 *
 * 2. Đã thêm:
 *    - Log triết lý "Không chấm điểm văn chương" ở cuối runFullDiagnosis.
 *
 * 3. Tương thích ngược:
 *    - Tất cả các hàm audit cũ (auditStaticFiles, auditNetwork...) giữ nguyên.
 *    - Chỉ sửa nội bộ auditAIPipeline.
 *
 * 4. Cách chạy kiểm tra:
 *    - Mở app → F12 → Console → `window.auditAIPipeline()`
 *    - Hoặc `window.audit()` để chạy toàn bộ chẩn đoán.
 *
 * 5. Triết lý cốt lõi:
 *    - Chẩn đoán hệ thống, không chấm điểm văn chương.
 *    - Test case `open-depth` kiểm tra "Lời Gợi Mở" (không phải "Phê bình").
 */
