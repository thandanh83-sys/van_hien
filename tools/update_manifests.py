#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: AUTO UPDATE MANIFESTS (FULL AUTOMATION)
Tên file: tools/update_manifests.py
Version: 2.0.0
=====================================================================
Tác giả: Văn Đạo

TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):

1. TỰ ĐỘNG HÓA HOÀN TOÀN (Full Automation):
   Con người chỉ cần tạo file Agent mới trong js/ai/agents/. Script này
   sẽ tự động phát hiện, cập nhật agents-manifest.json và
   static-assets.json. Không ai phải sửa tay mảng PRECACHE_ASSETS
   trong sw.js nữa.

2. MỘT NGUỒN SỰ THẬT DUY NHẤT (Single Source of Truth):
   Tất cả danh sách file đều được sinh ra từ cấu trúc thư mục thực tế.
   Không có sự trùng lặp hay sai lệch giữa code và manifest.

3. PHÂN LOẠI RÕ RÀNG (Structured Manifest):
   Chia các file thành 9 nhóm có ngữ nghĩa:
     - root           : Các file gốc (index.html, manifest.json)
     - css            : Toàn bộ file CSS trong css/
     - js_core        : JS lõi (js/*.js)
     - js_ai          : JS AI (js/ai/*.js)
     - js_agents      : JS Agents (js/ai/agents/*.js)
     - js_network     : JS Network (js/network/*.js)
     - json_data      : 9 file Data JSON chính (data/data-*.json)
     - json_manifests : Manifests & danh mục (data/manifests/*.json)
     - assets         : Ảnh, font, icon (assets/**)

4. AN TOÀN (Idempotent & Preserve):
   - Chạy nhiều lần cho kết quả giống nhau.
   - Sắp xếp ổn định để git diff gọn gàng.
   - Giữ nguyên các key lạ (nếu con người tự thêm vào JSON).
   - Loại bỏ trùng lặp tự động.

5. TRUNG THỰC (Honest Reporting):
   - Báo cáo rõ số file mỗi nhóm.
   - Cảnh báo nếu thư mục rỗng hoặc thiếu.
   - Không im lặng bỏ qua lỗi.

6. THANH TỊNH (Clean):
   - Loại bỏ file rác (temp, backup, .DS_Store).
   - Không đưa file nội dung chi tiết vào precache (quá nặng).

CÁCH SỬ DỤNG:
    python tools/update_manifests.py                 # Chạy thật (ghi file)
    python tools/update_manifests.py --dry-run       # Chỉ xem, không ghi
    python tools/update_manifests.py --verbose       # In chi tiết từng file
=====================================================================
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Set


# =====================================================================
# I. CẤU HÌNH MÀU SẮC TERMINAL (Để log trên GitHub Actions dễ đọc)
# =====================================================================
C_TEAL = "\033[96m"   # Màu xanh ngọc (Tiêu đề)
C_GOLD = "\033[93m"   # Màu vàng (Các bước, cảnh báo nhẹ)
C_GRAY = "\033[90m"   # Màu xám (Ghi chú, thông tin phụ)
C_GREEN = "\033[92m"  # Màu xanh lá (Thành công)
C_RED = "\033[91m"    # Màu đỏ (Lỗi)
C_RESET = "\033[0m"   # Reset màu


# =====================================================================
# II. CẤU HÌNH ĐƯỜNG DẪN (Path Configuration)
# =====================================================================
# Lấy thư mục gốc dự án (lùi 1 cấp từ tools/)
ROOT_DIR = Path(__file__).parent.parent.resolve()

# Di chuyển con trỏ làm việc về thư mục gốc để đường dẫn tương đối chuẩn
os.chdir(ROOT_DIR)

# Đường dẫn thư mục
AGENTS_DIR      = ROOT_DIR / "js" / "ai" / "agents"
MANIFESTS_DIR   = ROOT_DIR / "data" / "manifests"

# Đường dẫn file output
AGENTS_MANIFEST = MANIFESTS_DIR / "agents-manifest.json"
STATIC_MANIFEST = MANIFESTS_DIR / "static-assets.json"

# Các file cố định ở root (bắt buộc phải có trong precache)
ROOT_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
]

# Các key không được ghi đè (giữ nguyên nếu con người tự thêm)
PRESERVED_KEYS: Set[str] = {
    # Đây là các key mặc định. Nếu file static-assets.json cũ có
    # các key lạ khác, chúng sẽ được bảo toàn (xem preserve_unknown_keys).
}


# =====================================================================
# III. CÁC HÀM UTILITY (In log, ghi file, đảm bảo thư mục)
# =====================================================================

def print_header() -> None:
    """In tiêu đề khởi chạy."""
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - TỰ ĐỘNG CẬP NHẬT MANIFESTS (v2.0.0){C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")


def print_step(step: int, title: str) -> None:
    """In tiêu đề bước."""
    print(f"{C_GOLD}> BƯỚC {step}: {title}{C_RESET}")


def print_sub(text: str) -> None:
    """In thông tin phụ (thụt đầu dòng)."""
    print(f"  {C_GRAY}{text}{C_RESET}")


def print_ok(text: str) -> None:
    """In thông báo thành công."""
    print(f"  {C_GREEN}[OK]{C_RESET} {text}")


def print_warn(text: str) -> None:
    """In cảnh báo."""
    print(f"  {C_RED}[CẢNH BÁO]{C_RESET} {text}")


def print_info(text: str) -> None:
    """In thông tin trung tính."""
    print(f"  {C_GRAY}[INFO]{C_RESET} {text}")


def print_preserved(text: str) -> None:
    """In thông báo bảo toàn key lạ."""
    print(f"  {C_GOLD}[BẢO TOÀN]{C_RESET} {text}")


def ensure_dir(path: Path) -> None:
    """Đảm bảo thư mục tồn tại."""
    path.parent.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, data: Any) -> None:
    """
    Ghi dict/list ra file JSON với:
      - ensure_ascii=False  -> Giữ nguyên tiếng Việt
      - indent=2            -> Dễ đọc, diff gọn gàng
      - newline cuối file   -> Tương thích POSIX
    """
    ensure_dir(path)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def read_json_safe(path: Path) -> Any:
    """
    Đọc file JSON an toàn. Trả về None nếu file không tồn tại hoặc lỗi.
    """
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print_warn(f"File {path.name} bị lỗi cú pháp JSON: {e}")
        return None
    except Exception as e:
        print_warn(f"Không đọc được {path.name}: {e}")
        return None


# =====================================================================
# IV. CÁC HÀM SCAN (Quét file theo pattern)
# =====================================================================

def scan_glob(sub_dir: str, pattern: str, recursive: bool = False) -> List[str]:
    """
    Quét file trong một thư mục con theo pattern.

    Args:
        sub_dir: Đường dẫn tương đối của thư mục con (VD: "css", "js/ai").
        pattern: Glob pattern (VD: "*.css", "*").
        recursive: True -> dùng rglob (quét cả thư mục con).

    Returns:
        Danh sách các đường dẫn tương đối (bắt đầu bằng "./"), đã sắp xếp.
    """
    base = ROOT_DIR / sub_dir
    if not base.exists():
        return []

    result: Set[str] = set()
    iterator = base.rglob(pattern) if recursive else base.glob(pattern)

    for p in iterator:
        if not p.is_file():
            continue
        # Loại bỏ file rác (tạm, backup, system)
        name = p.name
        if name.startswith(".") and name not in (".nojekyll", ".gitkeep"):
            continue
        if name.endswith((".tmp", ".bak", ".swp", "~")):
            continue
        # Chuyển thành đường dẫn tương đối với "./" prefix
        rel = p.relative_to(ROOT_DIR).as_posix()
        result.add(f"./{rel}")

    return sorted(result)


def scan_agents() -> List[str]:
    """
    Quét tất cả file .js trong js/ai/agents/ (trừ index.js).
    Đây là nguồn dữ liệu cho agents-manifest.json.
    """
    if not AGENTS_DIR.exists():
        print_warn(f"Không tìm thấy thư mục {AGENTS_DIR}")
        return []

    agents: List[str] = []
    for p in AGENTS_DIR.glob("*.js"):
        if p.is_file() and p.stem != "index":
            agents.append(p.stem)

    return sorted(set(agents))


# =====================================================================
# V. CÁC HÀM BUILD (Xây dựng dict cho từng key)
# =====================================================================

def build_js_agents(agents: List[str]) -> List[str]:
    """
    Xây dựng danh sách file JS agents.
    Luôn bao gồm index.js, sau đó là từng agent cụ thể.
    """
    files: Set[str] = {"./js/ai/agents/index.js"}
    for agent in agents:
        files.add(f"./js/ai/agents/{agent}.js")
    return sorted(files)


def build_json_manifests() -> List[str]:
    """
    Xây dựng danh sách file manifests.
    Luôn đảm bảo agents-manifest.json và static-assets.json có mặt
    (kể cả khi --dry-run chưa kịp ghi chúng ra đĩa).
    """
    files: Set[str] = set(scan_glob("data/manifests", "*.json"))
    files.add("./data/manifests/agents-manifest.json")
    files.add("./data/manifests/static-assets.json")
    return sorted(files)


def build_static_assets(agents: List[str]) -> Dict[str, List[str]]:
    """
    Xây dựng dict static-assets.json đầy đủ 9 key.
    Đây là cấu trúc mà sw.js mong đợi.
    """
    return {
        "root":           list(ROOT_FILES),
        "css":            scan_glob("css", "*.css"),
        "js_core":        scan_glob("js", "*.js"),
        "js_ai":          scan_glob("js/ai", "*.js"),
        "js_agents":      build_js_agents(agents),
        "js_network":     scan_glob("js/network", "*.js"),
        "json_data":      scan_glob("data", "data-*.json"),
        "json_manifests": build_json_manifests(),
        "assets":         scan_glob("assets", "*", recursive=True),
    }


# =====================================================================
# VI. CÁC HÀM GHI MANIFEST (Có bảo toàn key lạ)
# =====================================================================

def preserve_unknown_keys(new_data: Dict[str, List[str]]) -> Dict[str, Any]:
    """
    Đọc static-assets.json cũ (nếu có) và giữ nguyên các key lạ
    (key không nằm trong schema 9 key mặc định). Việc này giúp
    tương thích ngược khi con người tự thêm key tùy chỉnh.
    """
    if not STATIC_MANIFEST.exists():
        return new_data

    old_data = read_json_safe(STATIC_MANIFEST)
    if not old_data or not isinstance(old_data, dict):
        return new_data

    # Các key nằm trong schema mới -> KHÔNG bảo toàn, sẽ bị ghi đè
    schema_keys = set(new_data.keys())

    for key, value in old_data.items():
        if key not in schema_keys:
            new_data[key] = value
            print_preserved(f"Giữ nguyên key lạ '{key}' ({len(value) if isinstance(value, list) else 'N/A'} mục)")

    return new_data


def write_agents_manifest(agents: List[str]) -> None:
    """Ghi agents-manifest.json (danh sách agent names)."""
    data = {"agents": agents}
    write_json(AGENTS_MANIFEST, data)


def write_static_manifest(static: Dict[str, List[str]]) -> None:
    """Ghi static-assets.json (đã bảo toàn key lạ)."""
    final_data = preserve_unknown_keys(static)
    write_json(STATIC_MANIFEST, final_data)


# =====================================================================
# VII. IN TỔNG KẾT
# =====================================================================

def print_summary(static: Dict[str, List[str]]) -> int:
    """In bảng tổng kết số file mỗi nhóm. Trả về tổng số file."""
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  TỔNG KẾT (MANIFEST REPORT){C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")

    total = 0
    order = [
        ("root",           "Root"),
        ("css",            "CSS"),
        ("js_core",        "JS Core"),
        ("js_ai",          "JS AI"),
        ("js_agents",      "JS Agents"),
        ("js_network",     "JS Network"),
        ("json_data",      "JSON Data"),
        ("json_manifests", "JSON Manifests"),
        ("assets",         "Assets"),
    ]

    for key, label in order:
        items = static.get(key, [])
        count = len(items)
        total += count
        status = C_GREEN if count > 0 else C_RED
        print(f"  {C_GOLD}{label:<16}{C_RESET} : {status}{count:>4}{C_RESET} file")

    print(f"  {'-' * 40}")
    print(f"  {C_TEAL}{'TỔNG CỘNG':<16}{C_RESET} : {C_GREEN}{total:>4}{C_RESET} file")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

    return total


def print_verbose_detail(static: Dict[str, List[str]]) -> None:
    """In chi tiết từng file (dùng khi --verbose)."""
    print(f"\n{C_GOLD}  DANH SÁCH CHI TIẾT:{C_RESET}")
    for key, items in static.items():
        if not items:
            continue
        print(f"\n  {C_TEAL}[{key}] - {len(items)} file{C_RESET}")
        for item in items:
            print(f"    {C_GRAY}-{C_RESET} {item}")


# =====================================================================
# VIII. HÀM MAIN (Điều phối toàn bộ)
# =====================================================================

def parse_args() -> argparse.Namespace:
    """Phân tích tham số dòng lệnh."""
    parser = argparse.ArgumentParser(
        description="Văn Đạo Engine - Tự động cập nhật Manifests (v2.0.0)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Ví dụ:\n"
            "  python tools/update_manifests.py                 # Chạy thật\n"
            "  python tools/update_manifests.py --dry-run       # Chỉ xem\n"
            "  python tools/update_manifests.py --verbose       # Chi tiết\n"
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Chỉ in kết quả, KHÔNG ghi file ra đĩa.",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="In chi tiết từng file trong mỗi nhóm.",
    )
    return parser.parse_args()


def main() -> int:
    """Điểm khởi chạy chính. Trả về exit code."""
    args = parse_args()

    print_header()

    if args.dry_run:
        print_warn("Chế độ DRY-RUN: Sẽ không ghi file nào ra đĩa.")

    try:
        # -----------------------------------------------------------------
        # BƯỚC 1: Quét thư mục agents
        # -----------------------------------------------------------------
        print_step(1, "Quét thư mục js/ai/agents/")
        agents = scan_agents()

        if not agents:
            print_warn("Không tìm thấy Agent nào. Kiểm tra lại thư mục js/ai/agents/.")
        else:
            print_ok(f"Tìm thấy {len(agents)} agent: {', '.join(agents)}")

        if args.verbose and agents:
            for a in agents:
                print(f"    {C_GRAY}-{C_RESET} {a}.js")

        # -----------------------------------------------------------------
        # BƯỚC 2: Ghi agents-manifest.json
        # -----------------------------------------------------------------
        print_step(2, "Cập nhật agents-manifest.json")
        if args.dry_run:
            print_info("Bỏ qua ghi file (dry-run).")
        else:
            write_agents_manifest(agents)
            print_ok(f"Đã ghi {AGENTS_MANIFEST.relative_to(ROOT_DIR).as_posix()}")

        # -----------------------------------------------------------------
        # BƯỚC 3: Xây dựng static-assets (quét toàn bộ dự án)
        # -----------------------------------------------------------------
        print_step(3, "Quét toàn bộ dự án và xây dựng static-assets")
        static = build_static_assets(agents)

        # Cảnh báo nếu một số key rỗng (trừ root luôn có 3 file)
        for key, items in static.items():
            if key == "root":
                continue
            if not items:
                print_warn(f"Nhóm '{key}' rỗng - có thể thư mục tương ứng chưa tồn tại.")

        # -----------------------------------------------------------------
        # BƯỚC 4: Ghi static-assets.json
        # -----------------------------------------------------------------
        print_step(4, "Cập nhật static-assets.json")
        if args.dry_run:
            print_info("Bỏ qua ghi file (dry-run).")
        else:
            write_static_manifest(static)
            print_ok(f"Đã ghi {STATIC_MANIFEST.relative_to(ROOT_DIR).as_posix()}")

        # -----------------------------------------------------------------
        # BƯỚC 5: Tổng kết
        # -----------------------------------------------------------------
        total = print_summary(static)

        if args.verbose:
            print_verbose_detail(static)

        if total == 0:
            print_warn("Tổng số file = 0. Có thể cấu trúc dự án chưa đúng.")
            return 1

        print_ok("Hoàn tất quá trình cập nhật manifests.")
        return 0

    except KeyboardInterrupt:
        print_warn("\nNgười dùng đã hủy (Ctrl+C).")
        return 130

    except Exception as e:
        print_warn(f"Lỗi không mong đợi: {e}")
        import traceback
        traceback.print_exc()
        return 1


# =====================================================================
# IX. ENTRY POINT
# =====================================================================
if __name__ == "__main__":
    sys.exit(main())
