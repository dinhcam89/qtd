import type { CollectionEntry } from 'astro:content';

export type NewsEntry = CollectionEntry<'news'>;

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
 * Lấy danh sách tin tức/thông báo công khai (lọc bỏ toàn bộ bài draft: true),
 * sắp xếp theo ngày đăng mới nhất trước.
 */
export async function getPublishedNews(): Promise<NewsEntry[]> {
  const { getCollection } = await import('astro:content');
  const newsList = await getCollection('news');
  const published = filterPublishedNews(newsList);

  return published.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
}
