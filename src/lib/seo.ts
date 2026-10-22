import fs from 'node:fs';
import path from 'node:path';
import type { SiteData } from './schemas/site';
import type { ContactData } from './schemas/contact';
import { toTelHref, buildOfficialDomainUrl } from './contact';

const PLACEHOLDER_PATTERN = /^\[(CẦN BỔ SUNG|TÊN QUỸ|CẦN XÁC NHẬN)/i;

/**
 * Kiểm tra xem một giá trị có phải là chuỗi placeholder không được xuất xưởng.
 */
export function isPlaceholder(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return true;
  return PLACEHOLDER_PATTERN.test(trimmed);
}

/**
 * Tạo nội dung file robots.txt.
 * Dòng Sitemap: <site>/sitemap-index.xml CHỈ được xuất hiện khi host không kết thúc bằng workers.dev hoặc pages.dev.
 */
export function buildRobotsTxt(siteUrl: string): string {
  let hostname = '';
  let cleanSite = siteUrl.trim();

  try {
    const parsed = new URL(cleanSite);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    hostname = cleanSite.toLowerCase().split('/')[0].split(':')[0];
  }

  const isPreviewOrWorkerHost =
    hostname === 'pages.dev' ||
    hostname.endsWith('.pages.dev') ||
    hostname === 'workers.dev' ||
    hostname.endsWith('.workers.dev');

  let content = 'User-agent: *\nAllow: /\n';

  if (!isPreviewOrWorkerHost && cleanSite) {
    const base = cleanSite.endsWith('/') ? cleanSite.slice(0, -1) : cleanSite;
    content += `\nSitemap: ${base}/sitemap-index.xml\n`;
  }

  return content;
}

/**
 * Tạo URL canonical tuyệt đối nhất quán với dấu gạch chéo cuối trang.
 */
export function buildCanonicalUrl(siteUrl: string, pathname: string): string {
  const base = (siteUrl || 'https://qtd.pages.dev').replace(/\/+$/, '');
  let cleanPath = pathname || '/';
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  // Giữ dấu gạch chéo cuối cùng nhất quán
  if (!cleanPath.endsWith('/')) {
    cleanPath = `${cleanPath}/`;
  }
  return `${base}${cleanPath}`;
}

/**
 * Kiểm tra sự tồn tại của ảnh chia sẻ mặc định og-default.* trong thư mục public.
 * Trả về đường dẫn ảnh tương đối (ví dụ /images/og-default.png) hoặc null nếu không có.
 */
export function getOgDefaultImagePath(publicDir: string): string | null {
  const imagesDir = path.join(publicDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    return null;
  }

  const supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
  for (const ext of supportedExtensions) {
    const candidate = path.join(imagesDir, `og-default${ext}`);
    if (fs.existsSync(candidate)) {
      return `/images/og-default${ext}`;
    }
  }

  return null;
}

/**
 * Sinh cấu trúc JSON-LD FinancialService tuân thủ schema.org.
 * - name: lấy từ site.name. Không phát ra JSON-LD nếu thiếu name hoặc là placeholder.
 * - url: từ official_domain (qua buildOfficialDomainUrl).
 * - telephone: từ toTelHref (bỏ tiền tố tel: để lấy dạng số chuẩn).
 * - address: lấy từ contact.address (bỏ các trường null hoặc placeholder).
 * - Bỏ mọi trường null, undefined hoặc placeholder.
 */
export function buildFinancialServiceJsonLd(params: {
  site?: Partial<SiteData> | null;
  contact?: Partial<ContactData> | null;
}): Record<string, unknown> | null {
  const site = params.site;
  const contact = params.contact;

  if (!site || !site.name || isPlaceholder(site.name)) {
    return null;
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: site.name.trim(),
  };

  // URL chính thức
  if (site.official_domain && !isPlaceholder(site.official_domain)) {
    const domainUrl = buildOfficialDomainUrl(site.official_domain);
    if (domainUrl) {
      jsonLd.url = domainUrl;
    }
  }

  // Số điện thoại liên hệ dạng chuẩn
  if (contact?.phone && !isPlaceholder(contact.phone)) {
    const telHref = toTelHref(contact.phone);
    if (telHref && telHref.startsWith('tel:')) {
      jsonLd.telephone = telHref.slice(4);
    }
  }

  // Địa chỉ trụ sở (PostalAddress)
  if (contact?.address) {
    const addr = contact.address;
    const postalAddress: Record<string, string> = {
      '@type': 'PostalAddress',
    };

    if (addr.street && !isPlaceholder(addr.street)) {
      postalAddress.streetAddress = addr.street.trim();
    } else if (addr.full && !isPlaceholder(addr.full)) {
      postalAddress.streetAddress = addr.full.trim();
    }

    if (addr.ward && !isPlaceholder(addr.ward)) {
      postalAddress.addressLocality = addr.ward.trim();
    }

    if (addr.district && !isPlaceholder(addr.district)) {
      postalAddress.addressRegion = addr.district.trim();
    }

    if (addr.city && !isPlaceholder(addr.city)) {
      postalAddress.addressCountry = 'VN';
    }

    // Chỉ đính kèm địa chỉ nếu có ít nhất 1 trường cụ thể
    if (Object.keys(postalAddress).length > 1) {
      jsonLd.address = postalAddress;
    }
  }

  return jsonLd;
}
