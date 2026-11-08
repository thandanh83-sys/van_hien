/* =====================================================================
   VĂN ĐẠO — POETRY ANALYZER (4-TIER, NO AI, NO SCORING)
   Tầng 0: Bằng/Trắc (dữ kiện thô, giữ nguyên)
   Tầng 1: Đối chiếu lý thuyết (nhận diện thể, vần, nhịp)
   Tầng 2: Chiếu rọi (biểu tượng, điển tích, Hán Việt → link Bách Khoa)
   Tầng 3: Mở ngỏ (câu hỏi cho người đọc)
   ===================================================================== */
const POETRY_ANALYZER = (() => {

  // ---------- TẦNG 0: BẰNG/TRẮC ----------
  function analyzeBangTrac(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.map((line, i) => {
      const syllables = line.match(/[\p{L}\p{N}]+/gu) || [];
      const pattern = syllables.map(s => {
        const nfd = s.normalize('NFD');
        const isTrac = nfd.includes('\u0301') || nfd.includes('\u0303')
                    || nfd.includes('\u0309') || nfd.includes('\u0323');
        return isTrac ? 'T' : 'B';
      }).join(' - ');
      return {
        lineNum: i + 1,
        text: line,
        count: syllables.length,
        pattern,
        lastSyllable: syllables[syllables.length - 1] || ''
      };
    });
  }

  // ---------- TẦNG 1: ĐỐI CHIẾU LÝ THUYẾT ----------
  function detectForm(lines) {
    const counts = lines.map(l => l.count);
    const n = counts.length;
    const uniform = counts.every(c => c === counts[0]);
    const c = counts[0];

    if (n === 4 && c === 7) return { form: 'Thất ngôn tứ tuyệt', confidence: 'cao', note: '4 câu × 7 chữ' };
    if (n === 8 && c === 7) return { form: 'Thất ngôn bát cú Đường luật', confidence: 'cao', note: '8 câu × 7 chữ' };
    if (n === 4 && c === 5) return { form: 'Ngũ ngôn tứ tuyệt', confidence: 'cao', note: '4 câu × 5 chữ' };
    if (n === 8 && c === 5) return { form: 'Ngũ ngôn bát cú', confidence: 'cao', note: '8 câu × 5 chữ' };

    // Lục bát / sáu-tám: bắt đầu 6-8
    if (n >= 2 && counts[0] === 6 && counts[1] === 8) {
      const strict = n % 2 === 0 && counts.every((v, i) => v === (i % 2 === 0 ? 6 : 8));
      return strict
        ? { form: 'Lục bát', confidence: 'cao', note: 'Luân phiên 6-8 đều' }
        : { form: 'Hình thức sáu-tám (biến thể)', confidence: 'trung bình', note: 'Có câu 6-8 nhưng chưa đủ chuỗi đều' };
    }

    // Song thất lục bát: 7-7-6-8
    if (n >= 4 && counts[0] === 7 && counts[1] === 7 && counts[2] === 6 && counts[3] === 8) {
      return { form: 'Song thất lục bát', confidence: 'cao', note: '7-7-6-8' };
    }

    if (!uniform) return { form: 'Thơ tự do hoặc biến thể', confidence: 'thấp', note: `Số chữ mỗi câu: ${counts.join(' - ')}` };
    return { form: `Thơ ${c} chữ (chưa xác định thể)`, confidence: 'trung bình', note: `${n} câu × ${c} chữ` };
  }

  function checkRhyme(lines) {
    const lastSyl = lines.map(l => l.lastSyllable);
    const rhymeParts = lastSyl.map(s => {
      const clean = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return clean.slice(-2);
    });

    const groups = {};
    rhymeParts.forEach((r, i) => {
      if (!groups[r]) groups[r] = [];
      groups[r].push(i + 1);
    });

    let dominant = { key: null, lines: [] };
    for (const [k, v] of Object.entries(groups)) {
      if (v.length > dominant.lines.length) dominant = { key: k, lines: v };
    }

    return {
      lastSyllables: lastSyl,
      rhymeParts,
      groups,
      dominantRhyme: dominant.key,
      dominantLines: dominant.lines,
      hasRhyme: dominant.lines.length >= 2
    };
  }

  // ---------- TẦNG 2: CHIẾU RỌI ----------
  // Mượn tư duy validator.py: đối chiếu với từ điển cố định, KHÔNG phán xét

  const SYMBOLS = {
    'trăng':      { vol: 'V',   sec: '5.2', mean: 'đoàn viên, nhớ quê, cô đơn, chiêm nghiệm' },
    'nguyệt':     { vol: 'V',   sec: '5.2', mean: 'Hán Việt của "trăng"' },
    'liễu':       { vol: 'V',   sec: '5.2', mean: 'chia biệt' },
    'đào':        { vol: 'V',   sec: '5.2', mean: 'tuổi trẻ, mùa xuân' },
    'sen':        { vol: 'V',   sec: '5.2', mean: 'thanh khiết' },
    'hạc':        { vol: 'V',   sec: '5.2', mean: 'thanh cao, trường thọ' },
    'nhạn':       { vol: 'V',   sec: '5.2', mean: 'tin tức' },
    'mây':        { vol: 'V',   sec: '5.2', mean: 'phiêu du' },
    'nước':       { vol: 'V',   sec: '5.2', mean: 'thời gian, mềm mại' },
    'thuyền':     { vol: 'V',   sec: '5.2', mean: 'hành trình' },
    'bến đò':     { vol: 'V',   sec: '5.2', mean: 'gặp gỡ, chia tay' },
    'tùng':       { vol: 'V',   sec: '5.2', mean: 'bền bỉ, khí tiết' },
    'cúc':        { vol: 'V',   sec: '5.2', mean: 'thanh cao, nhàn dật' },
    'trúc':       { vol: 'V',   sec: '5.2', mean: 'ngay thẳng, thanh nhã' },
    'hoa mai':    { vol: 'V',   sec: '5.2', mean: 'sức sống, thanh khiết' }
  };

  const DIEN_TICH = {
    'sân lai':     { vol: 'V', sec: '5.2', mean: 'lòng hiếu thảo (Lão Lai Tử)' },
    'ngưu lang':   { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' },
    'chức nữ':     { vol: 'V', sec: '5.2', mean: 'tình yêu bị ngăn cách' },
    'gót sen':     { vol: 'V', sec: '5.2', mean: 'đôi chân phụ nữ phong kiến' },
    'bèo dạt':     { vol: 'V', sec: '5.2', mean: 'thân phận trôi nổi' },
    'chim lồng':   { vol: 'V', sec: '5.2', mean: 'bị giam hãm, mất tự do' },
    'cá chậu':     { vol: 'V', sec: '5.2', mean: 'bị giam hãm, mất tự do' }
  };

  const HAN_VIET = {
    'vọng':        { vol: 'V', sec: '5.3', mean: '望 — trông về, ngóng đợi. KHÔNG phải "âm thanh vọng lại".' },
    'khúc':        { vol: 'V', sec: '5.3', mean: '曲 — khúc nhạc, bản nhạc. KHÔNG phải "chặng đường".' },
    'dặm trường':  { vol: 'V', sec: '5.3', mean: 'trường = 長 (dài) — đường xa. Phân biệt với 場 (nơi học).' }
  };

  function findSymbols(text) {
    const lower = text.toLowerCase();
    const out = [];
    for (const [kw, info] of Object.entries(SYMBOLS)) {
      if (lower.includes(kw)) out.push({ type: 'Biểu tượng', keyword: kw, ...info });
    }
    for (const [kw, info] of Object.entries(DIEN_TICH)) {
      if (lower.includes(kw)) out.push({ type: 'Điển tích', keyword: kw, ...info });
    }
    for (const [kw, info] of Object.entries(HAN_VIET)) {
      if (lower.includes(kw)) out.push({ type: 'Hán Việt', keyword: kw, ...info });
    }
    return out;
  }

  // ---------- TẦNG 3: MỞ NGỎ ----------
  function buildQuestions(bangTrac, form, rhymes, symbols) {
    const qs = [];

    if (form.confidence !== 'cao') {
      qs.push(`Bài được nhận diện là "${form.form}" (độ tin cậy ${form.confidence}). Đây có thể là biến thể có chủ ý hay chỉ là ngẫu nhiên? (Xem Quyển I.3)`);
    }

    if (!rhymes.hasRhyme) {
      qs.push(`Không thấy vần chân rõ ràng giữa các câu. Tác giả có chủ ý dùng vần lỏng, hay đây là thơ tự do?`);
    } else if (rhymes.dominantLines.length < rhymes.lastSyllables.length) {
      const outside = rhymes.lastSyllables.length - rhymes.dominantLines.length;
      qs.push(`Có ${outside} câu không cùng vần "${rhymes.dominantRhyme}". Việc đổi vần có phải để chuyển ý? (Xem Quyển II.2 — Tầng tính nhạc)`);
    }

    if (symbols.length > 0) {
      const s = symbols[0];
      qs.push(`"${s.keyword}" xuất hiện — trong ngữ cảnh cụ thể này, nó đang gợi nghĩa nào trong các nghĩa khả dĩ? (Xem Quyển V, mục ${s.sec})`);
    }

    qs.push(`Điều gì ở bài thơ này là "của riêng" tác giả — khác với những bài cùng thể?`);
    return qs.slice(0, 5);
  }

  // ---------- API CÔNG KHAI ----------
  function generateReport(text) {
    const bangTrac = analyzeBangTrac(text);
    if (bangTrac.length === 0) return null;
    const form = detectForm(bangTrac);
    const rhymes = checkRhyme(bangTrac);
    const symbols = findSymbols(text);
    const questions = buildQuestions(bangTrac, form, rhymes, symbols);
    return { bangTrac, form, rhymes, symbols, questions };
  }

  return { generateReport };
})();
