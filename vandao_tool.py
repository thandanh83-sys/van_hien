#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - DATA TOOL CLI (ULTIMATE EDITION)
=====================================================================
Tác giả: Văn Đạo
Mô tả: Công cụ dòng lệnh (CLI) quản lý, kiểm tra và thống kê dữ liệu
       cho hệ thống VĂN ĐẠO. Hoạt động độc lập với Engine phân tích.

Chức năng chính:
1. Stats    : Thống kê số lượng mục từ trong 4 file JSON.
2. Validate : Kiểm tra lỗi cấu trúc, thiếu trường, hoặc trùng ID.
3. Search   : Tìm kiếm từ khóa xuyên suốt 4 file dữ liệu.
4. Add      : Thêm nhanh một mục từ mới vào file JSON.

Cách chạy:
    python vandao_tool.py stats
    python vandao_tool.py validate
    python vandao_tool.py search --keyword "Nguyễn Du"
    python vandao_tool.py add --type works
=====================================================================
"""

import argparse
import json
import os
import sys
from pathlib import Path
from collections import Counter

# =====================================================================
# I. CẤU HÌNH HỆ THỐNG VÀ ĐƯỜNG DẪN
# =====================================================================
BASE_DIR = Path(__file__).parent
FILES = {
    "theory": BASE_DIR / "data-theory.json",
    "encyclopedia": BASE_DIR / "data-encyclopedia.json",
    "works": BASE_DIR / "data-works.json",
    "quotes": BASE_DIR / "data-quotes.json"
}

# Mã màu ANSI cho Terminal (Không dùng Emoji, chỉ dùng màu chữ)
C_TEAL = "\033[96m"
C_GOLD = "\033[93m"
C_GRAY = "\033[90m"
C_GREEN = "\033[92m"
C_RED = "\033[91m"
C_RESET = "\033[0m"

# =====================================================================
# II. CÁC HÀM TIỆN ÍCH (UTILITIES)
# =====================================================================
def load_json(filepath: Path) -> list:
    """Đọc file JSON và trả về list. Trả về list rỗng nếu lỗi."""
    if not filepath.exists():
        print(f"{C_RED}[LỖI]{C_RESET} Không tìm thấy file: {filepath.name}")
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"{C_RED}[LỖI]{C_RESET} File {filepath.name} bị lỗi cú pháp JSON: {e}")
        return []
    except Exception as e:
        print(f"{C_RED}[LỖI]{C_RESET} Không thể đọc {filepath.name}: {e}")
        return []

def save_json(filepath: Path, data: list) -> bool:
    """Ghi dữ liệu ra file JSON với định dạng đẹp (indent=4)."""
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"{C_RED}[LỖI]{C_RESET} Không thể ghi file {filepath.name}: {e}")
        return False

# =====================================================================
# III. CÁC MODULE CHỨC NĂNG CHÍNH
# =====================================================================

def cmd_stats():
    """Thống kê số lượng mục từ trong 4 file."""
    print(f"\n{C_TEAL}======================================================{C_RESET}")
    print(f"{C_GOLD}  THỐNG KÊ DỮ LIỆU VĂN ĐẠO{C_RESET}")
    print(f"{C_TEAL}======================================================{C_RESET}\n")

    total_items = 0
    for key, path in FILES.items():
        data = load_json(path)
        count = len(data)
        total_items += count
        
        # Đếm số lượng theo từng loại cụ thể (nếu có)
        extra_info = ""
        if key == "works":
            categories = Counter(item.get("loai_hinh", "Không rõ") for item in data)
            top_cat = ", ".join([f"{k} ({v})" for k, v in categories.most_common(3)])
            extra_info = f" | Phân bố: {top_cat}..."
        elif key == "encyclopedia":
            extra_info = " | Hồ sơ tác giả"
        elif key == "theory":
            extra_info = " | Quyển lý thuyết"
        elif key == "quotes":
            authors = Counter(item.get("author", "Không rõ") for item in data)
            top_auth = ", ".join([f"{k} ({v})" for k, v in authors.most_common(2)])
            extra_info = f" | Tác giả nổi bật: {top_auth}"

        print(f"  {C_GOLD}{path.name:<28}{C_RESET}: {C_GREEN}{count:>3} mục{C_RESET}{extra_info}")

    print(f"\n{C_TEAL}------------------------------------------------------{C_RESET}")
    print(f"  TỔNG CỘNG: {C_GREEN}{total_items}{C_RESET} mục từ.")
    print(f"{C_TEAL}======================================================{C_RESET}\n")


def cmd_validate():
    """Kiểm tra tính toàn vẹn của dữ liệu."""
    print(f"\n{C_TEAL}======================================================{C_RESET}")
    print(f"{C_GOLD}  KIỂM TRA TÍNH TOÀN VẸN DỮ LIỆU{C_RESET}")
    print(f"{C_TEAL}======================================================{C_RESET}\n")

    has_error = False
    
    # 1. Kiểm tra file Works (Tác phẩm)
    works = load_json(FILES["works"])
    seen_ids = set()
    for i, item in enumerate(works):
        item_id = item.get("id")
        title = item.get("title", "Không tên")
        
        # Kiểm tra trường bắt buộc
        required_fields = ["id", "title", "author", "loai_hinh", "the_loai", "desc"]
        missing = [f for f in required_fields if f not in item]
        if missing:
            print(f"  {C_RED}[LỖI]{C_RESET} Tác phẩm '{title}' thiếu trường: {', '.join(missing)}")
            has_error = True
            
        # Kiểm tra trùng ID
        if item_id:
            if item_id in seen_ids:
                print(f"  {C_RED}[LỖI]{C_RESET} Trùng ID '{item_id}' tại tác phẩm '{title}'")
                has_error = True
            seen_ids.add(item_id)

    # 2. Kiểm tra file Theory (Lý thuyết)
    theory = load_json(FILES["theory"])
    for item in theory:
        if "id" not in item or "title" not in item or "content" not in item:
            print(f"  {C_RED}[LỖI]{C_RESET} Quyển lý thuyết '{item.get('title', 'Không tên')}' thiếu trường id/title/content.")
            has_error = True

    # 3. Kiểm tra file Quotes (Danh ngôn)
    quotes = load_json(FILES["quotes"])
    for item in quotes:
        if "text" not in item or "author" not in item:
            print(f"  {C_RED}[LỖI]{C_RESET} Danh ngôn thiếu trường 'text' hoặc 'author'.")
            has_error = True

    if not has_error:
        print(f"  {C_GREEN}[OK]{C_RESET} Tất cả dữ liệu đều hợp lệ. Không phát hiện lỗi cấu trúc.")
    
    print(f"\n{C_TEAL}======================================================{C_RESET}\n")


def cmd_search(keyword: str):
    """Tìm kiếm từ khóa trong tất cả các file."""
    print(f"\n{C_TEAL}======================================================{C_RESET}")
    print(f"{C_GOLD}  TÌM KIẾM TỪ KHÓA: '{keyword}'{C_RESET}")
    print(f"{C_TEAL}======================================================{C_RESET}\n")

    kw_lower = keyword.lower()
    found_count = 0

    # Tìm trong Tác phẩm
    works = load_json(FILES["works"])
    for item in works:
        if kw_lower in item.get("title", "").lower() or kw_lower in item.get("author", "").lower() or kw_lower in item.get("desc", "").lower():
            print(f"  {C_GREEN}[TÁC PHẨM]{C_RESET} {item.get('title')} - {item.get('author')}")
            print(f"    {C_GRAY}ID: {item.get('id')}{C_RESET}")
            found_count += 1

    # Tìm trong Lý thuyết
    theory = load_json(FILES["theory"])
    for item in theory:
        if kw_lower in item.get("title", "").lower() or kw_lower in item.get("content", "").lower():
            print(f"  {C_GREEN}[LÝ THUYẾT]{C_RESET} {item.get('title')}")
            found_count += 1

    # Tìm trong Danh ngôn
    quotes = load_json(FILES["quotes"])
    for item in quotes:
        if kw_lower in item.get("text", "").lower() or kw_lower in item.get("author", "").lower():
            print(f"  {C_GREEN}[DANH NGÔN]{C_RESET} \"{item.get('text')[:60]}...\" - {item.get('author')}")
            found_count += 1

    print(f"\n{C_TEAL}------------------------------------------------------{C_RESET}")
    print(f"  Tìm thấy {C_GREEN}{found_count}{C_RESET} kết quả phù hợp.")
    print(f"{C_TEAL}======================================================{C_RESET}\n")


def cmd_add(data_type: str):
    """Thêm một mục từ mới thông qua giao diện dòng lệnh."""
    if data_type not in FILES:
        print(f"{C_RED}[LỖI]{C_RESET} Loại dữ liệu không hợp lệ. Chọn: theory, encyclopedia, works, quotes")
        return

    print(f"\n{C_TEAL}======================================================{C_RESET}")
    print(f"{C_GOLD}  THÊM MỚI VÀO: {FILES[data_type].name}{C_RESET}")
    print(f"{C_TEAL}======================================================{C_RESET}\n")

    new_item = {}

    if data_type == "works":
        new_item["id"] = input("  Nhập ID (vd: truyen-kieu): ").strip()
        new_item["title"] = input("  Nhập Tên tác phẩm: ").strip()
        new_item["author"] = input("  Nhập Tác giả: ").strip()
        print("  Chọn Loại hình: 1. van-hoc-dan-gian, 2. thi-ca, 3. van-xuoi, 4. ky-khao-cuu, 5. kich-san-khau, 6. am-nhac-mua, 7. my-thuat, 8. mo-rong")
        loai = input("  Nhập số (1-8): ").strip()
        mapping = {"1": "van-hoc-dan-gian", "2": "thi-ca", "3": "van-xuoi", "4": "ky-khao-cuu", "5": "kich-san-khau", "6": "am-nhac-mua", "7": "my-thuat", "8": "mo-rong"}
        new_item["loai_hinh"] = mapping.get(loai, "mo-rong")
        
        the_loai_raw = input("  Nhập Thể loại (cách nhau bằng dấu phẩy): ").strip()
        new_item["the_loai"] = [x.strip() for x in the_loai_raw.split(",") if x.strip()]
        
        new_item["era"] = input("  Nhập Thời đại (vd: 1941): ").strip()
        new_item["script"] = input("  Nhập Văn tự (vd: Quốc ngữ): ").strip()
        new_item["desc"] = input("  Nhập Mô tả ngắn: ").strip()
        new_item["content"] = input("  Nhập Nội dung chi tiết (HTML): ").strip()

    elif data_type == "theory":
        new_item["id"] = input("  Nhập ID (vd: quyen-xviii): ").strip()
        new_item["title"] = input("  Nhập Tên Quyển: ").strip()
        new_item["content"] = input("  Nhập Nội dung (HTML): ").strip()

    elif data_type == "encyclopedia":
        new_item["id"] = input("  Nhập ID (vd: tac-gia-abc): ").strip()
        new_item["title"] = input("  Nhập Tên Tác giả: ").strip()
        new_item["content"] = input("  Nhập Tiểu sử & Sự nghiệp (HTML): ").strip()

    elif data_type == "quotes":
        new_item["text"] = input("  Nhập Câu danh ngôn: ").strip()
        new_item["author"] = input("  Nhập Tác giả: ").strip()
        new_item["source"] = input("  Nhập Nguồn trích dẫn: ").strip()
        new_item["verificationStatus"] = "attributed"

    # Xác nhận và lưu
    print(f"\n{C_GRAY}Dữ liệu chuẩn bị thêm:{C_RESET}")
    for k, v in new_item.items():
        display_v = str(v)[:50] + "..." if len(str(v)) > 50 else str(v)
        print(f"  {C_GOLD}{k}{C_RESET}: {display_v}")

    confirm = input(f"\n{C_GOLD}Lưu vào file? (y/n): {C_RESET}").strip().lower()
    if confirm == 'y':
        data = load_json(FILES[data_type])
        data.append(new_item)
        if save_json(FILES[data_type], data):
            print(f"{C_GREEN}[OK]{C_RESET} Đã lưu thành công vào {FILES[data_type].name}.")
    else:
        print(f"{C_GRAY}Đã hủy bỏ.{C_RESET}")


# =====================================================================
# IV. GIAO DIỆN DÒNG LỆNH (CLI PARSER)
# =====================================================================
def main() -> int:
    parser = argparse.ArgumentParser(
        description="VĂN ĐẠO TOOL - Quản lý dữ liệu hệ thống Văn Đạo."
    )
    subparsers = parser.add_subparsers(dest="command", help="Các lệnh khả dụng")

    # Lệnh: stats
    subparsers.add_parser("stats", help="Thống kê số lượng mục từ trong các file JSON")

    # Lệnh: validate
    subparsers.add_parser("validate", help="Kiểm tra lỗi cấu trúc và trùng lặp ID")

    # Lệnh: search
    parser_search = subparsers.add_parser("search", help="Tìm kiếm từ khóa trong toàn bộ dữ liệu")
    parser_search.add_argument("--keyword", "-k", type=str, required=True, help="Từ khóa cần tìm")

    # Lệnh: add
    parser_add = subparsers.add_parser("add", help="Thêm mới một mục từ vào file JSON")
    parser_add.add_argument("--type", "-t", type=str, required=True, choices=["theory", "encyclopedia", "works", "quotes"], help="Loại dữ liệu muốn thêm")

    args = parser.parse_args()

    if args.command == "stats":
        cmd_stats()
    elif args.command == "validate":
        cmd_validate()
    elif args.command == "search":
        cmd_search(args.keyword)
    elif args.command == "add":
        cmd_add(args.type)
    else:
        parser.print_help()

    return 0


if __name__ == "__main__":
    sys.exit(main())