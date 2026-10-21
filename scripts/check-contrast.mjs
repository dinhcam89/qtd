// @ts-check
/**
 * Script kiểm tra tỉ lệ tương phản màu sắc (WCAG 2.1)
 * Thoát mã 1 nếu chữ thường < 4.5:1 hoặc chữ lớn < 3:1.
 */

/**
 * Chuyển mã hex thành sRGB [0..1]
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function parseHex(hex) {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return [
    parseInt(cleaned.slice(0, 2), 16) / 255,
    parseInt(cleaned.slice(2, 4), 16) / 255,
    parseInt(cleaned.slice(4, 6), 16) / 255,
  ];
}

/**
 * sRGB gamma correction to linear
 * @param {number} c
 * @returns {number}
 */
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Tính relative luminance theo WCAG 2.1
 * @param {[number, number, number]} rgb
 * @returns {number}
 */
function getLuminance([r, g, b]) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/**
 * Tính tỉ lệ tương phản giữa 2 màu hex
 * @param {string} foregroundHex
 * @param {string} backgroundHex
 * @returns {number}
 */
function getContrastRatio(foregroundHex, backgroundHex) {
  const l1 = getLuminance(parseHex(foregroundHex));
  const l2 = getLuminance(parseHex(backgroundHex));
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Bảng màu thực tế sử dụng trong hệ thống
/** @type {Record<string, string>} */
const PALETTE = {
  'surface-page': '#FFFFFF',
  'surface-muted': '#F8FAFC',
  'surface-brand-subtle': '#EFF6FF',
  'brand-primary': '#0F3666',
  'brand-dark': '#081C36',
  'ink-base': '#1F2937',
  'ink-muted': '#4B5563',
  'ink-subtle': '#596579',
  'ink-inverse': '#FFFFFF',
  'status-info-bg': '#EFF6FF',
  'status-info-text': '#1E40AF',
  'status-warn-bg': '#FFFBEB',
  'status-warn-text': '#92400E',
};

/**
 * @typedef {Object} ColorPair
 * @property {string} name - Mô tả cặp màu
 * @property {string} fg - Token chữ
 * @property {string} bg - Token nền
 * @property {boolean} isLargeText - True nếu là chữ lớn (>= 24px, hoặc >= 19px đậm)
 */

/** @type {ColorPair[]} */
const COLOR_PAIRS = [
  {
    name: 'Chữ chính trên nền trang',
    fg: 'ink-base',
    bg: 'surface-page',
    isLargeText: false,
  },
  {
    name: 'Chữ chính trên nền xám nhẹ',
    fg: 'ink-base',
    bg: 'surface-muted',
    isLargeText: false,
  },
  {
    name: 'Chữ chính trên nền brand nhạt',
    fg: 'ink-base',
    bg: 'surface-brand-subtle',
    isLargeText: false,
  },
  {
    name: 'Chữ phụ trên nền trang',
    fg: 'ink-muted',
    bg: 'surface-page',
    isLargeText: false,
  },
  {
    name: 'Chữ phụ trên nền xám nhẹ',
    fg: 'ink-muted',
    bg: 'surface-muted',
    isLargeText: false,
  },
  {
    name: 'Chữ phụ trên nền brand nhạt',
    fg: 'ink-muted',
    bg: 'surface-brand-subtle',
    isLargeText: false,
  },
  {
    name: 'Chữ nhãn nhạt trên nền trang',
    fg: 'ink-subtle',
    bg: 'surface-page',
    isLargeText: false,
  },
  {
    name: 'Chữ nhãn nhạt trên nền xám nhẹ',
    fg: 'ink-subtle',
    bg: 'surface-muted',
    isLargeText: false,
  },
  {
    name: 'Tiêu đề brand trên nền trang (lớn/đậm)',
    fg: 'brand-primary',
    bg: 'surface-page',
    isLargeText: true,
  },
  {
    name: 'Tiêu đề brand trên nền xám nhẹ (lớn/đậm)',
    fg: 'brand-primary',
    bg: 'surface-muted',
    isLargeText: true,
  },
  {
    name: 'Tiêu đề brand trên nền brand nhạt (lớn/đậm)',
    fg: 'brand-primary',
    bg: 'surface-brand-subtle',
    isLargeText: true,
  },
  {
    name: 'Chữ nút bấm chính (trắng trên brand)',
    fg: 'ink-inverse',
    bg: 'brand-primary',
    isLargeText: false,
  },
  {
    name: 'Chữ trắng trong Footer (nền brand dark)',
    fg: 'ink-inverse',
    bg: 'brand-dark',
    isLargeText: false,
  },
  {
    name: 'Thông báo Info (chữ info trên nền info)',
    fg: 'status-info-text',
    bg: 'status-info-bg',
    isLargeText: false,
  },
  {
    name: 'Lưu ý lãi suất / Warning (chữ warn trên nền warn)',
    fg: 'status-warn-text',
    bg: 'status-warn-bg',
    isLargeText: false,
  },
];

console.log('='.repeat(80));
console.log('KIỂM TRA TỈ LỆ TƯƠNG PHẢN MÀU SẮC (WCAG 2.1 CONSTRAST AUDIT)');
console.log('='.repeat(80));
console.log(
  'Quy chuẩn: Chữ thường >= 4.5:1 (WCAG AA), Chữ lớn/đậm >= 3.0:1 (WCAG AA)'
);
console.log('-'.repeat(80));

let hasFailure = false;
const results = [];

for (const pair of COLOR_PAIRS) {
  const fgHex = PALETTE[pair.fg];
  const bgHex = PALETTE[pair.bg];
  if (!fgHex || !bgHex) {
    console.error(
      `Lỗi: Không tìm thấy mã màu cho token ${pair.fg} hoặc ${pair.bg}`
    );
    hasFailure = true;
    continue;
  }

  const ratio = getContrastRatio(fgHex, bgHex);
  const minRequired = pair.isLargeText ? 3.0 : 4.5;
  const passed = ratio >= minRequired;
  const level = ratio >= 7.0 ? 'AAA' : ratio >= minRequired ? 'AA' : 'FAIL';

  if (!passed) {
    hasFailure = true;
  }

  results.push({
    Mục: pair.name,
    'Chữ (Hex)': `${pair.fg} (${fgHex})`,
    'Nền (Hex)': `${pair.bg} (${bgHex})`,
    'Tỉ lệ': `${ratio.toFixed(2)}:1`,
    'Yêu cầu': `>= ${minRequired.toFixed(1)}:1`,
    'Kết quả': passed ? `ĐẠT (${level})` : 'KHÔNG ĐẠT',
  });
}

console.table(results);

if (hasFailure) {
  console.error(
    '\n[THẤT BẠI] Có cặp màu không đạt tiêu chuẩn độ tương phản WCAG 2.1!'
  );
  process.exit(1);
} else {
  console.log('\n[THÀNH CÔNG] Toàn bộ cặp màu đều đạt tiêu chuẩn WCAG AA/AAA.');
  process.exit(0);
}
