#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - TOOL: ENRICH METADATA (MÁY LÀM GIÀU TRI THỨC)
=====================================================================
Tác giả: Văn Đạo

TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
1. Tự động hóa 100%: Quét hàng trăm file JSON, tự động phân tích nội dung
   HTML để trích xuất siêu dữ liệu (Metadata) phục vụ AI.
2. Phân tích Ngữ nghĩa: Dùng thuật toán so khớp từ khóa (Keyword Matching)
   để nhận diện Cảm xúc (cam_xuc), Thẻ (tags), Thời đại (era), Phong cách.
3. An toàn tuyệt đối: Chỉ THÊM trường nếu chưa có. Không ghi đè dữ liệu thật.
4. Tự động đồng bộ: Cập nhật cả file chi tiết VÀ file Index (data-*.json).
=====================================================================
"""

import os
import sys
import json
import re
import argparse
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
WORKS_INDEX = DATA_DIR / "data-tac-pham.json"
AUTHORS_INDEX = DATA_DIR / "data-tac-gia.json"

# =====================================================================
# III. TỪ ĐIỂN CẢM XÚC & THẺ NGỮ NGHĨA (CORE DICTIONARY)
# =====================================================================

# Từ điển Cảm xúc (Dùng cho Tác phẩm)
EMOTION_DICT = {
    "bi tráng": ["bi tráng", "hào hùng", "hy sinh", "chiến trận", "máu", "lửa"],
    "hào hùng": ["hào hùng", "chiến công", "kháng chiến", "anh hùng", "lập công"],
    "trữ tình": ["trữ tình", "tha thiết", "ngọt ngào", "yêu thương", "nhớ nhung"],
    "hoài niệm": ["hoài niệm", "nhớ quê", "cố hương", "quá khứ", "ký ức"],
    "bi thương": ["bi thương", "đau khổ", "bi kịch", "nước mắt", "số phận"],
    "trào phúng": ["trào phúng", "châm biếm", "mỉa mai", "hài hước", "lố lăng"],
    "triết lý": ["triết lý", "nhân sinh", "suy tư", "chiêm nghiệm", "đạo lý"],
    "hào hoa": ["hào hoa", "phóng khoáng", "lãng mạn", "tài tử"],
    "cô đơn": ["cô đơn", "lẻ loi", "cô độc", "một mình"],
    "nhiệt huyết": ["nhiệt huyết", "khát vọng", "tuổi trẻ", "sôi nổi"],
    "thanh cao": ["thanh cao", "thanh khiết", "thoát tục", "ẩn dật"],
    "u uất": ["u uất", "sầu muộn", "buồn bã", "u hoài"],
}

# Từ điển Thẻ (Tags) - Dùng cho cả Tác phẩm và Tác giả
TAG_DICT = {
    "thiên nhiên": ["trăng", "sông", "núi", "mây", "gió", "hoa", "lá", "biển", "suối"],
    "chiến tranh": ["chiến tranh", "kháng chiến", "người lính", "chiến sĩ", "bom đạn"],
    "nông thôn": ["làng", "xóm", "quê", "nông dân", "đồng ruộng", "cày cấy"],
    "thành thị": ["phố", "thành thị", "đô thị", "Hà Nội", "Sài Gòn"],
    "phụ nữ": ["phụ nữ", "người vợ", "người mẹ", "thiếu nữ", "hồng nhan"],
    "tình yêu": ["tình yêu", "lứa đôi", "duyên phận", "tương tư"],
    "gia đình": ["gia đình", "cha", "mẹ", "con", "anh em", "mẫu tử", "phụ tử"],
    "lịch sử": ["lịch sử", "triều đại", "vua", "nhà Lê", "nhà Trần", "nhà Lý"],
    "tôn giáo": ["Phật", "chùa", "thiền", "kinh", "Nho", "Đạo"],
    "văn hóa": ["văn hóa", "phong tục", "truyền thống", "lễ hội"],
    "ngụ ngôn": ["ngụ ngôn", "loài vật", "bài học", "ẩn dụ"],
    "cổ tích": ["cổ tích", "truyền thuyết", "thần kỳ", "phép thuật"],
    "xã hội": ["xã hội", "phong kiến", "bất công", "nghèo đói", "tha hóa"],
    "cách mạng": ["cách mạng", "đổi mới", "kháng chiến"],
    "tuổi trẻ": ["tuổi trẻ", "thanh xuân", "học trò", "sinh viên"],
    "bi kịch": ["bi kịch", "tragedy", "đau thương"],
    "trào phúng": ["trào phúng", "châm biếm", "hài hước"],
}

# Từ điển Quốc gia (Cho tác giả)
NATIONALITY_DICT = {
    "Việt Nam": ["việt nam", "vn"],
    "Trung Quốc": ["trung quốc", "trung hoa", "tàu"],
    "Hy Lạp": ["hy lạp", "greece"],
    "Nga": ["nga", "liên xô"],
    "Pháp": ["pháp", "pháp quốc"],
    "Anh": ["anh", "anh quốc"],
    "Mỹ": ["mỹ", "hoa kỳ"],
    "Ấn Độ": ["ấn độ"],
    "Nhật Bản": ["nhật bản", "nhật"],
    "Đức": ["đức"],
    "Đan Mạch": ["đan mạch"],
}

# =====================================================================
# IV. HÀM TIỆN ÍCH
# =====================================================================

def print_header():
    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  VĂN ĐẠO ENGINE - LÀM GIÀU SIÊU DỮ LIỆU TỰ ĐỘNG{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GRAY}  Thư mục làm việc: {ROOT_DIR}{C_RESET}\n")

def strip_html(html):
    """Xóa thẻ HTML để lấy text thuần."""
    if not html: return ""
    text = re.sub(r'<[^>]+>', ' ', html)
    return re.sub(r'\s+', ' ', text).strip().lower()

def extract_mood_tags(content, title=""):
    """Trích xuất cảm xúc và tags dựa trên so khớp từ khóa."""
    text = strip_html(content) + " " + title.lower()
    
    moods = set()
    for mood, keywords in EMOTION_DICT.items():
        for kw in keywords:
            if kw in text:
                moods.add(mood)
                break  # Mỗi cảm xúc chỉ cần 1 từ khóa khớp
    
    tags = set()
    for tag, keywords in TAG_DICT.items():
        for kw in keywords:
            if kw in text:
                tags.add(tag)
                break
                
    return list(moods), list(tags)

def extract_era(content):
    """Trích xuất thời đại từ nội dung (regex)."""
    text = strip_html(content)
    patterns = [
        r"thế kỷ (\d+|[ivxlcdm]+)",
        r"tk (\d+|[ivxlcdm]+)",
        r"năm (\d{4})",
        r"nhà (lê|trần|lý|nguyễn|hồ|tây sơn)",
    ]
    for p in patterns:
        match = re.search(p, text)
        if match:
            return match.group(0).upper()
    return None

def extract_nationality(content):
    """Trích xuất quốc tịch từ nội dung."""
    text = strip_html(content)
    for nationality, keywords in NATIONALITY_DICT.items():
        for kw in keywords:
            if kw in text:
                return nationality
    return None

def extract_style(content):
    """Trích xuất phong cách từ mục 'Phong cách' trong HTML."""
    styles = []
    match = re.search(r'<h4>[^<]*Phong cách[^<]*</h4>(.*?)(?=<h4>|$)', content, re.DOTALL | re.IGNORECASE)
    if match:
        style_text = strip_html(match.group(1))
        phrases = re.split(r'[,\.;]', style_text)
        styles = [p.strip() for p in phrases if len(p.strip()) > 3][:5]
    return styles

# =====================================================================
# V. HÀM XỬ LÝ CHÍNH
# =====================================================================

def enrich_works(dry_run=False):
    """Làm giàu metadata cho Tác phẩm."""
    if not WORKS_DIR.exists():
        return 0
    
    files = list(WORKS_DIR.glob("*.json"))
    print(f"{C_GOLD}> Xử lý {len(files)} Tác phẩm...{C_RESET}")
    updated = 0

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            content = data.get('content', '')
            title = data.get('title', '')
            changed = False
            
            if 'cam_xuc' not in data:
                moods, _ = extract_mood_tags(content, title)
                if moods:
                    data['cam_xuc'] = moods
                    changed = True
            
            if 'tags' not in data:
                _, tags = extract_mood_tags(content, title)
                if tags:
                    data['tags'] = tags
                    changed = True
            
            if changed:
                if not dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"  {C_GREEN}[+]{C_RESET} {file_path.name} (Mood: {len(data.get('cam_xuc', []))}, Tags: {len(data.get('tags', []))})")
                updated += 1
        except Exception as e:
            print(f"  {C_RED}[LỖI]{C_RESET} {file_path.name}: {e}")
    
    return updated

def enrich_authors(dry_run=False):
    """Làm giàu metadata cho Tác giả."""
    if not AUTHORS_DIR.exists():
        return 0
    
    files = list(AUTHORS_DIR.glob("*.json"))
    print(f"{C_GOLD}> Xử lý {len(files)} Tác giả...{C_RESET}")
    updated = 0

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            content = data.get('content', '')
            title = data.get('title', '')
            changed = False
            
            if 'era' not in data:
                era = extract_era(content)
                if era: data['era'] = era; changed = True
                
            if 'nationality' not in data:
                nationality = extract_nationality(content)
                if nationality: data['nationality'] = nationality; changed = True
                
            if 'style' not in data:
                styles = extract_style(content)
                if styles: data['style'] = styles; changed = True
                
            if 'tags' not in data:
                _, tags = extract_mood_tags(content, title)
                if tags: data['tags'] = tags; changed = True
            
            if changed:
                if not dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"  {C_GREEN}[+]{C_RESET} {file_path.name} (Era: {data.get('era', '?')}, Quốc tịch: {data.get('nationality', '?')})")
                updated += 1
        except Exception as e:
            print(f"  {C_RED}[LỖI]{C_RESET} {file_path.name}: {e}")
    
    return updated

def sync_indexes(dry_run=False):
    """Đồng bộ metadata mới vào file Index."""
    print(f"{C_GOLD}> Đồng bộ hóa Index...{C_RESET}")
    
    # Đồng bộ Tác phẩm
    if WORKS_INDEX.exists():
        with open(WORKS_INDEX, 'r', encoding='utf-8') as f:
            index_data = json.load(f)
        
        id_to_detail = {}
        for f in WORKS_DIR.glob("*.json"):
            with open(f, 'r', encoding='utf-8') as file:
                detail = json.load(file)
                id_to_detail[detail['id']] = detail
        
        changed = 0
        for item in index_data:
            detail = id_to_detail.get(item['id'])
            if detail:
                for key in ['cam_xuc', 'tags']:
                    if key in detail and key not in item:
                        item[key] = detail[key]
                        changed += 1
        
        if changed > 0 and not dry_run:
            with open(WORKS_INDEX, 'w', encoding='utf-8') as f:
                json.dump(index_data, f, ensure_ascii=False, indent=2)
            print(f"  {C_GREEN}[OK]{C_RESET} Đã cập nhật {changed} trường vào data-tac-pham.json")

    # Đồng bộ Tác giả (tương tự)
    if AUTHORS_INDEX.exists():
        with open(AUTHORS_INDEX, 'r', encoding='utf-8') as f:
            index_data = json.load(f)
        
        id_to_detail = {}
        for f in AUTHORS_DIR.glob("*.json"):
            with open(f, 'r', encoding='utf-8') as file:
                detail = json.load(file)
                id_to_detail[detail['id']] = detail
        
        changed = 0
        for item in index_data:
            detail = id_to_detail.get(item['id'])
            if detail:
                for key in ['era', 'nationality', 'style', 'tags']:
                    if key in detail and key not in item:
                        item[key] = detail[key]
                        changed += 1
        
        if changed > 0 and not dry_run:
            with open(AUTHORS_INDEX, 'w', encoding='utf-8') as f:
                json.dump(index_data, f, ensure_ascii=False, indent=2)
            print(f"  {C_GREEN}[OK]{C_RESET} Đã cập nhật {changed} trường vào data-tac-gia.json")

# =====================================================================
# VI. MAIN
# =====================================================================
def main():
    parser = argparse.ArgumentParser(description="Làm giàu Metadata cho Văn Đạo")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ xem, không ghi file")
    args = parser.parse_args()

    print_header()
    if args.dry_run:
        print(f"{C_RED}CHẾ ĐỘ DRY-RUN: Sẽ không ghi file.{C_RESET}\n")

    w_count = enrich_works(args.dry_run)
    a_count = enrich_authors(args.dry_run)
    sync_indexes(args.dry_run)

    print(f"\n{C_TEAL}====================================================================={C_RESET}")
    print(f"{C_GOLD}  TỔNG KẾT:{C_RESET}")
    print(f"  - Tác phẩm được làm giàu: {C_GREEN}{w_count}{C_RESET}")
    print(f"  - Tác giả được làm giàu: {C_GREEN}{a_count}{C_RESET}")
    print(f"{C_TEAL}====================================================================={C_RESET}\n")

if __name__ == "__main__":
    main()
