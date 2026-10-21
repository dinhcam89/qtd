export interface NavItem {
  label: string;
  href: string;
  /**
   * true: hiển thị ở menu ngang trên desktop (tối đa MAX_PRIMARY_NAV_ITEMS mục).
   * false: chỉ xuất hiện trong panel menu mobile, footer và các thẻ liên kết trong trang.
   */
  primary: boolean;
}

/** Số mục tối đa ở menu ngang desktop để không bị chật. */
export const MAX_PRIMARY_NAV_ITEMS = 6;

/**
 * Danh sách menu điều hướng của website.
 * Mọi trang mới được thêm vào đây sẽ tự động được kiểm thử bởi Playwright và Axe.
 * Các mục `primary: false` là trang con, truy cập từ trang Giới thiệu, footer và menu mobile.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Trang chủ', href: '/', primary: true },
  { label: 'Giới thiệu', href: '/gioi-thieu', primary: true },
  { label: 'Lịch sử hình thành', href: '/lich-su', primary: false },
  { label: 'Ban lãnh đạo', href: '/ban-lanh-dao', primary: false },
  { label: 'Quy mô', href: '/quy-mo', primary: false },
  { label: 'Quy chế và văn bản', href: '/quy-che', primary: false },
  { label: 'Sản phẩm', href: '/san-pham', primary: true },
  { label: 'Lãi suất', href: '/lai-suat', primary: true },
  { label: 'Liên hệ', href: '/#lien-he', primary: true },
] as const;

/** Các mục hiển thị ở menu ngang desktop. */
export const PRIMARY_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter(
  (item) => item.primary
);

/**
 * Lấy danh sách toàn bộ các trang nội bộ độc lập (route pathname) để kiểm thử tự động.
 * Tự động trích xuất từ NAV_ITEMS (loại bỏ hash anchor và trùng lặp) và bổ sung các trang hệ thống như /404.
 */
export function getNavRoutes(): Array<{ path: string; name: string }> {
  const seen = new Set<string>();
  const routes: Array<{ path: string; name: string }> = [];

  for (const item of NAV_ITEMS) {
    const [pathOnly] = item.href.split('#');
    const cleanPath = pathOnly || '/';

    if (cleanPath.startsWith('/') && !seen.has(cleanPath)) {
      seen.add(cleanPath);
      routes.push({
        path: cleanPath,
        name: item.label,
      });
    }
  }

  // Đảm bảo trang 404 luôn được kiểm thử
  if (!seen.has('/404')) {
    routes.push({ path: '/404', name: 'Trang 404' });
  }

  return routes;
}
