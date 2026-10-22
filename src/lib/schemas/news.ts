import { z } from 'astro/zod';

export const NEWS_CATEGORIES = ['tin-tuc', 'thong-bao', 'hoat-dong'] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/** Nhãn tiếng Việt hiển thị cho từng category. */
export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  'tin-tuc': 'Tin tức',
  'thong-bao': 'Thông báo',
  'hoat-dong': 'Hoạt động',
};

export const newsImageSchema = z.object({
  src: z.string(),
  alt: z.string().min(1, 'Ảnh bắt buộc phải có mô tả alt'),
});

export const newsSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  category: z.enum(NEWS_CATEGORIES),
  draft: z.boolean().default(false),
  image: newsImageSchema.optional(),
});

export type NewsImage = z.infer<typeof newsImageSchema>;
export type NewsData = z.infer<typeof newsSchema>;
