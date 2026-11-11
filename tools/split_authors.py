#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: SPLIT AUTHORS (TÁCH & NỐI DỮ LIỆU TÁC GIẢ)
=====================================================================
Tác giả: Văn Đạo
Mô tả chi tiết:
1. Đọc file gốc 'data/data-tac-gia-master.json'.
2. Kiểm tra tính hợp lệ của dữ liệu (phải là mảng JSON, có trường 'id').
3. Tách từng tác giả thành các file JSON nhỏ lẻ trong thư mục 'data/tac-gia/'.
4. Tự động trích xuất thông tin (bỏ phần content) để nối vào file danh mục 'data/data-tac-gia.json'.
5. TỰ ĐỘNG SẮP XẾP danh mục theo thứ tự Bảng chữ cái (A-Z).
6. TỰ ĐỘNG XÓA file Master sau khi xử lý thành công để dọn dẹp dự án.
7. Tự động bỏ qua êm đẹp nếu không có file Master (tránh báo lỗi đỏ trên GitHub).
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
# Lấy thư mục chứa file script hiện tại (tools/), sau đó lùi ra 1 cấp để lấy thư mục gốc dự án
ROOT_DIR = Path(__file__).parent.parent
os.chdir(ROOT_DIR) # Di chuyển con trỏ làm việc về thư mục gốc để các đường dẫn tương đối hoạt động chuẩn

# Định nghĩa các đường dẫn file và thư mục
MASTER_FILE = ROOT_DIR / "data" / "data-tac-gia-master.json"
DATA_DIR = ROOT_DIR / "data"
AUTHORS_DIR = DATA_DIR / "tac-gia" # Thư mục chứa hàng trăm file JSON chi tiết
INDEX_FILE = DATA_DIR / "data-tac-gia.json" # File danh mục chính

