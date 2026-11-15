#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VĂN ĐẠO - TOOL: NORMALIZE ALL (CHUẨN HÓA HÀNG LOẠT)
Tự động sửa các lỗi phổ biến trong file JSON tác phẩm và tác giả.
"""

import os
import json
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
DATA_DIR = ROOT_DIR / "data"
WORKS_DIR = DATA_DIR / "tac-pham"
AUTHORS_DIR = DATA_DIR / "tac-gia"

def normalize_file(filepath, group):
    """Chuẩn hóa 1 file JSON."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"  [LỖI JSON] {filepath.name}: {e}")
        return False
    except Exception as e:
        print(f"  [LỖI] {filepath.name}: {e}")
        return False

    changed = False

    # 1. Đảm bảo có 'id' khớp với tên file
    if 'id' not in data:
        data['id'] = filepath.stem
        changed = True
    elif data['id'] != filepath.stem:
        print(f"  [SỬA ID] {filepath.name}: '{data['id']}' → '{filepath.stem}'")
        data['id'] = filepath.stem
        changed = True

    # 2. Đảm bảo có 'title'
    if 'title' not in data:
        if group == 'ky-tai':
            data['title'] = f"Chân Dung Tác Giả: {filepath.stem.replace('tac-gia-', '').replace('-', ' ').title()}"
        else:
            data['title'] = filepath.stem.replace('-', ' ').title()
        changed = True

    # 3. Đảm bảo có 'content'
    if 'content' not in data:
        data['content'] = '<p style="text-align:center;padding:30px;font-style:italic;">Nội dung đang được hiệu đính.</p>'
        changed = True

    # 4. Đảm bảo các trường mảng là mảng
    for field in ['the_loai', 'cam_xuc', 'tags', 'style']:
        if field in data and not isinstance(data[field], list):
            data[field] = [data[field]] if data[field] else []
            changed = True

    # 5. Lưu nếu có thay đổi
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  [OK] Đã chuẩn hóa: {filepath.name}")
        return True

    return False

def main():
    print("\n=== CHUẨN HÓA TOÀN BỘ FILE JSON ===\n")

    total = 0
    if WORKS_DIR.exists():
        for f in WORKS_DIR.glob("*.json"):
            if normalize_file(f, 'tinh-hoa'):
                total += 1

    if AUTHORS_DIR.exists():
        for f in AUTHORS_DIR.glob("*.json"):
            if normalize_file(f, 'ky-tai'):
                total += 1

    print(f"\n=== HOÀN TẤT: Đã chuẩn hóa {total} file ===\n")

if __name__ == "__main__":
    main()
