#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - PYTHON CORE (ULTIMATE EDITION V2)
=====================================================================
Tác giả: Văn Đạo
Mô tả: Bộ máy phân tích thi pháp tất định (Deterministic) và
       Kiểm soát tri thức (Epistemic Layer) dành cho Văn học.

Kiến trúc "Nhất Khí Hóa Tam Thanh":
- Tầng 1 (Corpus): Đọc và bảo tồn văn bản gốc.
- Tầng 2 (Formal): Bóc tách số tiếng, thanh điệu (NFD), vần điệu.
- Tầng 3 (Epistemic): Đánh giá, phân tầng nhận thức và tra cứu biểu tượng.

Cách chạy:
    python vandao_core.py
    python vandao_core.py --text "Quạt giấy khép lại mùa thi,\nÁo dài bay giữa kinh kỳ sắc xuân."
    python vandao_core.py --file poem.txt --title "Tên bài thơ"
=====================================================================
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

# =====================================================================
# I. EPISTEMIC LAYER (TẦNG KIỂM SOÁT TRI THỨC)
# =====================================================================
class Level(str, Enum):
    """Bốn cấp độ nhận thức - Bộ lọc bắt buộc."""
    FACT = "Dữ kiện"
    HYPOTHESIS = "Giả thuyết"
    INTERPRETATION = "Diễn giải"
    FEELING = "Cảm nhận"


class Confidence(str, Enum):
    """Trạng thái tin cậy của một nhận định."""
    VERIFIED = "Đã xác minh"
    TENTATIVE = "Tạm thời"
    CONTESTED = "Còn tranh luận"
    UNVERIFIED = "Chưa xác minh"
    MISSING = "Thiếu nguồn"


@dataclass
class Reference:
    """Nguồn tham chiếu cho một Claim."""
    source: str
    status: Confidence = Confidence.UNVERIFIED
    location: str = ""


@dataclass
class Claim:
    """Đơn vị nhận định có provenance (nguồn gốc)."""
    content: str
    level: Level
    text_excerpt: str = ""
    location: str = ""
    references: list[Reference] = field(default_factory=list)
    confidence: Confidence = Confidence.UNVERIFIED

    def validate(self) -> list[str]:
        """Kiểm tra tính hợp lệ của Claim. Trả về danh sách cảnh báo."""
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
    """Đối tượng lưu trữ bài thơ gốc."""
    title: str
    lines: list[str]
    author: str = "Khuyết danh"
    source_status: Confidence = Confidence.UNVERIFIED

    def full_text(self) -> str:
        """Trả về toàn bộ văn bản thơ dưới dạng chuỗi."""
        return "\n".join(self.lines)


