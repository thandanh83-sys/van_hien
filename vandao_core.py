#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - PYTHON CORE (ULTIMATE EDITION V3 - FIXED)
=====================================================================
Tác giả: Văn Đạo
Mô tả: Bộ máy phân tích thi pháp tất định (Deterministic) và
       Kiểm soát tri thức (Epistemic Layer) dành cho Văn học.
       Đã sửa lỗi hiển thị tiếng Việt trên Windows Terminal.
=====================================================================
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

# --- FIX LỖI FONT TIẾNG VIỆT TRÊN WINDOWS TERMINAL ---
if sys.platform == "win32":
    os.system("")
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

# =====================================================================
# I. EPISTEMIC LAYER (TẦNG KIỂM SOÁT TRI THỨC)
# =====================================================================
class Level(str, Enum):
    FACT = "Dữ kiện"
    HYPOTHESIS = "Giả thuyết"
    INTERPRETATION = "Diễn giải"
    FEELING = "Cảm nhận"

class Confidence(str, Enum):
    VERIFIED = "Đã xác minh"
    TENTATIVE = "Tạm thời"
    CONTESTED = "Còn tranh luận"
    UNVERIFIED = "Chưa xác minh"
    MISSING = "Thiếu nguồn"

@dataclass
class Reference:
    source: str
    status: Confidence = Confidence.UNVERIFIED
    location: str = ""

@dataclass
class Claim:
    content: str
    level: Level
    text_excerpt: str = ""
    location: str = ""
    references: list[Reference] = field(default_factory=list)
    confidence: Confidence = Confidence.UNVERIFIED

    def validate(self) -> list[str]:
        warnings = []
        if self.level is Level.FACT:
            if not self.references:
                warnings.append("FACT không có Reference (Cần nguồn dẫn).")
            elif not any(r.status is Confidence.VERIFIED for r in self.references):
                warnings.append("FACT không có Reference đã xác minh.")
        if self.level is Level.INTERPRETATION:
            if not self.text_excerpt and not self.references:
                warnings.append("INTERPRETATION thiếu cả trích dẫn văn bản và Reference.")
        return warnings

# =====================================================================
# II. TẦNG 1: CORPUS & VĂN BẢN HỌC
# =====================================================================
@dataclass
class Poem:
    title: str
    lines: list[str]
    author: str = "Khuyết danh"
    source_status: Confidence = Confidence.UNVERIFIED

    def full_text(self) -> str:
        return "\n".join(self.lines)

# =====================================================================
# III. TẦNG 2: FORMAL ANALYSIS (PHÂN TÍCH HÌNH THỨC)
# =====================================================================
class FormalAnalyzer:
    _TONE_MARKS = {
        "\u0300": "huyền", "\u0301": "sắc", "\u0303": "ngã",
        "\u0309": "hỏi", "\u0323": "nặng",
    }
    _BANG_TONES = {"ngang", "huyền"}
    _INITIALS = sorted(
        ["ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "th", "tr", "qu",
         "b", "c", "d", "đ", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "x"],
        key=len, reverse=True
    )

    @staticmethod
    def tokenize(line: str) -> list[str]:
        return re.findall(r"[a-zA-Zà-ỹÀ-ỸđĐ]+", line, re.UNICODE)

    @classmethod
    def get_tone(cls, syllable: str) -> str:
        nfd = unicodedata.normalize("NFD", syllable.lower())
        for ch in nfd:
            if ch in cls._TONE_MARKS:
                return cls._TONE_MARKS[ch]
        return "ngang"

    @classmethod
    def strip_tone(cls, syllable: str) -> str:
        nfd = unicodedata.normalize("NFD", syllable.lower())
        kept = "".join(ch for ch in nfd if ch not in cls._TONE_MARKS)
        return unicodedata.normalize("NFC", kept)

    @classmethod
    def get_rhyme(cls, syllable: str) -> str:
        stripped = cls.strip_tone(syllable)
        for ini in cls._INITIALS:
            if stripped.startswith(ini) and len(stripped) > len(ini):
                return stripped[len(ini):]
        return stripped

    @classmethod
    def analyze(cls, poem: Poem) -> dict[str, Any]:
        result = []
        counts = []
        for i, line in enumerate(poem.lines, 1):
            syllables = cls.tokenize(line)
            counts.append(len(syllables))
            tones = [cls.get_tone(s) for s in syllables]
            pattern = " - ".join(["B" if t in cls._BANG_TONES else "T" for t in tones])
            last_rhyme = cls.get_rhyme(syllables[-1]) if syllables else ""
            result.append({
                "line_number": i, "text": line, "syllables": syllables,
                "syllable_count": len(syllables), "pattern": pattern,
                "tones": tones, "last_rhyme": last_rhyme
            })
            
        is_68 = bool(counts) and counts[0] == 6 and all(
            c == (6 if i % 2 == 0 else 8) for i, c in enumerate(counts)
        )
        
        rhyme_analysis = []
        if is_68:
            for i in range(0, len(result) - 1, 2):
                luc, bat = result[i], result[i + 1]
                rhyme_analysis.append({
                    "pair": f"L{luc['line_number']}-B{bat['line_number']}",
                    "rhyme_1": luc["last_rhyme"], "rhyme_2": bat["last_rhyme"],
                    "match": luc["last_rhyme"] == bat["last_rhyme"]
                })
        
        return {
            "lines": result, "total_syllables": sum(counts), "total_lines": len(result),
            "is_68_pattern": is_68, "rhyme_analysis": rhyme_analysis,
            "conclusion": "Văn bản có cấu trúc luân phiên 6-8 tiếng (Lục bát)." if is_68 else "Văn bản không theo cấu trúc 6-8 cố định."
        }

