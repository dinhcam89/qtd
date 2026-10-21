import { z } from 'astro/zod';

export const pageSchema = z.object({
  title: z.string().min(1, 'Tiêu đề trang không được để trống'),
  description: z.string().min(1, 'Mô tả trang không được để trống'),
  updated: z.coerce.date(),
});

export type PageData = z.infer<typeof pageSchema>;
