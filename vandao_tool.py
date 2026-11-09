#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL QUẢN LÝ DỮ LIỆU VĂN HIẾN (ULTIMATE EDITION)
=====================================================================
Tác giả: Văn Đạo
Mô tả: Công cụ tự động chuẩn hóa ID (slug), merge dữ liệu mới, 
       kiểm tra lỗi schema và tạo bản sao lưu (backup) an toàn.

Tính năng nổi bật:
  - 100% SVG-like symbols (Không dùng emoji, hiển thị sắc nét mọi Terminal).
  - Tự động tạo ID từ Tiêu đề tiếng Việt (VD: "Truyện Kiều" -> "truyen-kieu").
  - Tự động phát hiện và xử lý ID trùng lặp (thêm hậu tố -2, -3...).
  - Tự động backup file cũ trước khi ghi đè.
  - Thống kê dữ liệu bằng biểu đồ cột (Bar chart) trực quan.

Cách sử dụng:
  1. Chỉ chuẩn hóa file hiện tại: 
     python vandao_tool.py
  2. Merge thêm file mới (data-heritage-new.json):
     python vandao_tool.py --new data-heritage-new.json
=====================================================================
"""

import json
import re
import unicodedata
import shutil
import sys
import argparse
from datetime import datetime
from pathlib import Path

# ─── CẤU HÌNH HỆ THỐNG ────────────────────────────────────────────────────
DEFAULT_DATA_FILE = "data-heritage.json"
DEFAULT_NEW_FILE  = "data-heritage-new.json"
BACKUP_DIR        = "backups"

# Các trường bắt buộc phải có trong mỗi tác phẩm
REQUIRED_FIELDS = ["title", "author", "genre", "era", "script", "desc", "category"]

# ─── BỘ KÝ TỰ SVG-LIKE (Unicode Typographic - Không dùng Emoji) ───────────
SYM = {
    "ok":     "✓",   # U+2713 CHECK MARK
    "err":    "✗",   # U+2717 BALLOT X
    "warn":   "△",   # U+25B3 WHITE UP-POINTING TRIANGLE
    "dir":    "▸",   # U+25B8 BLACK RIGHT-POINTING SMALL TRIANGLE
    "bak":    "▣",   # U+25A3 WHITE SQUARE CONTAINING BLACK SMALL SQUARE
    "merge":  "⇄",   # U+21C4 RIGHTWARDS ARROW OVER LEFTWARDS ARROW
    "stat":   "▤",   # U+25A4 SQUARE WITH HORIZONTAL FILL
    "stop":   "⊗",   # U+2297 CIRCLED TIMES
    "bullet": "▸",   # U+25B8
    "bar":    "▮",   # U+25AE BLACK VERTICAL RECTANGLE
    "hl":     "═",   # U+2550 BOX DRAWINGS DOUBLE HORIZONTAL
    "vl":     "║",   # U+2551 BOX DRAWINGS DOUBLE VERTICAL
    "tl":     "╔",   # U+2554 BOX DRAWINGS DOUBLE DOWN AND RIGHT
    "tr":     "╗",   # U+2557 BOX DRAWINGS DOUBLE DOWN AND LEFT
    "bl":     "╚",   # U+255A BOX DRAWINGS DOUBLE UP AND RIGHT
    "br":     "╝",   # U+255D BOX DRAWINGS DOUBLE UP AND LEFT
}

# ─── CÁC HÀM TIỆN ÍCH GIAO DIỆN ───────────────────────────────────────────

def banner(title: str, width: int = 55) -> str:
    """Vẽ khung tiêu đề SVG-like bằng box-drawing characters."""
    min_w = len(title) + 4
    if width < min_w:
        width = min_w
    inner  = width - 2
    pad    = inner - len(title) - 2
    left   = pad // 2
    right  = pad - left
    top    = SYM["tl"] + SYM["hl"] * inner + SYM["tr"]
    middle = SYM["vl"] + " " * left + title + " " * right + SYM["vl"]
    bottom = SYM["bl"] + SYM["hl"] * inner + SYM["br"]
    return f"{top}\n{middle}\n{bottom}"

# ─── XỬ LÝ SLUG VÀ ID TIẾNG VIỆT ──────────────────────────────────────────

SPECIAL_MAP = {
    "đ": "d", "Đ": "D", "ơ": "o", "Ơ": "O", "ư": "u", "Ư": "U",
    "ă": "a", "Ă": "A", "â": "a", "Â": "A", "ê": "e", "Ê": "E", 
    "ô": "o", "Ô": "O"
}

def remove_diacritics(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để tạo slug."""
    for k, v in SPECIAL_MAP.items():
        text = text.replace(k, v)
    # Chuẩn hóa NFD để tách dấu ra khỏi ký tự gốc, sau đó xóa các dấu đó
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")

def slugify(text: str) -> str:
    """Chuyển tiêu đề thành ID dạng slug (VD: 'Truyện Kiều' -> 'truyen-kieu')."""
    text = remove_diacritics(text).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return re.sub(r"-+", "-", text)

def ensure_unique(base: str, used: set) -> str:
    """Đảm bảo ID không bị trùng lặp. Nếu trùng, thêm -2, -3..."""
    if base not in used:
        return base
    n = 2
    while f"{base}-{n}" in used:
        n += 1
    return f"{base}-{n}"

# ─── ĐỌC / GHI FILE VÀ BACKUP ─────────────────────────────────────────────

