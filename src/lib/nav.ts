export interface NavItem {
  label: string;
  href: string;
}

/**
 * Danh sách menu điều hướng chính của website.
 * Mọi trang mới được thêm vào đây sẽ tự động được kiểm thử bởi Playwright và Axe.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Giới thiệu', href: '/gioi-thieu' },
  { label: 'Lịch sử hình thành', href: '/lich-su' },
  { label: 'Ban lãnh đạo', href: '/ban-lanh-dao' },
  { label: 'Quy mô', href: '/#quy-mo' },
  { label: 'Lãi suất', href: '/#lai-suat' },
  { label: 'Liên hệ', href: '/#lien-he' },
] as const;

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
