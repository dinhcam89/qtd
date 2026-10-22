import { PAGE_SIZE } from './constants';

export interface PaginationResult<T> {
  items: T[];
  /** Trang hiện tại sau khi đã chuẩn hóa vào khoảng [1, totalPages]. */
  page: number;
  /** Tổng số trang, tối thiểu là 1 (kể cả khi không có mục nào). */
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * Phân trang một danh sách (hàm thuần, không phụ thuộc Astro).
 *
 * Quy ước:
 * - Không có mục nào: totalPages = 1, items rỗng (trang 1 vẫn tồn tại để hiển thị trạng thái rỗng).
 * - page không phải số nguyên hữu hạn hoặc nhỏ hơn 1: dùng trang 1.
 * - page lớn hơn totalPages: dùng trang cuối.
 * - pageSize phải là số nguyên dương, nếu không sẽ ném RangeError.
 */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number = PAGE_SIZE
): PaginationResult<T> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError(`pageSize phải là số nguyên dương, nhận: ${pageSize}`);
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const requested = Number.isInteger(page) && page >= 1 ? page : 1;
  const current = Math.min(requested, totalPages);
  const start = (current - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: current,
    totalPages,
    hasPrev: current > 1,
    hasNext: current < totalPages,
  };
}
