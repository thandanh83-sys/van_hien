# =====================================================================
# VĂN ĐẠO ENGINE - GITHUB ACTION: TỰ ĐỘNG CẬP NHẬT MANIFESTS
# Tên file: .github/workflows/auto-update-manifests.yml
# Version: 3.0.0 (Defensive Scan + Regression Guard + Summary)
# =====================================================================
# Tác giả: Văn Đạo
#
# TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY):
#
# 1. TỰ ĐỘNG HÓA THÔNG MINH (Smart Automation):
#    Bot tự phát hiện khi cấu trúc dự án thay đổi (thêm Agent mới,
#    thêm file CSS/JS, thêm asset, đổi cấu trúc graph node...) và
#    sinh lại 2 file manifest:
#      - data/manifests/agents-manifest.json
#      - data/manifests/static-assets.json
#    Nhờ đó Service Worker (sw.js) luôn có danh sách precache chính
#    xác mà con người không phải sửa tay.
#
# 2. CHỐNG VÒNG LẶP TUYỆT ĐỐI (Anti-Loop):
#    Trigger paths TUYỆT ĐỐI KHÔNG liệt kê 2 file output:
#      - data/manifests/static-assets.json
#      - data/manifests/agents-manifest.json
#    Nếu không, mỗi lần bot commit → lại trigger → vòng lặp vô tận.
#
# 3. XẾP HÀNG KỶ LUẬT (Concurrency):
#    Dùng chung group "git-push-group" với các bot tách dữ liệu
#    (auto-split-works, auto-split-authors) để tránh xung đột Git.
#    Mọi bot commit phải chạy tuần tự, không dẫm đạp lên nhau.
#
# 4. KIỂM TRA CÚ PHÁP TRƯỚC KHI CHẠY (Syntax Guard):
#    Luôn chạy `python -m py_compile` trước khi thực thi script.
#    Nếu script Python lỗi cú pháp, bot dừng ngay (fail-fast) thay
#    vì chạy nửa chừng rồi crash.
#
# 5. REGRESSION GUARD (v3.0.0 - MỚI):
#    Sau khi script chạy, verify lại output:
#      - JSON phải hợp lệ (parse được).
#      - 9 key bắt buộc phải có trong static-assets.json.
#      - js_ai/js_agents/js_core không được rỗng.
#      - js_ai PHẢI chứa file trong thư mục /nlp/ (regression test
#        cho lỗi scan thiếu recursive ở v2.0.0).
#    Nếu vi phạm → job fail ĐỎ ngay, chặn commit rác.
#
# 6. TRUNG THỰC & DỄ DEBUG (Honest Reporting):
#    - Chạy script với --verbose để log chi tiết từng file.
#    - In diff của 2 file manifest để review trên UI Actions.
#    - Ghi $GITHUB_STEP_SUMMARY để xem báo cáo trực quan.
#
# 7. AN TOÀN (Safety):
#    - timeout-minutes: 10 để tránh treo máy ảo.
#    - fetch-depth: 0 để lấy đủ lịch sử commit.
#    - permissions: contents: write để có quyền commit.
#    - push_attempts: 5 để chống Git lag.
#
# LỊCH SỬ PHIÊN BẢN:
#   v2.0.0: Full automation, 9 key manifest, preserve unknown keys.
#   v3.0.0: + Regression Guard (verify output sau khi chạy).
#           + Summary trên giao diện Actions.
#           + Trigger thêm sw.js (khi đổi logic precache).
#           + Comment chi tiết từng bước.
# =====================================================================

name: Auto Update Manifests

