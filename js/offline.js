/**
 * ==========================================================
 * VĂN ĐẠO - OFFLINE MODULE (js/offline.js)
 * Vị trí: js/offline.js
 * Version: 2.0.0 (Independent & Pure Offline-First)
 * ==========================================================
 * CHỨC NĂNG:
 * - Tải toàn bộ data JSON (tác phẩm, tác giả) về Cache.
 * - Kiểm tra dung lượng Storage.
 * - Xóa dữ liệu Offline.
 * 
 * TRIẾT LÝ:
 * - Không phụ thuộc MotherNode. Tự lấy URL từ APP_DATA.
 * - Chia nhỏ Batch để tránh nghẽn UI.
 * - Báo cáo tiến độ chính xác.
 * ==========================================================
 */

import { APP_DATA } from './config.js';

// ==========================================================
// PHẦN 1: STATE & CẤU HÌNH
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
// PHẦN 2: UTILITIES (Hàm tiện ích)
// ==========================================================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Fetch với timeout + retry
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
// PHẦN 3: STORAGE CHECK & CLEAR
// ==========================================================

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

export async function clearOfflineData() {
    if (!('caches' in window)) return false;
    try {
        const cacheNames = await caches.keys();
        const vandaoCaches = cacheNames.filter(name => name.startsWith('vandao-'));
        await Promise.all(vandaoCaches.map(name => caches.delete(name)));
        console.log(`[OFFLINE] Đã xóa ${vandaoCaches.length} cache:`, vandaoCaches);
        await checkStorageSize();
        return true;
    } catch (error) {
        console.error("[OFFLINE] Lỗi khi xóa cache:", error);
        return false;
    }
}

// ==========================================================
// PHẦN 4: COLLECT URLS (Lấy từ APP_DATA, không cần MotherNode)
// ==========================================================

async function collectUrlsToDownload() {
    const queue = [];
    // Lấy trực tiếp từ RAM
    const works = APP_DATA.WORKS_DATA || [];
    const authors = APP_DATA.AUTHOR_DATA || [];

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
    return queue;
}

// ==========================================================
// PHẦN 5: DOWNLOAD ALL (Tiến trình chính)
// ==========================================================

export async function downloadAllOffline(progressCallback) {
    if (isDownloading) {
        return { success: false, message: 'Đang tải dữ liệu, vui lòng đợi...' };
    }

    isDownloading = true;
    isCancelled = false;

    try {
        const queue = await collectUrlsToDownload();
        const totalFiles = queue.length;

        if (totalFiles === 0) {
            return { success: false, message: 'Không có dữ liệu để tải.' };
        }

        let completedFiles = 0;
        let failedFiles = 0;

        for (let i = 0; i < totalFiles; i += CONFIG.BATCH_SIZE) {
            if (isCancelled) {
                console.log('[OFFLINE] Người dùng đã hủy');
                break;
            }

            const batch = queue.slice(i, i + CONFIG.BATCH_SIZE);
            let batchSuccess = 0;

            await Promise.allSettled(
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

            completedFiles += batchSuccess;
            const processedFiles = Math.min(i + batch.length, totalFiles);
            const percent = Math.round((processedFiles / totalFiles) * 100);

            if (typeof progressCallback === 'function') {
                progressCallback(percent, completedFiles, totalFiles, failedFiles);
            }

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
        return { success: false, error: error.message, message: `Lỗi: ${error.message}` };
    } finally {
        isDownloading = false;
        isCancelled = false;
        await checkStorageSize();
    }
}

export function cancelDownload() {
    if (isDownloading) {
        isCancelled = true;
        console.log('[OFFLINE] Đã gửi tín hiệu hủy');
    }
}

export function isDownloadingNow() {
    return isDownloading;
}
