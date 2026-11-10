import json
import os
from pathlib import Path

# Đường dẫn trên GitHub
ROOT = Path('.')
MASTER_FILE = ROOT / "data" / "data-tac-pham-master.json"
WORKS_DIR = ROOT / "data" / "tac-pham"
INDEX_FILE = ROOT / "data" / "data-tac-pham-index.json"

def main():
    if not MASTER_FILE.exists():
        print("Không tìm thấy file master.")
        return

    WORKS_DIR.mkdir(parents=True, exist_ok=True)

    with open(MASTER_FILE, 'r', encoding='utf-8') as f:
        works = json.load(f)

    index = []
    for item in works:
        if 'id' not in item: continue
        
        # Tạo file nhỏ
        with open(WORKS_DIR / f"{item['id']}.json", 'w', encoding='utf-8') as f:
            json.dump(item, f, ensure_ascii=False, indent=2)
        
        # Tạo index
        idx = {k: v for k, v in item.items() if k != 'content'}
        index.append(idx)

    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Đã tách thành công {len(index)} tác phẩm.")

if __name__ == "__main__":
    main()
