import { z } from 'astro/zod';

export const newsImageSchema = z.object({
  src: z.string(),
  alt: z.string().min(1, 'Ảnh bắt buộc phải có mô tả alt'),
});

export const newsSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  category: z.string(),
  draft: z.boolean().default(false),
  image: newsImageSchema.optional(),
});

export type NewsImage = z.infer<typeof newsImageSchema>;
export type NewsData = z.infer<typeof newsSchema>;
