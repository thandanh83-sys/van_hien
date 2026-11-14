#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: MINIFY DATA (MÁY NÉN DỮ LIỆU)
=====================================================================
Tác giả: Văn Đạo
Version: 1.0.0

TRIẾT LÝ THIẾT KẾ:
1. Tiết kiệm băng thông: JSON thông thường chứa rất nhiều khoảng trắng 
   và dấu xuống dòng (indent=2). Việc xóa chúng giúp giảm 40-50% dung lượng.
2. Tự động hóa: Quét toàn bộ thư mục data/, bao gồm cả thư mục con.
3. An toàn: Chỉ ghi đè nếu file tồn tại và parse JSON thành công.
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
# II. ĐƯỜNG DẪN
# =====================================================================
ROOT_DIR = Path(__file__).parent.parent.resolve()
os.chdir(ROOT_DIR)

DATA_DIR = ROOT_DIR / "data"

def print_header():
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - TỐI ƯU HÓA DUNG LƯỢNG JSON{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def minify_file(filepath):
    """Đọc, nén và ghi đè file JSON."""
    try:
        # 1. Đọc dữ liệu gốc
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 2. Ghi đè với separators=(',', ':') để xóa mọi khoảng trắng thừa
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        
        return True
    except json.JSONDecodeError as e:
        print(f"  {C_RED}[LỖI JSON]{C_RESET} File {filepath.name}: {e}")
        return False
    except Exception as e:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể xử lý {filepath.name}: {e}")
        return False

def main():
    print_header()
    
    if not DATA_DIR.exists():
        print(f"{C_RED}[LỖI]{C_RESET} Thư mục 'data/' không tồn tại.")
        sys.exit(1)

    # Quét TẤT CẢ file .json trong thư mục data/ (bao gồm cả thư mục con)
    json_files = list(DATA_DIR.rglob("*.json"))
    
    if not json_files:
        print(f"{C_GOLD}[CẢNH BÁO]{C_RESET} Không tìm thấy file JSON nào trong thư mục data/.")
        sys.exit(0)

    print(f"{C_GOLD}> Đang nén {len(json_files)} file JSON...{C_RESET}")
    
    success_count = 0
    for file_path in json_files:
        # Bỏ qua các file manifest vì bot update_manifests.py đã xử lý
        # (hoặc nén luôn cũng không sao, nhưng thường manifest cần dễ đọc)
        if "manifests" in str(file_path):
            continue
            
        if minify_file(file_path):
            success_count += 1

    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GREEN}[THÀNH CÔNG]{C_RESET} Đã nén xong {success_count}/{len(json_files)} file JSON.")
    print(f"{C_GRAY}[GHI CHÚ]{C_RESET} Các file này sẽ giúp trang web tải nhanh hơn đáng kể.")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

if __name__ == "__main__":
    main()
