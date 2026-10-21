import { getEntry } from 'astro:content';
import type { SiteData } from './schemas/site';
import type { RatesData } from './schemas/rates';
import type { ContactData } from './schemas/contact';
import type { ScheduleData } from './schemas/schedule';
import type { LeadershipData } from './schemas/leadership';
import type { ProductsData } from './schemas/products';

/**
 * Lấy dữ liệu cấu hình chung của Quỹ từ collection site.
 */
export async function getSite(): Promise<SiteData> {
  const entry = await getEntry('site', 'site');
  if (!entry) {
    throw new Error('Không tìm thấy dữ liệu site.yaml trong collection site');
  }
  return entry.data;
}

/**
 * Lấy dữ liệu biểu lãi suất từ collection rates.
 */
export async function getRates(): Promise<RatesData> {
  const entry = await getEntry('rates', 'rates');
  if (!entry) {
    throw new Error('Không tìm thấy dữ liệu rates.yaml trong collection rates');
  }
  return entry.data;
}

/**
 * Lấy danh mục sản phẩm (cho vay, tiền gửi) từ collection products.
 */
export async function getProducts(): Promise<ProductsData> {
  const entry = await getEntry('products', 'products');
  if (!entry) {
    throw new Error(
      'Không tìm thấy dữ liệu products.yaml trong collection products'
    );
  }
  return entry.data;
}

/**
 * Lấy thông tin liên hệ từ collection contact.
 */
export async function getContact(): Promise<ContactData> {
  const entry = await getEntry('contact', 'contact');
  if (!entry) {
    throw new Error(
      'Không tìm thấy dữ liệu contact.yaml trong collection contact'
    );
  }
  return entry.data;
}

/**
 * Lấy lịch làm việc từ collection schedule.
 */
export async function getSchedule(): Promise<ScheduleData> {
  const entry = await getEntry('schedule', 'schedule');
  if (!entry) {
    throw new Error(
      'Không tìm thấy dữ liệu schedule.yaml trong collection schedule'
    );
  }
  return entry.data;
}

/**
 * Lấy thông tin ban lãnh đạo từ collection leadership.
 */
export async function getLeadership(): Promise<LeadershipData> {
  const entry = await getEntry('leadership', 'leadership');
  if (!entry) {
    throw new Error(
      'Không tìm thấy dữ liệu leadership.yaml trong collection leadership'
    );
  }
  return entry.data;
}

/**
 * Lấy nội dung văn bản từ collection pages theo slug (gioi-thieu, lich-su, su-menh).
 */
export async function getPageEntry(slug: 'gioi-thieu' | 'lich-su' | 'su-menh') {
  const entry = await getEntry('pages', slug);
  if (!entry) {
    throw new Error(`Không tìm thấy trang '${slug}' trong collection pages`);
  }
  return entry;
}
