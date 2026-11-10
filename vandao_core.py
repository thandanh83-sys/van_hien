#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
VĂN ĐẠO ENGINE - PYTHON CORE (ULTIMATE EDITION V5)
=====================================================================
Tác giả: Văn Đạo
Mô tả: 
- Bộ máy phân tích thi pháp tất định (Deterministic).
- Tích hợp "Quy trình 3 bước" nhận diện thể thơ (Lục bát, Đường luật, Hiện đại).
- Tầng kiểm soát tri thức (Epistemic Layer) chống ảo giác.
- Giao diện Terminal 100% Text, KHÔNG Emoji.
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
# I. CẤU HÌNH MÀU SẮC TERMINAL (ANSI COLORS)
# =====================================================================
C_TEAL = "\033[96m"
C_GOLD = "\033[93m"
C_GRAY = "\033[90m"
C_GREEN = "\033[92m"
C_RED = "\033[91m"
C_BLUE = "\033[94m"
C_RESET = "\033[0m"

# =====================================================================
# II. EPISTEMIC LAYER (TẦNG KIỂM SOÁT TRI THỨC)
# =====================================================================
class Level(str, Enum):
    FACT = "Dữ kiện"
    HYPOTHESIS = "Giả thuyết"
    INTERPRETATION = "Diễn giải"

class Confidence(str, Enum):
    VERIFIED = "Đã xác minh"
    TENTATIVE = "Tạm thời"
    UNVERIFIED = "Chưa xác minh"

@dataclass
class Reference:
    source: str
    status: Confidence = Confidence.UNVERIFIED

@dataclass
class Claim:
    content: str
    level: Level
    references: list[Reference] = field(default_factory=list)

    def validate(self) -> list[str]:
        warnings = []
        if self.level is Level.FACT:
            if not self.references:
                warnings.append("FACT (Dữ kiện) thiếu nguồn dẫn.")
            elif not any(r.status is Confidence.VERIFIED for r in self.references):
                warnings.append("FACT (Dữ kiện) chưa có nguồn xác minh.")
        return warnings

