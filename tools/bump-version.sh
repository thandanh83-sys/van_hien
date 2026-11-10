#!/usr/bin/env bash
# =====================================================================
# VĂN ĐẠO ENGINE - TOOL: BUMP VERSION (TĂNG PHIÊN BẢN TỰ ĐỘNG)
# =====================================================================
# Tác giả: Văn Đạo
# Mô tả: 
# - Cập nhật số Version trong sw.js, manifest.json, script.js
# - Tự động đổi tham số ?v=... trong index.html để phá vỡ Cache HTTP
# - Tuân thủ quy tắc: 100% Text, KHÔNG dùng Emoji/Icon Unicode.
# =====================================================================

# 1. Khai báo màu sắc Terminal (ANSI Colors)
C_TEAL="\033[96m"
C_GOLD="\033[93m"
C_GRAY="\033[90m"
C_GREEN="\033[92m"
C_RED="\033[91m"
C_RESET="\033[0m"

# 2. Lấy tham số đầu vào
NEW_VERSION="$1"
TODAY=$(date +%Y-%m-%d)

if [ -z "$NEW_VERSION" ]; then
    printf "${C_RED}[LỖI]${C_RESET} Thiếu tham số phiên bản.\n"
    printf "Cách dùng: bash tools/bump-version.sh 2.5\n"
    exit 1
fi

printf "\n${C_TEAL}=====================================================================${C_RESET}\n"
printf "${C_GOLD}  VĂN ĐẠO ENGINE - NÂNG CẤP PHIÊN BẢN HỆ THỐNG${C_RESET}\n"
printf "${C_TEAL}=====================================================================${C_RESET}\n"
printf "${C_GRAY}  Phiên bản mới: v${NEW_VERSION} | Ngày cập nhật: ${TODAY}${C_RESET}\n\n"

# 3. Hàm xử lý thay thế chuỗi (Tương thích cả Mac và Linux)
replace_in_file() {
    local file="$1"
    local search="$2"
    local replace="$3"
    
    if [ ! -f "$file" ]; then
        printf "  ${C_RED}[LỖI]${C_RESET} Không tìm thấy file: %s\n" "$file"
        return 1
    fi
    
    # Tạo file backup tạm (.bak) để tương thích chéo giữa Mac và Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|$search|$replace|g" "$file"
    else
        sed -i "s|$search|$replace|g" "$file"
    fi
    
    printf "  ${C_GREEN}[CẬP NHẬT]${C_RESET} Đã sửa thành công: %s\n" "$file"
}

# 4. Tiến hành cập nhật từng file
printf "${C_GOLD}> BƯỚC 1: CẬP NHẬT CÁC FILE CẤU HÌNH${C_RESET}\n"

# Cập nhật Service Worker (sw.js)
replace_in_file "sw.js" \
    "const CACHE_VERSION = '[^']*'" \
    "const CACHE_VERSION = 'vandao-final-v${NEW_VERSION}'"

# Cập nhật Manifest (manifest.json)
replace_in_file "manifest.json" \
    "\"version\": \"[^\"]*\"" \
    "\"version\": \"${NEW_VERSION}\""

# Cập nhật Script chính (script.js)
replace_in_file "script.js" \
    "window.VD_APP_VERSION = '[^']*'" \
    "window.VD_APP_VERSION = '${NEW_VERSION}'"

replace_in_file "script.js" \
    "window.VD_BUILD_DATE  = '[^']*'" \
    "window.VD_BUILD_DATE  = '${TODAY}'"

# 5. Cập nhật Cache Busting trong index.html
printf "\n${C_GOLD}> BƯỚC 2: PHÁ VỠ CACHE TRÌNH DUYỆT (index.html)${C_RESET}\n"
if [ -f "index.html" ]; then
    # Thay thế ?v=... của style.css và script.js
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' -E "s/(style\.css)\?v=[0-9a-zA-Z._-]+/\1?v=${NEW_VERSION}/g" "index.html"
        sed -i '' -E "s/(script\.js)\?v=[0-9a-zA-Z._-]+/\1?v=${NEW_VERSION}/g" "index.html"
    else
        sed -i -E "s/(style\.css)\?v=[0-9a-zA-Z._-]+/\1?v=${NEW_VERSION}/g" "index.html"
        sed -i -E "s/(script\.js)\?v=[0-9a-zA-Z._-]+/\1?v=${NEW_VERSION}/g" "index.html"
    fi
    printf "  ${C_GREEN}[CẬP NHẬT]${C_RESET} Đã đổi tham số ?v= trong index.html\n"
else
    printf "  ${C_RED}[BỎ QUA]${C_RESET} Không tìm thấy index.html\n"
fi

printf "\n${C_TEAL}=====================================================================${C_RESET}\n"
printf "${C_GREEN}  HOÀN TẤT!${C_RESET} Hệ thống đã được nâng lên phiên bản v${NEW_VERSION}\n"
printf "${C_GRAY}  Bước tiếp theo: Chạy 'git add .' và 'git commit -m \"build: release v${NEW_VERSION}\"'${C_RESET}\n"
printf "${C_TEAL}=====================================================================${C_RESET}\n\n"
