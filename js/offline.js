/**
 * ==========================================================
 * VĂN ĐẠO - OFFLINE MODULE (js/offline.js)
 * Chức năng: Tải dữ liệu Offline, kiểm tra dung lượng, Lazy load.
 * Đã sửa: Không dùng Promise.all (chống treo tiến trình), chia lô.
 * ==========================================================
 */

import { CONFIG } from './config.js';

/**
 * 1. TẢI 1 BÀI DUY NHẤT (Lazy Load - Siêu tốc)
 * Dùng khi người dùng click vào 1 bài thơ cụ thể.
 */
export async function loadSingleItem(id, type = 'tac-pham') {
    try {
        const url = `data/${type}/${id}.json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`File không tồn tại: ${url}`);
        return await res.json();
    } catch (error) {
        console.error(`[Lỗi tải bài] ${error.message}`);
        return null;
    }
}

/**
 * 2. TẢI TOÀN BỘ (Dành cho nút "Tải Toàn Bộ" trong Cài Đặt)
 * Sử dụng kỹ thuật Batch (chia lô) và allSettled (lỗi 1 file không sập cả mẻ).
 */
export async function downloadAllOffline(progressCallback) {
    try {
        // Bước 1: Chỉ tải file Index (Rất nhẹ, chứa danh sách ID)
        const indexRes = await fetch(CONFIG.DATA_PATHS.TAC_PHAM_INDEX);
        const indexData = await indexRes.json();
        
        const totalFiles = indexData.length;
        let completedFiles = 0;
        let failedFiles = 0;

        // Bước 2: Chia thành từng lô (Batch) 10 file một để không nghẽn mạng
        const BATCH_SIZE = 10;
        
        for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
            const batch = indexData.slice(i, i + BATCH_SIZE);
            
            // Tạo mảng các Promise fetch
            const fetchPromises = batch.map(item => 
                fetch(`data/tac-pham/${item.id}.json`).catch(err => {
                    console.warn(`[Cảnh báo] Lỗi tải file ${item.id}.json:`, err);
                    failedFiles++;
                })
            );

            // Dùng allSettled: Chờ cả lô tải xong (dù có file lỗi) rồi mới đi tiếp
            await Promise.allSettled(fetchPromises);
            
            // Cập nhật tiến trình
            completedFiles += batch.length;
            const percent = Math.round((completedFiles / totalFiles) * 100);
            
            // Gọi hàm callback để cập nhật thanh Progress Bar trên UI
            if (typeof progressCallback === 'function') {
                progressCallback(percent, completedFiles, totalFiles);
            }
        }

        return { success: true, total: totalFiles, failed: failedFiles };

    } catch (error) {
        console.error("[Lỗi Offline] Quá trình tải thất bại:", error);
        return { success: false, error: error.message };
    }
}

/**
 * 3. KIỂM TRA DUNG LƯỢNG LƯU TRỮ (Storage API)
 * Hiển thị dung lượng đã dùng lên giao diện Cài Đặt.
 */
export async function checkStorageSize() {
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
            const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
            
            // Cập nhật DOM
            const storageText = document.getElementById('storage-text');
            if (storageText) {
                storageText.innerText = `Đã dùng: ${usedMB} MB / ${quotaMB} MB`;
            }
            return { usedMB, quotaMB };
        } catch (err) {
            console.error("Không thể lấy thông tin dung lượng:", err);
            return null;
        }
    }
    return null;
}

/**
 * 4. XÓA DỮ LIỆU OFFLINE (Dọn dẹp bộ nhớ đệm)
 */
export async function clearOfflineData() {
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(name => caches.delete(name))
            );
            alert("Đã xóa toàn bộ dữ liệu Offline thành công.");
            return true;
        } catch (error) {
            console.error("Lỗi khi xóa cache:", error);
            return false;
        }
    }
    return false;
}