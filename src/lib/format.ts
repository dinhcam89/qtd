import { DEFAULT_FALLBACK_TEXT } from './constants';

const LOCALE_VI = 'vi-VN';

/**
 * Định dạng ngày theo chuẩn Việt Nam dd/mm/yyyy (Intl locale vi-VN).
 * Trả về "Đang cập nhật" khi giá trị null, undefined hoặc không hợp lệ.
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  fallback = DEFAULT_FALLBACK_TEXT
): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(LOCALE_VI, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}

/**
 * Định dạng số liệu quy mô kèm nhãn "tính đến dd/mm/yyyy" theo Mục 5.2 AGENTS.md.
 * Trả về "Đang cập nhật" khi ngày null, undefined hoặc không hợp lệ.
 */
export function formatAsOf(
  value: Date | string | number | null | undefined,
  fallback = DEFAULT_FALLBACK_TEXT
): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const formattedDate = formatDate(value, '');
  if (!formattedDate) {
    return fallback;
  }

  return `tính đến ${formattedDate}`;
}

/**
 * Định dạng số nguyên/thập phân thông thường theo chuẩn vi-VN (phân cách hàng nghìn bằng dấu chấm).
 * Trả về "Đang cập nhật" khi null/undefined.
 */
export function formatNumber(
  value: number | bigint | null | undefined,
  fallback = DEFAULT_FALLBACK_TEXT
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return new Intl.NumberFormat(LOCALE_VI).format(value);
}

/**
 * Định dạng tiền tệ VNĐ theo chuẩn Mục 5.7 AGENTS.md (ví dụ: 1.000.000 đồng).
 * Trả về "Đang cập nhật" khi null/undefined.
 */
export function formatCurrency(
  value: number | bigint | null | undefined,
  fallback = DEFAULT_FALLBACK_TEXT
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return `${new Intl.NumberFormat(LOCALE_VI).format(value)} đồng`;
}

export interface FormatPercentOptions {
  /** Có hiển thị hậu tố /năm hay không (mặc định: true) */
  perYear?: boolean;
  /** Số chữ số thập phân tối đa (mặc định: 2) */
  decimals?: number;
}

/**
 * Định dạng lãi suất phần trăm theo chuẩn Việt Nam (dấu phẩy thập phân: 5,2%/năm hoặc 5,2%).
 * Giá trị đầu vào là số phần trăm thực tế (ví dụ: 5.2 tương ứng 5,2%).
 * Trả về "Đang cập nhật" khi null/undefined.
 */
export function formatPercent(
  value: number | null | undefined,
  options: FormatPercentOptions = {},
  fallback = DEFAULT_FALLBACK_TEXT
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const { perYear = true, decimals = 2 } = options;

  const formatted = new Intl.NumberFormat(LOCALE_VI, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);

  return perYear ? `${formatted}%/năm` : `${formatted}%`;
}

/**
 * Định dạng chuỗi văn bản an toàn, trả về fallback khi chuỗi rỗng/chỉ chứa khoảng trắng hoặc null/undefined.
 */
export function formatText(
  value: string | null | undefined,
  fallback = DEFAULT_FALLBACK_TEXT
): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}
