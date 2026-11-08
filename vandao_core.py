"""
VĂN ĐẠO ENGINE - PYTHON CORE (Tầng 1 & Tầng 2)
Bộ máy phân tích thi pháp tất định (Deterministic).
"""
from dataclasses import dataclass
import unicodedata
import re

# --- TẦNG 1: CORPUS ---
@dataclass
class Poem:
    title: str
    lines: list[str]
    source_status: str = "unverified"

# --- TẦNG 2: FORMAL ANALYSIS ---
_TONE_MARKS = {"\u0300": "huyền", "\u0301": "sắc", "\u0303": "ngã", "\u0309": "hỏi", "\u0323": "nặng"}
_BANG_TONES = {"ngang", "huyền"}

class FormalAnalyzer:
    @staticmethod
    def get_tone(syllable: str) -> str:
        nfd = unicodedata.normalize("NFD", syllable.lower())
        for ch in nfd:
            if ch in _TONE_MARKS:
                return _TONE_MARKS[ch]
        return "ngang"

    @classmethod
    def analyze(cls, poem: Poem) -> dict:
        result = []
        counts = []
        for i, line in enumerate(poem.lines, 1):
            syllables = [w for w in re.findall(r"\w+", line) if not w.isdigit()]
            counts.append(len(syllables))
            
            tones = [cls.get_tone(s) for s in syllables]
            pattern = " ".join(["B" if t in _BANG_TONES else "T" for t in tones])
            
            result.append({
                "line": i,
                "text": line,
                "syllables": len(syllables),
                "pattern": pattern
            })
            
        is_68 = bool(counts) and counts[0] == 6 and all(c == (6 if i % 2 == 0 else 8) for i, c in enumerate(counts))
        
        return {
            "lines": result,
            "is_68_pattern": is_68,
            "conclusion": "Có cấu trúc 6-8" if is_68 else "Không theo cấu trúc 6-8"
        }

# --- CHẠY THỬ NGHIỆM ---
if __name__ == "__main__":
    sample_poem = Poem(
        title="Vọng Khúc Thanh Xuân",
        lines=[
            "Quạt giấy khép lại mùa thi,",
            "Áo dài bay giữa kinh kỳ sắc xuân.",
            "Thầy cô tựa ánh trăng ngần,",
            "Dắt em qua những thăng trầm thế gian."
        ]
    )
    
    print("=== VĂN ĐẠO ENGINE (PYTHON CLI) ===")
    analysis = FormalAnalyzer.analyze(sample_poem)
    
    for line in analysis["lines"]:
        print(f"[{line['line']:02d}] {line['text']}")
        print(f"     Thanh điệu: {line['pattern']}")
        
    print(f"\n=> KẾT LUẬN: {analysis['conclusion']}")