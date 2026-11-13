/**
 * ==========================================================
 * VĂN ĐẠO — NETWORK LAYER FACADE (js/network/index.js)
 * Vị trí: js/network/index.js
 * Version: 3.2.0 (Plugin Architecture)
 * ==========================================================
 * CHỨC NĂNG:
 * - Đóng vai trò là "Trạm trung chuyển" (Facade) duy nhất cho toàn bộ
 *   hệ thống mạng lưới.
 * - Gom các module cốt lõi lại và export ra ngoài:
 *   1. DataHub: Trái tim dữ liệu (Truy xuất, Cache, Knowledge Graph).
 *   2. VDBus: Đường truyền tin nhắn (Publish/Subscribe/Request).
 *   3. AgentRegistry: Sổ đăng ký năng lực của các AI Agents (từ agents/index.js).
 * ==========================================================
 */

// =====================================================================
// 1. IMPORTS
// =====================================================================
import { DataHub } from './data-hub.js';
import { VDBus } from './bus.js';
// [SỬA] Import từ agents/index.js thay vì agent-registry.js cũ
import { AgentRegistry } from '../ai/agents/index.js'; 

// =====================================================================
// 2. RE-EXPORT (Xuất khẩu lại để main.js dễ sử dụng)
// =====================================================================
export { DataHub, VDBus, AgentRegistry };

// =====================================================================
// 3. NETWORK LAYER FACADE (Trạm trung chuyển cấp cao)
// =====================================================================
export const NetworkLayer = Object.freeze({
    version: '3.2.0',
    
    // Các module con (dùng để truy cập trực tiếp nếu cần)
    dataHub: DataHub,
    bus: VDBus,
    agentRegistry: AgentRegistry,

    /**
     * Khởi động mạng lưới và log trạng thái ra Console.
     * Hàm này được gọi từ main.js (bootstrapNetwork).
     * 
     * @returns {Promise<NetworkLayer>}
     */
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

    /**
     * [DEBUG] In ra trạng thái hiện tại của toàn bộ mạng lưới.
     */
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

// =====================================================================
// 4. CONVENIENCE HELPER (Hàm tiện ích)
// =====================================================================

/**
 * Khởi động mạng lưới (Wrapper cho NetworkLayer.bootstrap)
 * @returns {Promise<NetworkLayer>}
 */
export async function bootstrapNetwork() {
    return NetworkLayer.bootstrap();
}