# =====================================================================
# III. TẦNG 1: VĂN BẢN HỌC (CORPUS)
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
# IV. TẦNG 2: PHÂN TÍCH HÌNH THỨC (FORMAL ANALYSIS V5)
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
            if not syllables: continue
            counts.append(len(syllables))
            tones = [cls.get_tone(s) for s in syllables]
            pattern = " - ".join(["B" if t in cls._BANG_TONES else "T" for t in tones])
            last_rhyme = cls.get_rhyme(syllables[-1]) if syllables else ""
            
            result.append({
                "line_number": i, "text": line.strip(), "syllables": syllables,
                "syllable_count": len(syllables), "pattern": pattern, "last_rhyme": last_rhyme
            })

        # --- QUY TRÌNH 3 BƯỚC NHẬN DIỆN THỂ THƠ ---
        form_name = "Thơ tự do / Chưa xác định"
        confidence = "thấp"
        reasoning = []

        if not counts:
            return {"lines": [], "form": "Văn bản trống", "confidence": "cao", "reasoning": [], "rhymes": {}}

        # BƯỚC 1: Kiểm tra số chữ
        is_uniform = len(set(counts)) == 1
        uniform_len = counts[0] if is_uniform else 0
        
        if is_uniform:
            reasoning.append(f"Bước 1: Các câu đều có {uniform_len} chữ.")
        else:
            reasoning.append(f"Bước 1: Số chữ không đều ({counts[0]}, {counts[1]}...).")

        # BƯỚC 2: Kiểm tra cấu trúc đặc biệt & Số câu
        n = len(counts)
        if not is_uniform:
            # Lục bát
            is_luc_bat = n % 2 == 0 and all(c == (6 if i % 2 == 0 else 8) for i, c in enumerate(counts))
            if is_luc_bat:
                form_name = "Thơ Lục bát"
                confidence = "cao"
                reasoning.append("Bước 2: Cấu trúc luân phiên 6-8 chữ liên tục.")
            else:
                # Song thất lục bát
                is_stlb = n % 4 == 0 and all(c == [7, 7, 6, 8][i % 4] for i, c in enumerate(counts))
                if is_stlb:
                    form_name = "Thơ Song thất lục bát"
                    confidence = "cao"
                    reasoning.append("Bước 2: Cấu trúc chu kỳ 7-7-6-8.")
                else:
                    # Lục bát biến thể
                    if 6 in counts and 8 in counts:
                        form_name = "Thơ Lục bát biến thể"
                        confidence = "trung bình"
                        reasoning.append("Bước 2: Có xuất hiện câu 6 và 8 nhưng không đều (Biến thể).")
                    else:
                        form_name = "Thơ Tự do"
                        confidence = "cao"
                        reasoning.append("Bước 2: Số chữ ngắn dài đan xen, không theo quy luật cố định.")
        else:
            # Thơ Đồng đều số chữ
            if uniform_len == 7:
                if n == 4:
                    form_name = "Thơ Thất ngôn tứ tuyệt"
                    confidence = "cao"
                    reasoning.append("Bước 2: Có 4 câu, mỗi câu 7 chữ.")
                elif n == 8:
                    form_name = "Thơ Thất ngôn bát cú"
                    confidence = "cao"
                    reasoning.append("Bước 2: Có 8 câu, mỗi câu 7 chữ.")
                else:
                    form_name = "Thơ 7 chữ (Hiện đại / Cổ phong)"
                    confidence = "trung bình"
                    reasoning.append(f"Bước 2: Có {n} câu 7 chữ (Không rơi vào cấu trúc Tứ tuyệt/Bát cú).")
            elif uniform_len == 5:
                if n == 4: form_name = "Thơ Ngũ ngôn tứ tuyệt"
                elif n == 8: form_name = "Thơ Ngũ ngôn bát cú"
                else: form_name = "Thơ 5 chữ"
                confidence = "cao"
                reasoning.append(f"Bước 2: Có {n} câu, mỗi câu 5 chữ.")
            elif uniform_len == 4:
                form_name = "Thơ 4 chữ"
                confidence = "cao"
                reasoning.append("Bước 2: Các câu đều 4 chữ (Thường thấy trong thơ hiện đại).")
            elif uniform_len == 8:
                form_name = "Thơ 8 chữ"
                confidence = "cao"
                reasoning.append("Bước 2: Các câu đều 8 chữ (Thường thấy trong thơ hiện đại).")
            elif n == 3 and counts == [5, 7, 5]:
                form_name = "Thơ Haiku (Nhật Bản)"
                confidence = "cao"
                reasoning.append("Bước 2: Cấu trúc đặc trưng 5-7-5 âm tiết.")

        # BƯỚC 3: Phân tích Vần để phân biệt Đường luật vs Hiện đại
        rhymes = {"chan": [], "lien": [], "cach": []}
        
        # Tìm vần chân (cuối câu)
        last_words = [r["syllables"][-1] for r in result]
        last_rhymes = [r["last_rhyme"] for r in result]
        
        # Kiểm tra vần 1-2-4 (Tứ tuyệt) hoặc 1-2-4-6-8 (Bát cú)
        rhymed_indices = []
        if len(last_rhymes) > 0:
            base_rhyme = last_rhymes[0]
            for i in range(len(last_rhymes)):
                if last_rhymes[i] == base_rhyme:
                    rhymed_indices.append(i + 1) # 1-based index

            if "Thất ngôn" in form_name or "Ngũ ngôn" in form_name:
                if n == 4 and [1, 2, 4] == rhymed_indices:
                    reasoning.append("Bước 3: Gieo vần chân đúng chuẩn Đường luật (Câu 1, 2, 4).")
                elif n == 8 and [1, 2, 4, 6, 8] == rhymed_indices:
                    reasoning.append("Bước 3: Gieo vần chân đúng chuẩn Đường luật (Câu 1, 2, 4, 6, 8).")
                else:
                    reasoning.append("Bước 3: Vần gieo không theo chuẩn Đường luật nghiêm ngặt.")
                    if "Đường luật" not in form_name and ("Thất ngôn" in form_name or "Ngũ ngôn" in form_name):
                        form_name += " (Phóng khoáng)"

        for i in range(len(result)):
            for j in range(i + 1, len(result)):
                r1, r2 = result[i]["last_rhyme"], result[j]["last_rhyme"]
                if r1 == r2 and r1 != "":
                    rhyme_info = {
                        "pair": f"Câu {result[i]['line_number']} & {result[j]['line_number']}",
                        "word1": result[i]["syllables"][-1],
                        "word2": result[j]["syllables"][-1],
                        "rhyme": r1
                    }
                    if j == i + 1: rhymes["lien"].append(rhyme_info)
                    elif j == i + 2: rhymes["cach"].append(rhyme_info)
                    if j == len(result) - 1 or j == i + 1:
                        rhymes["chan"].append(rhyme_info)

        return {
            "lines": result, 
            "total_syllables": sum(counts), 
            "total_lines": len(result),
            "form": form_name,
            "form_confidence": confidence,
            "reasoning": reasoning,
            "rhymes": rhymes
        }

