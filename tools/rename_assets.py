#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: RENAME & MOVE ASSETS (VERSION 2.0)
=====================================================================
Tác giả: Văn Đạo
Mô tả: 
- Tự động di chuyển ảnh vào thư mục 'assets/'.
- Đổi tên file chuẩn hóa (bỏ tiền tố 'anh-', dùng gạch ngang).
- Tự động quét và cập nhật đường dẫn trong toàn bộ code.
- Tuân thủ quy tắc: 100% Text, KHÔNG dùng Emoji/Icon Unicode.
=====================================================================
"""

import os
import sys
import shutil
from pathlib import Path

# =====================================================================
# I. CẤU HÌNH MÀU SẮC TERMINAL (ANSI COLORS - KHÔNG DÙNG ICON)
# =====================================================================
C_TEAL = "\033[96m"
C_GOLD = "\033[93m"
C_GRAY = "\033[90m"
C_GREEN = "\033[92m"
C_RED = "\033[91m"
C_RESET = "\033[0m"

# =====================================================================
# II. CẤU HÌNH ĐƯỜNG DẪN VÀ DANH SÁCH FILE
# =====================================================================
# Đảm bảo script luôn chạy ở thư mục gốc của dự án (ngang hàng với index.html)
ROOT_DIR = Path(__file__).parent.parent
os.chdir(ROOT_DIR)

ASSETS_DIR = ROOT_DIR / "assets"

# Từ điển ánh xạ: Tên cũ (hoặc tên sai) -> Tên mới chuẩn
# Xử lý triệt để cả trường hợp có dấu gạch dưới, gạch ngang, hoặc thiếu thư mục
FILE_MAPPING = {
    # Bản có dấu gạch dưới (cũ)
    "anh-nen_sang.jpg": "assets/nen-sang.jpg",
    "anh-khung_sang.jpg": "assets/khung-sang.jpg",
    "anh-logo_trang.png": "assets/logo-trang.png",
    
    # Bản có dấu gạch ngang (đã đổi trước đó)
    "anh-nen-sang.jpg": "assets/nen-sang.jpg",
    "anh-khung-sang.jpg": "assets/khung-sang.jpg",
    "anh-logo-trang.png": "assets/logo-trang.png",
    
    # Bản đã nằm trong assets nhưng còn tiền tố 'anh-'
    "assets/anh-nen-sang.jpg": "assets/nen-sang.jpg",
    "assets/anh-khung-sang.jpg": "assets/khung-sang.jpg",
    "assets/anh-logo-trang.png": "assets/logo-trang.png",
    
    # Bản đã nằm trong assets nhưng còn dấu gạch dưới
    "assets/anh-nen_sang.jpg": "assets/nen-sang.jpg",
    "assets/anh-khung_sang.jpg": "assets/khung-sang.jpg",
    "assets/anh-logo_trang.png": "assets/logo-trang.png",
}

# Các file code cần quét để sửa đường dẫn
CODE_FILES_TO_FIX = [
    "index.html",
    "style.css",
    "script.js",
    "manifest.json",
    "sw.js"
]

# Các chuỗi cần tìm và thay thế trong code
# (Tìm tất cả các biến thể để đảm bảo không sót)
SEARCH_REPLACE_PAIRS = [
    ("anh-nen_sang.jpg", "assets/nen-sang.jpg"),
    ("anh-khung_sang.jpg", "assets/khung-sang.jpg"),
    ("anh-logo_trang.png", "assets/logo-trang.png"),
    ("anh-nen-sang.jpg", "assets/nen-sang.jpg"),
    ("anh-khung-sang.jpg", "assets/khung-sang.jpg"),
    ("anh-logo-trang.png", "assets/logo-trang.png"),
    # Đề phòng trường hợp code đã có chữ assets/ nhưng tên file còn sai
    ("assets/anh-nen_sang.jpg", "assets/nen-sang.jpg"),
    ("assets/anh-khung_sang.jpg", "assets/khung-sang.jpg"),
    ("assets/anh-logo_trang.png", "assets/logo-trang.png"),
]

def print_header():
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - CHUẨN HÓA TÀI NGUYÊN HÌNH ẢNH{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def create_assets_folder():
    if not ASSETS_DIR.exists():
        try:
            ASSETS_DIR.mkdir(parents=True, exist_ok=True)
            print(f"{C_GREEN}[TẠO MỚI]{C_RESET} Đã tạo thư mục 'assets/'")
        except Exception as e:
            print(f"{C_RED}[LỖI]{C_RESET} Không thể tạo thư mục 'assets/': {e}")
            sys.exit(1)

def move_and_rename_files():
    print(f"{C_GOLD}> BƯỚC 1: DI CHUYỂN VÀ ĐỔI TÊN FILE ẢNH{C_RESET}")
    moved_count = 0
    skip_count = 0
    
    for old_path_str, new_path_str in FILE_MAPPING.items():
        old_path = ROOT_DIR / old_path_str
        new_path = ROOT_DIR / new_path_str
        
        if old_path.exists() and old_path.is_file():
            try:
                # Nếu file đích đã tồn tại, ghi đè
                if new_path.exists():
                    new_path.unlink()
                    
                shutil.move(str(old_path), str(new_path))
                print(f"  {C_GREEN}[DI CHUYỂN]{C_RESET} {C_GRAY}{old_path_str}{C_RESET} -> {C_GREEN}{new_path_str}{C_RESET}")
                moved_count += 1
            except Exception as e:
                print(f"  {C_RED}[LỖI]{C_RESET} Không thể di chuyển {old_path_str}: {e}")
        else:
            skip_count += 1
            
    if moved_count == 0:
        print(f"  {C_GRAY}[TRỐNG]{C_RESET} Không tìm thấy file ảnh nào cần di chuyển (Có thể đã chuẩn hóa trước đó).")
    print()

def update_code_references():
    print(f"{C_GOLD}> BƯỚC 2: CẬP NHẬT ĐƯỜNG DẪN TRONG CODE{C_RESET}")
    updated_files = 0
    
    for file_name in CODE_FILES_TO_FIX:
        file_path = ROOT_DIR / file_name
        if not file_path.exists():
            print(f"  {C_GRAY}[BỎ QUA]{C_RESET} Không tìm thấy file: {file_name}")
            continue
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            original_content = content
            
            # Thực hiện thay thế
            for search_str, replace_str in SEARCH_REPLACE_PAIRS:
                content = content.replace(search_str, replace_str)
                
            # Nếu có sự thay đổi, ghi lại vào file
            if content != original_content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"  {C_GREEN}[CẬP NHẬT]{C_RESET} Đã sửa đường dẫn trong: {file_name}")
                updated_files += 1
            else:
                print(f"  {C_GRAY}[GIỮ NGUYÊN]{C_RESET} Không có đường dẫn cũ trong: {file_name}")
                
        except Exception as e:
            print(f"  {C_RED}[LỖI]{C_RESET} Không thể xử lý file {file_name}: {e}")
            
    print()

def main():
    print_header()
    create_assets_folder()
    move_and_rename_files()
    update_code_references()
    
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GREEN}  HOÀN TẤT!{C_RESET} Hệ thống tài nguyên đã được chuẩn hóa 100%.")
    print(f"{C_GRAY}  Bước tiếp theo: Hãy tăng Version trong 'sw.js' và tải lại App.{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

if __name__ == "__main__":
    main()
