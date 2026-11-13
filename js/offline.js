/**
 * ==========================================================
 * VĂN ĐẠO - OFFLINE MODULE (js/offline.js)
 * Vị trí: js/offline.js
 * Version: 1.0.0 (Network Edition)
 * ==========================================================
 * Chức năng:
 * - Quản lý Tủ Sách Offline (tải toàn bộ data JSON về cache).
 * - Kiểm tra dung lượng Storage API.
 * - Xóa cache.
 * 
 * ĐÃ FIX (P4.14):
 * - Bug: Progress tăng sai khi cả batch fail
 * - Fix: Dùng batchSuccess counter riêng, không dùng batch.length
 * 
 * TÍCH HỢP NETWORK:
 * - Ưu tiên dùng MotherNode để lấy danh sách works/authors
 * - Nếu MotherNode offline, fallback dùng APP_DATA trực tiếp
 * 
 * ==========================================================
 */

import { APP_DATA } from './config.js';
import { MotherNode } from './network/mother.js';

// ==========================================================
// PHẦN 1: STATE
// ==========================================================
let isDownloading = false;
let isCancelled = false;

const CONFIG = Object.freeze({
    BATCH_SIZE: 10,           // Số file tải mỗi lô
    RETRY_PER_FILE: 2,        // Số lần retry mỗi file
    RETRY_DELAY: 500,         // Delay retry (ms)
    YIELD_DELAY: 50,          // Delay nhường UI (ms)
    TIMEOUT: 8000             // Timeout mỗi fetch (ms)
});

// ==========================================================
// PHẦN 2: UTILITIES
// ==========================================================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Fetch với timeout + retry
 * @param {string} url
 * @param {number} attempts
 * @returns {Promise<Response|null>}
 */
async function fetchWithRetry(url, attempts = CONFIG.RETRY_PER_FILE) {
    for (let i = 0; i <= attempts; i++) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        } catch (err) {
            if (i === attempts) {
                console.warn(`[OFFLINE] Bỏ qua file sau ${attempts + 1} lần thử: ${url}`);
                return null;
            }
            await sleep(CONFIG.RETRY_DELAY * (i + 1));
        }
    }
    return null;
}

// ==========================================================
// PHẦN 3: STORAGE CHECK
// ==========================================================

/**
 * Kiểm tra dung lượng lưu trữ hiện tại
 * Cập nhật text vào #settings-storage-text
 */
export async function checkStorageSize() {
    const storageText = document.getElementById('settings-storage-text');

    if (!navigator.storage || !navigator.storage.estimate) {
        if (storageText) storageText.textContent = "Không hỗ trợ";
        return null;
    }

    try {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
        const percent = ((estimate.usage / estimate.quota) * 100).toFixed(1);

        if (storageText) {
            storageText.textContent = `Đã dùng: ${usedMB} MB (${percent}%)`;
            storageText.title = `Tổng dung lượng khả dụng: ${quotaMB} MB`;
            storageText.style.color = 'var(--accent-text)';
        }

        return { used: estimate.usage, quota: estimate.quota, usedMB, quotaMB, percent };
    } catch (err) {
        console.warn("[STORAGE] Không lấy được thông tin:", err);
        if (storageText) storageText.textContent = "Không xác định";
        return null;
    }
}

// ==========================================================
// PHẦN 4: CLEAR CACHE
// ==========================================================

/**
 * Xóa toàn bộ dữ liệu Offline (chỉ cache của vandao-*)
 * @returns {Promise<boolean>}
 */
export async function clearOfflineData() {
    if (!('caches' in window)) return false;

    try {
        const cacheNames = await caches.keys();
        const vandaoCaches = cacheNames.filter(name => name.startsWith('vandao-'));

        await Promise.all(vandaoCaches.map(name => caches.delete(name)));

        console.log(`[OFFLINE] Đã xóa ${vandaoCaches.length} cache:`, vandaoCaches);

        // Reset storage text
        await checkStorageSize();

        return true;
    } catch (error) {
        console.error("[OFFLINE] Lỗi khi xóa cache:", error);
        return false;
    }
}

// ==========================================================
// PHẦN 5: COLLECT URLS
// ==========================================================

/**
 * Lấy danh sách URL cần tải
 * Ưu tiên MotherNode, fallback APP_DATA
 * @returns {Promise<Array<{url, id, type}>>}
 */
