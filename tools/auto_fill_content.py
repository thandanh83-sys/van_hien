#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import json
from pathlib import Path

C_TEAL = "\033[96m"
C_GOLD = "\033[93m"
C_GREEN = "\033[92m"
C_RESET = "\033m"

ROOT_DIR = Path(__file__).parent.parent
os.chdir(ROOT_DIR)
WORKS_DIR = ROOT_DIR / "data" / "tac-pham"

# Nội dung mẫu (Bạn có thể sửa lại câu chữ tùy thích)
DEFAULT_CONTENT = """
<div style="text-align: center; padding: 30px 10px; opacity: 0.8;">
    <p style="font-family: var(--font-body); font-style: italic; color: var(--accent-text);">
        Văn bản này đang được Văn Đạo hiệu đính và biên soạn nội dung chi tiết.
    </p>
    <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 10px;">
        Vui lòng quay lại sau hoặc sử dụng tính năng "Thi Pháp" để phân tích tác phẩm.
    </p>
</div>
"""

def auto_fill():
    if not WORKS_DIR.exists():
        print("Thư mục tác phẩm không tồn tại.")
        return

    files = list(WORKS_DIR.glob("*.json"))
    count = 0

    print(f"{C_GOLD}Bắt đầu kiểm tra {len(files)} file tác phẩm...{C_RESET}")

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Nếu thiếu content hoặc content rỗng, tự động chèn vào
            if not data.get('content') or str(data.get('content')).strip() == '':
                data['content'] = DEFAULT_CONTENT.strip()
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                print(f"  [+] Đã chèn nội dung mẫu cho: {file_path.name}")
                count += 1
                
        except Exception as e:
            print(f"  [LỖI] Không thể xử lý file {file_path.name}: {e}")

    print(f"\n{C_GREEN}Hoàn tất! Đã cập nhật {count} file.{C_RESET}")

if __name__ == "__main__":
    auto_fill()
