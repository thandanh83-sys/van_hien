#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: AUTO FILL CONTENT (NGƯỜI ĐIỀN KHUYẾT)
=====================================================================
Tác giả: Văn Đạo

TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
1. Tôn trọng sự thật: Tuyệt đối KHÔNG GHI ĐÈ nếu file đã có nội dung 
   thực sự (dài hơn 100 ký tự). Chỉ can thiệp khi khoảng trống là thật.
2. Thanh tao trong khuyết thiếu: Thay vì để khoảng trắng vô hồn, tự động 
   chèn một khung thông báo đẹp mắt, mang đậm phong cách Bạch Ngọc.
3. Không xâm phạm Metadata: Bỏ qua các file JSON không có trường 'content' 
   (ví dụ: file danh mục, file cấu hình). Chỉ điền vào nơi thực sự cần.
4. Nhẹ nhàng và an toàn: Sử dụng thư viện chuẩn, bắt lỗi JSON hỏng, 
   và thống kê rõ ràng những gì đã làm để con người kiểm soát.
=====================================================================
"""

import os
import sys
import json
from pathlib import Path

# =====================================================================
# I. CẤU HÌNH MÀU SẮC TERMINAL (Để log trên GitHub Actions dễ đọc)
# =====================================================================
C_TEAL = "\033[96m"   # Màu xanh ngọc (Tiêu đề)
C_GOLD = "\033[93m"   # Màu vàng (Các bước)
C_GRAY = "\033[90m"   # Màu xám (Ghi chú)
C_GREEN = "\033[92m"  # Màu xanh lá (Thành công)
C_RED = "\033[91m"    # Màu đỏ (Lỗi/Cảnh báo)
C_RESET = "\033[0m"   # Reset màu

# =====================================================================
# II. CẤU HÌNH ĐƯỜNG DẪN
# =====================================================================
ROOT_DIR = Path(__file__).parent.parent
os.chdir(ROOT_DIR)

DATA_DIR = ROOT_DIR / "data"
WORKS_DIR = DATA_DIR / "tac-pham"
AUTHORS_DIR = DATA_DIR / "tac-gia"

# Nội dung mẫu (Giao diện Bạch Ngọc, thanh tao, không dùng Emoji lòe loẹt)
DEFAULT_CONTENT = """
<div style="text-align: center; padding: 40px 20px; opacity: 0.85; background: rgba(139, 184, 168, 0.05); border-radius: 12px; border: 1px dashed var(--border-color);">
    <p style="font-family: var(--font-body); font-size: 1.1rem; font-style: italic; color: var(--accent-text); margin-bottom: 10px;">
        Văn bản này đang được Văn Đạo hiệu đính và biên soạn nội dung chi tiết.
    </p>
    <p style="font-family: var(--font-body); font-size: 0.9rem; color: var(--text-muted);">
        Vui lòng quay lại sau hoặc sử dụng tính năng "Thi Pháp" để phân tích tác phẩm.
    </p>
</div>
""".strip()

def print_header():
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - TỰ ĐỘNG ĐIỀN NỘI DUNG MẪU{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def process_directory(directory, dir_name):
    """Hàm xử lý một thư mục cụ thể (Tác phẩm hoặc Tác giả)"""
    if not directory.exists():
        print(f"{C_GRAY}[BỎ QUA]{C_RESET} Thư mục '{dir_name}' không tồn tại.\n")
        return 0, 0

    files = list(directory.glob("*.json"))
    if not files:
        print(f"{C_GRAY}[BỎ QUA]{C_RESET} Không có file JSON nào trong '{dir_name}'.\n")
        return 0, 0

    print(f"{C_GOLD}> KIỂM TRA {len(files)} FILE TRONG '{dir_name}'...{C_RESET}")
    
    filled_count = 0
    skipped_count = 0

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # LÁ CHẮN AN TOÀN MỚI (BƯỚC NÂNG CẤP):
            # Nếu file không có trường 'content' (ví dụ: file metadata thuần),
            # ta bỏ qua hoàn toàn, không tự ý thêm vào.
            if 'content' not in data:
                print(f"  {C_GRAY}[BỎ QUA]{C_RESET} File không có trường 'content': {file_path.name}")
                skipped_count += 1
                continue

            content = data.get('content', '')
            # Loại bỏ các thẻ HTML để đếm số ký tự thực tế
            clean_text = str(content).replace('<[^>]*>', '').strip() if content else ''
            
            # Nếu nội dung quá ngắn (dưới 100 ký tự) -> Coi là file rỗng cần điền mẫu
            if len(clean_text) < 100:
                data['content'] = DEFAULT_CONTENT
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"  {C_GREEN}[+]{C_RESET} Đã điền nội dung mẫu: {file_path.name}")
                filled_count += 1
            else:
                # File đã có nội dung thật, bỏ qua
                skipped_count += 1
                
        except json.JSONDecodeError:
            print(f"  {C_RED}[LỖI JSON]{C_RESET} File bị hỏng cú pháp: {file_path.name}")
        except Exception as e:
            print(f"  {C_RED}[LỖI]{C_RESET} Không thể xử lý {file_path.name}: {e}")

    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã điền mẫu cho {filled_count} file.")
    print(f"  {C_GRAY}[GIỮ NGUYÊN]{C_RESET} Bỏ qua {skipped_count} file (đã có nội dung thật hoặc không có trường 'content').\n")
    
    return filled_count, skipped_count

def main():
    print_header()
    
    total_filled = 0
    total_skipped = 0
    
    # 1. Quét thư mục Tác phẩm
    f, s = process_directory(WORKS_DIR, "data/tac-pham/")
    total_filled += f
    total_skipped += s
    
    # 2. Quét thư mục Tác giả
    f, s = process_directory(AUTHORS_DIR, "data/tac-gia/")
    total_filled += f
    total_skipped += s

    # Báo cáo tổng kết
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  TỔNG KẾT:{C_RESET}")
    print(f"  - Tổng số file được chèn nội dung mẫu: {C_GREEN}{total_filled}{C_RESET}")
    print(f"  - Tổng số file được giữ nguyên: {C_GRAY}{total_skipped}{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")
    
    if total_filled > 0:
        print(f"{C_GRAY}[GHI CHÚ]{C_RESET} Các file vừa được chèn mẫu sẽ hiển thị khung thông báo 'Đang hiệu đính' trên App.")
        print(f"{C_GRAY}[GHI CHÚ]{C_RESET} Khi bạn tìm thấy dữ liệu thật cho tác phẩm đó, hãy dùng file Master để ghi đè.\n")

if __name__ == "__main__":
    main()
