#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: AUTO UPDATE MANIFESTS (FULL AUTOMATION)
Tên file: tools/update_manifests.py
Version: 3.0.1 (Fixed Recursive Scan for AI/NLP)
=====================================================================
Tác giả: Văn Đạo

TRIẾT LÝ THIẾT KẾ:
1. TỰ ĐỘNG HÓA HOÀN TOÀN (Full Automation):
   Tự động phát hiện file mới, sinh lại 2 file manifest.
2. CHỐNG VÒNG LẶP (Anti-Loop):
   Bảo toàn các key lạ, không ghi đè cấu hình tùy chỉnh.
3. PHÂN LOẠI CHÍNH XÁC (Precise Classification):
   Đảm bảo js_ai quét ĐỆ QUY (recursive) cả thư mục con nlp/ để không
   bỏ sót các file quan trọng như literary-engine.js.
=====================================================================
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Set

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
# II. CẤU HÌNH ĐƯỜNG DẪN
# =====================================================================
ROOT_DIR = Path(__file__).parent.parent.resolve()
os.chdir(ROOT_DIR)

AGENTS_DIR      = ROOT_DIR / "js" / "ai" / "agents"
MANIFESTS_DIR   = ROOT_DIR / "data" / "manifests"

AGENTS_MANIFEST = MANIFESTS_DIR / "agents-manifest.json"
STATIC_MANIFEST = MANIFESTS_DIR / "static-assets.json"

ROOT_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
]

PRESERVED_KEYS: Set[str] = set()

