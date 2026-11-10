#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: SPLIT WORKS (TÁCH & NỐI DỮ LIỆU)
=====================================================================
Tác giả: Văn Đạo
Mô tả: 
- Đọc file 'data-tac-pham-master.json'.
- Tách thành các file nhỏ trong thư mục 'data/tac-pham/'.
- TỰ ĐỘNG NỐI (MERGE) vào file danh mục 'data-tac-pham-index.json' 
  mà không làm mất các tác phẩm cũ.
- Tự động bỏ qua êm đẹp nếu không có file Master (tránh lỗi đỏ).
=====================================================================
"""

import os
import sys
import json
from pathlib import Path

# =====================================================================
# I. CẤU HÌNH MÀU SẮC TERMINAL
# =====================================================================
C_TEAL = "\033[96m"
C_GOLD = "\033[93m"
C_GRAY = "\033[90m"
C_GREEN = "\033[92m"
C_RED = "\033[91m"
C_RESET = "\033[0m"

# =====================================================================
# II. CẤU HÌNH ĐƯỜNG DẪN
# =====================================================================
# Đảm bảo script luôn chạy ở thư mục gốc của dự án
ROOT_DIR = Path(__file__).parent.parent
os.chdir(ROOT_DIR)

MASTER_FILE = ROOT_DIR / "data" / "data-tac-pham-master.json"
DATA_DIR = ROOT_DIR / "data"
WORKS_DIR = DATA_DIR / "tac-pham"
INDEX_FILE = DATA_DIR / "data-tac-pham-index.json"

def print_header():
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - TÁCH & NỐI DỮ LIỆU TÁC PHẨM{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def process_works():
    # KIỂM TRA AN TOÀN: Nếu không có file Master thì bỏ qua êm đẹp (Không báo lỗi)
    if not MASTER_FILE.exists():
        print(f"{C_GRAY}[BỎ QUA]{C_RESET} Không tìm thấy file 'data/data-tac-pham-master.json'.")
        print(f"  (Bình thường, bạn không cần làm gì cả. Bot kết thúc an toàn).")
        return
        
    print(f"{C_GOLD}> BƯỚC 1: ĐỌC DỮ LIỆU TỪ MASTER{C_RESET}")
    print(f"  {C_GRAY}[ĐANG ĐỌC]{C_RESET} File: {MASTER_FILE.name}")
    
    try:
        with open(MASTER_FILE, 'r', encoding='utf-8') as f:
            new_works = json.load(f)
    except json.JSONDecodeError as e:
        print(f"{C_RED}[LỖI]{C_RESET} File JSON Master bị lỗi cú pháp: {e}")
        sys.exit(1)
        
    if not isinstance(new_works, list):
        print(f"{C_RED}[LỖI]{C_RESET} Cấu trúc file Master không hợp lệ (Phải là một mảng []).")
        sys.exit(1)
        
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã đọc {len(new_works)} tác phẩm từ file Master.\n")

    print(f"{C_GOLD}> BƯỚC 2: TÁCH FILE VÀ NỐI DANH MỤC{C_RESET}")
    
    if not WORKS_DIR.exists():
        WORKS_DIR.mkdir(parents=True, exist_ok=True)

    # Đọc Index cũ (nếu có) để nối thêm vào
    if INDEX_FILE.exists():
        try:
            with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                index_data = json.load(f)
        except Exception:
            index_data = []
    else:
        index_data = []

    # Chuyển Index cũ thành Dictionary để dễ tìm và cập nhật (tránh trùng lặp)
    index_dict = {item['id']: item for item in index_data if 'id' in item}
    
    new_count = 0
    error_count = 0
    
    for item in new_works:
        work_id = item.get('id')
        
        if not work_id:
            title = item.get('title', 'Không rõ tên')
            print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Bỏ qua tác phẩm không có 'id': {title}")
            error_count += 1
            continue
            
        try:
            # 1. Tạo/ghi đè file chi tiết
            detail_file_path = WORKS_DIR / f"{work_id}.json"
            with open(detail_file_path, 'w', encoding='utf-8') as f:
                json.dump(item, f, ensure_ascii=False, indent=2)
                
            # 2. Tạo dữ liệu cho Index (bỏ content cho nhẹ)
            index_item = {k: v for k, v in item.items() if k != 'content'}
            
            # 3. Nối vào danh sách (Tự động ghi đè nếu ID đã tồn tại)
            index_dict[work_id] = index_item
            new_count += 1
            
        except Exception as e:
            print(f"  {C_RED}[LỖI]{C_RESET} Không thể tách tác phẩm '{work_id}': {e}")
            error_count += 1

    # 4. Ghi lại toàn bộ Index
    final_index = list(index_dict.values())
    try:
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_index, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể tạo file danh mục: {e}")
        sys.exit(1)

    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã xử lý: {new_count} tác phẩm mới/cập nhật.")
    if error_count > 0:
        print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Có {error_count} tác phẩm bị lỗi (Đã bỏ qua).")
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Tổng số tác phẩm trên hệ thống: {len(final_index)}\n")

    print(f"{C_GOLD}> BƯỚC 3: BÁO CÁO{C_RESET}")
    print(f"  {C_GRAY}[GHI CHÚ]{C_RESET} Các tác phẩm cũ trong thư mục 'data/tac-pham/' vẫn được giữ nguyên vẹn.")
    print(f"  {C_GRAY}[GHI CHÚ]{C_RESET} Bạn có thể yên tâm xóa file Master sau khi bot chạy xong.")

def main():
    print_header()
    process_works()
    
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GREEN}  HOÀN TẤT!{C_RESET} Hệ thống đã được cập nhật.")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

if __name__ == "__main__":
    main()
