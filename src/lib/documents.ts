import fs from 'node:fs';
import path from 'node:path';
import {
  DOCS_DIR,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
} from './schemas/documents';

export interface DocumentItem {
  id: string;
  title: string;
  date: Date | null;
  file: string;
  href: string;
  sizeBytes: number;
  category: DocumentCategory;
}

export interface DocumentGroup {
  category: DocumentCategory;
  label: string;
  items: DocumentItem[];
}

/**
 * Gom nhóm danh sách văn bản theo danh mục cố định (chỉ giữ nhóm có mục).
 * Trong mỗi nhóm: ngày mới trước, mục chưa có ngày xếp cuối, rồi theo tên theo chuẩn tiếng Việt.
 */
export function groupDocuments(
  items: DocumentItem[],
  categories: readonly DocumentCategory[] = DOCUMENT_CATEGORIES,
  labels: Record<DocumentCategory, string> = DOCUMENT_CATEGORY_LABELS
): DocumentGroup[] {
  return categories
    .map((category) => ({
      category,
      label: labels[category],
      items: items
        .filter((item) => item.category === category)
        .sort((a, b) => {
          const ta = a.date ? a.date.getTime() : -Infinity;
          const tb = b.date ? b.date.getTime() : -Infinity;
          if (ta !== tb) return tb - ta;
          return a.title.localeCompare(b.title, 'vi');
        }),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Lấy danh sách văn bản theo nhóm (chỉ nhóm có mục). Dung lượng đọc trực tiếp từ file lúc build.
 * Trong mỗi nhóm: ngày mới trước, mục chưa có ngày xếp cuối, rồi theo tên.
 */
export async function getDocumentGroups(): Promise<DocumentGroup[]> {
  const { getCollection } = await import('astro:content');
  const entries = await getCollection('documents');
  const items: DocumentItem[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.data.title,
    date: entry.data.date,
    file: entry.data.file,
    href: `/docs/${entry.data.file}`,
    sizeBytes: fs.statSync(path.join(DOCS_DIR, entry.data.file)).size,
    category: entry.data.category,
  }));

  return groupDocuments(items);
}
