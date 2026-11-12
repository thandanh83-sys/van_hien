/**
 * ==========================================================
 * VĂN ĐẠO - OFFLINE MODULE (js/offline.js)
 * Chức năng: Quản lý Tủ Sách Offline, Tải dữ liệu theo lô,
 * Kiểm tra dung lượng lưu trữ và Xóa Cache.
 * ==========================================================
 */

import { APP_DATA } from './config.js';

// Biến cờ hiệu để kiểm soát việc tạm dừng/hủy tiến trình tải
let isDownloading = false;
let isPaused = false;
let isCancelled = false;

/**
 * ==========================================
 * 1. KIỂM TRA DUNG LƯỢNG LƯU TRỮ (STORAGE API)
 * Cập nhật text "Đã dùng: X MB" lên giao diện Cài đặt
 * ==========================================
 */
export async function checkStorageSize() {
    const storageText = document.getElementById('settings-storage-text');
    
    // Kiểm tra xem trình duyệt có hỗ trợ Storage API không
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            // Đổi Bytes sang MB (1 MB = 1024 * 1024 Bytes)
            const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
            const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
            
            if (storageText) {
                storageText.textContent = `Đã dùng: ${usedMB} MB`;
                storageText.title = `Tổng dung lượng khả dụng: ${quotaMB} MB`; // Tooltip hiển thị khi rê chuột
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
 * ==========================================
 * 2. XÓA TOÀN BỘ DỮ LIỆU OFFLINE
 * Xóa sạch bộ nhớ đệm (Cache) của trình duyệt
 * ==========================================
 */
export async function clearOfflineData() {
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            // Chỉ xóa các cache có liên quan đến Văn Đạo để không ảnh hưởng web khác
            const vandaoCaches = cacheNames.filter(name => name.startsWith('vandao-'));
            
            await Promise.all(
                vandaoCaches.map(name => caches.delete(name))
            );
            
            // Cập nhật lại dung lượng sau khi xóa
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
 * ==========================================
 * 3. TẢI TOÀN BỘ DỮ LIỆU (DOWNLOAD ALL)
 * Sử dụng kỹ thuật Batch (chia lô) để chống treo thanh tiến trình
 * ==========================================
 */
export async function downloadAllOffline(progressCallback) {
    if (isDownloading) return; // Ngăn việc bấm nút 2 lần liên tiếp
    isDownloading = true;
    isPaused = false;
    isCancelled = false;

    // 1. Thu thập tất cả các ID cần tải từ APP_DATA (tránh tải file index)
    const worksList = APP_DATA.WORKS_DATA || [];
    const authorsList = APP_DATA.AUTHOR_DATA || [];
    
    // Tạo danh sách URL cần tải
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

    // 2. Cấu hình kích thước lô (Batch)
    const BATCH_SIZE = 10; // Tải 10 file một lần, tránh nghẽn mạng

    try {
        for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
            // Kiểm tra cờ Hủy hoặc Tạm dừng
            if (isCancelled) {
                console.log("[OFFLINE] Đã hủy tiến trình tải.");
                break;
            }
            
            // Vòng lặp đợi nếu đang Tạm dừng
            while (isPaused) {
                await new Promise(r => setTimeout(r, 500));
                if (isCancelled) break;
            }
            if (isCancelled) break;

            // Cắt ra một lô file (10 file)
            const batch = queue.slice(i, i + BATCH_SIZE);
            
            // Gửi tín hiệu fetch cho cả lô
            const fetchPromises = batch.map(url => 
                fetch(url).catch(err => {
                    console.warn(`[OFFLINE] Lỗi tải file ${url}:`, err);
                    failedFiles++;
                    return null; // Trả về null để allSettled không bị lỗi
                })
            );

            // Dùng allSettled: Chờ cả lô tải xong (dù có file lỗi vẫn tiếp tục)
            await Promise.allSettled(fetchPromises);
            
            // Cập nhật tiến trình
            completedFiles += batch.length;
            const percent = Math.round((completedFiles / totalFiles) * 100);
            
            if (typeof progressCallback === 'function') {
                progressCallback(percent, completedFiles, totalFiles, failedFiles);
            }

            // NHƯỜNG LUỒNG (QUAN TRỌNG): Ép trình duyệt nghỉ 50ms để vẽ lại thanh tiến trình
            // Nếu không có dòng này, UI sẽ bị đơ và thanh tiến trình không nhảy %.
            await new Promise(r => setTimeout(r, 50));
        }

        return { success: true, total: totalFiles, failed: failedFiles };
        
    } catch (error) {
        console.error("[OFFLINE] Lỗi hệ thống khi tải dữ liệu:", error);
        return { success: false, error: error.message };
    } finally {
        // Reset các cờ trạng thái
        isDownloading = false;
        isPaused = false;
        isCancelled = false;
        await checkStorageSize(); // Cập nhật lại dung lượng sau khi tải
    }
}

/**
 * ==========================================
 * 4. CÁC HÀM ĐIỀU KHIỂN TIẾN TRÌNH (PAUSE/CANCEL)
 * ==========================================
 */
export function pauseDownload() {
    isPaused = true;
}

export function resumeDownload() {
    isPaused = false;
}

export function cancelDownload() {
    isCancelled = true;
    isPaused = false;
}