# =====================================================================
# IV. TẦNG 3: KNOWLEDGE GRAPH
# =====================================================================
KNOWLEDGE_BASE = {
    "biểu tượng": {
        "trăng": ["Hoài niệm", "Đoàn viên"], "nước": ["Thời gian", "Dòng đời"],
        "tùng": ["Khí tiết", "Bền bỉ"], "liễu": ["Tiễn biệt", "Chia ly"],
        "sen": ["Thanh khiết"], "mai": ["Mùa xuân", "Sức sống"],
    },
    "tư tưởng": {
        "Nho gia": ["nhân", "nghĩa", "lễ", "trí", "tín"],
        "Đạo gia": ["vô vi", "tự nhiên", "tiêu dao"],
        "Phật giáo": ["vô thường", "vô ngã", "từ bi"]
    }
}

def extract_knowledge(text: str) -> dict[str, list[str]]:
    found = {"biểu tượng": [], "tư tưởng": []}
    lower_text = text.lower()
    for category, items in KNOWLEDGE_BASE.items():
        for key in items.keys():
            if key.lower() in lower_text:
                found[category].append(key)
    return found

# =====================================================================
# V. BỘ MÁY ĐIỀU KHIỂN VÀ RENDER (TERMINAL UI)
# =====================================================================
class VanDaoEngine:
    C_TEAL = "\033[96m"; C_GOLD = "\033[93m"; C_GRAY = "\033[90m"
    C_GREEN = "\033[92m"; C_RED = "\033[91m"; C_RESET = "\033[0m"

    @classmethod
    def render_header(cls, poem: Poem) -> None:
        print(f"\n{cls.C_TEAL}------------------------------------------------------{cls.C_RESET}")
        print(f"{cls.C_TEAL}|{cls.C_RESET} {cls.C_GOLD}VĂN ĐẠO ENGINE - BÁO CÁO PHÂN TÍCH{cls.C_RESET}")
        print(f"{cls.C_TEAL}------------------------------------------------------{cls.C_RESET}")
        print(f"{cls.C_TEAL}|{cls.C_RESET} {cls.C_GOLD}Tác phẩm:{cls.C_RESET} {poem.title}")
        print(f"{cls.C_TEAL}|{cls.C_RESET} {cls.C_GOLD}Tác giả :{cls.C_RESET} {poem.author}")
        print(f"{cls.C_TEAL}|{cls.C_RESET} {cls.C_GOLD}Nguồn   :{cls.C_RESET} {poem.source_status.value}")
        print(f"{cls.C_TEAL}------------------------------------------------------{cls.C_RESET}\n")

    @classmethod
    def render_formal(cls, analysis: dict[str, Any]) -> list[Claim]:
        print(f"{cls.C_GOLD}> TẦNG 2: PHÂN TÍCH HÌNH THỨC (Dữ kiện tất định){cls.C_RESET}\n")
        for line in analysis["lines"]:
            print(f"  {cls.C_GRAY}{line['line_number']:02d}.{cls.C_RESET} {line['text']}")
            print(f"      {cls.C_GRAY}-> {line['syllable_count']} tiếng | Thanh điệu: {line['pattern']} | Vần: '{line['last_rhyme']}'{cls.C_RESET}")
        
        claims = [Claim(content=analysis["conclusion"], level=Level.FACT, references=[Reference(source="Thuật toán NFD", status=Confidence.VERIFIED)])]
        if analysis["rhyme_analysis"]:
            matched = sum(1 for r in analysis["rhyme_analysis"] if r["match"])
            total = len(analysis["rhyme_analysis"])
            claims.append(Claim(content=f"Tỷ lệ gieo vần chính: {matched}/{total} cặp vần khớp nhau.", level=Level.FACT, references=[Reference(source="Thuật toán vần", status=Confidence.VERIFIED)]))
        return claims

    @classmethod
    def render_epistemic(cls, claims: list[Claim], knowledge: dict[str, list[str]]) -> None:
        print(f"\n{cls.C_GOLD}> TẦNG 3: ĐÁNH GIÁ NHẬN THỨC (Epistemic Layer){cls.C_RESET}\n")
        for c in claims:
            warnings = c.validate()
            status_color = cls.C_GREEN if not warnings else cls.C_RED
            print(f"  {status_color}[{c.level.value}]{cls.C_RESET} {c.content}")
            if c.references:
                print(f"      {cls.C_GRAY}Nguồn: {c.references[0].source}{cls.C_RESET}")
            for w in warnings:
                print(f"      {cls.C_RED}[!] {w}{cls.C_RESET}")
        
        print()
        if knowledge["biểu tượng"]:
            print(f"  {cls.C_TEAL}[Diễn giải]{cls.C_RESET} Biểu tượng: {', '.join(knowledge['biểu tượng'])}")
        if knowledge["tư tưởng"]:
            print(f"  {cls.C_TEAL}[Giả thuyết]{cls.C_RESET} Tư tưởng: {', '.join(knowledge['tư tưởng'])}")
        if not knowledge["biểu tượng"] and not knowledge["tư tưởng"]:
            print(f"  {cls.C_GRAY}[Trống] Không phát hiện biểu tượng hay tư tưởng nào.{cls.C_RESET}")

    @classmethod
    def run(cls, poem: Poem) -> None:
        cls.render_header(poem)
        analysis = FormalAnalyzer.analyze(poem)
        claims = cls.render_formal(analysis)
        knowledge = extract_knowledge(poem.full_text())
        cls.render_epistemic(claims, knowledge)
        print(f"\n{cls.C_GRAY}{'-'*54}{cls.C_RESET}")
        print(f"{cls.C_GRAY}* Báo cáo này là phân tích tất định (deterministic).{cls.C_RESET}")
        print(f"{cls.C_GRAY}* Mọi nhận định về 'Hồn thơ' cần được thực hiện bởi con người.{cls.C_RESET}\n")

