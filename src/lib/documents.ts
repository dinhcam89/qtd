import fs from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';
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
 * Lấy danh sách văn bản theo nhóm (chỉ nhóm có mục). Dung lượng đọc trực tiếp từ file lúc build.
 * Trong mỗi nhóm: ngày mới trước, mục chưa có ngày xếp cuối, rồi theo tên.
 */
export async function getDocumentGroups(): Promise<DocumentGroup[]> {
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

  return DOCUMENT_CATEGORIES.map((category) => ({
    category,
    label: DOCUMENT_CATEGORY_LABELS[category],
    items: items
      .filter((item) => item.category === category)
      .sort((a, b) => {
        const ta = a.date ? a.date.getTime() : -Infinity;
        const tb = b.date ? b.date.getTime() : -Infinity;
        if (ta !== tb) return tb - ta;
        return a.title.localeCompare(b.title, 'vi');
      }),
  })).filter((group) => group.items.length > 0);
}
