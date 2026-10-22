import type { HolidayNotice } from './schemas/schedule';

/**
 * Sắp xếp kỳ nghỉ theo ngày bắt đầu tăng dần (chuỗi ISO yyyy-mm-dd).
 * Kỳ chưa có ngày bắt đầu xếp cuối; trùng nhau giữ nguyên thứ tự trong dữ liệu.
 * Không dùng ngày hiện tại.
 */
export function sortHolidays(items: readonly HolidayNotice[]): HolidayNotice[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const sa = a.item.start_date || null;
      const sb = b.item.start_date || null;
      if (sa !== sb) {
        if (sa === null) return 1;
        if (sb === null) return -1;
        return sa < sb ? -1 : 1;
      }
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