# =====================================================================
# III. TẦNG 2: FORMAL ANALYSIS (PHÂN TÍCH HÌNH THỨC)
# =====================================================================
class FormalAnalyzer:
    """Bộ máy phân tích ngữ âm và cấu trúc thơ tất định."""
    
    # Bảng tra dấu thanh trong chuẩn NFD (Unicode)
    # Ngang: không dấu | Huyền, Sắc, Ngã, Hỏi, Nặng: có dấu
    _TONE_MARKS = {
        "\u0300": "huyền",
        "\u0301": "sắc",
        "\u0303": "ngã",
        "\u0309": "hỏi",
        "\u0323": "nặng",
    }
    _BANG_TONES = {"ngang", "huyền"}
    
    # Phụ âm đầu tiếng Việt (xếp theo độ dài giảm dần để khớp chính xác)
    _INITIALS = sorted(
        ["ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "th", "tr", "qu",
         "b", "c", "d", "đ", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "x"],
        key=len, reverse=True
    )

    @staticmethod
    def tokenize(line: str) -> list[str]:
        """Tách từ tiếng Việt, loại bỏ dấu câu và số."""
        # Regex chỉ lấy chữ cái tiếng Việt (bao gồm cả chữ có dấu)
        return re.findall(r"[a-zA-Zà-ỹÀ-ỸđĐ]+", line, re.UNICODE)

    @classmethod
    def get_tone(cls, syllable: str) -> str:
        """Lấy thanh điệu của một âm tiết bằng NFD."""
        nfd = unicodedata.normalize("NFD", syllable.lower())
        for ch in nfd:
            if ch in cls._TONE_MARKS:
                return cls._TONE_MARKS[ch]
        return "ngang"

    @classmethod
    def strip_tone(cls, syllable: str) -> str:
        """Bỏ dấu thanh, giữ nguyên dấu mũ/móc (ă, â, ê, ô, ơ, ư, đ)."""
        nfd = unicodedata.normalize("NFD", syllable.lower())
        kept = "".join(ch for ch in nfd if ch not in cls._TONE_MARKS)
        return unicodedata.normalize("NFC", kept)

    @classmethod
    def get_rhyme(cls, syllable: str) -> str:
        """Lấy phần vần (bỏ phụ âm đầu và dấu thanh)."""
        stripped = cls.strip_tone(syllable)
        for ini in cls._INITIALS:
            if stripped.startswith(ini) and len(stripped) > len(ini):
                return stripped[len(ini):]
        return stripped

    @classmethod
    def analyze(cls, poem: Poem) -> dict[str, Any]:
        """Phân tích cấu trúc toàn bài thơ."""
        result = []
        counts = []
        
        for i, line in enumerate(poem.lines, 1):
            syllables = cls.tokenize(line)
            counts.append(len(syllables))
            
            tones = [cls.get_tone(s) for s in syllables]
            # Tạo mẫu Bằng - Trắc (B/T)
            pattern = " - ".join(["B" if t in cls._BANG_TONES else "T" for t in tones])
            
            # Lấy vần của từ cuối cùng
            last_rhyme = cls.get_rhyme(syllables[-1]) if syllables else ""
            
            result.append({
                "line_number": i,
                "text": line,
                "syllables": syllables,
                "syllable_count": len(syllables),
                "pattern": pattern,
                "tones": tones,
                "last_rhyme": last_rhyme
            })
            
        # Kiểm tra mẫu 6-8
        is_68 = bool(counts) and counts[0] == 6 and all(
            c == (6 if i % 2 == 0 else 8) for i, c in enumerate(counts)
        )
        
        # Phân tích vần giữa các dòng (nếu có mẫu 6-8)
        rhyme_analysis = []
        if is_68:
            for i in range(0, len(result) - 1, 2):
                luc = result[i]
                bat = result[i + 1]
                rhyme_analysis.append({
                    "pair": f"L{luc['line_number']}-B{bat['line_number']}",
                    "rhyme_1": luc["last_rhyme"],
                    "rhyme_2": bat["last_rhyme"],
                    "match": luc["last_rhyme"] == bat["last_rhyme"]
                })
        
        return {
            "lines": result,
            "total_syllables": sum(counts),
            "total_lines": len(result),
            "is_68_pattern": is_68,
            "rhyme_analysis": rhyme_analysis,
            "conclusion": (
                "Văn bản có cấu trúc luân phiên 6-8 tiếng (Lục bát)."
                if is_68
                else "Văn bản không theo cấu trúc 6-8 cố định."
            )
        }


# =====================================================================
# IV. TẦNG 3: KNOWLEDGE GRAPH (TRI THỨC BIỂU TƯỢNG & TƯ TƯỞNG)
# =====================================================================
KNOWLEDGE_BASE = {
    "biểu tượng": {
        "trăng": ["Hoài niệm", "Đoàn viên", "Thanh khiết", "Cô đơn"],
        "nước": ["Thời gian", "Dòng đời", "Biến chuyển"],
        "tùng": ["Khí tiết", "Bền bỉ", "Quân tử"],
        "liễu": ["Tiễn biệt", "Chia ly"],
        "sen": ["Thanh khiết", "Thoát tục"],
        "mai": ["Mùa xuân", "Sức sống", "Thanh cao"],
        "hạc": ["Trường thọ", "Thanh cao", "Cõi tiên"],
        "mây": ["Phiêu du", "Tự do"],
    },
    "tư tưởng": {
        "Nho gia": ["nhân", "nghĩa", "lễ", "trí", "tín", "tôn sư trọng đạo"],
        "Đạo gia": ["vô vi", "tự nhiên", "tiêu dao", "thượng thiện nhược thủy"],
        "Phật giáo": ["vô thường", "vô ngã", "từ bi", "duyên khởi"]
    }
}