def load_json(path: str) -> list:
    """Đọc file JSON an toàn, trả về mảng rỗng nếu file không tồn tại."""
    p = Path(path)
    if not p.exists():
        return []
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                print(f"  {SYM['err']}  Lỗi: File {path} phải là một mảng [...]")
                sys.exit(1)
            return data
    except json.JSONDecodeError as e:
        print(f"  {SYM['err']}  Lỗi cú pháp JSON trong {path}: {e}")
        sys.exit(1)

def save_json(path: str, data: list) -> None:
    """Ghi file JSON và tự động tạo backup nếu file đã tồn tại."""
    p = Path(path)
    if p.exists():
        Path(BACKUP_DIR).mkdir(exist_ok=True)
        ts  = datetime.now().strftime("%Y%m%d_%H%M%S")
        bak = Path(BACKUP_DIR) / f"{p.stem}_{ts}{p.suffix}"
        shutil.copy2(p, bak)
        print(f"  {SYM['bak']}  Đã tạo Backup: {bak}")
    
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"  {SYM['ok']}  Đã lưu: {path} ({len(data)} mục)")

# ─── LOGIC XỬ LÝ DỮ LIỆU ──────────────────────────────────────────────────

def normalize_ids(entries: list) -> list:
    """Quét qua tất cả dữ liệu, tự động thêm trường 'id' nếu bị thiếu."""
    used_ids = set()
    result = []
    for e in entries:
        e = dict(e) # Tạo bản sao để không ảnh hưởng mảng gốc
        if "id" not in e or not e["id"]:
            e["id"] = ensure_unique(slugify(e.get("title", "untitled")), used_ids)
        elif e["id"] in used_ids:
            e["id"] = ensure_unique(e["id"], used_ids)
        
        used_ids.add(e["id"])
        result.append(e)
    return result

def validate_schema(entries: list) -> list:
    """Kiểm tra xem có mục nào bị thiếu trường bắt buộc không."""
    errors = []
    for i, e in enumerate(entries):
        for field in REQUIRED_FIELDS:
            if not e.get(field):
                errors.append(f"Mục #{i} (ID: {e.get('id', '?')}) thiếu trường '{field}'")
    return errors

def print_statistics(entries: list) -> None:
    """In biểu đồ thống kê phân bố thể loại."""
    cats = {}
    for e in entries:
        cat = e.get("category", "khong-ro")
        cats[cat] = cats.get(cat, 0) + 1

    print(f"\n  {SYM['stat']}  Thống kê theo Category:")
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        # Vẽ biểu đồ cột (tối đa 25 ký tự ▮)
        bar = SYM["bar"] * min(count // 2, 25)
        print(f"     {cat:15s} {SYM['vl']} {count:3d}  {bar}")
    print(f"     {'TỔNG CỘNG':15s} {SYM['vl']} {len(entries):3d}")

# ─── HÀM CHẠY CHÍNH ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="VĂN ĐẠO - Tool chuẩn hóa và merge dữ liệu.")
    parser.add_argument("--data", default=DEFAULT_DATA_FILE, help="Đường dẫn file JSON gốc")
    parser.add_argument("--new", default=None, help="Đường dẫn file JSON chứa dữ liệu mới cần merge")
    args = parser.parse_args()

    print(banner("VĂN ĐẠO - TOOL DỮ LIỆU VĂN HIẾN"))
    print()

    # 1. Đọc file gốc
    print(f"  {SYM['dir']}  Đang đọc file gốc: {args.data}")
    existing_data = load_json(args.data)
    print(f"     -> Tìm thấy {len(existing_data)} mục.")
    
    # 2. Chuẩn hóa ID cho file gốc (đề phòng có mục cũ chưa có ID)
    existing_data = normalize_ids(existing_data)

    # 3. Nếu có file mới, tiến hành merge
    if args.new:
        print(f"\n  {SYM['dir']}  Đang đọc file mới: {args.new}")
        new_data = load_json(args.new)
        
        if new_data:
            print(f"     -> Tìm thấy {len(new_data)} mục mới.")
            new_data = normalize_ids(new_data)
            
            # Đảm bảo ID của file mới không trùng với file cũ
            used_ids = {e["id"] for e in existing_data}
            for e in new_data:
                if e["id"] in used_ids:
                    e["id"] = ensure_unique(e["id"], used_ids)
                used_ids.add(e["id"])
            
            existing_data.extend(new_data)
            print(f"  {SYM['merge']}  Đã merge thành công. Tổng cộng: {len(existing_data)} mục.")
        else:
            print(f"  {SYM['warn']}  File mới rỗng hoặc không tồn tại. Bỏ qua bước merge.")

    # 4. Kiểm tra lỗi (Validate)
    print(f"\n  {SYM['dir']}  Đang kiểm tra tính toàn vẹn dữ liệu...")
    errors = validate_schema(existing_data)
    if errors:
        print(f"  {SYM['err']}  Phát hiện {len(errors)} lỗi schema:")
        for err in errors[:10]: # Chỉ in 10 lỗi đầu tiên để đỡ rối
            print(f"     {SYM['bullet']} {err}")
        if len(errors) > 10:
            print(f"     ... và {len(errors) - 10} lỗi khác.")
    else:
        print(f"  {SYM['ok']}  Tất cả dữ liệu đều hợp lệ. Schema OK.")

    # 5. In thống kê
    print_statistics(existing_data)

    # 6. Ghi file
    print()
    save_json(args.data, existing_data)
    
    print(f"\n{SYM['ok']}  HOÀN TẤT!\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n  {SYM['stop']}  Đã hủy bởi người dùng.")
        sys.exit(1)