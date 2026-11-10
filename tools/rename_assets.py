import os
import shutil
import re
import sys

# =====================================================================
# CẤU HÌNH MÀU SẮC CHO TERMINAL
# =====================================================================
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_CYAN = "\033[96m"
C_RESET = "\033[0m"

# =====================================================================
# CẤU HÌNH ĐƯỜNG DẪN VÀ DANH SÁCH FILE
# =====================================================================
ASSETS_DIR = "assets"

# Danh sách các file cần xử lý (bao gồm cả tên có dấu gạch dưới và gạch ngang)
# Chúng ta chỉ giữ lại 3 file Bạch Ngọc
LIGHT_ASSETS = {
    "nen-sang":   {"old_names": ["anh-nen-sang.jpg", "anh-nen_sang.jpg"], "new_name": "nen-sang.jpg"},
    "khung-sang": {"old_names": ["anh-khung-sang.jpg", "anh-khung_sang.jpg"], "new_name": "khung-sang.jpg"},
    "logo-trang": {"old_names": ["anh-logo-trang.png", "anh-logo_trang.png"], "new_name": "logo-trang.png"}
}

# Danh sách các file rác (Chế độ Tối cũ) cần xóa vĩnh viễn
DARK_ASSETS_TO_DELETE = [
    "anh-nen-toi.jpg", "anh-nen_toi.jpg",
    "anh-khung-toi.jpg", "anh-khung_toi.jpg",
    "anh-logo-toi.png", "anh-logo_toi.png"
]

# Các file code cần quét và sửa đường dẫn
CODE_FILES_TO_FIX = ["index.html", "style.css", "script.js", "sw.js", "manifest.json"]

# =====================================================================
# HÀM HỖ TRỢ
# =====================================================================
def print_status(icon, color, message):
    print(f"{color}[{icon}]{C_RESET} {message}")

def backup_files():
    """Sao lưu các file code quan trọng trước khi sửa"""
    backup_dir = "tools/backup_code"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        
    print_status("📦", C_CYAN, "Đang sao lưu các file code để đề phòng...")
    for file in CODE_FILES_TO_FIX:
        if os.path.exists(file):
            shutil.copy2(file, os.path.join(backup_dir, file))
    print_status("✅", C_GREEN, f"Đã sao lưu vào thư mục: {backup_dir}/")

# =====================================================================
# BƯỚC 1: DI CHUYỂN, ĐỔI TÊN VÀ DỌN DẸP ẢNH
# =====================================================================
def process_assets():
    if not os.path.exists(ASSETS_DIR):
        os.makedirs(ASSETS_DIR)
        print_status("📁", C_CYAN, f"Đã tạo thư mục: {ASSETS_DIR}/")

    print("\n" + "="*50)
    print_status("🚀", C_CYAN, "BƯỚC 1: XỬ LÝ FILE HÌNH ẢNH")
    print("="*50)

    # 1.1 Dọn dẹp file Tối (Xóa)
    for dark_file in DARK_ASSETS_TO_DELETE:
        # Kiểm tra ở thư mục gốc
        if os.path.exists(dark_file):
            os.remove(dark_file)
            print_status("🗑️", C_RED, f"Đã xóa file Tối ở gốc: {dark_file}")
        # Kiểm tra trong thư mục assets
        path_in_assets = os.path.join(ASSETS_DIR, dark_file)
        if os.path.exists(path_in_assets):
            os.remove(path_in_assets)
            print_status("🗑️", C_RED, f"Đã xóa file Tối trong assets: {dark_file}")

    # 1.2 Di chuyển và đổi tên file Sáng
    for key, data in LIGHT_ASSETS.items():
        target_path = os.path.join(ASSETS_DIR, data["new_name"])
        
        for old_name in data["old_names"]:
            # Trường hợp 1: File đang nằm ở thư mục gốc
            if os.path.exists(old_name):
                shutil.move(old_name, target_path)
                print_status("✅", C_GREEN, f"Đã chuyển: {old_name} -> {target_path}")
                break # Đã tìm thấy và chuyển, thoát vòng lặp tên cũ
            
            # Trường hợp 2: File đã nằm trong assets/ nhưng chưa đổi tên
            old_path_in_assets = os.path.join(ASSETS_DIR, old_name)
            if os.path.exists(old_path_in_assets):
                os.rename(old_path_in_assets, target_path)
                print_status("✅", C_GREEN, f"Đã đổi tên trong assets: {old_name} -> {data['new_name']}")
                break