# =====================================================================
# V. TẦNG 3: ĐỒ THỊ TRI THỨC (KNOWLEDGE GRAPH)
# =====================================================================
KNOWLEDGE_BASE = {
    "biểu tượng": {
        "trăng": ["Hoài niệm", "Đoàn viên", "Cô đơn"], 
        "nước": ["Thời gian", "Dòng đời", "Mềm mại"],
        "tùng": ["Khí tiết", "Bền bỉ"], 
        "liễu": ["Tiễn biệt", "Chia ly"],
        "sen": ["Thanh khiết", "Bạch Ngọc"], 
        "mai": ["Mùa xuân", "Sức sống"],
        "mây": ["Phiêu du", "Tự tại"],
        "đá": ["Kiên định", "Thử thách"]
    },
    "tư tưởng": {
        "Nho gia": ["nhân", "nghĩa", "lễ", "trí", "tín", "trung", "hiếu"],
        "Đạo gia": ["vô vi", "tự nhiên", "tiêu dao", "thanh tĩnh"],
        "Phật giáo": ["vô thường", "vô ngã", "từ bi", "duyên khởi", "nghiệp"]
    }
}

def extract_knowledge(text: str) -> dict[str, list[str]]:
    found = {"biểu tượng": [], "tư tưởng": []}
    lower_text = text.lower()
    
    for category, items in KNOWLEDGE_BASE.items():
        for key in items.keys():
            if re.search(rf"\b{key}\b", lower_text):
                found[category].append(key)
    return found

# =====================================================================
# VI. BỘ MÁY ĐIỀU KHIỂN VÀ RENDER (TERMINAL UI - TEXT ONLY)
# =====================================================================
class VanDaoEngine:
    @classmethod
    def render_header(cls, poem: Poem) -> None:
        print(f"\n{C_TEAL}+------------------------------------------------------+{C_RESET}")
        print(f"{C_TEAL}|{C_RESET} {C_GOLD}VĂN ĐẠO ENGINE - BÁO CÁO PHÂN TÍCH{C_RESET}                {C_TEAL}|{C_RESET}")
        print(f"{C_TEAL}+------------------------------------------------------+{C_RESET}")
        print(f"{C_TEAL}|{C_RESET} {C_GOLD}Tác phẩm:{C_RESET} {poem.title:<42} {C_TEAL}|{C_RESET}")
        print(f"{C_TEAL}|{C_RESET} {C_GOLD}Tác giả :{C_RESET} {poem.author:<42} {C_TEAL}|{C_RESET}")
        print(f"{C_TEAL}+------------------------------------------------------+{C_RESET}\n")

    @classmethod
    def render_formal(cls, analysis: dict[str, Any]) -> list[Claim]:
        print(f"{C_GOLD}> TẦNG 2: PHÂN TÍCH HÌNH THỨC (Dữ kiện tất định){C_RESET}\n")
        
        print(f"  {C_TEAL}Thể thơ nhận diện:{C_RESET} {C_GREEN}{analysis['form']}{C_RESET} (Độ tin cậy: {analysis['form_confidence']})")
        
        print(f"\n  {C_GRAY}[ Quy trình 3 bước nhận diện ]{C_RESET}")
        for step in analysis["reasoning"]:
            print(f"    - {step}")
            
        print(f"\n  {C_GRAY}[ Chi tiết thanh điệu Bằng (B) / Trắc (T) ]{C_RESET}")
        for line in analysis["lines"]:
            print(f"    {C_GRAY}{line['line_number']:02d}.{C_RESET} {line['text']}")
            print(f"        {C_BLUE}-> {line['syllable_count']} tiếng | Nhịp: {line['pattern']} | Vần: '{line['last_rhyme']}'{C_RESET}")
        
        claims = [
            Claim(
                content=f"Thể thơ xác định: {analysis['form']}",
                level=Level.FACT,
                references=[Reference(source="Thuật toán NFD & Cấu trúc", status=Confidence.VERIFIED)]
            )
        ]
        
        if analysis["rhymes"]["lien"]:
            claims.append(Claim(
                content=f"Phát hiện {len(analysis['rhymes']['lien'])} cặp vần liền (câu trước vần với câu sau).",
                level=Level.FACT,
                references=[Reference(source="Thuật toán Rhyme", status=Confidence.VERIFIED)]
            ))
            
        return claims

    @classmethod
    def render_epistemic(cls, claims: list[Claim], knowledge: dict[str, list[str]]) -> None:
        print(f"\n{C_GOLD}> TẦNG 3: ĐÁNH GIÁ NHẬN THỨC (Epistemic Layer){C_RESET}\n")
        
        for c in claims:
            warnings = c.validate()
            status_color = C_GREEN if not warnings else C_RED
            status_text = "[HỢP LỆ]" if not warnings else "[CẢNH BÁO]"
            
            print(f"  {status_color}{status_text}{C_RESET} {C_GOLD}[{c.level.value}]{C_RESET} {c.content}")
            if c.references:
                print(f"         {C_GRAY}Nguồn: {c.references[0].source}{C_RESET}")
            for w in warnings:
                print(f"         {C_RED}-> {w}{C_RESET}")
        
        print()
        if knowledge["biểu tượng"]:
            print(f"  {C_TEAL}[Diễn giải]{C_RESET} Biểu tượng phát hiện: {C_GOLD}{', '.join(knowledge['biểu tượng'])}{C_RESET}")
        if knowledge["tư tưởng"]:
            print(f"  {C_TEAL}[Giả thuyết]{C_RESET} Hệ tư tưởng liên quan: {C_GOLD}{', '.join(knowledge['tư tưởng'])}{C_RESET}")
        if not knowledge["biểu tượng"] and not knowledge["tư tưởng"]:
            print(f"  {C_GRAY}[Trống] Không phát hiện biểu tượng hay hệ tư tưởng đặc trưng.{C_RESET}")

    @classmethod
    def run(cls, poem: Poem) -> None:
        cls.render_header(poem)
        analysis = FormalAnalyzer.analyze(poem)
        claims = cls.render_formal(analysis)
        knowledge = extract_knowledge(poem.full_text())
        cls.render_epistemic(claims, knowledge)
        
        print(f"\n{C_TEAL}+------------------------------------------------------+{C_RESET}")
        print(f"{C_GRAY}| GHI CHÚ: Báo cáo này là phân tích tất định (Deterministic).{C_RESET}")
        print(f"{C_GRAY}| Mọi nhận định về 'Hồn thơ' cần được thực hiện bởi con người.{C_RESET}")
        print(f"{C_TEAL}+------------------------------------------------------+{C_RESET}\n")

