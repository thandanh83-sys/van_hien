/**
 * ==========================================================
 * VĂN ĐẠO — DICTIONARY DATABASE (IndexedDB Engine)
 * Vị trí: js/network/dictionary-db.js
 * Version: 1.0.0 (Async Dictionary Strategy)
 * ==========================================================
 * TRIẾT LÝ:
 * - Lưu trữ từ điển lớn (Hán Việt) vào IndexedDB để giải phóng RAM.
 * - Cung cấp API tìm kiếm tốc độ cao (<10ms) thay vì duyệt mảng.
 * ==========================================================
 */

const DB_NAME = 'vandao_dictionary_db';
const DB_VERSION = 1;
const STORE_NAME = 'han_viet';

export const DictionaryDB = {
    db: null,

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (e) => reject(e.target.error);

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('normalized', 'normalized', { unique: false });
                }
            };
        });
    },

    async importData(dataObject) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            store.clear(); // Xóa cũ trước khi import mới

            let count = 0;
            for (const [keyword, info] of Object.entries(dataObject)) {
                const record = {
                    id: `han_viet_${keyword}`,
                    keyword: keyword,
                    normalized: info.normalized || keyword.toLowerCase(),
                    mean: info.mean || '',
                    vol: info.vol || '',
                    sec: info.sec || ''
                };
                store.put(record);
                count++;
            }

            tx.oncomplete = () => resolve(count);
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    async getExact(normalizedKeyword) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('normalized');
            const request = index.getAll(normalizedKeyword);

            request.onsuccess = () => {
                resolve(request.result.length > 0 ? request.result[0] : null);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async searchPartial(queryNormalized, limit = 5) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const results = [];
            
            const request = store.openCursor();
            
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor && results.length < limit) {
                    const item = cursor.value;
                    if (item.normalized.includes(queryNormalized) || queryNormalized.includes(item.normalized)) {
                        results.push(item);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async count() {
        const db = await this.init();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
        });
    },

    async clear() {
        const db = await this.init();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.clear();
            tx.oncomplete = () => resolve();
        });
    }
};
