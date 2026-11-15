#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: NORMALIZE ALL (CHUẨN HÓA HÀNG LOẠT)
Tên file: tools/normalize_all.py
Version: 1.0.0
=====================================================================
Tác giả: Văn Đạo

TRIẾT LÝ THIẾT KẾ:
1. Tự động sửa lỗi CẤU TRÚC (không sửa nội dung):
   - ID không khớp tên file → sửa cho khớp.
   - Thiếu 'title' → tự sinh từ tên file.
   - Thiếu 'content' → chèn khung "Đang hiệu đính".
   - Trường mảng bị string → chuyển thành mảng.
2. An toàn tuyệt đối:
   - Chỉ đọc và sửa file có lỗi cấu trúc.
   - Không sửa nội dung đã có.
   - Báo cáo chi tiết từng file.
3. Không chấm điểm (theo Quy tắc vàng 12).

CÁCH DÙNG:
   python tools/normalize_all.py

   Hoặc chạy trên GitHub Actions:
   Actions → Normalize Data → Run workflow.
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
WORKS_DIR = DATA_DIR / "tac-pham"
AUTHORS_DIR = DATA_DIR / "tac-gia"

# Khung nội dung mặc định (Bạch Ngọc style)
DEFAULT_CONTENT = """
<div style="text-align: center; padding: 40px 20px; opacity: 0.85; background: rgba(139, 184, 168, 0.05); border-radius: 12px; border: 1px dashed var(--border-color);">
    <p style="font-family: var(--font-body); font-size: 1.1rem; font-style: italic; color: var(--accent-text); margin-bottom: 10px;">
        Văn bản này đang được Văn Đạo hiệu đính và biên soạn nội dung chi tiết.
    </p>
    <p style="font-family: var(--font-body); font-size: 0.9rem; color: var(--text-muted);">
        Vui lòng quay lại sau hoặc sử dụng tính năng "Thi Pháp" để phân tích tác phẩm.
    </p>
</div>
""".strip()


def print_header():
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - CHUẨN HÓA HÀNG LOẠT FILE JSON{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")


def normalize_file(filepath, group):
    """
    Chuẩn hóa 1 file JSON.
    Trả về: (changed: bool, error: str|None)
    """
    # Đọc file
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return False, f"JSON hỏng: {e}"
    except Exception as e:
        return False, f"Lỗi đọc: {e}"

    if not isinstance(data, dict):
        return False, "Nội dung không phải object JSON"

    changed = False
    fixes = []  # Ghi nhận các sửa đổi

    # -----------------------------------------------------------------
    # 1. SỬA 'id' CHO KHỚP TÊN FILE
    # -----------------------------------------------------------------
    expected_id = filepath.stem  # Tên file không có .json
    if 'id' not in data:
        data['id'] = expected_id
        changed = True
        fixes.append(f"thêm id='{expected_id}'")
    elif data['id'] != expected_id:
        fixes.append(f"sửa id '{data['id']}' → '{expected_id}'")
        data['id'] = expected_id
        changed = True

    # -----------------------------------------------------------------
    # 2. ĐẢM BẢO CÓ 'title'
    # -----------------------------------------------------------------
    if 'title' not in data or not str(data.get('title', '')).strip():
        # Tự sinh title từ id
        clean_name = expected_id.replace('tac-gia-', '').replace('-', ' ').title()
        if group == 'ky-tai':
            data['title'] = f"Chân Dung Tác Giả: {clean_name}"
        else:
            data['title'] = clean_name
        changed = True
        fixes.append(f"thêm title='{data['title']}'")

    # -----------------------------------------------------------------
    # 3. ĐẢM BẢO CÓ 'content'
    # -----------------------------------------------------------------
    if 'content' not in data or not str(data.get('content', '')).strip():
        data['content'] = DEFAULT_CONTENT
        changed = True
        fixes.append("thêm content khung")

    # -----------------------------------------------------------------
    # 4. CHUẨN HÓA CÁC TRƯỜNG MẢNG
    # -----------------------------------------------------------------
    array_fields = ['the_loai', 'cam_xuc', 'tags', 'style', 'related']
    for field in array_fields:
        if field in data:
            if not isinstance(data[field], list):
                # Nếu là string → chuyển thành mảng
                if data[field]:
                    data[field] = [data[field]]
                    fixes.append(f"chuyển '{field}' thành mảng")
                else:
                    data[field] = []
                changed = True
            # Lọc bỏ phần tử rỗng
            cleaned = [x for x in data[field] if x and str(x).strip()]
            if len(cleaned) != len(data[field]):
                data[field] = cleaned
                changed = True
                fixes.append(f"lọc rỗng '{field}'")

    # -----------------------------------------------------------------
    # 5. LƯU FILE NẾU CÓ THAY ĐỔI
    # -----------------------------------------------------------------
    if changed:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True, ", ".join(fixes)
        except Exception as e:
            return False, f"Lỗi ghi: {e}"

    return False, None


def process_directory(directory, group, label):
    """Xử lý 1 thư mục (tác phẩm hoặc tác giả)."""
    if not directory.exists():
        print(f"{C_GRAY}[BỎ QUA] Thư mục '{label}' không tồn tại.{C_RESET}\n")
        return 0, 0, 0

    files = list(directory.glob("*.json"))
    if not files:
        print(f"{C_GRAY}[BỎ QUA] Không có file JSON nào trong '{label}'.{C_RESET}\n")
        return 0, 0, 0

    print(f"{C_GOLD}> KIỂM TRA {len(files)} FILE TRONG '{label}'...{C_RESET}")

    fixed_count = 0
    error_count = 0
    ok_count = 0

    for filepath in files:
        changed, info = normalize_file(filepath, group)

        if info is None:
            # Không có gì thay đổi, không có lỗi
            ok_count += 1
        elif changed:
            # Đã sửa thành công
            print(f"  {C_GREEN}[SỬA]{C_RESET} {filepath.name}: {info}")
            fixed_count += 1
        else:
            # Có lỗi
            print(f"  {C_RED}[LỖI]{C_RESET} {filepath.name}: {info}")
            error_count += 1

    print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã sửa: {fixed_count} file.")
    print(f"  {C_GRAY}[GIỮ NGUYÊN]{C_RESET} Không cần sửa: {ok_count} file.")
    if error_count > 0:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể sửa: {error_count} file.\n")
    else:
        print()

    return fixed_count, ok_count, error_count


def main():
    print_header()

    total_fixed = 0
    total_ok = 0
    total_errors = 0

    # Xử lý tác phẩm
    f, ok, err = process_directory(WORKS_DIR, 'tinh-hoa', "data/tac-pham/")
    total_fixed += f
    total_ok += ok
    total_errors += err

    # Xử lý tác giả
    f, ok, err = process_directory(AUTHORS_DIR, 'ky-tai', "data/tac-gia/")
    total_fixed += f
    total_ok += ok
    total_errors += err

    # Tổng kết
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  TỔNG KẾT:{C_RESET}")
    print(f"  - File đã sửa: {C_GREEN}{total_fixed}{C_RESET}")
    print(f"  - File không cần sửa: {C_GRAY}{total_ok}{C_RESET}")
    if total_errors > 0:
        print(f"  - File lỗi không sửa được: {C_RED}{total_errors}{C_RESET}")
        print(f"\n{C_RED}[CHÚ Ý]{C_RESET} Có {total_errors} file bị lỗi. Mở từng file kiểm tra bằng tay.")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

    if total_errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