def print_header():
    """In tiêu đề khởi chạy ra màn hình Terminal"""
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - TÁCH, NỐI & DỌN DẸP DỮ LIỆU TÁC GIẢ{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def process_authors():
    """Hàm xử lý chính: Đọc Master -> Tách file -> Nối Index -> Sắp xếp -> Xóa Master"""
    
    # -----------------------------------------------------------------
    # BƯỚC 0: KIỂM TRA AN TOÀN (Nếu không có file Master thì bỏ qua êm đẹp)
    # -----------------------------------------------------------------
    if not MASTER_FILE.exists():
        print(f"{C_GRAY}[BỎ QUA]{C_RESET} Không tìm thấy file 'data/data-tac-gia-master.json'.")
        print(f"  (Bình thường, bạn không cần làm gì cả. Bot kết thúc an toàn).")
        return
        
    # -----------------------------------------------------------------
    # BƯỚC 1: ĐỌC DỮ LIỆU TỪ FILE MASTER
    # -----------------------------------------------------------------
    print(f"{C_GOLD}> BƯỚC 1: ĐỌC DỮ LIỆU TỪ MASTER{C_RESET}")
    print(f"  {C_GRAY}[ĐANG ĐỌC]{C_RESET} File: {MASTER_FILE.name}")
    
    try:
        with open(MASTER_FILE, 'r', encoding='utf-8') as f:
            new_authors = json.load(f)
    except json.JSONDecodeError as e:
        print(f"{C_RED}[LỖI]{C_RESET} File JSON Master bị lỗi cú pháp (Thiếu dấu phẩy/ngoặc kép?): {e}")
        sys.exit(1) # Dừng bot nếu file JSON hỏng
        
    # Kiểm tra xem dữ liệu có phải là một mảng (list) không
    if not isinstance(new_authors, list):
        print(f"{C_RED}[LỖI]{C_RESET} Cấu trúc file Master không hợp lệ (Phải là một mảng []).")
        sys.exit(1)
        
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã đọc {len(new_authors)} tác giả từ file Master.\n")

    # -----------------------------------------------------------------
    # BƯỚC 2: TÁCH FILE VÀ NỐI DANH MỤC
    # -----------------------------------------------------------------
    print(f"{C_GOLD}> BƯỚC 2: TÁCH FILE VÀ NỐI DANH MỤC{C_RESET}")
    
    # Tạo thư mục 'data/tac-gia' nếu chưa tồn tại
    if not AUTHORS_DIR.exists():
        AUTHORS_DIR.mkdir(parents=True, exist_ok=True)

    # Đọc file Index cũ (nếu có) để chuẩn bị nối thêm vào
    if INDEX_FILE.exists():
        try:
            with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                index_data = json.load(f)
        except Exception:
            index_data = [] # Nếu file Index cũ bị lỗi, tạo mảng rỗng mới
    else:
        index_data = []

    # Chuyển Index cũ thành Dictionary (dạng {id: data}) để dễ tìm và cập nhật
    # Việc này giúp chống trùng lặp: Nếu ID đã có, nó sẽ ghi đè thay vì thêm mới
    index_dict = {item['id']: item for item in index_data if 'id' in item}
    
    new_count = 0
    error_count = 0
    
    # Duyệt qua từng tác giả trong file Master
    for item in new_authors:
        author_id = item.get('id')
        
        # Nếu tác giả không có 'id', bỏ qua và báo cảnh báo
        if not author_id:
            title = item.get('title', 'Không rõ tên')
            print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Bỏ qua tác giả không có 'id': {title}")
            error_count += 1
            continue
            
        try:
            # 2.1. Tạo/Ghi đè file chi tiết (VD: data/tac-gia/tac-gia-nguyen-du.json)
            detail_file_path = AUTHORS_DIR / f"{author_id}.json"
            with open(detail_file_path, 'w', encoding='utf-8') as f:
                # ensure_ascii=False để giữ nguyên tiếng Việt, indent=2 để dễ đọc
                json.dump(item, f, ensure_ascii=False, indent=2)
                
            # 2.2. Tạo dữ liệu cho Index: Loại bỏ trường 'content' để nhẹ file
            index_item = {k: v for k, v in item.items() if k != 'content'}
            
            # 2.3. Nối vào danh sách (Tự động ghi đè nếu ID đã tồn tại)
            index_dict[author_id] = index_item
            new_count += 1
            
        except Exception as e:
            print(f"  {C_RED}[LỖI]{C_RESET} Không thể tách tác giả '{author_id}': {e}")
            error_count += 1

    # -----------------------------------------------------------------
    # BƯỚC 3: SẮP XẾP VÀ GHI LẠI FILE INDEX
    # -----------------------------------------------------------------
    # CẢI TIẾN TỐI ƯU: Sắp xếp danh sách theo Tiêu đề (title) từ A-Z
    # Dùng .get('title', '') để tránh lỗi nếu một tác giả bị thiếu trường title
    final_index = sorted(
        list(index_dict.values()), 
        key=lambda x: x.get('title', '').lower()
    )
    
    try:
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_index, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể tạo file danh mục: {e}")
        sys.exit(1)

    # -----------------------------------------------------------------
    # BƯỚC 4: IN BÁO CÁO VÀ TỰ ĐỘNG XÓA FILE MASTER
    # -----------------------------------------------------------------
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã xử lý: {new_count} tác giả mới/cập nhật.")
    if error_count > 0:
        print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Có {error_count} tác giả bị lỗi (Đã bỏ qua).")
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Tổng số tác giả trên hệ thống: {len(final_index)} (Đã sắp xếp A-Z)\n")

    print(f"{C_GOLD}> BƯỚC 4: DỌN DẸP DỰ ÁN{C_RESET}")
    try:
        # Nếu file Master tồn tại thì tiến hành xóa
        if MASTER_FILE.exists():
            MASTER_FILE.unlink()
            print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã tự động xóa file '{MASTER_FILE.name}' để dọn dẹp Repository.")
            print(f"  {C_GRAY}[GHI CHÚ]{C_RESET} Bạn có thể tạo lại file Master mới nếu muốn thêm tác giả khác.")
    except Exception as e:
        print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Không thể xóa file Master (có thể do quyền hệ thống): {e}")

def main():
    """Hàm khởi chạy chính của toàn bộ script"""
    print_header()
    process_authors()
    
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GREEN}  HOÀN TẤT!{C_RESET} Hệ thống đã được cập nhật.")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

# Điểm khởi chạy của Python
if __name__ == "__main__":
    main()
