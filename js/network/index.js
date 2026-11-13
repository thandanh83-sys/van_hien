/**
 * ==========================================================
 * VĂN ĐẠO — NETWORK LAYER FACADE v2.0.0
 * Vị trí: js/network/index.js
 * ==========================================================
 */

import { MotherNode } from './mother.js';
import { VDBus } from './bus.js';
import { DataHub } from './data-hub.js'; // [MỚI] Trái tim dữ liệu

export { MotherNode, VDBus, DataHub };

export const NetworkLayer = Object.freeze({
    version: '2.0.0',
    mother: MotherNode,
    bus: VDBus,
    dataHub: DataHub, // Export DataHub qua Facade

    async bootstrap() {
        const index = await MotherNode.loadIndex();
        console.log(
            `%c[NETWORK] Văn Đạo Network Layer v${this.version}`,
            'color: #8bb8a8; font-weight: bold; font-size: 14px;',
            `\n• DataHub: Sẵn sàng`,
            `\n• Mother: ${MotherNode.id}`,
            `\n• Adapter: ${VDBus.adapterName}`,
            `\n• Nodes: ${(index.nodes || []).length}`
        );
        return this;
    }
});

export async function bootstrapNetwork() {
    return NetworkLayer.bootstrap();
}
