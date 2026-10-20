export interface NavItem {
  label: string;
  href: string;
}

/**
 * Danh sách menu neo trong trang chủ theo quy chuẩn Phase 1.
 * Tuyệt đối không tạo liên kết tới các trang con chưa tồn tại.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Trang chủ', href: '#' },
  { label: 'Quy mô', href: '#quy-mo' },
  { label: 'Lãi suất', href: '#lai-suat' },
  { label: 'Liên hệ', href: '#lien-he' },
] as const;
