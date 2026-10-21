import fs from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';

/** Nhóm văn bản (nhãn cấu trúc, không phải nội dung pháp lý). Thứ tự = thứ tự hiển thị. */
export const DOCUMENT_CATEGORIES = [
  'dieu-le',
  'quy-che',
  'bieu-mau',
  'bao-cao',
  'khac',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  'dieu-le': 'Điều lệ',
  'quy-che': 'Quy chế',
  'bieu-mau': 'Biểu mẫu',
  'bao-cao': 'Báo cáo',
  khac: 'Văn bản khác',
};

/** Thư mục chứa PDF (đường dẫn tuyệt đối, tính từ thư mục gốc dự án khi build). */
export const DOCS_DIR = path.resolve(process.cwd(), 'public', 'docs');

export const documentsSchema = z.object({
  title: z.string().trim().min(1, 'Văn bản phải có tên'),
  /** Ngày văn bản (ISO yyyy-mm-dd). null = chưa có, hiển thị "Đang cập nhật". */
  date: z.union([z.null(), z.coerce.date()]),
  /** Tên file PDF nằm trực tiếp trong public/docs/ (không chứa đường dẫn). */
  file: z
    .string()
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/,
      'file phải là tên file .pdf nằm trực tiếp trong public/docs/ (chỉ chữ, số, ".", "_", "-")'
    )
    .refine((name) => fs.existsSync(path.join(DOCS_DIR, name)), {
      message:
        'File không tồn tại trong public/docs/. Hãy thêm file PDF thật trước khi khai báo văn bản.',
    }),
  category: z.enum(DOCUMENT_CATEGORIES),
});

export type DocumentData = z.infer<typeof documentsSchema>;
