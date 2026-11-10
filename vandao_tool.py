#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - DATA TOOL CLI (ULTIMATE EDITION V4)
=====================================================================
Tác giả: Văn Đạo
Mô tả: 
- Công cụ quản lý, kiểm tra và thống kê dữ liệu hệ thống VĂN ĐẠO.
- Hỗ trợ cấu trúc thư mục mới (data/ và data/tac-pham/).
- Giao diện Terminal 100% Text, KHÔNG Emoji/Icon.
=====================================================================
"""

import argparse
import json
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# --- FIX LỖI FONT TIẾNG VIỆT TRÊN WINDOWS TERMINAL ---
if sys.platform == "win32":
    os.system("")
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

# =====================================================================
# I. CẤU HÌNH MÀU SẮC TERMINAL (ANSI COLORS)
# =====================================================================
C_TEAL = "\033[96m"
C_GOLD = "\033[93m"
C_GRAY = "\033[90m"
C_GREEN = "\033[92m"
C_RED = "\033[91m"
C_BLUE = "\033[94m"
C_RESET = "\033[0m"

# =====================================================================
# II. CẤU HÌNH ĐƯỜNG DẪN
# =====================================================================
ROOT_DIR = Path(__file__).parent
DATA_DIR = ROOT_DIR / "data"
WORKS_DIR = DATA_DIR / "tac-pham"
BACKUP_DIR = ROOT_DIR / "backup"

FILES = {
    "theory": DATA_DIR / "data-ly-thuyet.json",
    "authors": DATA_DIR / "data-tac-gia.json",
    "works_index": DATA_DIR / "data-tac-pham-index.json",
    "quotes": DATA_DIR / "data-danh-ngon.json",
}

# =====================================================================
# III. CÁC HÀM TIỆN ÍCH (UTILITIES)
# =====================================================================
def print_header(title: str):
    print(f"\n{C_TEAL}+------------------------------------------------------+{C_RESET}")
    print(f"{C_TEAL}|{C_RESET} {C_GOLD}{title:<52}{C_RESET} {C_TEAL}|{C_RESET}")
    print(f"{C_TEAL}+------------------------------------------------------+{C_RESET}\n")

def load_json(filepath: Path) -> list:
    if not filepath.exists():
        print(f"  {C_RED}[LỖI]{C_RESET} Không tìm thấy file: {filepath.name}")
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"  {C_RED}[LỖI]{C_RESET} File {filepath.name} bị lỗi cú pháp JSON: {e}")
        return []
    except Exception as e:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể đọc {filepath.name}: {e}")
        return []

def save_json(filepath: Path, data: list) -> bool:
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể ghi file {filepath.name}: {e}")
        return False

# =====================================================================
# IV. CÁC MODULE CHỨC NĂNG CHÍNH
# =====================================================================

def cmd_stats():
    print_header("THỐNG KÊ DỮ LIỆU VĂN ĐẠO")
    
    if not DATA_DIR.exists():
        print(f"  {C_RED}[LỖI]{C_RESET} Thư mục 'data/' không tồn tại.")
        return

    total_items = 0
    
    # 1. Thống kê các file Index
    for key, path in FILES.items():
        if not path.exists():
            print(f"  {C_GRAY}[BỎ QUA]{C_RESET} {path.name:<28} (Chưa có file)")
            continue
            
        data = load_json(path)
        count = len(data)
        total_items += count
        
        size_kb = path.stat().st_size / 1024
        print(f"  {C_GOLD}{path.name:<28}{C_RESET}: {C_GREEN}{count:>4} mục{C_RESET} | {size_kb:>6.1f} KB")

    # 2. Thống kê thư mục tác phẩm chi tiết
    if WORKS_DIR.exists():
        detail_files = list(WORKS_DIR.glob("*.json"))
        count = len(detail_files)
        size_kb = sum(f.stat().st_size for f in detail_files) / 1024
        print(f"  {C_GOLD}{'data/tac-pham/ (chi tiết)':<28}{C_RESET}: {C_GREEN}{count:>4} mục{C_RESET} | {size_kb:>6.1f} KB")

    print(f"\n{C_TEAL}------------------------------------------------------{C_RESET}")
    print(f"  TỔNG CỘNG DANH MỤC: {C_GREEN}{total_items}{C_RESET} mục từ.")
    print(f"{C_TEAL}------------------------------------------------------{C_RESET}\n")


def cmd_validate():
    print_header("KIỂM TRA TÍNH TOÀN VẸN DỮ LIỆU")
    
    has_error = False
    
    # 1. Validate Theory
    theory = load_json(FILES["theory"])
    for item in theory:
        if not all(k in item for k in ["id", "title", "content"]):
            print(f"  {C_RED}[LỖI]{C_RESET} Lý thuyết '{item.get('title', 'Không tên')}' thiếu trường (id, title, content).")
            has_error = True

    # 2. Validate Authors
    authors = load_json(FILES["authors"])
    for item in authors:
        if not all(k in item for k in ["id", "title", "content"]):
            print(f"  {C_RED}[LỖI]{C_RESET} Tác giả '{item.get('title', 'Không tên')}' thiếu trường (id, title, content).")
            has_error = True

    # 3. Validate Quotes
    quotes = load_json(FILES["quotes"])
    for item in quotes:
        if not all(k in item for k in ["text", "author"]):
            print(f"  {C_RED}[LỖI]{C_RESET} Danh ngôn thiếu trường 'text' hoặc 'author'.")
            has_error = True

    # 4. Validate Works Index & Chi tiết
    works_index = load_json(FILES["works_index"])
    seen_ids = set()
    
    for item in works_index:
        item_id = item.get("id")
        title = item.get("title", "Không tên")
        
        if not all(k in item for k in ["id", "title", "author"]):
            print(f"  {C_RED}[LỖI]{C_RESET} Index tác phẩm '{title}' thiếu trường (id, title, author).")
            has_error = True
            
        if item_id:
            if item_id in seen_ids:
                print(f"  {C_RED}[LỖI]{C_RESET} Trùng ID '{item_id}' tại tác phẩm '{title}'.")
                has_error = True
            seen_ids.add(item_id)
            
            # Kiểm tra file chi tiết có tồn tại không
            detail_path = WORKS_DIR / f"{item_id}.json"
            if not detail_path.exists():
                print(f"  {C_RED}[LỖI]{C_RESET} Thiếu file chi tiết cho tác phẩm: {item_id}.json")
                has_error = True

    # 5. Kiểm tra file rác trong tac-pham/
    if WORKS_DIR.exists():
        for file in WORKS_DIR.glob("*.json"):
            file_id = file.stem
            if file_id not in seen_ids:
                print(f"  {C_RED}[LỖI]{C_RESET} File rác (Không có trong Index): tac-pham/{file.name}")
                has_error = True

    if not has_error:
        print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Tất cả dữ liệu đều hợp lệ. Cấu trúc hoàn hảo.")
    else:
        print(f"\n  {C_RED}[CẢNH BÁO]{C_RESET} Phát hiện lỗi dữ liệu. Vui lòng kiểm tra lại.")
        
    print()


def cmd_search(keyword: str):
    print_header(f"TÌM KIẾM TỪ KHÓA: '{keyword}'")
    
    kw_lower = keyword.lower()
    found_count = 0

    def search_in_data(data_list, category_name, text_fields):
        nonlocal found_count
        for item in data_list:
            # Gộp tất cả các trường text lại để tìm kiếm
            haystack = " ".join([str(item.get(f, "")) for f in text_fields]).lower()
            if kw_lower in haystack:
                title = item.get("title") or item.get("text", "")[:40] + "..."
                print(f"  {C_GREEN}[{category_name}]{C_RESET} {title}")
                found_count += 1

    # Tìm trong các file Index
    search_in_data(load_json(FILES["theory"]), "LÝ THUYẾT", ["title", "content"])
    search_in_data(load_json(FILES["authors"]), "TÁC GIẢ", ["title", "content"])
    search_in_data(load_json(FILES["works_index"]), "TÁC PHẨM", ["title", "author", "desc"])
    search_in_data(load_json(FILES["quotes"]), "DANH NGÔN", ["text", "author"])

    # Tìm sâu trong file chi tiết tác phẩm
    if WORKS_DIR.exists():
        for file in WORKS_DIR.glob("*.json"):
            item = load_json(file)
            if isinstance(item, dict) and item:
                content = item.get("content", "").lower()
                if kw_lower in content:
                    print(f"  {C_GREEN}[CHI TIẾT]{C_RESET} {item.get('title')} (Tìm thấy trong nội dung)")
                    found_count += 1

    print(f"\n{C_TEAL}------------------------------------------------------{C_RESET}")
    print(f"  Tìm thấy {C_GREEN}{found_count}{C_RESET} kết quả phù hợp.")
    print(f"{C_TEAL}------------------------------------------------------{C_RESET}\n")


def cmd_backup():
    print_header("SAO LƯU DỮ LIỆU")
    
    if not DATA_DIR.exists():
        print(f"  {C_RED}[LỖI]{C_RESET} Thư mục 'data/' không tồn tại để sao lưu.")
        return
        
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    dest_dir = BACKUP_DIR / f"backup_{timestamp}"
    
    try:
        shutil.copytree(DATA_DIR, dest_dir)
        print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã sao lưu toàn bộ thư mục 'data/' vào:")
        print(f"  {C_GRAY}{dest_dir}{C_RESET}")
    except Exception as e:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể sao lưu: {e}")
    print()


def cmd_restore():
    print_header("PHỤC HỒI DỮ LIỆU")
    
    if not BACKUP_DIR.exists():
        print(f"  {C_RED}[LỖI]{C_RESET} Chưa có bản sao lưu nào trong thư mục 'backup/'.")
        return
        
    backups = sorted([d for d in BACKUP_DIR.iterdir() if d.is_dir()], reverse=True)
    if not backups:
        print(f"  {C_RED}[LỖI]{C_RESET} Không tìm thấy thư mục sao lưu nào.")
        return
        
    print(f"  Danh sách các bản sao lưu hiện có:")
    for i, b in enumerate(backups, 1):
        print(f"    {i}. {b.name}")
        
    try:
        choice = input(f"\n  {C_GOLD}Nhập số thứ tự để phục hồi (hoặc 0 để hủy): {C_RESET}").strip()
        if not choice or choice == "0": return
        
        selected_backup = backups[int(choice) - 1]
        confirm = input(f"  {C_RED}CẢNH BÁO: Hành động này sẽ ghi đè lên thư mục data/ hiện tại. Tiếp tục? (y/n): {C_RESET}").strip().lower()
        
        if confirm == 'y':
            # Xóa data cũ và copy bản backup vào
            if DATA_DIR.exists():
                shutil.rmtree(DATA_DIR)
            shutil.copytree(selected_backup, DATA_DIR)
            print(f"  {C_GREEN}[THÀNH CÔNG]{C_RESET} Đã phục hồi dữ liệu từ: {selected_backup.name}")
        else:
            print(f"  {C_GRAY}Đã hủy thao tác.{C_RESET}")
            
    except (ValueError, IndexError):
        print(f"  {C_RED}[LỖI]{C_RESET} Lựa chọn không hợp lệ.")
    print()


def cmd_test_poem(filepath: str):
    """Gọi trực tiếp bộ máy vandao_core.py để phân tích"""
    print_header(f"PHÂN TÍCH THI PHÁP: {Path(filepath).name}")
    
    try:
        # Import trực tiếp module core
        sys.path.insert(0, str(ROOT_DIR))
        from vandao_core import Poem, VanDaoEngine, Confidence
        
        text = Path(filepath).read_text(encoding="utf-8")
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        if not lines:
            print(f"  {C_RED}[LỖI]{C_RESET} File rỗng.")
            return

        poem = Poem(
            title=Path(filepath).stem,
            author="Khuyết danh",
            lines=lines,
            source_status=Confidence.UNVERIFIED
        )
        
        # Gọi hàm render của Core
        VanDaoEngine.run(poem)
        
    except ImportError:
        print(f"  {C_RED}[LỖI]{C_RESET} Không thể import 'vandao_core.py'. Hãy đảm bảo file này nằm cùng thư mục.")
    except FileNotFoundError:
        print(f"  {C_RED}[LỖI]{C_RESET} Không tìm thấy file: {filepath}")
    except Exception as e:
        print(f"  {C_RED}[LỖI]{C_RESET} Lỗi khi phân tích: {e}")


def cmd_split():
    """Gọi script tách file tác phẩm"""
    script_path = ROOT_DIR / "tools" / "split-works.py"
    if not script_path.exists():
        print(f"  {C_RED}[LỖI]{C_RESET} Không tìm thấy script: tools/split-works.py")
        return
        
    print(f"  {C_GRAY}[ĐANG CHẠY]{C_RESET} Thực thi tools/split-works.py...\n")
    import subprocess
    subprocess.run([sys.executable, str(script_path)])


# =====================================================================
# V. GIAO DIỆN DÒNG LỆNH (CLI PARSER)
# =====================================================================
def main() -> int:
    parser = argparse.ArgumentParser(
        description="VĂN ĐẠO TOOL - Quản lý dữ liệu hệ thống (Không dùng Emoji)."
    )
    subparsers = parser.add_subparsers(dest="command", help="Các lệnh khả dụng")

    subparsers.add_parser("stats", help="Thống kê số lượng mục từ trong các file JSON")
    subparsers.add_parser("validate", help="Kiểm tra lỗi cấu trúc, trùng lặp ID, file rác")
    subparsers.add_parser("backup", help="Sao lưu toàn bộ thư mục data/")
    subparsers.add_parser("restore", help="Phục hồi dữ liệu từ bản backup")
    subparsers.add_parser("split", help="Tách file data-tac-pham.json thành các file nhỏ")

    parser_search = subparsers.add_parser("search", help="Tìm kiếm từ khóa trong toàn bộ dữ liệu")
    parser_search.add_argument("--keyword", "-k", type=str, required=True, help="Từ khóa cần tìm")

    parser_test = subparsers.add_parser("test-poem", help="Phân tích một file thơ (.txt)")
    parser_test.add_argument("--file", "-f", type=str, required=True, help="Đường dẫn tới file .txt")

    args = parser.parse_args()

    if args.command == "stats":
        cmd_stats()
    elif args.command == "validate":
        cmd_validate()
    elif args.command == "search":
        cmd_search(args.keyword)
    elif args.command == "backup":
        cmd_backup()
    elif args.command == "restore":
        cmd_restore()
    elif args.command == "test-poem":
        cmd_test_poem(args.file)
    elif args.command == "split":
        cmd_split()
    else:
        parser.print_help()

    return 0

if __name__ == "__main__":
    sys.exit(main())