# =====================================================================
# VI. GIAO DIỆN DÒNG LỆNH (CLI)
# =====================================================================
def main() -> int:
    parser = argparse.ArgumentParser(description="VĂN ĐẠO ENGINE - Phân tích thi pháp.")
    parser.add_argument("--title", type=str, default="Bài thơ chưa đặt tên", help="Tên bài thơ")
    parser.add_argument("--author", type=str, default="Khuyết danh", help="Tác giả")
    parser.add_argument("--text", type=str, help="Nội dung bài thơ (dùng \\n để xuống dòng)")
    parser.add_argument("--file", type=str, help="Đường dẫn file .txt chứa bài thơ")
    
    args = parser.parse_args()
    poem_text = ""
    source_status = Confidence.UNVERIFIED
    
    if args.file:
        try:
            poem_text = Path(args.file).read_text(encoding="utf-8")
        except FileNotFoundError:
            print(f"Lỗi: Không tìm thấy file {args.file}", file=sys.stderr)
            return 1
    elif args.text:
        poem_text = args.text.replace("\\n", "\n")
    else:
        poem_text = (
            "Quạt giấy khép lại mùa thi,\n"
            "Áo dài bay giữa kinh kỳ sắc xuân.\n"
            "Thầy cô tựa ánh trăng ngần,\n"
            "Dắt em qua những thăng trầm thế gian."
        )
        print(f"\n{VanDaoEngine.C_GRAY}* Không có tham số. Đang phân tích dữ liệu mẫu.{VanDaoEngine.C_RESET}")

    poem = Poem(title=args.title, author=args.author, lines=[line.strip() for line in poem_text.split("\n") if line.strip()], source_status=source_status)
    VanDaoEngine.run(poem)
    return 0

if __name__ == "__main__":
    sys.exit(main())