# =====================================================================
# 1. ĐIỀU KIỆN KÍCH HOẠT (TRIGGERS)
# =====================================================================
# Bot chỉ chạy khi các "nguồn sự thật" thay đổi. Tuyệt đối KHÔNG
# liệt kê 2 file output ở đây, để tránh vòng lặp vô tận.
# =====================================================================
on:
  push:
    paths:
      # --- JS: Có thể thêm Agent mới, thêm file lõi, thêm NLP ---
      # Pattern js/** khớp TẤT CẢ thư mục con:
      #   js/*.js               (main, config, utils, router, ...)
      #   js/ai/*.js            (core, master, input-ai, output-ai, ...)
      #   js/ai/nlp/*.js        (language-signals, intent-definitions, ...)
      #   js/ai/agents/*.js     (11 agents)
      #   js/network/*.js       (data-hub, bus, index)
      - 'js/**'

      # --- CSS: Thêm file stylesheet mới ---
      - 'css/**'

      # --- Assets: Ảnh, font, icon PWA ---
      - 'assets/**'

      # --- 9 file Data JSON chính (data/data-*.json) ---
      # Pattern data-*.json CHỈ khớp file có tiền tố "data-":
      #   ✅ data/data-ly-thuyet.json
      #   ✅ data/data-tac-pham.json
      #   ✅ data/data-tac-gia.json
      #   ❌ data/data-tac-pham-master.json (khớp, nhưng sẽ bị xóa bởi bot khác)
      #   ❌ data/tac-pham/truyen-kieu.json (KHÔNG khớp — tốt)
      - 'data/data-*.json'

      # --- Graph node: Manifests node đồ thị tri thức ---
      # Chỉ khớp 2 pattern cụ thể để KHÔNG bao gồm file output của bot:
      #   ✅ data/manifests/index.json
      #   ✅ data/manifests/node-*.json
      #   ❌ data/manifests/static-assets.json (file bot sinh ra)
      #   ❌ data/manifests/agents-manifest.json (file bot sinh ra)
      - 'data/manifests/index.json'
      - 'data/manifests/node-*.json'

      # --- Bản thân script cập nhật manifest ---
      # Khi logic scan thay đổi (VD: fix recursive, thêm nhóm mới)
      - 'tools/update_manifests.py'

      # --- Service Worker (v3.0.0 - MỚI) ---
      # Khi sw.js thay đổi logic đọc manifest hoặc chiến lược cache,
      # cần regenerate để đảm bảo version khớp.
      - 'sw.js'

  # Cho phép bấm nút chạy thủ công trên GitHub (Tab Actions)
  # để test bất cứ lúc nào mà không cần tạo commit mới.
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Chế độ Dry-run (chỉ xem, không ghi file)'
        required: false
        default: 'false'
        type: choice
        options: ['false', 'true']

# =====================================================================
# 2. QUẢN LÝ XUNG ĐỘT (CONCURRENCY)
# =====================================================================
# Dùng chung group với các bot tách dữ liệu để đảm bảo chạy tuần tự.
# Lý do: các bot này đều commit vào cùng nhánh main, nếu chạy song
# song sẽ xảy ra lỗi "non-fast-forward" khi push.
# =====================================================================
concurrency:
  group: git-push-group

  # KHÔNG hủy ngang khi có push mới, vì bot này rất nhanh (vài giây).
  # Nếu hủy giữa chừng có thể để lại trạng thái không nhất quán
  # (manifest ghi dở dang).
  cancel-in-progress: false

# =====================================================================
# 3. QUYỀN HẠN CỦA BOT (PERMISSIONS)
# =====================================================================
# Chỉ cần quyền ghi nội dung repo để commit 2 file manifest.
# Không cần quyền nào khác (pages, issues, PR...).
# =====================================================================
permissions:
  contents: write

# =====================================================================
# 4. BIẾN MÔI TRƯỜNG DÙNG CHUNG
# =====================================================================
env:
  PYTHON_VERSION: '3.10'
  SCRIPT_PATH: 'tools/update_manifests.py'
  STATIC_MANIFEST: 'data/manifests/static-assets.json'
  AGENTS_MANIFEST: 'data/manifests/agents-manifest.json'

