import type { CollectionEntry } from 'astro:content';
import { NEWS_CATEGORY_LABELS, type NewsCategory } from './schemas/news';

export type NewsEntry = CollectionEntry<'news'>;

/** Slug bị cấm vì trùng đoạn đường dẫn dành cho phân trang (/tin-tuc/trang/<n>/). */
export const RESERVED_NEWS_SLUGS: readonly string[] = ['trang'];

export interface NewsFilterable {
  data: {
    draft?: boolean;
    pubDate?: Date;
    [key: string]: unknown;
  };
}

/**
 * Lọc danh sách bài viết đã xuất bản (bỏ các bài có draft: true).
 */
export function filterPublishedNews<T extends NewsFilterable>(items: T[]): T[] {
  return items.filter((item) => item.data.draft !== true);
}

/**
 * So sánh để sắp xếp: ngày đăng mới trước; trùng ngày thì theo id tăng dần để thứ tự ổn định.
 */
export function compareNewsDesc(
  a: { id: string; data: { pubDate: Date } },
  b: { id: string; data: { pubDate: Date } }
): number {
  const diff = b.data.pubDate.getTime() - a.data.pubDate.getTime();
  if (diff !== 0) return diff;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Slug của bài viết = tên file (đoạn cuối của id, không gồm thư mục). */
export function getNewsSlug(id: string): string {
  const parts = id.split('/');
  return parts[parts.length - 1];
}

/**
 * Kiểm tra slug: không trùng nhau và không dùng slug dành riêng. Ném lỗi rõ ràng khi vi phạm.
 */
export function assertUniqueNewsSlugs(ids: readonly string[]): void {
  const seen = new Map<string, string>();
  for (const id of ids) {
    const slug = getNewsSlug(id);
    if (RESERVED_NEWS_SLUGS.includes(slug)) {
      throw new Error(
        `Slug tin tức "${slug}" (file: ${id}) bị cấm vì trùng đường dẫn /tin-tuc/${slug}/ dành cho phân trang. Hãy đổi tên file.`
      );
    }
    const existing = seen.get(slug);
    if (existing !== undefined) {
      throw new Error(
        `Hai bài tin tức trùng slug "${slug}": "${existing}" và "${id}". Mỗi bài phải có tên file duy nhất.`
      );
    }
    seen.set(slug, id);
  }
}

/** Đường dẫn trang danh sách: trang 1 là /tin-tuc/, các trang sau là /tin-tuc/trang/<n>/. */
export function getNewsListHref(page: number): string {
  return page <= 1 ? '/tin-tuc/' : `/tin-tuc/trang/${page}/`;
}

export function getNewsDetailHref(id: string): string {
  return `/tin-tuc/${getNewsSlug(id)}/`;
}

export function getNewsCategoryLabel(category: NewsCategory): string {
  return NEWS_CATEGORY_LABELS[category];
}

/**
 * Lấy danh sách tin tức/thông báo công khai (lọc bỏ toàn bộ bài draft: true),
 * sắp xếp theo ngày đăng mới nhất trước. Kiểm tra slug trùng trên toàn bộ bài (cả bản nháp).
 */
export async function getPublishedNews(): Promise<NewsEntry[]> {
  const { getCollection } = await import('astro:content');
  const newsList = await getCollection('news');
  assertUniqueNewsSlugs(newsList.map((entry) => entry.id));
  const published = filterPublishedNews(newsList);

  return published.sort(compareNewsDesc);
}
