#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: SPLIT WORKS (NHÀ LUYỆN ĐAN TÁC PHẨM)
=====================================================================
Tác giả: Văn Đạo

TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
1. Tách hạt giống thành rừng cây: File Master chứa toàn bộ nội dung nặng. 
   Script này tách nó thành hàng ngàn file JSON nhỏ trong 'data/tac-pham/'. 
   Nhờ vậy, App chỉ tải đúng bài cần đọc, không tải cả kho dữ liệu.
2. Ghi chép sổ bộ (Index): Tự động trích xuất thông tin (bỏ phần content) 
   để nối vào 'data-tac-pham.json' (danh mục). Danh mục luôn nhẹ và sắp xếp A-Z.
3. Dọn dẹp chiến trường: Tự động xóa file Master sau khi xử lý xong, 
   để lại một kho lưu trữ gọn gàng, thanh tịnh.
4. Kỷ luật thép: Kiểm tra cú pháp JSON, kiểm tra trùng lặp ID, và bỏ qua 
   êm đẹp nếu không có file Master (tránh báo lỗi đỏ trên GitHub Actions).
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
# Lấy thư mục chứa file script hiện tại, sau đó lùi ra 1 cấp (thư mục gốc dự án)
ROOT_DIR = Path(__file__).parent.parent

# Di chuyển con trỏ làm việc về thư mục gốc để các đường dẫn tương đối hoạt động chuẩn
os.chdir(ROOT_DIR)

# Định nghĩa các đường dẫn file và thư mục
MASTER_FILE = ROOT_DIR / "data" / "data-tac-pham-master.json"
DATA_DIR = ROOT_DIR / "data"
WORKS_DIR = DATA_DIR / "tac-pham"
INDEX_FILE = DATA_DIR / "data-tac-pham.json" # File danh mục chính