# =====================================================================
# 5. CÁC BƯỚC THỰC THI (JOBS)
# =====================================================================
jobs:
  update-manifests:
    # Chạy trên máy ảo Ubuntu mới nhất của GitHub
    runs-on: ubuntu-latest

    # KỶ LUẬT THỜI GIAN: Tự động hủy nếu chạy quá 10 phút.
    # Script Python chỉ mất vài giây. Nếu quá 10 phút, chắc chắn có
    # lỗi (vòng lặp vô hạn, hoặc file quá lớn).
    timeout-minutes: 10

    steps:
      # -----------------------------------------------------------------
      # BƯỚC 1: LẤY CODE MỚI NHẤT TỪ KHO VỀ MÁY ẢO
      # -----------------------------------------------------------------
      - name: '1. Checkout code (Lấy code về)'
        uses: actions/checkout@v4
        with:
          # Lấy toàn bộ lịch sử commit (tránh lỗi shallow clone khi
          # bot commit tiếp). Nếu không có fetch-depth: 0, bot có thể
          # gặp lỗi "fatal: shallow update not allowed".
          fetch-depth: 0

      # -----------------------------------------------------------------
      # BƯỚC 2: CÀI ĐẶT MÔI TRƯỜNG PYTHON
      # -----------------------------------------------------------------
      - name: '2. Set up Python (Cài đặt Python)'
        uses: actions/setup-python@v5
        with:
          # Python 3.10 ổn định và tương thích tốt nhất với mọi script
          # trong tools/. Không cần cache pip vì script chỉ dùng stdlib.
          python-version: ${{ env.PYTHON_VERSION }}

      # -----------------------------------------------------------------
      # BƯỚC 3: KIỂM TRA PHIÊN BẢN & MÔI TRƯỜNG
      # -----------------------------------------------------------------
      # Bước nhỏ để dev xác nhận đúng môi trường trên UI Actions.
      - name: '3. Verify environment (Kiểm tra môi trường)'
        run: |
          echo "=== Thông tin môi trường ==="
          echo "Python: $(python --version 2>&1)"
          echo "Workspace: ${{ github.workspace }}"
          echo "Commit SHA: ${{ github.sha }}"
          echo "Actor: ${{ github.actor }}"
          echo "Event: ${{ github.event_name }}"
          echo ""
          echo "=== Cấu trúc thư mục (tóm tắt) ==="
          ls -la
          echo ""
          echo "=== Files trong tools/ ==="
          ls -la tools/ || echo "⚠️ Chưa có thư mục tools/"
          echo ""
          echo "=== Files trong js/ai/ ==="
          ls -la js/ai/ || echo "⚠️ Chưa có js/ai/"
          echo ""
          echo "=== Files trong js/ai/nlp/ ==="
          ls -la js/ai/nlp/ || echo "⚠️ Chưa có js/ai/nlp/"

      # -----------------------------------------------------------------
      # BƯỚC 4: KIỂM TRA CÚ PHÁP PYTHON (LÁ CHẮN AN TOÀN)
      # -----------------------------------------------------------------
      # "Ai gác cổng cũng phải biết võ". Đảm bảo bản thân script
      # update_manifests.py không bị lỗi cú pháp trước khi chạy thật.
      # Nếu lỗi, bước này báo đỏ và các bước sau không chạy.
      - name: '4. Check Python syntax (Kiểm tra cú pháp)'
        run: |
          echo "=== Kiểm tra cú pháp ${{ env.SCRIPT_PATH }} ==="
          python -m py_compile "${{ env.SCRIPT_PATH }}"
          echo "✅ Cú pháp hợp lệ."

      # -----------------------------------------------------------------
      # BƯỚC 5: CHẠY SCRIPT CẬP NHẬT MANIFEST (TRÁI TIM CỦA BOT)
      # -----------------------------------------------------------------
      # Script sẽ:
      #   - Quét toàn bộ thư mục dự án (js, css, assets, data)
      #   - Xây dựng 9 nhóm file trong static-assets.json
      #   - Sinh agents-manifest.json từ thư mục js/ai/agents/
      #   - In chi tiết từng bước và từng nhóm file (--verbose)
      #   - Bảo toàn key lạ trong static-assets.json (nếu có)
      #
      # Output: ghi đè 2 file:
      #   - data/manifests/static-assets.json
      #   - data/manifests/agents-manifest.json
      - name: '5. Run Update Manifests Script (Chạy script)'
        id: run-script
        # Cho phép chọn dry-run khi trigger thủ công
        run: |
          DRY_RUN="${{ github.event.inputs.dry_run || 'false' }}"
          if [ "$DRY_RUN" = "true" ]; then
            echo "=== CHẾ ĐỘ DRY-RUN: Sẽ KHÔNG ghi file ==="
            python "${{ env.SCRIPT_PATH }}" --dry-run --verbose
          else
            echo "=== CHẾ ĐỘ THẬT: Ghi file manifest ==="
            python "${{ env.SCRIPT_PATH }}" --verbose
          fi
          echo "exit_code=$?" >> $GITHUB_OUTPUT

      # -----------------------------------------------------------------
      # BƯỚC 6: REGRESSION GUARD (v3.0.0) — VERIFY OUTPUT SAU KHI CHẠY
      # -----------------------------------------------------------------
      # Đây là "cửa ải" cuối cùng để đảm bảo manifest sinh ra ĐÚNG:
      #   1. JSON phải parse được (không bị hỏng).
      #   2. static-assets.json phải có đủ 9 key bắt buộc.
      #   3. js_ai/js_agents/js_core không được rỗng.
      #   4. js_ai PHẢI chứa file trong /nlp/ → chống lỗi scan thiếu
      #      recursive (đây là bug của v2.0.0, đã fix ở v3.0.0).
      #   5. agents-manifest.json phải có ít nhất 1 agent.
      #
      # Nếu bất kỳ điều kiện nào fail → job dừng ĐỎ ngay, không commit.
      - name: '6. Verify manifest output (Kiểm tra kết quả)'
        if: github.event.inputs.dry_run != 'true'
        run: |
          echo "=== Kiểm tra output manifest ==="
          python3 - <<'PY'
          import json
          import sys
          from pathlib import Path

          STATIC = Path("data/manifests/static-assets.json")
          AGENTS = Path("data/manifests/agents-manifest.json")

          # ---- 1. Kiểm tra file tồn tại ----
          if not STATIC.exists():
              sys.exit(f"❌ THIẾU FILE: {STATIC}")
          if not AGENTS.exists():
              sys.exit(f"❌ THIẾU FILE: {AGENTS}")

          # ---- 2. Kiểm tra JSON hợp lệ ----
          try:
              static_data = json.loads(STATIC.read_text(encoding="utf-8"))
              agents_data = json.loads(AGENTS.read_text(encoding="utf-8"))
          except json.JSONDecodeError as e:
              sys.exit(f"❌ JSON HỎNG: {e}")

          # ---- 3. Kiểm tra 9 key bắt buộc ----
          REQUIRED_KEYS = [
              "root", "css", "js_core", "js_ai", "js_agents",
              "js_network", "json_data", "json_manifests", "assets"
          ]
          missing = [k for k in REQUIRED_KEYS if k not in static_data]
          if missing:
              sys.exit(f"❌ THIẾU KEY trong static-assets.json: {missing}")

          # ---- 4. Kiểm tra không rỗng ở các key quan trọng ----
          for key in ["js_core", "js_ai", "js_agents", "root"]:
              if not static_data[key]:
                  sys.exit(f"❌ KEY '{key}' RỖNG — có thể scan lỗi.")

          # ---- 5. REGRESSION TEST: js_ai phải chứa file /nlp/ ----
          # Đây là test chống tái phát bug "scan_glob thiếu recursive"
          # của update_manifests.py v2.0.0.
          ai_files_joined = " ".join(static_data["js_ai"])
          if "/js/ai/nlp/" not in ai_files_joined:
              sys.exit(
                  "❌ REGRESSION: js_ai KHÔNG chứa file trong /js/ai/nlp/. "
                  "Kiểm tra lại scan_glob trong tools/update_manifests.py — "
                  "phải dùng recursive=True cho thư mục nlp."
              )

          # ---- 6. Kiểm tra agents-manifest ----
          if "agents" not in agents_data or not agents_data["agents"]:
              sys.exit("❌ agents-manifest.json rỗng hoặc thiếu key 'agents'.")

          # ---- 7. Kiểm tra số lượng hợp lý ----
          print("\n=== Tổng kết manifest ===")
          for key in REQUIRED_KEYS:
              print(f"  {key:<16} : {len(static_data[key]):>4} file")
          print(f"  {'agents':<16} : {len(agents_data['agents']):>4} agent")
          print(f"\n✅ Manifest hợp lệ 100%.")
          PY

      # -----------------------------------------------------------------
      # BƯỚC 7: KIỂM TRA XEM CÓ SỰ THAY ĐỔI NÀO KHÔNG
      # -----------------------------------------------------------------
      # git diff --exit-code sẽ trả về mã lỗi nếu có thay đổi.
      # Nếu có thay đổi → ghi "changes=true" vào biến output của step.
      # Điều này tránh việc bot tạo ra commit rỗng (khi manifest
      # không đổi vì thư mục không thay đổi).
      - name: '7. Check for changes (Kiểm tra thay đổi)'
        id: git-check
        if: github.event.inputs.dry_run != 'true'
        run: |
          echo "=== Kiểm tra thay đổi ==="
          if git diff --quiet "${{ env.STATIC_MANIFEST }}" "${{ env.AGENTS_MANIFEST }}"; then
            echo "Không có thay đổi nào trong 2 file manifest."
            echo "changes=false" >> $GITHUB_OUTPUT
          else
            echo "Phát hiện thay đổi trong manifest."
            echo "changes=true" >> $GITHUB_OUTPUT
          fi

      # -----------------------------------------------------------------
      # BƯỚC 8: IN DIFF ĐỂ DEBUG (LOG CHI TIẾT)
      # -----------------------------------------------------------------
      # In ra những file thay đổi và nội dung tóm tắt để con người
      # có thể review trên giao diện Actions trước khi commit.
      - name: '8. Print diff for debugging (In diff)'
        if: |
          github.event.inputs.dry_run != 'true' &&
          steps.git-check.outputs.changes == 'true'
        run: |
          echo "======================================================="
          echo "  CÁC FILE ĐÃ THAY ĐỔI"
          echo "======================================================="
          git diff --stat

          echo ""
          echo "======================================================="
          echo "  DIFF CHI TIẾT: static-assets.json"
          echo "======================================================="
          git diff "${{ env.STATIC_MANIFEST }}" | head -n 120 || echo "(diff quá dài, chỉ hiện 120 dòng đầu)"

          echo ""
          echo "======================================================="
          echo "  DIFF CHI TIẾT: agents-manifest.json"
          echo "======================================================="
          git diff "${{ env.AGENTS_MANIFEST }}" | head -n 80 || echo "(diff quá dài, chỉ hiện 80 dòng đầu)"

      # -----------------------------------------------------------------
      # BƯỚC 9: TỰ ĐỘNG COMMIT VÀ PUSH (CÓ CƠ CHẾ THỬ LẠI)
      # -----------------------------------------------------------------
      # Chỉ chạy nếu bước 7 báo có sự thay đổi (changes == 'true')
      # và không phải dry-run.
      - name: '9. Commit and Push (Commit & Push)'
        if: |
          github.event.inputs.dry_run != 'true' &&
          steps.git-check.outputs.changes == 'true'
        uses: EndBug/add-and-commit@v11
        with:
          # Tin nhắn commit chuẩn, dễ đọc trong git log.
          # ĐÃ XÓA [skip ci] để deploy.yml có thể chạy và đẩy
          # manifest mới lên web cho Service Worker.
          message: "chore: auto-update manifests for agents and static assets"

          # Tự động thử lại 5 lần nếu Push gặp sự cố mạng hoặc Git lag.
          push_attempts: 5

          # Tác giả commit là GitHub Actions.
          default_author: github_actions

          # CHỈ add 2 file manifest — không add các file khác.
          # Đây là lá chắn cuối để tránh bot vô tình commit file rác.
          add: |
            data/manifests/static-assets.json
            data/manifests/agents-manifest.json

      # -----------------------------------------------------------------
      # BƯỚC 10: TÓM TẮT TRÊN GIAO DIỆN ACTIONS (v3.0.0)
      # -----------------------------------------------------------------
      # Ghi báo cáo trực quan lên $GITHUB_STEP_SUMMARY để dev xem
      # ngay trên trang Actions, không cần scroll log.
      # Chạy BẤT KỂ job thành công hay thất bại (if: always()).
      - name: '10. Summary (Báo cáo trên giao diện Actions)'
        if: always()
        run: |
          {
            echo "## 🧾 Văn Đạo Manifest Update"
            echo ""
            echo "| Hạng mục | Giá trị |"
            echo "|---|---|"
            echo "| Trạng thái | \`${{ job.status }}\` |"
            echo "| Có thay đổi | \`${{ steps.git-check.outputs.changes || 'false' }}\` |"
            echo "| Dry-run | \`${{ github.event.inputs.dry_run || 'false' }}\` |"
            echo "| Commit SHA | \`${{ github.sha }}\` |"
            echo "| Người kích hoạt | @${{ github.actor }} |"
            echo "| Trigger bởi | \`${{ github.event_name }}\` |"
            echo ""
            echo "### Thông điệp"
            echo ""
            if [ "${{ steps.git-check.outputs.changes }}" = "true" ]; then
              echo "✅ Manifest ĐÃ thay đổi và được commit tự động."
            else
              echo "ℹ️ Manifest KHÔNG thay đổi (không tạo commit rỗng)."
            fi
          } >> $GITHUB_STEP_SUMMARY