# =====================================================================
# BƯỚC 2: TỰ ĐỘNG SỬA ĐƯỜNG DẪN TRONG CODE
# =====================================================================
def fix_code_references():
    print("\n" + "="*50)
    print_status("🛠️", C_CYAN, "BƯỚC 2: CẬP NHẬT ĐƯỜNG DẪN TRONG CODE")
    print("="*50)

    # Xây dựng bộ Regex tìm kiếm và chuỗi thay thế
    replacements = [
        # Xóa các tiền tố dư thừa (./) và đưa về chuẩn assets/
        (r'((\.\/)?assets\/)?anh-nen[-_]sang\.jpg', 'assets/nen-sang.jpg'),
        (r'((\.\/)?assets\/)?anh-khung[-_]sang\.jpg', 'assets/khung-sang.jpg'),
        (r'((\.\/)?assets\/)?anh-logo[-_]trang\.png', 'assets/logo-trang.png')
    ]

    for file in CODE_FILES_TO_FIX:
        if not os.path.exists(file):
            print_status("⚠️", C_YELLOW, f"Bỏ qua (Không tìm thấy): {file}")
            continue

        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        changes_made = 0

        for pattern, replacement in replacements:
            # Thay thế tất cả các biến thể của đường dẫn
            new_content, count = re.subn(pattern, replacement, content)
            if count > 0:
                content = new_content
                changes_made += count

        # Nếu có sự thay đổi, ghi lại vào file
        if content != original_content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print_status("✅", C_GREEN, f"Đã sửa {changes_made} đường dẫn trong: {file}")
        else:
            print_status("ℹ️", C_YELLOW, f"Không có thay đổi nào trong: {file}")

# =====================================================================
# BƯỚC 3: KIỂM TRA KẾT QUẢ
# =====================================================================
def verify_results():
    print("\n" + "="*50)
    print_status("🔍", C_CYAN, "BƯỚC 3: KIỂM TRA KẾT QUẢ")
    print("="*50)

    missing = False
    for key, data in LIGHT_ASSETS.items():
        target_path = os.path.join(ASSETS_DIR, data["new_name"])
        if os.path.exists(target_path):
            size_kb = os.path.getsize(target_path) / 1024
            print_status("✅", C_GREEN, f"Tìm thấy: {target_path} ({size_kb:.1f} KB)")
        else:
            print_status("❌", C_RED, f"LỖI: Không tìm thấy {target_path}!")
            missing = True

    if missing:
        print_status("⚠️", C_YELLOW, "Vui lòng kiểm tra lại xem bạn đã tải ảnh lên đúng chưa!")
    else:
        print_status("🎉", C_GREEN, "HOÀN HẤT! Cấu trúc ảnh đã chuẩn 100%.")

# =====================================================================
# KHỞI CHẠY CHÍNH
# =====================================================================
if __name__ == "__main__":
    print_status("✨", C_CYAN, "BẮT ĐẦU QUÁ TRÌNH CHUẨN HÓA THƯ MỤC VĂN ĐẠO")
    
    try:
        backup_files()
        process_assets()
        fix_code_references()
        verify_results()
        
        print("\n" + "="*50)
        print_status("💡", C_YELLOW, "LƯU Ý: Hãy nhớ tăng Version trong sw.js lên (VD: v2.4)")
        print_status("💡", C_YELLOW, "Sau đó tải lại App (F5) để nhận diện ảnh mới nhé!")
        print("="*50)
        
    except Exception as e:
        print_status("❌", C_RED, f"Đã xảy ra lỗi: {e}")
        sys.exit(1)
