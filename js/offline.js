/**
 * ==========================================================
 * VĂN ĐẠO - OFFLINE MODULE (js/offline.js)
 * Chức năng: Quản lý Tủ Sách Offline, Tải dữ liệu theo lô.
 * Đã sửa: Lỗi crash khi bấm tải 2 lần, xóa code chết.
 * ==========================================================
 */

import { APP_DATA } from './config.js';

let isDownloading = false;
let isCancelled = false;

/**
 * 1. KIỂM TRA DUNG LƯỢNG LƯU TRỮ (STORAGE API)
 */
export async function checkStorageSize() {
    const storageText = document.getElementById('settings-storage-text');
    
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
            const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
            
            if (storageText) {
                storageText.textContent = `Đã dùng: ${usedMB} MB`;
                storageText.title = `Tổng dung lượng khả dụng: ${quotaMB} MB`;
                storageText.style.color = 'var(--accent-text)';
            }
        } catch (err) {
            console.warn("[STORAGE] Không thể lấy thông tin dung lượng:", err);
            if (storageText) storageText.textContent = "Không xác định";
        }
    } else {
        if (storageText) storageText.textContent = "Không hỗ trợ";
    }
}

/**
 * 2. XÓA TOÀN BỘ DỮ LIỆU OFFLINE
 */
export async function clearOfflineData() {
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            const vandaoCaches = cacheNames.filter(name => name.startsWith('vandao-'));
            
            await Promise.all(
                vandaoCaches.map(name => caches.delete(name))
            );
            
            await checkStorageSize();
            return true;
        } catch (error) {
            console.error("[OFFLINE] Lỗi khi xóa cache:", error);
            return false;
        }
    }
    return false;
}

/**
 * 3. TẢI TOÀN BỘ DỮ LIỆU (DOWNLOAD ALL)
 */
export async function downloadAllOffline(progressCallback) {
    // ĐÃ SỬA: Trả về object thay vì undefined để tránh lỗi TypeError ở main.js
    if (isDownloading) return { success: false, message: 'Đang tải dữ liệu, vui lòng đợi...' }; 
    
    isDownloading = true;
    isCancelled = false;

    const worksList = APP_DATA.WORKS_DATA || [];
    const authorsList = APP_DATA.AUTHOR_DATA || [];
    
    const queue = [];
    worksList.forEach(w => queue.push(`./data/tac-pham/${encodeURIComponent(w.id)}.json`));
    authorsList.forEach(a => queue.push(`./data/tac-gia/${encodeURIComponent(a.id)}.json`));

    const totalFiles = queue.length;
    let completedFiles = 0;
    let failedFiles = 0;

    if (totalFiles === 0) {
        isDownloading = false;
        return { success: false, message: "Không có dữ liệu để tải." };
    }

    const BATCH_SIZE = 10;

    try {
        for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
            if (isCancelled) break;

            const batch = queue.slice(i, i + BATCH_SIZE);
            
            const fetchPromises = batch.map(url => 
                fetch(url).catch(err => {
                    console.warn(`[OFFLINE] Lỗi tải file ${url}:`, err);
                    failedFiles++;
                    return null; 
                })
            );

            await Promise.allSettled(fetchPromises);
            
            completedFiles += batch.length;
            const percent = Math.round((completedFiles / totalFiles) * 100);
            
            if (typeof progressCallback === 'function') {
                progressCallback(percent, completedFiles, totalFiles, failedFiles);
            }

            // Nhường luồng cho UI vẽ thanh tiến trình
            await new Promise(r => setTimeout(r, 50));
        }

        return { success: true, total: totalFiles, failed: failedFiles };
        
    } catch (error) {
        console.error("[OFFLINE] Lỗi hệ thống khi tải dữ liệu:", error);
        return { success: false, error: error.message };
    } finally {
        isDownloading = false;
        isCancelled = false;
        await checkStorageSize(); 
    }
}

/**
 * 4. HÀM ĐIỀU KHIỂN TIẾN TRÌNH (Đã xóa Pause/Resume)
 */
export function cancelDownload() {
    isCancelled = true;
}