# =====================================================================
# VII. GIAO DIỆN DÒNG LỆNH (CLI)
# =====================================================================
def main() -> int:
    parser = argparse.ArgumentParser(
        description="VĂN ĐẠO ENGINE - Phân tích thi pháp (Không dùng Emoji)."
    )
    parser.add_argument("--title", type=str, default="Bài thơ chưa đặt tên", help="Tên bài thơ")
    parser.add_argument("--author", type=str, default="Khuyết danh", help="Tác giả")
    parser.add_argument("--text", type=str, help="Nội dung bài thơ (dùng \\n để xuống dòng)")
    parser.add_argument("--file", type=str, help="Đường dẫn file .txt chứa bài thơ")
    
    args = parser.parse_args()
    poem_text = ""
    
    if args.file:
        try:
            poem_text = Path(args.file).read_text(encoding="utf-8")
        except FileNotFoundError:
            print(f"{C_RED}[LỖI]{C_RESET} Không tìm thấy file: {args.file}", file=sys.stderr)
            return 1
    elif args.text:
        poem_text = args.text.replace("\\n", "\n")
    else:
        # Dữ liệu mẫu nếu không truyền tham số
        poem_text = (
            "Quạt giấy khép lại mùa thi,\n"
            "Áo dài bay giữa kinh kỳ sắc xuân.\n"
            "Thầy cô tựa ánh trăng ngần,\n"
            "Dắt em qua những thăng trầm thế gian."
        )
        print(f"\n{C_GRAY}* Không có tham số đầu vào. Đang phân tích dữ liệu mẫu...{C_RESET}")

    lines = [line.strip() for line in poem_text.split("\n") if line.strip()]
    poem = Poem(
        title=args.title, 
        author=args.author, 
        lines=lines,
        source_status=Confidence.UNVERIFIED
    )
    
    VanDaoEngine.run(poem)
    return 0

if __name__ == "__main__":
    sys.exit(main())