async function collectUrlsToDownload() {
    const queue = [];

    try {
        // Ưu tiên: lấy works từ MotherNode
        const worksResp = await MotherNode.request({ group: 'tinh-hoa' });
        const works = worksResp.records || APP_DATA.WORKS_DATA || [];

        const authorsResp = await MotherNode.request({ group: 'ky-tai' });
        const authors = authorsResp.records || APP_DATA.AUTHOR_DATA || [];

        works.forEach(w => {
            if (w.id) {
                queue.push({
                    url: `./data/tac-pham/${encodeURIComponent(w.id)}.json`,
                    id: w.id,
                    type: 'work'
                });
            }
        });

        authors.forEach(a => {
            if (a.id) {
                queue.push({
                    url: `./data/tac-gia/${encodeURIComponent(a.id)}.json`,
                    id: a.id,
                    type: 'author'
                });
            }
        });
    } catch (err) {
        console.warn('[OFFLINE] MotherNode lỗi, dùng APP_DATA fallback:', err);

        (APP_DATA.WORKS_DATA || []).forEach(w => {
            if (w.id) queue.push({
                url: `./data/tac-pham/${encodeURIComponent(w.id)}.json`,
                id: w.id,
                type: 'work'
            });
        });

        (APP_DATA.AUTHOR_DATA || []).forEach(a => {
            if (a.id) queue.push({
                url: `./data/tac-gia/${encodeURIComponent(a.id)}.json`,
                id: a.id,
                type: 'author'
            });
        });
    }

    return queue;
}

// ==========================================================
// PHẦN 6: DOWNLOAD ALL
// ==========================================================

/**
 * Tải toàn bộ dữ liệu về cache (theo batch)
 * 
 * @param {Function} progressCallback - (percent, completed, total, failed) => void
 * @returns {Promise<{success, total?, failed?, message?}>}
 */
export async function downloadAllOffline(progressCallback) {
    // [FIX P4.14] Guard clause: trả object, KHÔNG return undefined
    if (isDownloading) {
        return {
            success: false,
            message: 'Đang tải dữ liệu, vui lòng đợi...'
        };
    }

    isDownloading = true;
    isCancelled = false;

    try {
        // Bước 1: Thu thập URL
        const queue = await collectUrlsToDownload();
        const totalFiles = queue.length;

        if (totalFiles === 0) {
            return {
                success: false,
                message: 'Không có dữ liệu để tải.'
            };
        }

        let completedFiles = 0;
        let failedFiles = 0;

        // Bước 2: Tải theo batch
        for (let i = 0; i < totalFiles; i += CONFIG.BATCH_SIZE) {
            if (isCancelled) {
                console.log('[OFFLINE] Người dùng đã hủy');
                break;
            }

            const batch = queue.slice(i, i + CONFIG.BATCH_SIZE);

            // [FIX P4.14] Dùng batchSuccess riêng
            let batchSuccess = 0;

            const results = await Promise.allSettled(
                batch.map(async (item) => {
                    const res = await fetchWithRetry(item.url, CONFIG.RETRY_PER_FILE);
                    if (res) {
                        batchSuccess++;
                        return { ok: true, item };
                    } else {
                        failedFiles++;
                        return { ok: false, item };
                    }
                })
            );

            // [FIX P4.14] Tăng theo số thực tế thành công
            completedFiles += batchSuccess;

            // Tính percent dựa trên số FILE ĐÃ XỬ LÝ (thành công + fail)
            const processedFiles = Math.min(i + batch.length, totalFiles);
            const percent = Math.round((processedFiles / totalFiles) * 100);

            if (typeof progressCallback === 'function') {
                progressCallback(percent, completedFiles, totalFiles, failedFiles);
            }

            // Nhường UI
            await sleep(CONFIG.YIELD_DELAY);
        }

        const finalStatus = isCancelled ? 'cancelled' : 'completed';

        return {
            success: true,
            status: finalStatus,
            total: totalFiles,
            completed: completedFiles,
            failed: failedFiles,
            message: isCancelled
                ? `Đã hủy. Hoàn thành: ${completedFiles}/${totalFiles}`
                : `Hoàn tất. Thành công: ${completedFiles - failedFiles}, Lỗi: ${failedFiles}`
        };

    } catch (error) {
        console.error("[OFFLINE] Lỗi hệ thống:", error);
        return {
            success: false,
            error: error.message,
            message: `Lỗi: ${error.message}`
        };
    } finally {
        isDownloading = false;
        isCancelled = false;
        await checkStorageSize();
    }
}

// ==========================================================
// PHẦN 7: CONTROL
// ==========================================================

/**
 * Hủy tiến trình tải
 */
export function cancelDownload() {
    if (isDownloading) {
        isCancelled = true;
        console.log('[OFFLINE] Đã gửi tín hiệu hủy');
    }
}

/**
 * Kiểm tra đang tải?
 * @returns {boolean}
 */
export function isDownloadingNow() {
    return isDownloading;
}