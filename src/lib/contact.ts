/**
 * Các hàm tiện ích thuần hỗ trợ chuẩn hóa liên hệ, điện thoại, email và bản đồ.
 */

const PLACEHOLDER_PATTERN = /^\[(CẦN BỔ SUNG|TÊN QUỸ|CẦN XÁC NHẬN)/;

function isPlaceholderText(value: string): boolean {
  return (
    (value.startsWith('[') && value.endsWith(']')) ||
    PLACEHOLDER_PATTERN.test(value)
  );
}

/**
 * Chuẩn hóa số điện thoại thành href dạng `tel:<số>` hợp lệ.
 * - Chỉ cho phép ký tự số, dấu + ở đầu và các ký tự phân cách (khoảng trắng, dấu chấm, dấu gạch ngang).
 * - Bỏ khoảng trắng, dấu chấm, dấu gạch ngang.
 * - Chấp nhận số bắt đầu bằng `0` hoặc `+84`.
 * - Phần số sau `+84` hoặc bắt đầu bằng `0` phải có độ dài chữ số hợp lệ (9 đến 11 chữ số cho đầu 0, tương đương 8-10 chữ số sau +84).
 * - Trả về `null` nếu value là null/undefined, rỗng, chứa ký tự chữ/placeholder/ký tự lạ, hoặc không đúng định dạng.
 */
export function toTelHref(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || isPlaceholderText(trimmed)) return null;

  // Chỉ cho phép dấu + ở đầu, chữ số và các ký tự phân cách khoảng trắng, dấu chấm, dấu gạch
  if (!/^\+?[0-9\s.-]+$/.test(trimmed)) return null;

  // Bỏ khoảng trắng, dấu chấm, dấu gạch ngang
  const cleaned = trimmed.replace(/[\s.-]/g, '');

  // Kiểm tra định dạng bắt đầu bằng 0 hoặc +84
  if (cleaned.startsWith('+84')) {
    const digitsAfter = cleaned.slice(3);
    if (!/^[0-9]+$/.test(digitsAfter)) return null;
    if (digitsAfter.length >= 8 && digitsAfter.length <= 10) {
      return `tel:${cleaned}`;
    }
    return null;
  }

  if (cleaned.startsWith('0')) {
    if (!/^[0-9]+$/.test(cleaned)) return null;
    if (cleaned.length >= 9 && cleaned.length <= 11) {
      return `tel:${cleaned}`;
    }
    return null;
  }

  return null;
}

/**
 * Chuẩn hóa địa chỉ email thành href dạng `mailto:<email>` hợp lệ.
 * - Từ chối các ký tự: ?, &, ,, ;, %, khoảng trắng, <, > (chống chèn tham số/header injection).
 * - Dùng regex email an toàn: <local>@<domain>.<tld>.
 * - Trả về `null` nếu null, undefined, rỗng, hoặc là placeholder.
 */
export function toMailtoHref(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || isPlaceholderText(trimmed)) return null;

  // Từ chối tuyệt đối các ký tự điều khiển/tham số: ?, &, ,, ;, %, khoảng trắng, <, >
  if (/[?&,;%\s<>]/.test(trimmed)) return null;

  // Regex email an toàn (không chấp nhận %)
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return `mailto:${trimmed}`;
}

/**
 * Tạo URL xem bản đồ Google Maps mở ở tab mới.
 * - Trả về `https://www.google.com/maps/search/?api=1&query=<encodeURIComponent(địa chỉ đầy đủ)>`.
 * - Trả về `null` nếu địa chỉ là null/undefined, rỗng, hoặc là placeholder.
 */
export function buildMapUrl(address: string | null | undefined): string | null {
  if (!address || typeof address !== 'string') return null;
  const trimmed = address.trim();
  if (!trimmed || isPlaceholderText(trimmed)) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

/**
 * Kiểm tra tên miền hợp lệ và tạo URL https://<domain>.
 * - Từ chối /, :, @, khoảng trắng, và chữ "http".
 * - Trả về `null` nếu null, undefined, không hợp lệ hoặc chứa protocol/đường dẫn.
 */
export function buildOfficialDomainUrl(
  domain: string | null | undefined
): string | null {
  if (!domain || typeof domain !== 'string') return null;
  const trimmed = domain.trim();
  if (!trimmed || isPlaceholderText(trimmed)) return null;

  // Từ chối /, :, @, khoảng trắng và chữ "http"
  if (
    trimmed.includes('/') ||
    trimmed.includes(':') ||
    trimmed.includes('@') ||
    /\s/.test(trimmed) ||
    trimmed.toLowerCase().includes('http')
  ) {
    return null;
  }

  if (
    !/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(
      trimmed
    )
  ) {
    return null;
  }

  return `https://${trimmed}`;
}

/**
 * Định dạng văn bản liên hệ an toàn, trả về "Đang cập nhật" khi null, rỗng hoặc là placeholder.
 */
export function formatContactText(
  value: string | null | undefined,
  fallback = 'Đang cập nhật'
): string {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || isPlaceholderText(trimmed)) return fallback;

  return trimmed;
}
