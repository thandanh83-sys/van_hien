/**
 * ==========================================================
 * VĂN ĐẠO — NETWORK LAYER FACADE v1.0.0
 * ==========================================================
 * 
 * Barrel export cho toàn bộ network layer.
 * Import từ đây thay vì từng file riêng lẻ.
 * 
 * USAGE:
 *   import { MotherNode, VDBus, NetworkLayer, bootstrapNetwork } 
 *     from './network/index.js';
 * ==========================================================
 */

import { MotherNode } from './mother.js';
import { VDBus } from './bus.js';

export { MotherNode, VDBus };

/**
 * NetworkLayer: Facade cấp cao gộp MotherNode + VDBus
 * Dùng khi cần truy cập "toàn mạng" như một thực thể duy nhất.
 */
export const NetworkLayer = Object.freeze({
    version: '1.0.0',
    mother: MotherNode,
    bus: VDBus,

    /**
     * Khởi động mạng lưới (log + warmup cache)
     * @returns {Promise<NetworkLayer>}
     */
    async bootstrap() {
        const index = await MotherNode.loadIndex();
        console.log(
            `%c[NETWORK] Văn Đạo Network Layer v${this.version}`,
            'color: #8bb8a8; font-weight: bold; font-size: 14px;',
            `\n• Mother: ${MotherNode.id}`,
            `\n• Node ID: ${VDBus.nodeId}`,
            `\n• Adapter: ${VDBus.adapterName}`,
            `\n• Nodes: ${(index.nodes || []).length}`
        );
        return this;
    }
});

/**
 * Convenience helper — bootstrap network
 * @returns {Promise<NetworkLayer>}
 */
export async function bootstrapNetwork() {
    return NetworkLayer.bootstrap();
}