/**
 * ==========================================================
 * VĂN ĐẠO - OFFLINE MODULE (js/offline.js)
 * Vị trí: js/offline.js
 * Version: 5.1.0 (Offline Delta Strategy + Safe Clear)
 * ==========================================================
 * TRIẾT LÝ:
 * - KHÔNG tải toàn bộ hàng ngàn file (tránh đầy bộ nhớ).
 * - Chỉ tải "Kho lõi" (Core Data): Index, Từ điển, Lý thuyết.
 * - Áp dụng Delta Update: Chỉ tải file có mã hash thay đổi.
 * - Tự động nạp han-viet.json vào IndexedDB để giải phóng RAM.
 * - [v5.1.0] Hàm clearOfflineData xóa sạch Tủ Sách nhưng GIỮ LẠI
 *   cài đặt cá nhân (Theme, Draft).
 * ==========================================================
 */

import { APP_DATA } from './config.js';
import { DictionaryDB } from './network/dictionary-db.js';

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
// PHẦN 2: STORAGE CHECK & CLEAR (SAFE CLEAR - v5.1.0)
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

/**
 * XÓA SẠCH TỦ SÁCH OFFLINE (Safe Clear)
 * 
 * Hành động:
 * 1. Xóa toàn bộ Cache API (vandao-*).
 * 2. Xóa toàn bộ IndexedDB (Hán Việt).
 * 3. Xóa dấu vết Version (LocalStorage).
 * 
 * KHÔNG XÓA:
 * - Theme Sáng/Tối.
 * - Bản nháp bài thơ (vandao_draft_poem).
 * - Service Worker (để web vẫn chạy offline).
 */
export async function clearOfflineData() {
    if (!('caches' in window)) {
        console.warn("[OFFLINE] Trình duyệt không hỗ trợ Cache API.");
        return false;
    }

    try {
        // 1. Xóa Cache API
        const cacheNames = await caches.keys();
        const vandaoCaches = cacheNames.filter(name => name.startsWith('vandao-'));
        
        if (vandaoCaches.length > 0) {
            await Promise.all(vandaoCaches.map(name => caches.delete(name)));
            console.log(`[OFFLINE] Đã xóa ${vandaoCaches.length} Cache API:`, vandaoCaches);
        } else {
            console.log("[OFFLINE] Không có Cache API nào để xóa.");
        }

        // 2. Xóa IndexedDB (Từ điển Hán Việt)
        try {
            const dictCount = await DictionaryDB.count();
            await DictionaryDB.clear();
            console.log(`[OFFLINE] Đã xóa IndexedDB (${dictCount} từ Hán Việt).`);
        } catch (e) {
            console.warn("[OFFLINE] Lỗi khi xóa IndexedDB (có thể chưa khởi tạo):", e);
        }

        // 3. Xóa dấu vết Version (Để lần sau tải lại từ đầu)
        localStorage.removeItem(LOCAL_VERSION_KEY);
        console.log("[OFFLINE] Đã xóa dấu vết Version.");

        // 4. Cập nhật lại UI
        await checkStorageSize();
        
        return true;
    } catch (error) {
        console.error("[OFFLINE] Lỗi khi xóa dữ liệu Offline:", error);
        return false;
    }
}

// ==========================================================
// PHẦN 3: DELTA UPDATE LOGIC (CHỈ TẢI FILE THAY ĐỔI)
// ==========================================================
async function getFilesToDownload() {
    const res = await fetch(VERSION_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Không thể tải data-version.json');
    const serverManifest = await res.json();

    let localManifest = { files: {} };
    try {
        const saved = localStorage.getItem(LOCAL_VERSION_KEY);
        if (saved) localManifest = JSON.parse(saved);
    } catch (e) {}

    const queue = [];

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
        const { queue, serverManifest } = await getFilesToDownload();
        const totalFiles = queue.length;

        if (totalFiles === 0) {
            localStorage.setItem(LOCAL_VERSION_KEY, JSON.stringify(serverManifest));
            return { success: true, message: 'Dữ liệu đã là mới nhất.' };
        }

        const cache = await caches.open(CACHE_NAME);
        let completedFiles = 0;
        let failedFiles = 0;

        for (let i = 0; i < totalFiles; i += CONFIG.BATCH_SIZE) {
            if (isCancelled) break;

            const batch = queue.slice(i, i + CONFIG.BATCH_SIZE);
            let batchSuccess = 0;

            await Promise.allSettled(
                batch.map(async (item) => {
                    const res = await fetchWithRetry(item.url, CONFIG.RETRY_PER_FILE);
                    if (res && res.ok) {
                        await cache.put(item.url, res.clone());
                        
                        // XỬ LÝ ĐẶC BIỆT CHO TỪ ĐIỂN HÁN VIỆT
                        if (item.url.includes('han-viet.json')) {
                            try {
                                const jsonData = await res.clone().json();
                                const flatData = jsonData.hanViet || jsonData;
                                await DictionaryDB.importData(flatData);
                                console.log(`[OFFLINE] Đã nạp từ điển Hán Việt vào IndexedDB.`);
                            } catch (e) {
                                console.error(`[OFFLINE] Lỗi nạp Hán Việt vào DB:`, e);
                            }
                        }

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
