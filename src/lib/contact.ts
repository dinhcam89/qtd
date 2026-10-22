/**
 * Các hàm tiện ích thuần hỗ trợ chuẩn hóa liên hệ, điện thoại, email và bản đồ.
 */

/**
 * Chuẩn hóa số điện thoại thành href dạng `tel:<số>` hợp lệ.
 * - Bỏ khoảng trắng, dấu chấm, dấu gạch ngang (\s, ., -).
 * - Chấp nhận số bắt đầu bằng `0` hoặc `+84`.
 * - Phần số sau `+84` hoặc bắt đầu bằng `0` phải có độ dài chữ số hợp lệ (9 đến 11 chữ số cho đầu 0, tương đương 8-10 chữ số sau +84).
 * - Trả về `null` nếu value là null/undefined, rỗng, chứa ký tự chữ/placeholder/ký tự lạ, hoặc không đúng định dạng.
 */
export function toTelHref(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Nếu chứa placeholder dạng [CẦN BỔ SUNG...] hoặc [TÊN QUỸ]
  if (trimmed.includes('[') || trimmed.includes(']')) return null;

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
 * - Dùng regex email đơn giản.
 * - Trả về `null` nếu null, undefined, rỗng, có khoảng trắng, hoặc là placeholder.
 */
export function toMailtoHref(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes('[') || trimmed.includes(']')) return null;

  // Regex email đơn giản: <local>@<domain>.<tld>
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return `mailto:${trimmed}`;
}

/**
 * Tạo URL xem bản đồ Google Maps mở ở tab mới.
 * - Trả về `https://www.google.com/maps/search/?api=1&query=<encodeURIComponent(địa chỉ đầy đủ)>`.
 * - Trả về `null` nếu địa chỉ là null/undefined, rỗng, hoặc là placeholder dạng [CẦN BỔ SUNG...] hoặc [TÊN QUỸ].
 */
export function buildMapUrl(address: string | null | undefined): string | null {
  if (!address || typeof address !== 'string') return null;
  const trimmed = address.trim();
  if (!trimmed) return null;

  if (
    trimmed.includes('[CẦN BỔ SUNG') ||
    trimmed.includes('[TÊN QUỸ') ||
    trimmed.includes('[CẦN XÁC NHẬN')
  ) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

/**
 * Kiểm tra tên miền hợp lệ và tạo URL https://<domain>.
 * Trả về `null` nếu null, undefined, không hợp lệ hoặc chứa protocol/đường dẫn.
 */
export function buildOfficialDomainUrl(
  domain: string | null | undefined
): string | null {
  if (!domain || typeof domain !== 'string') return null;
  const trimmed = domain.trim();
  if (!trimmed) return null;

  if (
    trimmed.includes('://') ||
    trimmed.includes('/') ||
    trimmed.includes(' ') ||
    trimmed.includes(':') ||
    trimmed.includes('[')
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
  if (!trimmed) return fallback;

  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    trimmed.includes('[CẦN BỔ SUNG') ||
    trimmed.includes('[TÊN QUỸ') ||
    trimmed.includes('[CẦN XÁC NHẬN')
  ) {
    return fallback;
  }

  return trimmed;
}