def extract_knowledge(text: str) -> dict[str, list[str]]:
    """Quét văn bản để tìm biểu tượng và tư tưởng."""
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
    """Bộ máy điều khiển và hiển thị kết quả trên Terminal."""
    
    # Mã màu ANSI cho Terminal thanh lịch
    C_TEAL = "\033[96m"    # Xanh ngọc
    C_GOLD = "\033[93m"    # Vàng kim
    C_GRAY = "\033[90m"    # Xám khói
    C_GREEN = "\033[92m"   # Xanh lá (Cho dữ kiện đúng)
    C_RED = "\033[91m"     # Đỏ son (Cho cảnh báo)
    C_RESET = "\033[0m"    # Reset

    @classmethod
    def render_header(cls, poem: Poem) -> None:
        """In phần tiêu đề báo cáo."""
        print(f"\n{cls.C_TEAL}╭──────────────────────────────────────────────────────╮{cls.C_RESET}")
        print(f"{cls.C_TEAL}│{cls.C_RESET} {cls.C_GOLD}VĂN ĐẠO ENGINE — BÁO CÁO PHÂN TÍCH{cls.C_RESET}")
        print(f"{cls.C_TEAL}├──────────────────────────────────────────────────────┤{cls.C_RESET}")
        print(f"{cls.C_TEAL}│{cls.C_RESET} {cls.C_GOLD}Tác phẩm:{cls.C_RESET} {poem.title}")
        print(f"{cls.C_TEAL}│{cls.C_RESET} {cls.C_GOLD}Tác giả :{cls.C_RESET} {poem.author}")
        print(f"{cls.C_TEAL}│{cls.C_RESET} {cls.C_GOLD}Nguồn   :{cls.C_RESET} {poem.source_status.value}")
        print(f"{cls.C_TEAL}╰──────────────────────────────────────────────────────╯{cls.C_RESET}\n")

    @classmethod
    def render_formal(cls, analysis: dict[str, Any]) -> list[Claim]:
        """In phần phân tích hình thức và trả về danh sách Claims."""
        print(f"{cls.C_GOLD}► TẦNG 2: PHÂN TÍCH HÌNH THỨC (Dữ kiện tất định){cls.C_RESET}\n")
        
        for line in analysis["lines"]:
            print(f"  {cls.C_GRAY}{line['line_number']:02d}.{cls.C_RESET} {line['text']}")
            print(f"      {cls.C_GRAY}→ {line['syllable_count']} tiếng | "
                  f"Thanh điệu: {line['pattern']} | "
                  f"Vần: '{line['last_rhyme']}'{cls.C_RESET}")
        
        # Tạo danh sách Claims cấp độ DỮ KIỆN
        claims = []
        claims.append(Claim(
            content=analysis["conclusion"],
            level=Level.FACT,
            references=[Reference(
                source="Thuật toán phân tích NFD (Unicode)",
                status=Confidence.VERIFIED,
                location="FormalAnalyzer.analyze()"
            )]
        ))
        
        # Nếu có mẫu 6-8, phân tích vần
        if analysis["rhyme_analysis"]:
            matched = sum(1 for r in analysis["rhyme_analysis"] if r["match"])
            total = len(analysis["rhyme_analysis"])
            claims.append(Claim(
                content=f"Tỷ lệ gieo vần chính: {matched}/{total} cặp vần khớp nhau.",
                level=Level.FACT,
                references=[Reference(
                    source="Thuật toán phân tích vần",
                    status=Confidence.VERIFIED
                )]
            ))
        
        return claims

    @classmethod
    def render_epistemic(cls, claims: list[Claim], knowledge: dict[str, list[str]]) -> None:
        """In phần đánh giá tri thức (Epistemic Layer)."""
        print(f"\n{cls.C_GOLD}► TẦNG 3: ĐÁNH GIÁ NHẬN THỨC (Epistemic Layer){cls.C_RESET}\n")
        
        # 1. In các Claims cấp Dữ kiện
        for c in claims:
            warnings = c.validate()
            status_color = cls.C_GREEN if not warnings else cls.C_RED
            print(f"  {status_color}[{c.level.value}]{cls.C_RESET} {c.content}")
            print(f"      {cls.C_GRAY}Nguồn: {c.references[0].source if c.references else 'N/A'}{cls.C_RESET}")
            
            for w in warnings:
                # Sử dụng ký tự △ thay cho emoji ⚠ để đảm bảo an toàn terminal
                print(f"      {cls.C_RED}△ {w}{cls.C_RESET}")
        
        # 2. In kết quả trích xuất tri thức (Diễn giải/Giả thuyết)
        print()
        if knowledge["biểu tượng"]:
            print(f"  {cls.C_TEAL}[Diễn giải]{cls.C_RESET} Biểu tượng phát hiện: "
                  f"{', '.join(knowledge['biểu tượng'])}")
            print(f"      {cls.C_GRAY}→ Cần đặt trong ngữ cảnh để xác định nghĩa chính xác.{cls.C_RESET}")
        
        if knowledge["tư tưởng"]:
            print(f"  {cls.C_TEAL}[Giả thuyết]{cls.C_RESET} Từ khóa tư tưởng: "
                  f"{', '.join(knowledge['tư tưởng'])}")
            print(f"      {cls.C_GRAY}→ Đây chỉ là dấu hiệu từ vựng, chưa đủ chứng minh ảnh hưởng.{cls.C_RESET}")
        
        if not knowledge["biểu tượng"] and not knowledge["tư tưởng"]:
            print(f"  {cls.C_GRAY}[Trống] Không phát hiện biểu tượng hay tư tưởng nào.{cls.C_RESET}")

    @classmethod
    def run(cls, poem: Poem) -> None:
        """Chạy toàn bộ pipeline phân tích."""
        # 1. In Header
        cls.render_header(poem)
        
        # 2. Tầng 2: Phân tích hình thức
        analysis = FormalAnalyzer.analyze(poem)
        claims = cls.render_formal(analysis)
        
        # 3. Tầng 3: Trích xuất tri thức
        knowledge = extract_knowledge(poem.full_text())
        cls.render_epistemic(claims, knowledge)
        
        # 4. Footnote
        print(f"\n{cls.C_GRAY}{'─'*54}{cls.C_RESET}")
        print(f"{cls.C_GRAY}* Báo cáo này là phân tích tất định (deterministic).{cls.C_RESET}")
        print(f"{cls.C_GRAY}* Mọi nhận định về 'Hồn thơ' cần được thực hiện bởi con người.{cls.C_RESET}\n")