def print_header():
    """In tiêu đề khởi chạy ra màn hình Terminal"""
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - TÁCH, NỐI & DỌN DẸP DỮ LIỆU TÁC PHẨM{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def process_works():
    """Hàm xử lý chính: Đọc Master -> Tách file -> Nối Index -> Sắp xếp -> Xóa Master"""
    
    # -----------------------------------------------------------------
    # BƯỚC 0: KIỂM TRA AN TOÀN (Nếu không có file Master thì bỏ qua êm đẹp)
    # -----------------------------------------------------------------
    if not MASTER_FILE.exists():
        print(f"{C_GRAY}[BỎ QUA]{C_RESET} Không tìm thấy file 'data/data-tac-pham-master.json'.")
        print(f"  (Bình thường, bạn không cần làm gì cả. Bot kết thúc an toàn).")
        return
        
    # -----------------------------------------------------------------
    # BƯỚC 1: ĐỌC DỮ LIỆU TỪ FILE MASTER
    # -----------------------------------------------------------------
    print(f"{C_GOLD}> BƯỚC 1: ĐỌC DỮ LIỆU TỪ MASTER{C_RESET}")
    print(f"  {C_GRAY}[ĐANG ĐỌC]{C_RESET} File: {MASTER_FILE.name}")
    
    try:
        with open(MASTER_FILE, 'r', encoding='utf-8') as f:
            new_works = json.load(f)
    except json.JSONDecodeError as e:
        print(f"{C_RED}[LỖI]{C_RESET} File JSON Master bị lỗi cú pháp: {e}")
        sys.exit(1) # Dừng bot nếu file JSON hỏng
        
    # Kiểm tra xem dữ liệu có phải là một mảng (list) không
    if not isinstance(new_works, list):
        print(f"{C_RED}[LỖI]{C_RESET} Cấu trúc file Master không hợp lệ (Phải là một mảng []).")
        sys.exit(1)
        
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã đọc {len(new_works)} tác phẩm từ file Master.\n")

    # -----------------------------------------------------------------
    # BƯỚC 1.5: KIỂM TRA TRÙNG LẶP ID TRONG MASTER (LÁ CHẮN AN TOÀN)
    # -----------------------------------------------------------------
    seen_ids = set()
    duplicates = []
    for item in new_works:
        wid = item.get('id')
        if wid:
            if wid in seen_ids:
                duplicates.append(wid)
            seen_ids.add(wid)
    
    if duplicates:
        print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Phát hiện ID trùng trong file Master: {duplicates}")
        print(f"  {C_GRAY}[GHI CHÚ]{C_RESET} Item sau sẽ ghi đè item trước. Hãy kiểm tra lại file Master.\n")
    # -----------------------------------------------------------------

    # -----------------------------------------------------------------
    # BƯỚC 2: TÁCH FILE VÀ NỐI DANH MỤC
    # -----------------------------------------------------------------
    print(f"{C_GOLD}> BƯỚC 2: TÁCH FILE VÀ NỐI DANH MỤC{C_RESET}")
    
    # Tạo thư mục 'data/tac-pham' nếu chưa tồn tại
    if not WORKS_DIR.exists():
        WORKS_DIR.mkdir(parents=True, exist_ok=True)

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
    
    # Duyệt qua từng tác phẩm trong file Master
    for item in new_works:
        work_id = item.get('id')
        
        # Nếu tác phẩm không có 'id', bỏ qua và báo cảnh báo
        if not work_id:
            title = item.get('title', 'Không rõ tên')
            print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Bỏ qua tác phẩm không có 'id': {title}")
            error_count += 1
            continue
            
        try:
            # 2.1. Tạo/Ghi đè file chi tiết (VD: data/tac-pham/truyen-kieu.json)
            detail_file_path = WORKS_DIR / f"{work_id}.json"
            with open(detail_file_path, 'w', encoding='utf-8') as f:
                # ensure_ascii=False để giữ nguyên tiếng Việt, indent=2 để dễ đọc
                json.dump(item, f, ensure_ascii=False, indent=2)
                
            # 2.2. Tạo dữ liệu cho Index: Loại bỏ trường 'content' để nhẹ file
            index_item = {k: v for k, v in item.items() if k != 'content'}
            
            # 2.3. Nối vào danh sách (Tự động ghi đè nếu ID đã tồn tại)
            index_dict[work_id] = index_item
            new_count += 1
            
        except Exception as e:
            print(f"  {C_RED}[LỖI]{C_RESET} Không thể tách tác phẩm '{work_id}': {e}")
            error_count += 1

    # -----------------------------------------------------------------
    # BƯỚC 3: SẮP XẾP VÀ GHI LẠI FILE INDEX
    # -----------------------------------------------------------------
    # CẢI TIẾN TỐI ƯU: Sắp xếp danh sách theo Tiêu đề (title) từ A-Z
    # Dùng .get('title', '') để tránh lỗi nếu một tác phẩm bị thiếu trường title
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
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã xử lý: {new_count} tác phẩm mới/cập nhật.")
    if error_count > 0:
        print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Có {error_count} tác phẩm bị lỗi (Đã bỏ qua).")
    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Tổng số tác phẩm trên hệ thống: {len(final_index)} (Đã sắp xếp A-Z)\n")

    print(f"{C_GOLD}> BƯỚC 4: DỌN DẸP DỰ ÁN{C_RESET}")
    try:
        # Nếu file Master tồn tại thì tiến hành xóa
        if MASTER_FILE.exists():
            MASTER_FILE.unlink()
            print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã tự động xóa file '{MASTER_FILE.name}' để dọn dẹp Repository.")
            print(f"  {C_GRAY}[GHI CHÚ]{C_RESET} Bạn có thể tạo lại file Master mới nếu muốn thêm tác phẩm khác.")
    except Exception as e:
        print(f"  {C_RED}[CẢNH BÁO]{C_RESET} Không thể xóa file Master (có thể do quyền hệ thống): {e}")

def main():
    """Hàm khởi chạy chính của toàn bộ script"""
    print_header()
    process_works()
    
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GREEN}  HOÀN TẤT!{C_RESET} Hệ thống đã được cập nhật.")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

# Điểm khởi chạy của Python
if __name__ == "__main__":
    main()
