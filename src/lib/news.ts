import { getCollection, type CollectionEntry } from 'astro:content';

export type NewsEntry = CollectionEntry<'news'>;

/**
 * Lấy danh sách tin tức/thông báo công khai (lọc bỏ toàn bộ bài draft: true),
 * sắp xếp theo ngày đăng mới nhất trước.
 */
export async function getPublishedNews(): Promise<NewsEntry[]> {
  const newsList = await getCollection('news', ({ data }) => {
    return data.draft !== true;
  });

  return newsList.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
}
