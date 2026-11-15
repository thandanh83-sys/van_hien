/**
 * ==========================================================
 * VĂN ĐẠO - OFFLINE MODULE (js/offline.js)
 * Vị trí: js/offline.js
 * Version: 4.0.0 (Offline Delta Strategy — Core Only)
 * ==========================================================
 * TRIẾT LÝ:
 * - KHÔNG tải toàn bộ hàng ngàn file tác phẩm/tác giả (tránh đầy bộ nhớ).
 * - Chỉ tải "Kho lõi" (Core Data): Index, Từ điển, Lý thuyết.
 * - Áp dụng Delta Update: Chỉ tải file có mã hash thay đổi.
 * - Gọi cache.put() trực tiếp để đảm bảo 100% offline.
 * ==========================================================
 */

import { APP_DATA } from './config.js';

// ==========================================================
// PHẦN 1: STATE & CẤU HÌNH
// ==========================================================
let isDownloading = false;
let isCancelled = false;

const CACHE_NAME = 'vandao-core-v4';
const VERSION_URL = './data/manifests/data-version.json';
const LOCAL_VERSION_KEY = 'vandao_core_version';

const CONFIG = Object.freeze({
    BATCH_SIZE: 5,
    RETRY_PER_FILE: 2,
    RETRY_DELAY: 500,
    YIELD_DELAY: 50,
    TIMEOUT: 8000
});

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
// PHẦN 2: STORAGE CHECK & CLEAR
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
        const percent = ((estimate.usage / estimate.quota) * 100).toFixed(1);

        if (storageText) {
            storageText.textContent = `Đã dùng: ${usedMB} MB (${percent}%)`;
            storageText.title = `Tổng dung lượng khả dụng: ${(estimate.quota / (1024 * 1024)).toFixed(0)} MB`;
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
        localStorage.removeItem(LOCAL_VERSION_KEY); // Xóa dấu vết version
        await checkStorageSize();
        return true;
    } catch (error) {
        return false;
    }
}

// ==========================================================
// PHẦN 3: DELTA UPDATE LOGIC (CHỈ TẢI FILE THAY ĐỔI)
// ==========================================================
async function getFilesToDownload() {
    // 1. Lấy manifest version từ server
    const res = await fetch(VERSION_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Không thể tải data-version.json');
    const serverManifest = await res.json();

    // 2. Lấy version đang lưu ở máy khách
    let localManifest = { files: {} };
    try {
        const saved = localStorage.getItem(LOCAL_VERSION_KEY);
        if (saved) localManifest = JSON.parse(saved);
    } catch (e) {}

    const queue = [];

    // 3. So sánh Delta
    for (const [url, hash] of Object.entries(serverManifest.files)) {
        const localHash = localManifest.files ? localManifest.files[url] : null;
        if (hash !== localHash) {
            queue.push({ url, hash });
        }
    }

    return { queue, serverManifest };
}

// ==========================================================
// PHẦN 4: DOWNLOAD ALL (CHỈ TẢI KHO LÕI + CACHE THỦ CÔNG)
// ==========================================================
export async function downloadAllOffline(progressCallback) {
    if (isDownloading) return { success: false, message: 'Đang tải dữ liệu...' };

    isDownloading = true;
    isCancelled = false;

    try {
        // Bước 1: Lấy danh sách file cần tải (Delta Update)
        const { queue, serverManifest } = await getFilesToDownload();
        const totalFiles = queue.length;

        if (totalFiles === 0) {
            // Nếu không có file nào thay đổi, cập nhật version và báo hoàn tất
            localStorage.setItem(LOCAL_VERSION_KEY, JSON.stringify(serverManifest));
            return { success: true, message: 'Dữ liệu đã là mới nhất.' };
        }

        // Bước 2: Mở Cache Storage
        const cache = await caches.open(CACHE_NAME);
        let completedFiles = 0;
        let failedFiles = 0;

        // Bước 3: Tải từng batch
        for (let i = 0; i < totalFiles; i += CONFIG.BATCH_SIZE) {
            if (isCancelled) break;

            const batch = queue.slice(i, i + CONFIG.BATCH_SIZE);
            let batchSuccess = 0;

            await Promise.allSettled(
                batch.map(async (item) => {
                    const res = await fetchWithRetry(item.url, CONFIG.RETRY_PER_FILE);
                    if (res && res.ok) {
                        // [QUAN TRỌNG] Chủ động lưu vào Cache
                        await cache.put(item.url, res.clone());
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

        // Bước 4: Nếu tải thành công toàn bộ, lưu version mới
        if (failedFiles === 0 && !isCancelled) {
            localStorage.setItem(LOCAL_VERSION_KEY, JSON.stringify(serverManifest));
        }

        return {
            success: true,
            status: isCancelled ? 'cancelled' : 'completed',
            total: totalFiles,
            completed: completedFiles,
            failed: failedFiles,
            message: isCancelled ? `Đã hủy. Hoàn thành: ${completedFiles}/${totalFiles}` : `Hoàn tất ${completedFiles} file mới.`
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
