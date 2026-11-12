/**
 * ==========================================================
 * VĂN ĐẠO - RENDER MODULE (js/render.js)
 * Chức năng: Hiển thị giao diện (Trang chủ, Bài thơ, Tác giả)
 * Đã sửa: Xóa nút Bản dịch/Nguyên văn, bỏ cắt chữ, sửa Tooltip đè chữ.
 * ==========================================================
 */

import { STATE, ICONS } from './config.js';

// Khai báo các thẻ chứa nội dung chính (đảm bảo bạn có các ID này trong index.html)
const DOM = {
    viewHome: document.getElementById('view-home'),
    viewDetail: document.getElementById('view-detail'),
    viewAuthor: document.getElementById('view-author'),
    tooltip: null // Sẽ được tạo động
};

/**
 * ==========================================
 * 1. RENDER TRANG CHỦ (HOME VIEW)
 * ==========================================
 */
export function renderHomeView() {
    if (!DOM.viewHome) return;
    
    // Code render trang chủ của bạn (danh sách tác giả, danh ngôn...)
    // Ở đây tôi giả lập một giao diện trang chủ cơ bản
    DOM.viewHome.innerHTML = `
        <div class="home-hero">
            <h1 class="home-title">VĂN ĐẠO</h1>
            <p class="home-subtitle">Vẻ Đẹp Bạch Ngọc Giữa Làn Nước Tĩnh</p>
        </div>
        <div class="home-section">
            <h2>Khám Phá</h2>
            <div class="card-grid">
                <!-- Các thẻ tác phẩm, tác giả sẽ được render ở đây -->
                <div class="card" onclick="window.navigateTo('tac-pham', 'tran-quoc-tuan')">
                    <h3>Hịch Tướng Sĩ</h3>
                    <p>Trần Quốc Tuấn</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * ==========================================
 * 2. RENDER CHI TIẾT TÁC PHẨM (BÀI THƠ)
 * Nơi sửa triệt để lỗi nút Bản Dịch và cắt chữ
 * ==========================================
 */
export function renderWorkDetail(data) {
    if (!DOM.viewDetail || !data) return;

    // 1. Phần Header (Tên bài thơ, Tên tác giả)
    let html = `
        <div class="work-header fade-in">
            <h1 class="work-title">${data.ten_tac_pham || 'Chưa rõ tên'}</h1>
            <p class="work-author">— ${data.tac_gia || 'Vô danh'} —</p>
        </div>
    `;

    // ---------------------------------------------------------
    // ĐÃ XÓA HOÀN TOÀN CÁC NÚT "BẢN DỊCH", "NGUYÊN VĂN" TẠI ĐÂY
    // Không có bất kỳ thẻ <button> nào được sinh ra ở đoạn này.
    // ---------------------------------------------------------

    // 2. Phần Nội dung (Đã bỏ hàm cắt chữ substring)
    if (data.noi_dung && data.noi_dung.trim() !== "") {
        // Bọc nội dung vào thẻ div có class poem-content để CSS căn lề đẹp
        // Tuyệt đối không cắt chữ, hiển thị 100% độ dài
        html += `
            <div class="work-content poem-content fade-in">
                ${data.noi_dung}
            </div>
        `;
    } else {
        // Nếu file JSON không có nội dung, không render khung rỗng (tránh lỗi khung () )
        html += `<div class="work-content empty-content">Nội dung đang được Văn Đạo hiệu đính.</div>`;
    }

    // 3. Phần Lời Bình (Đã sửa font chữ bị nhỏ)
    if (data.loi_binh && data.loi_binh.trim() !== "") {
        html += `
            <div class="loi-binh-section fade-in">
                <div class="loi-binh-header">
                    <h3 class="loi-binh-title">Lời Bình</h3>
                    <!-- Tag Văn Khí (nếu có) -->
                    ${data.van_khi ? `<span class="van-khi-tag">VĂN KHÍ: ${data.van_khi}</span>` : ''}
                </div>
                <div class="loi-binh-content">
                    ${data.loi_binh}
                </div>
            </div>
        `;
    }

    // Render toàn bộ ra màn hình
    DOM.viewDetail.innerHTML = html;
    
    // Xóa thông báo loading (nếu có)
    const loadingEl = DOM.viewDetail.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
}

/**
 * ==========================================
 * 3. HIỂN THỊ TOOLTIP (SỬA LỖI ĐÈ CHỮ)
 * ==========================================
 */
export function showTooltip(event, textNghia) {
    // 1. Xóa tooltip cũ nếu đang có
    if (DOM.tooltip) {
        DOM.tooltip.remove();
    }

    // 2. Tạo thẻ div chứa Tooltip
    DOM.tooltip = document.createElement('div');
    DOM.tooltip.className = 'vd-tooltip';
    DOM.tooltip.innerHTML = textNghia;
    document.body.appendChild(DOM.tooltip);

    // 3. Tính toán vị trí để KHÔNG BAO GIỜ ĐÈ LÊN CHỮ
    const rect = event.target.getBoundingClientRect();
    const tooltipRect = DOM.tooltip.getBoundingClientRect();

    // Tính toán vị trí Top (Mặc định đẩy lên trên chữ 10px)
    let top = rect.top + window.scrollY - tooltipRect.height - 10;
    
    // Nếu bị tràn lên mép trên màn hình, đẩy xuống dưới chữ
    if (top < window.scrollY) {
        top = rect.bottom + window.scrollY + 10;
    }

    // Căn giữa Tooltip so với từ được chọn
    let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);

    // Đảm bảo tooltip không bị tràn ra ngoài mép trái/phải màn hình
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }

    // 4. Áp dụng vị trí
    DOM.tooltip.style.top = `${top}px`;
    DOM.tooltip.style.left = `${left}px`;
    
    // Kích hoạt hiệu ứng hiện lên mượt mà
    requestAnimationFrame(() => {
        DOM.tooltip.classList.add('show');
    });
}