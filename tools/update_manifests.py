#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VĂN ĐẠO ENGINE - TOOL: AUTO UPDATE MANIFESTS
Tự động quét thư mục agents/ và cập nhật danh mục file.
"""
import os, json
from pathlib import Path

ROOT = Path(__file__).parent.parent
AGENTS_DIR = ROOT / "js" / "ai" / "agents"
STATIC_MANIFEST = ROOT / "data" / "manifests" / "static-assets.json"
AGENTS_MANIFEST = ROOT / "data" / "manifests" / "agents-manifest.json"

def main():
    print("[INFO] Đang quét thư mục agents/...")
    # Lấy tất cả file .js trong agents (trừ index.js)
    agent_files = [f.stem for f in AGENTS_DIR.glob("*.js") if f.stem != "index"]
    agent_files.sort()

    # 1. Cập nhật agents-manifest.json
    with open(AGENTS_MANIFEST, "w", encoding="utf-8") as f:
        json.dump({"agents": agent_files}, f, ensure_ascii=False, indent=2)
    print(f"[OK] Đã cập nhật agents-manifest.json với {len(agent_files)} agents.")

    # 2. Cập nhật static-assets.json
    if STATIC_MANIFEST.exists():
        with open(STATIC_MANIFEST, "r", encoding="utf-8") as f:
            static = json.load(f)
    else:
        static = {}

    static["js_agents"] = ["js/ai/agents/index.js"] + [f"js/ai/agents/{name}.js" for name in agent_files]

    with open(STATIC_MANIFEST, "w", encoding="utf-8") as f:
        json.dump(static, f, ensure_ascii=False, indent=2)
    print("[OK] Đã cập nhật static-assets.json.")

if __name__ == "__main__":
    main()
