#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: VALIDATE DATA (NGƯỜI GÁC CỔNG DỮ LIỆU)
=====================================================================
Tác giả: Văn Đạo

TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
1. Người Gác Cổng (The Gatekeeper): Script này KHÔNG có quyền ghi (write).
   Nó chỉ đọc (read) và kiểm tra. Mục đích là ngăn chặn dữ liệu lỗi 
   (JSON hỏng, thiếu ID, đứt gãy liên kết) trước khi chúng được deploy.
2. Sự toàn vẹn của mạng lưới: Kiểm tra chéo giữa Index (Danh mục) và 
   Detail (Chi tiết). Đảm bảo mọi ID trong danh mục đều có file tương ứng 
   và ngược lại. Không có "bóng ma" nào bị bỏ sót.
3. Trung thực tuyệt đối: Báo cáo rõ ràng LỖI (Error - làm sập bot) và 
   CẢNH BÁO (Warning - không làm sập nhưng cần chú ý). 
4. Tự động hóa: Nếu dữ liệu hoàn hảo, nó lặng lẽ kết thúc. Nếu có lỗi, 
   nó báo ĐỎ (Exit code 1) để GitHub Actions chặn đứng quá trình deploy.
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
C_RED = "\033[91m"    # Màu đỏ (Lỗi)
C_RESET = "\033[0m"   # Reset màu

# =====================================================================
# II. CẤU HÌNH ĐƯỜNG DẪN
# =====================================================================
ROOT_DIR = Path(__file__).parent.parent
os.chdir(ROOT_DIR)

DATA_DIR = ROOT_DIR / "data"
WORKS_DIR = DATA_DIR / "tac-pham"
AUTHORS_DIR = DATA_DIR / "tac-gia"
WORKS_INDEX = DATA_DIR / "data-tac-pham.json"
AUTHORS_INDEX = DATA_DIR / "data-tac-gia.json"

def print_header():
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - KIỂM TRA TOÀN VẸN DỮ LIỆU{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def load_json_safe(path):
    """Đọc file JSON một cách an toàn, trả về (data, error)"""
    if not path.exists():
        return None, "File không tồn tại"
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f), None
    except json.JSONDecodeError as e:
        return None, f"Lỗi cú pháp JSON: {e}"
    except Exception as e:
        return None, f"Lỗi không xác định: {e}"

def validate_index_file(index_path, name, required_fields):
    """Kiểm tra tính toàn vẹn của file Danh mục (Index)"""
    errors = []
    warnings = []
    
    data, err = load_json_safe(index_path)
    if err:
        errors.append(f"[{name}] File Index lỗi: {err}")
        return errors, warnings, []

    if not isinstance(data, list):
        errors.append(f"[{name}] File Index không phải là mảng (Array).")
        return errors, warnings, []

    seen_ids = set()
    for item in data:
        item_id = item.get('id')
        
        # 1. Kiểm tra trường bắt buộc (ID, Title)
        for field in required_fields:
            if not item.get(field):
                if field == 'id':
                    errors.append(f"[{name}] Có item thiếu 'id' (Title: {item.get('title', 'Không rõ')})")
                else:
                    warnings.append(f"[{name}] Item '{item_id}' thiếu trường '{field}'")
        
        # 2. Kiểm tra trùng lặp ID trong Index
        if item_id:
            if item_id in seen_ids:
                errors.append(f"[{name}] Phát hiện ID trùng lặp trong Index: '{item_id}'")
            seen_ids.add(item_id)
            
    return errors, warnings, list(seen_ids)