# =====================================================================
# VI. GIAO DIỆN DÒNG LỆNH (CLI)
# =====================================================================
def main() -> int:
    parser = argparse.ArgumentParser(
        description="VĂN ĐẠO ENGINE - Phân tích thi pháp và tri thức văn học."
    )
    parser.add_argument("--title", type=str, default="Bài thơ chưa đặt tên", help="Tên bài thơ")
    parser.add_argument("--author", type=str, default="Khuyết danh", help="Tác giả")
    parser.add_argument("--text", type=str, help="Nội dung bài thơ (dùng \\n để xuống dòng)")
    parser.add_argument("--file", type=str, help="Đường dẫn file .txt chứa bài thơ")
    
    args = parser.parse_args()

    # Xử lý nguồn đầu vào
    poem_text = ""
    source_status = Confidence.UNVERIFIED
    
    if args.file:
        try:
            poem_text = Path(args.file).read_text(encoding="utf-8")
            source_status = Confidence.UNVERIFIED  # Cần đối chiếu thêm
        except FileNotFoundError:
            print(f"Lỗi: Không tìm thấy file {args.file}", file=sys.stderr)
            return 1
    elif args.text:
        poem_text = args.text.replace("\\n", "\n")
    else:
        # Dữ liệu mẫu nếu không truyền tham số
        poem_text = (
            "Quạt giấy khép lại mùa thi,\n"
            "Áo dài bay giữa kinh kỳ sắc xuân.\n"
            "Thầy cô tựa ánh trăng ngần,\n"
            "Dắt em qua những thăng trầm thế gian.\n"
            "Lời ru thuở trước vọng vang,\n"
            "Điển xưa tích cũ, hành trang em mang."
        )
        print(f"\n{VanDaoEngine.C_GRAY}* Không có tham số. Đang phân tích dữ liệu mẫu.{VanDaoEngine.C_RESET}")

    # Tạo đối tượng Poem (Tầng 1)
    poem = Poem(
        title=args.title,
        author=args.author,
        lines=[line.strip() for line in poem_text.split("\n") if line.strip()],
        source_status=source_status
    )

    # Chạy bộ máy
    VanDaoEngine.run(poem)
    return 0


if __name__ == "__main__":
    sys.exit(main())