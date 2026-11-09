#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VĂN ĐẠO - Công cụ chuẩn hóa ID và merge dữ liệu Văn Hiến
Phiên bản SVG-ified: Thay thế TOÀN BỘ emoji bằng ký tự hình học Unicode
                    (sắc nét, đồng bộ, không phụ thuộc font emoji hệ điều hành)

Ký hiệu sử dụng:
  ▸   Thư mục / file           ▣   Lưu trữ / backup
  ✓   Thành công                ✗   Lỗi
  △   Cảnh báo                  ⇄   Merge
  ▤   Thống kê                  ⊗   Dừng / hủy
  ◈   Thông tin                 ═║╔╗╚╝  Khung tiêu đề SVG-like
  ▮   Bar chart (thống kê)

Cách dùng:
  1. Đặt file này cùng thư mục với data-heritage.json
  2. Muốn thêm dữ liệu: tạo file data-heritage-new.json (cùng cấu trúc mảng)
  3. Chạy: python vandao_tool.py
"""
import json, re, unicodedata, shutil, sys
from datetime import datetime
from pathlib import Path

# ─── CẤU HÌNH ─────────────────────────────────────────────────────────────
DATA_FILE   = "data-heritage.json"
NEW_FILE    = "data-heritage-new.json"
BACKUP_DIR  = "backups"
REQUIRED    = ["title", "author", "genre", "era", "script", "desc", "category"]

# ─── BỘ KÝ TỰ SVG-LIKE (Unicode typographic — không phải emoji) ──────────
# Tất cả đều là ký tự monochrome, render sắc nét trên mọi terminal
SYM = {
    "ok":     "✓",   # U+2713 CHECK MARK
    "err":    "✗",   # U+2717 BALLOT X
    "warn":   "△",   # U+25B3 WHITE UP-POINTING TRIANGLE
    "dir":    "▸",   # U+25B8 BLACK RIGHT-POINTING SMALL TRIANGLE
    "bak":    "▣",   # U+25A3 WHITE SQUARE CONTAINING BLACK SMALL SQUARE
    "merge":  "⇄",   # U+21C4 RIGHTWARDS ARROW OVER LEFTWARDS ARROW
    "stat":   "▤",   # U+25A4 SQUARE WITH HORIZONTAL FILL
    "stop":   "⊗",   # U+2297 CIRCLED TIMES
    "info":   "◈",   # U+25C8 WHITE DIAMOND CONTAINING BLACK SMALL DIAMOND
    "bullet": "▸",   # U+25B8
    "bar":    "▮",   # U+25AE BLACK VERTICAL RECTANGLE
    "hl":     "═",   # U+2550 BOX DRAWINGS DOUBLE HORIZONTAL
    "vl":     "║",   # U+2551 BOX DRAWINGS DOUBLE VERTICAL
    "tl":     "╔",   # U+2554 BOX DRAWINGS DOUBLE DOWN AND RIGHT
    "tr":     "╗",   # U+2557 BOX DRAWINGS DOUBLE DOWN AND LEFT
    "bl":     "╚",   # U+255A BOX DRAWINGS DOUBLE UP AND RIGHT
    "br":     "╝",   # U+255D BOX DRAWINGS DOUBLE UP AND LEFT
}

# ─── HÀM VẼ KHUNG SVG-LIKE ────────────────────────────────────────────────
def banner(title, width=50):
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

# ─── XỬ LÝ SLUG / ID ──────────────────────────────────────────────────────
SPECIAL_MAP = {"đ":"d","Đ":"D","ơ":"o","Ơ":"O","ư":"u","Ư":"U",
               "ă":"a","Ă":"A","â":"a","Â":"A","ê":"e","Ê":"E","ô":"o","Ô":"O"}

def remove_diacritics(t):
    for k, v in SPECIAL_MAP.items():
        t = t.replace(k, v)
    t = unicodedata.normalize("NFD", t)
    return "".join(c for c in t if unicodedata.category(c) != "Mn")

def slugify(t):
    t = remove_diacritics(t).lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return re.sub(r"-+", "-", t)

def ensure_unique(base, used):
    if base not in used: return base
    n = 2
    while f"{base}-{n}" in used: n += 1
    return f"{base}-{n}"

# ─── ĐỌC / GHI FILE ───────────────────────────────────────────────────────
def load(path):
    p = Path(path)
    if not p.exists():
        print(f"  {SYM['warn']}  Không có: {path}")
        return []
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def save(path, data):
    p = Path(path)
    if p.exists():
        Path(BACKUP_DIR).mkdir(exist_ok=True)
        ts  = datetime.now().strftime("%Y%m%d_%H%M%S")
        bak = Path(BACKUP_DIR) / f"{p.stem}_{ts}{p.suffix}"
        shutil.copy2(p, bak)
        print(f"  {SYM['bak']}  Backup: {bak}")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"  {SYM['ok']}  Ghi: {path} ({len(data)} mục)")

# ─── LOGIC CHÍNH ──────────────────────────────────────────────────────────
def normalize_ids(entries):
    used, out = set(), []
    for e in entries:
        e = dict(e)
        if "id" not in e or not e["id"]:
            e["id"] = ensure_unique(slugify(e.get("title", "untitled")), used)
        elif e["id"] in used:
            e["id"] = ensure_unique(e["id"], used)
        used.add(e["id"])
        out.append(e)
    return out

def validate(entries):
    errs = []
    for i, e in enumerate(entries):
        for f in REQUIRED:
            if not e.get(f):
                errs.append(f"#{i} '{e.get('title','?')}': thiếu '{f}'")
    return errs

def main():
    print(banner("VĂN ĐẠO - Tool chuẩn hóa dữ liệu"))
    print()

    existing = load(DATA_FILE)
    print(f"  {SYM['dir']}  File hiện tại: {len(existing)} mục")
    existing = normalize_ids(existing)

    new = load(NEW_FILE)
    if new:
        print(f"  {SYM['dir']}  File mới: {len(new)} mục")
        new = normalize_ids(new)
        used = {e["id"] for e in existing}
        for e in new:
            if e["id"] in used:
                e["id"] = ensure_unique(e["id"], used)
            used.add(e["id"])
        existing += new
        print(f"  {SYM['merge']}  Đã merge: tổng {len(existing)} mục")

    errs = validate(existing)
    if errs:
        print(f"\n  {SYM['err']}  {len(errs)} lỗi schema:")
        for e in errs[:10]:
            print(f"     {SYM['bullet']} {e}")
    else:
        print(f"  {SYM['ok']}  Schema OK")

    cats = {}
    for e in existing:
        c = e.get("category", "?")
        cats[c] = cats.get(c, 0) + 1

    print(f"\n  {SYM['stat']}  Thống kê theo category:")
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        bar = SYM["bar"] * min(n // 3, 20)
        print(f"     {c:15s} {SYM['vl']} {n:3d}  {bar}")
    print(f"     {'TỔNG':15s} {SYM['vl']} {len(existing):3d}")
    print()

    save(DATA_FILE, existing)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n  {SYM['stop']}  Hủy")
        sys.exit(1)