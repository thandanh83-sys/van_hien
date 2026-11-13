/**
 * ==========================================================
 * VĂN ĐẠO - MOTHER NODE (Máy Mẹ)
 * Vị trí: js/network/mother.js
 * Version: 1.5.0 (Offline-First & In-Memory Routing)
 * ==========================================================
 * CHỨC NĂNG:
 * - Quản lý bản đồ định tuyến (Routing Map) 100% Offline.
 * - Cung cấp hàm locateById(id) để tìm thông tin cơ bản.
 * - Cung cấp hàm getDetailData(id) để lấy nội dung chi tiết (có Fallback).
 * ==========================================================
 */

import { APP_DATA, STATE } from '../config.js';

export const MotherNode = (() => {
    let indexCache = null;

    /**
     * [OFFLINE-FIRST] Xây dựng bản đồ định tuyến từ bộ nhớ RAM.
     * Không cần gọi mạng, chạy siêu tốc.
     */
    function getLocalData(group) {
        if (group === 'triet-thuyet') return APP_DATA.THEORY_DATA || [];
        if (group === 'ky-tai')       return APP_DATA.AUTHOR_DATA || [];
        if (group === 'tinh-hoa')     return APP_DATA.WORKS_DATA || [];
        if (group === 'the-loai')     return APP_DATA.THE_LOAI_DATA || [];
        return [];
    }

    /**
     * Tải file index.json (Chỉ dùng khi cần thông tin chi tiết của Node, ít khi dùng tới)
     */
    async function loadIndex() {
        if (indexCache) return indexCache;
        try {
            const res = await fetch('./data/manifests/index.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            indexCache = await res.json();
            return indexCache;
        } catch (e) {
            console.warn('[MOTHER] Index không tải được (có thể đang Offline). Dùng cấu hình mặc định.');
            // Fallback cấu hình cứng nếu đang Offline và chưa cache được index.json
            return { 
                routing: { 
                    'triet-thuyet': 'node-triet-thuyet', 
                    'ky-tai': 'node-ky-tai', 
                    'tinh-hoa': 'node-tinh-hoa', 
                    'the-loai': 'node-the-loai' 
                }, 
                nodes: [] 
            };
        }
    }

    /**
     * [CỰC NHANH] Định tuyến ID: Tìm xem ID này thuộc nhóm nào (Node nào)
     * @param {string} id 
     * @returns {Promise<Object|null>} { nodeId, group, record }
     */
    async function locateById(id) {
        if (!id) return null;

        // 1. Ưu tiên quét trong GLOBAL_RECORDS (Đã nạp sẵn trong RAM - Offline 100%)
        if (STATE.GLOBAL_RECORDS && STATE.GLOBAL_RECORDS.length > 0) {
            const record = STATE.GLOBAL_RECORDS.find(r => r.id === id);
            if (record) {
                const index = await loadIndex();
                return {
                    nodeId: (index.routing || {})[record.group] || 'unknown',
                    group: record.group,
                    record: record.data
                };
            }
        }

        // 2. Nếu RAM chưa có (hiếm khi xảy ra), quét thủ công trong APP_DATA
        const groups = ['triet-thuyet', 'ky-tai', 'tinh-hoa', 'the-loai'];
        for (const group of groups) {
            const found = getLocalData(group).find(r => r.id === id);
            if (found) {
                const index = await loadIndex();
                return {
                    nodeId: (index.routing || {})[group] || 'unknown',
                    group: group,
                    record: found
                };
            }
        }

        return null;
    }

    /**
     * Lấy dữ liệu chi tiết của một ID (Offline-Friendly)
     * @param {string} id 
     * @returns {Promise<Object>} Dữ liệu JSON chi tiết hoặc Fallback
     */
    async function getDetailData(id) {
        const location = await locateById(id);
        if (!location) return null;

        const { group, record } = location;

        // 1. Nếu là Lý thuyết hoặc Thể loại -> Dữ liệu content đã có sẵn trong record
        if (group === 'triet-thuyet' || group === 'the-loai') {
            return { content: record.content || record.description || '' };
        }

        // 2. Nếu là Tác phẩm hoặc Tác giả -> Cần lấy file JSON chi tiết
        const folder = group === 'tinh-hoa' ? 'tac-pham' : 'tac-gia';
        const url = `./data/${folder}/${encodeURIComponent(id)}.json`;

        // [OFFLINE TIMEOUT] Tạo AbortController để ép hủy request nếu mạng lag quá 1.5s
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);

        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
            
        } catch (err) {
            // BẮT LỖI OFFLINE HOẶC TIMEOUT -> Tự động Fallback về dữ liệu trong RAM
            clearTimeout(timer);
            // Không log warning ầm ĩ để tránh rác console khi offline
            return { 
                content: record.content || record.desc || record.description || 'Nội dung đang được cập nhật.' 
            };
        }
    }

    return { locateById, getDetailData, loadIndex };
})();