#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import json
from pathlib import Path

C_TEAL = "\033[96m"
C_GOLD = "\033[93m"
C_GRAY = "\033[90m"
C_GREEN = "\033[92m"
C_RED = "\033[91m"
C_RESET = "\033[0m"

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

def load_json_safe(path):
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
        
        for field in required_fields:
            if not item.get(field):
                if field == 'id':
                    errors.append(f"[{name}] Có item thiếu 'id' (Title: {item.get('title', 'Không rõ')})")
                else:
                    warnings.append(f"[{name}] Item '{item_id}' thiếu trường '{field}'")
        
        if item_id:
            if item_id in seen_ids:
                errors.append(f"[{name}] Phát hiện ID trùng lặp trong Index: '{item_id}'")
            seen_ids.add(item_id)
            
    return errors, warnings, list(seen_ids)

def validate_detail_folder(folder_path, index_ids, name):
    errors = []
    warnings = []
    
    if not folder_path.exists():
        return errors, warnings

    files = list(folder_path.glob("*.json"))
    detail_ids = set()
    
    for f in files:
        data, err = load_json_safe(f)
        if err:
            errors.append(f"[{name}] File '{f.name}' lỗi cú pháp: {err}")
            continue

        file_id = f.stem
        data_id = data.get('id')
        
        if not data_id:
            errors.append(f"[{name}] File '{f.name}' thiếu trường 'id' bên trong.")
        elif data_id != file_id:
            errors.append(f"[{name}] Tên file '{f.name}' không khớp với 'id' bên trong ('{data_id}').")
            
        detail_ids.add(file_id)

        if index_ids and file_id not in index_ids:
            warnings.append(f"[{name}] File '{f.name}' có tồn tại nhưng không có trong Index (Mồ côi).")

    if index_ids:
        for idx_id in index_ids:
            if idx_id not in detail_ids:
                warnings.append(f"[{name}] ID '{idx_id}' có trong Index nhưng thiếu file JSON chi tiết (Đứt gãy liên kết).")

    return errors, warnings

def main():
    print_header()
    all_errors = []
    all_warnings = []

    # Tác phẩm
    w_errors, w_warnings, w_ids = validate_index_file(WORKS_INDEX, "Tác Phẩm", ['id', 'title'])
    d_errors, d_warnings = validate_detail_folder(WORKS_DIR, w_ids, "Tác Phẩm")
    all_errors.extend(w_errors + d_errors)
    all_warnings.extend(w_warnings + d_warnings)

    # Tác giả
    a_errors, a_warnings, a_ids = validate_index_file(AUTHORS_INDEX, "Tác Giả", ['id', 'title'])
    ad_errors, ad_warnings = validate_detail_folder(AUTHORS_DIR, a_ids, "Tác Giả")
    all_errors.extend(a_errors + ad_errors)
    # [ĐÃ SỬA LỖI CHÍNH TẢ Ở ĐÂY]
    all_warnings.extend(a_warnings + ad_warnings)

    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  BÁO CÁO TỔNG KẾT (AUDIT REPORT){C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")

    if not all_errors and not all_warnings:
        print(f"{C_GREEN}[HOÀN HẢO] Mạng lưới tri thức toàn vẹn 100%.{C_RESET}\n")
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

    if all_errors:
        sys.exit(1)
    
    print(f"{C_GREEN}[CHẤP NHẬN] Dữ liệu có cảnh báo nhưng không có lỗi nghiêm trọng. Cho phép deploy.{C_RESET}\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