def validate_detail_folder(folder_path, index_ids, name):
    """Kiểm tra các file JSON chi tiết và đối chiếu với Index"""
    errors = []
    warnings = []
    
    if not folder_path.exists():
        warnings.append(f"[{name}] Thư mục chi tiết không tồn tại: {folder_path.name}")
        return errors, warnings

    files = list(folder_path.glob("*.json"))
    if not files:
        warnings.append(f"[{name}] Không có file JSON nào trong thư mục chi tiết.")
        return errors, warnings

    detail_ids = set()
    
    for f in files:
        # 1. Kiểm tra cú pháp file
        data, err = load_json_safe(f)
        if err:
            errors.append(f"[{name}] File '{f.name}' lỗi cú pháp: {err}")
            continue

        # 2. Kiểm tra sự khớp nhau giữa Tên file và ID bên trong
        file_id = f.stem
        data_id = data.get('id')
        
        if not data_id:
            errors.append(f"[{name}] File '{f.name}' thiếu trường 'id' bên trong.")
        elif data_id != file_id:
            errors.append(f"[{name}] Tên file '{f.name}' không khớp với 'id' bên trong ('{data_id}').")
            
        detail_ids.add(file_id)

        # 3. Kiểm tra xem file chi tiết này có nằm trong Index không
        if index_ids and file_id not in index_ids:
            warnings.append(f"[{name}] File '{f.name}' có tồn tại nhưng không có trong Index (Mồ côi).")

    # 4. Đối chiếu ngược lại: ID trong Index có file chi tiết không?
    if index_ids:
        for idx_id in index_ids:
            if idx_id not in detail_ids:
                warnings.append(f"[{name}] ID '{idx_id}' có trong Index nhưng thiếu file JSON chi tiết (Đứt gãy liên kết).")

    return errors, warnings

def main():
    print_header()
    
    all_errors = []
    all_warnings = []

    # -----------------------------------------------------------------
    # PHẦN 1: KIỂM TRA TÁC PHẨM
    # -----------------------------------------------------------------
    print(f"{C_GOLD}> KIỂM TRA DỮ LIỆU TÁC PHẨM...{C_RESET}")
    works_errors, works_warnings, works_ids = validate_index_file(
        WORKS_INDEX, "Tác Phẩm", required_fields=['id', 'title']
    )
    detail_errors, detail_warnings = validate_detail_folder(
        WORKS_DIR, works_ids, "Tác Phẩm"
    )
    all_errors.extend(works_errors + detail_errors)
    all_warnings.extend(works_warnings + detail_warnings)

    # -----------------------------------------------------------------
    # PHẦN 2: KIỂM TRA TÁC GIẢ
    # -----------------------------------------------------------------
    print(f"{C_GOLD}> KIỂM TRA DỮ LIỆU TÁC GIẢ...{C_RESET}")
    authors_errors, authors_warnings, authors_ids = validate_index_file(
        AUTHORS_INDEX, "Tác Giả", required_fields=['id', 'title']
    )
    detail_errors, detail_warnings = validate_detail_folder(
        AUTHORS_DIR, authors_ids, "Tác Giả"
    )
    all_errors.extend(authors_errors + detail_errors)
    all_warnings.extend(authors_warnings + detail_warnings)

    # -----------------------------------------------------------------
    # PHẦN 3: IN BÁO CÁO TỔNG KẾT
    # -----------------------------------------------------------------
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  BÁO CÁO TỔNG KẾT (AUDIT REPORT){C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")

    if not all_errors and not all_warnings:
        print(f"{C_GREEN}[HOÀN HẢO] Mạng lưới tri thức toàn vẹn 100%.{C_RESET}")
        print(f"  - Mọi file JSON đều hợp lệ.")
        print(f"  - Mọi Index và Detail đều khớp nhau.")
        print(f"  - Không có ID trùng lặp hay mồ côi.\n")
        sys.exit(0)

    if all_errors:
        print(f"{C_RED}[LỖI NGHIÊM TRỌNG] Có {len(all_errors)} lỗi cần sửa ngay:{C_RESET}")
        for err in all_errors:
            print(f"  {C_RED}x{C_RESET} {err}")
        print(f"\n{C_RED}DỮ LIỆU KHÔNG HỢP LỆ. BOT SẼ DỪNG LẠI.{C_RESET}\n")

    if all_warnings:
        print(f"{C_GOLD}[CẢNH BÁO] Có {len(all_warnings)} vấn đề nhỏ (Không chặn deploy):{C_RESET}")
        for warn in all_warnings:
            print(f"  {C_GOLD}!{C_RESET} {warn}")
        print(f"\n{C_GRAY}(Bạn nên xem lại các cảnh báo này để mạng lưới hoàn hảo hơn.){C_RESET}\n")

    # Nếu có lỗi nghiêm trọng, thoát với mã 1 để GitHub Actions báo đỏ
    if all_errors:
        sys.exit(1)
    
    # Nếu chỉ có cảnh báo, vẫn cho phép qua (exit 0)
    print(f"{C_GREEN}[CHẤP NHẬN] Dữ liệu có cảnh báo nhưng không có lỗi nghiêm trọng. Cho phép deploy.{C_RESET}\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
