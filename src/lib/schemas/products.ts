import { z } from 'astro/zod';

/**
 * Một sản phẩm của Quỹ (cho vay hoặc tiền gửi).
 * Chỉ `name` là bắt buộc. Mọi trường còn lại để null khi chưa có dữ liệu thật
 * (không tự suy diễn điều kiện, hạn mức, thủ tục).
 */
export const productItemSchema = z.object({
  name: z.string(),
  summary: z.string().nullable(),
  target_customers: z.string().nullable(),
  amount_limit: z.string().nullable(),
  term: z.string().nullable(),
  conditions: z.string().nullable(),
  required_documents: z.string().nullable(),
});

export const productsSchema = z.object({
  loan_products: z.array(productItemSchema),
  deposit_products: z.array(productItemSchema),
});

export type ProductItem = z.infer<typeof productItemSchema>;
export type ProductsData = z.infer<typeof productsSchema>;
