/**
 * ==========================================================
 * VĂN ĐẠO — NETWORK LAYER FACADE (js/network/index.js)
 * Vị trí: js/network/index.js
 * Version: 3.2.1 (Fixed: Added missing imports)
 * ==========================================================
 */

// [SỬA LỖI] Thêm import APP_DATA và STATE từ config.js
import { APP_DATA, STATE } from '../config.js'; 

import { DataHub } from './data-hub.js';
import { VDBus } from './bus.js';
// Import từ agents/index.js (thay vì agent-registry.js cũ)
import { AgentRegistry } from '../ai/agents/index.js'; 

export { DataHub, VDBus, AgentRegistry };

export const NetworkLayer = Object.freeze({
    version: '3.2.1',
    dataHub: DataHub,
    bus: VDBus,
    agentRegistry: AgentRegistry,

    async bootstrap() {
        try {
            const totalRecords = STATE?.GLOBAL_RECORDS?.length || 0;
            const totalWorks = APP_DATA?.WORKS_DATA?.length || 0;
            const totalAuthors = APP_DATA?.AUTHOR_DATA?.length || 0;
            const agentCount = AgentRegistry.getAllAgentKeys().length;

            console.log(
                `%c[NETWORK] Văn Đạo Network Layer v${this.version}`,
                'color: #8bb8a8; font-weight: bold; font-size: 14px;',
                `\n• DataHub: Sẵn sàng (${totalRecords} thực thể)`,
                `\n• AgentRegistry: Sẵn sàng (${agentCount} agents)`,
                `\n• VDBus: ${VDBus.isActive ? `Hoạt động (${VDBus.adapterName})` : 'Không khả dụng'}`,
                `\n• Tác phẩm: ${totalWorks} | Tác giả: ${totalAuthors}`
            );

            return this;
        } catch (err) {
            console.error('[NETWORK] Lỗi khởi động mạng lưới:', err);
            return this;
        }
    },

    debug() {
        return {
            version: this.version,
            dataHub: {
                totalRecords: STATE?.GLOBAL_RECORDS?.length || 0,
                totalWorks: APP_DATA?.WORKS_DATA?.length || 0,
                totalAuthors: APP_DATA?.AUTHOR_DATA?.length || 0,
                totalGenres: APP_DATA?.THE_LOAI_DATA?.length || 0
            },
            agentRegistry: {
                totalAgents: AgentRegistry.getAllAgentKeys().length,
                agents: AgentRegistry.getAllAgentKeys()
            },
            bus: VDBus.debug()
        };
    }
});

export async function bootstrapNetwork() {
    return NetworkLayer.bootstrap();
}
