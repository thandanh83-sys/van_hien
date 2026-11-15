/**
 * ==========================================================
 * VĂN ĐẠO - OFFLINE MODULE (js/offline.js)
 * Vị trí: js/offline.js
 * Version: 3.0.0 (Lazy-Load Strategy — No Scoring)
 * ==========================================================
 * TRIẾT LÝ:
 * - KHÔNG tải toàn bộ hàng ngàn file chi tiết (gây đầy bộ nhớ).
 * - Chỉ tải "Kho lõi" (Core Data): Index, Từ điển, Lý thuyết.
 * - Các file chi tiết (Tác giả/Tác phẩm) sẽ được Service Worker
 *   tự động cache khi người dùng thực sự bấm vào đọc (Runtime Cache).
 * ==========================================================
 */

import { APP_DATA } from './config.js';

// ==========================================================
// PHẦN 1: STATE & CẤU HÌNH
// ==========================================================
let isDownloading = false;
let isCancelled = false;

const CONFIG = Object.freeze({
    BATCH_SIZE: 10,
    RETRY_PER_FILE: 2,
    RETRY_DELAY: 500,
    YIELD_DELAY: 50,
    TIMEOUT: 8000
});

// ==========================================================
// PHẦN 2: UTILITIES
// ==========================================================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
            if (i === attempts) return null;
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
        }
        return { used: estimate.usage, quota: estimate.quota };
    } catch (err) {
        return null;
    }
}

export async function clearOfflineData() {
    if (!('caches' in window)) return false;
    try {
        const cacheNames = await caches.keys();
        const vandaoCaches = cacheNames.filter(name => name.startsWith('vandao-'));
        await Promise.all(vandaoCaches.map(name => caches.delete(name)));
        await checkStorageSize();
        return true;
    } catch (error) {
        return false;
    }
}

// ==========================================================
// PHẦN 4: COLLECT CORE URLS (CHỈ TẢI KHO LÕI)
// ==========================================================
async function collectUrlsToDownload() {
    const queue = [];
    
    // 1. Tải các file dữ liệu tĩnh cốt lõi (Rất nhẹ, chỉ vài trăm KB)
    const coreDataFiles = [
        './data/data-danh-ngon.json',
        './data/data-ly-thuyet.json',
        './data/data-the-loai.json',
        './data/data-tu-dien-the-loai.json',
        './data/data-loi-binh.json',
        './data/data-van-khi.json',
        './data/contemplative-prompts.json',
        './data/tu-dien/symbols.json',
        './data/tu-dien/dien-tich.json',
        './data/tu-dien/han-viet.json'
    ];

    coreDataFiles.forEach(url => {
        queue.push({ url, id: url.split('/').pop(), type: 'core' });
    });

    return queue;
}

// ==========================================================
// PHẦN 5: DOWNLOAD ALL (Chỉ tải Kho Lõi)
// ==========================================================
export async function downloadAllOffline(progressCallback) {
    if (isDownloading) return { success: false, message: 'Đang tải dữ liệu...' };

    isDownloading = true;
    isCancelled = false;

    try {
        const queue = await collectUrlsToDownload();
        const totalFiles = queue.length;

        if (totalFiles === 0) return { success: false, message: 'Không có dữ liệu để tải.' };

        let completedFiles = 0;
        let failedFiles = 0;

        for (let i = 0; i < totalFiles; i += CONFIG.BATCH_SIZE) {
            if (isCancelled) break;

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

        return {
            success: true,
            status: isCancelled ? 'cancelled' : 'completed',
            total: totalFiles,
            completed: completedFiles,
            failed: failedFiles,
            message: isCancelled ? `Đã hủy. Hoàn thành: ${completedFiles}/${totalFiles}` : `Hoàn tất. Lỗi: ${failedFiles}`
        };

    } catch (error) {
        return { success: false, message: `Lỗi: ${error.message}` };
    } finally {
        isDownloading = false;
        isCancelled = false;
        await checkStorageSize();
    }
}

export function cancelDownload() {
    if (isDownloading) isCancelled = true;
}

export function isDownloadingNow() {
    return isDownloading;
}
