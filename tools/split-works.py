#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: SPLIT WORKS (TÁCH DỮ LIỆU TÁC PHẨM)
=====================================================================
Tác giả: Văn Đạo
Mô tả: 
- Đọc file 'data-tac-pham.json' gốc (chứa toàn bộ nội dung).
- Tách thành các file nhỏ trong thư mục 'data/tac-pham/'.
- Tạo file danh mục siêu nhẹ 'data-tac-pham-index.json'.
- Tự động dọn dẹp các file JSON cũ không còn tồn tại trong file gốc.
- Tuân thủ quy tắc: 100% Text, KHÔNG dùng Emoji/Icon Unicode.
=====================================================================
"""

import os
import sys
import json
from pathlib import Path

# =====================================================================
# I. CẤU HÌNH MÀU SẮC TERMINAL (ANSI COLORS)
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

# File gốc (có thể nằm ở thư mục gốc hoặc trong thư mục data/)
SOURCE_FILE_ROOT = ROOT_DIR / "data-tac-pham.json"
SOURCE_FILE_DATA = ROOT_DIR / "data" / "data-tac-pham.json"

DATA_DIR = ROOT_DIR / "data"
WORKS_DIR = DATA_DIR / "tac-pham"
INDEX_FILE = DATA_DIR / "data-tac-pham-index.json"

def print_header():
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - TÁCH DỮ LIỆU TÁC PHẨM{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def get_source_file():
    """Tìm file gốc data-tac-pham.json"""
    if SOURCE_FILE_ROOT.exists():
        return SOURCE_FILE_ROOT
    elif SOURCE_FILE_DATA.exists():
        return SOURCE_FILE_DATA
    else:
        return None

def prepare_directories():
    """Tạo thư mục nếu chưa có"""
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        print(f"  {C_GREEN}[TẠO MỚI]{C_RESET} Đã tạo thư mục 'data/'")
        
    if not WORKS_DIR.exists():
        WORKS_DIR.mkdir(parents=True, exist_ok=True)
        print(f"  {C_GREEN}[TẠO MỚI]{C_RESET} Đã tạo thư mục 'data/tac-pham/'")

def clean_old_files():
    """Xóa các file JSON cũ trong thư mục tac-pham để tránh rác"""
    if WORKS_DIR.exists():
        old_files = list(WORKS_DIR.glob("*.json"))
        if old_files:
            for f in old_files:
                f.unlink()
            print(f"  {C_GRAY}[DỌN DẸP]{C_RESET} Đã xóa {len(old_files)} file JSON cũ trong 'data/tac-pham/'")

def process_works():
    source_file = get_source_file()
    
    if not source_file:
        print(f"{C_RED}[LỖI]{C_RESET} Không tìm thấy file 'data-tac-pham.json' gốc.")
        print(f"  Vui lòng đặt file gốc ở thư mục chính hoặc trong thư mục 'data/'.")
        sys.exit(1)
        
    print(f"{C_GOLD}> BƯỚC 1: ĐỌC DỮ LIỆU GỐC{C_RESET}")
    print(f"  {C_GRAY}[ĐANG ĐỌC]{C_RESET} File: {source_file.name}")
    
    try:
        with open(source_file, 'r', encoding='utf-8') as f:
            works_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"{C_RED}[LỖI]{C_RESET} File JSON gốc bị lỗi cú pháp: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"{C_RED}[LỖI]{C_RESET} Không thể đọc file: {e}")
        sys.exit(1)
        
    if not isinstance(works_data, list):
        print(f"{C_RED}[LỖI]{C_RESET} Cấu trúc file gốc không hợp lệ (Phải là một mảng []).")
        sys.exit(1)
        
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã đọc {len(works_data)} tác phẩm từ file gốc.\n")

    print(f"{C_GOLD}> BƯỚC 2: TÁCH FILE VÀ TẠO DANH MỤC{C_RESET}")
    prepare_directories()
    clean_old_files()
    
    index_data = []
    success_count = 0
    error_count = 0
    
    for item in works_data:
        work_id = item.get('id')
        
        if not work_id:
            title = item.get('title', 'Không rõ tên')
            print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Bỏ qua tác phẩm không có 'id': {title}")
            error_count += 1
            continue
            
        try:
            # 1. Tạo file chi tiết (chứa toàn bộ nội dung)
            detail_file_path = WORKS_DIR / f"{work_id}.json"
            with open(detail_file_path, 'w', encoding='utf-8') as f:
                json.dump(item, f, ensure_ascii=False, indent=2)
                
            # 2. Tạo dữ liệu cho file danh mục (loại bỏ trường 'content' cho nhẹ)
            index_item = {k: v for k, v in item.items() if k != 'content'}
            index_data.append(index_item)
            
            success_count += 1
            
        except Exception as e:
            print(f"  {C_RED}[LỖI]{C_RESET} Không thể tách tác phẩm '{work_id}': {e}")
            error_count += 1

    # Ghi file danh mục index
    try:
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể tạo file danh mục: {e}")
        sys.exit(1)

    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã tách thành công: {success_count} file chi tiết.")
    if error_count > 0:
        print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Có {error_count} tác phẩm bị lỗi hoặc thiếu ID (Đã bỏ qua).")
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã tạo file danh mục: {INDEX_FILE.name}\n")

    print(f"{C_GOLD}> BƯỚC 3: BÁO CÁO DUNG LƯỢNG{C_RESET}")
    # Tính dung lượng
    try:
        size_source = source_file.stat().st_size / 1024
        size_index = INDEX_FILE.stat().st_size / 1024
        
        print(f"  {C_GRAY}[DỮ LIỆU]{C_RESET} Dung lượng file gốc cũ: {C_RED}{size_source:.1f} KB{C_RESET}")
        print(f"  {C_GRAY}[DỮ LIỆU]{C_RESET} Dung lượng file Index mới: {C_GREEN}{size_index:.1f} KB{C_RESET}")
        
        saved_percent = ((size_source - size_index) / size_source) * 100 if size_source > 0 else 0
        print(f"  {C_GREEN}[TỐI ƯU]{C_RESET} Tiết kiệm được {C_GOLD}{saved_percent:.1f}%{C_RESET} dung lượng tải trang ban đầu!")
    except Exception:
        pass

def main():
    print_header()
    process_works()
    
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GREEN}  HOÀN TẤT!{C_RESET} Dữ liệu đã sẵn sàng cho App.")
    print(f"  {C_GRAY}Bước tiếp theo:{C_RESET}")
    print(f"  1. Xóa file gốc 'data-tac-pham.json' (nếu muốn).")
    print(f"  2. Tăng Version trong 'sw.js' và tải lại App.")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

if __name__ == "__main__":
    main()