# =====================================================================
# III. CÁC HÀM UTILITY
# =====================================================================
def print_header() -> None:
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - TỰ ĐỘNG CẬP NHẬT MANIFESTS (v3.0.1){C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def print_step(step: int, title: str) -> None:
    print(f"{C_GOLD}> BƯỚC {step}: {title}{C_RESET}")

def print_ok(text: str) -> None:
    print(f"  {C_GREEN}[OK]{C_RESET} {text}")

def print_warn(text: str) -> None:
    print(f"  {C_RED}[CẢNH BÁO]{C_RESET} {text}")

def print_info(text: str) -> None:
    print(f"  {C_GRAY}[INFO]{C_RESET} {text}")

def ensure_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

def write_json(path: Path, data: Any) -> None:
    ensure_dir(path)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

def read_json_safe(path: Path) -> Any:
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print_warn(f"File {path.name} bị lỗi cú pháp JSON: {e}")
        return None

# =====================================================================
# IV. CÁC HÀM SCAN
# =====================================================================
def scan_glob(sub_dir: str, pattern: str, recursive: bool = False) -> List[str]:
    base = ROOT_DIR / sub_dir
    if not base.exists():
        return []

    result: Set[str] = set()
    iterator = base.rglob(pattern) if recursive else base.glob(pattern)

    for p in iterator:
        if not p.is_file():
            continue
        name = p.name
        # Bỏ qua file rác
        if name.startswith(".") and name not in (".nojekyll", ".gitkeep"):
            continue
        if name.endswith((".tmp", ".bak", ".swp", "~")):
            continue
        
        rel = p.relative_to(ROOT_DIR).as_posix()
        result.add(f"./{rel}")

    return sorted(result)

def scan_agents() -> List[str]:
    if not AGENTS_DIR.exists():
        print_warn(f"Không tìm thấy thư mục {AGENTS_DIR}")
        return []

    agents: List[str] = []
    for p in AGENTS_DIR.glob("*.js"):
        if p.is_file() and p.stem != "index":
            agents.append(p.stem)

    return sorted(set(agents))

# =====================================================================
# V. CÁC HÀM BUILD
# =====================================================================
def build_js_agents(agents: List[str]) -> List[str]:
    files: Set[str] = {"./js/ai/agents/index.js"}
    for agent in agents:
        files.add(f"./js/ai/agents/{agent}.js")
    return sorted(files)

def build_js_ai() -> List[str]:
    """
    Xây dựng danh sách file JS AI.
    [v3.0.1 - FIX] Phải quét CẢ cấp 1 (js/ai/*.js) VÀ cấp 2 (js/ai/nlp/*.js).
    Tuyệt đối không dùng recursive=True ở đây vì sẽ lẫn sang thư mục agents/
    (vốn đã có nhóm riêng là js_agents).
    """
    files: Set[str] = set()
    files.update(scan_glob("js/ai", "*.js"))       # Cấp 1
    files.update(scan_glob("js/ai/nlp", "*.js"))   # Cấp 2 (nlp)
    return sorted(files)

def build_json_manifests() -> List[str]:
    files: Set[str] = set(scan_glob("data/manifests", "*.json"))
    files.add("./data/manifests/agents-manifest.json")
    files.add("./data/manifests/static-assets.json")
    return sorted(files)

def build_static_assets(agents: List[str]) -> Dict[str, List[str]]:
    return {
        "root":           list(ROOT_FILES),
        "css":            scan_glob("css", "*.css"),
        "js_core":        scan_glob("js", "*.js"),
        "js_ai":          build_js_ai(),              # Đã fix
        "js_agents":      build_js_agents(agents),
        "js_network":     scan_glob("js/network", "*.js"),
        "json_data":      scan_glob("data", "data-*.json"),
        "json_manifests": build_json_manifests(),
        "assets":         scan_glob("assets", "*", recursive=True),
    }

# =====================================================================
# VI. GHI MANIFEST & TỔNG KẾT
# =====================================================================
def preserve_unknown_keys(new_data: Dict[str, List[str]]) -> Dict[str, Any]:
    if not STATIC_MANIFEST.exists():
        return new_data

    old_data = read_json_safe(STATIC_MANIFEST)
    if not old_data or not isinstance(old_data, dict):
        return new_data

    schema_keys = set(new_data.keys())

    for key, value in old_data.items():
        if key not in schema_keys:
            new_data[key] = value
            print(f"  {C_GOLD}[BẢO TOÀN]{C_RESET} Giữ nguyên key lạ '{key}'")

    return new_data

def write_agents_manifest(agents: List[str]) -> None:
    write_json(AGENTS_MANIFEST, {"agents": agents})

def write_static_manifest(static: Dict[str, List[str]]) -> None:
    final_data = preserve_unknown_keys(static)
    write_json(STATIC_MANIFEST, final_data)

def print_summary(static: Dict[str, List[str]]) -> int:
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

# =====================================================================
# VII. HÀM MAIN
# =====================================================================
def main() -> int:
    parser = argparse.ArgumentParser(description="Văn Đạo - Cập nhật Manifests")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ in kết quả, không ghi file.")
    parser.add_argument("--verbose", "-v", action="store_true", help="In chi tiết từng file.")
    args = parser.parse_args()

    print_header()

    if args.dry_run:
        print_warn("Chế độ DRY-RUN: Sẽ không ghi file nào ra đĩa.")

    try:
        # 1. Quét Agents
        print_step(1, "Quét thư mục js/ai/agents/")
        agents = scan_agents()
        if not agents:
            print_warn("Không tìm thấy Agent nào.")
        else:
            print_ok(f"Tìm thấy {len(agents)} agent: {', '.join(agents)}")

        # 2. Ghi agents-manifest
        print_step(2, "Cập nhật agents-manifest.json")
        if not args.dry_run:
            write_agents_manifest(agents)
            print_ok("Đã ghi agents-manifest.json")

        # 3. Build static-assets
        print_step(3, "Quét toàn bộ dự án và xây dựng static-assets")
        static = build_static_assets(agents)
        for key, items in static.items():
            if key != "root" and not items:
                print_warn(f"Nhóm '{key}' rỗng - có thể thư mục tương ứng chưa tồn tại.")

        # 4. Ghi static-assets
        print_step(4, "Cập nhật static-assets.json")
        if not args.dry_run:
            write_static_manifest(static)
            print_ok("Đã ghi static-assets.json")

        # 5. Tổng kết
        total = print_summary(static)
        if args.verbose:
            print(f"\n{C_GOLD}  DANH SÁCH CHI TIẾT:{C_RESET}")
            for key, items in static.items():
                if not items: continue
                print(f"\n  {C_TEAL}[{key}] - {len(items)} file{C_RESET}")
                for item in items:
                    print(f"    {C_GRAY}-{C_RESET} {item}")

        if total == 0:
            print_warn("Tổng số file = 0. Kiểm tra lại cấu trúc dự án.")
            return 1

        print_ok("Hoàn tất quá trình cập nhật manifests.")
        return 0

    except Exception as e:
        print_warn(f"Lỗi không mong đợi: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
