import { test, expect } from '@playwright/test';
import {
  formatDate,
  formatFileSize,
  formatNumber,
  formatPercent,
  formatCurrency,
} from '../src/lib/format';
import { filterPublishedNews } from '../src/lib/news';
import { groupDocuments, type DocumentItem } from '../src/lib/documents';

test.describe('Unit tests — Định dạng chuẩn vi-VN (src/lib/format.ts)', () => {
  test('formatFileSize: bao phủ 0, 1023, 1024, 1536, 1048576, 1572864, null, undefined', () => {
    // 0 byte trả về "0 KB"
    expect(formatFileSize(0)).toBe('0 KB');

    // Dưới 1 MB (1024 * 1024 = 1.048.576 byte), hiển thị KB (làm tròn số nguyên)
    expect(formatFileSize(1023)).toBe('1 KB');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('2 KB'); // 1536 / 1024 = 1.5 -> làm tròn thành 2 KB

    // Từ 1 MB trở lên hiển thị MB với tối đa 1 chữ số thập phân, phân cách phẩy chuẩn vi-VN
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1572864)).toBe('1,5 MB'); // 1572864 / 1048576 = 1.5 -> 1,5 MB

    // Giá trị không hợp lệ trả về fallback "Đang cập nhật"
    expect(formatFileSize(null)).toBe('Đang cập nhật');
    expect(formatFileSize(undefined)).toBe('Đang cập nhật');
    expect(formatFileSize(-100)).toBe('Đang cập nhật');
  });

  test('formatDate: ISO hợp lệ, null, chuỗi sai', () => {
    // ISO hợp lệ dd/mm/yyyy
    expect(formatDate('2026-10-21T00:00:00Z')).toBe('21/10/2026');
    expect(formatDate('2026-03-05')).toBe('05/03/2026');
    expect(formatDate(new Date('2026-01-15T12:00:00Z'))).toBe('15/01/2026');

    // null / undefined / rỗng trả về "Đang cập nhật"
    expect(formatDate(null)).toBe('Đang cập nhật');
    expect(formatDate(undefined)).toBe('Đang cập nhật');
    expect(formatDate('')).toBe('Đang cập nhật');

    // Chuỗi sai định dạng trả về "Đang cập nhật"
    expect(formatDate('khong-phai-ngay')).toBe('Đang cập nhật');
    expect(formatDate('2026-99-99')).toBe('Đang cập nhật');
  });

  test('formatNumber: phân cách hàng nghìn bằng dấu chấm, phân cách thập phân bằng dấu phẩy theo vi-VN, null/undefined trả về "Đang cập nhật"', () => {
    expect(formatNumber(null)).toBe('Đang cập nhật');
    expect(formatNumber(undefined)).toBe('Đang cập nhật');
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(1000000)).toBe('1.000.000');
    expect(formatNumber(1234567.89)).toBe('1.234.567,89');
    expect(formatNumber(0)).toBe('0');
  });

  test('formatPercent: chuẩn Việt Nam (5,2%/năm hoặc 5,2%), null/undefined trả về "Đang cập nhật"', () => {
    expect(formatPercent(null)).toBe('Đang cập nhật');
    expect(formatPercent(undefined)).toBe('Đang cập nhật');
    expect(formatPercent(5.2)).toBe('5,2%/năm');
    expect(formatPercent(5.25)).toBe('5,25%/năm');
    expect(formatPercent(6)).toBe('6%/năm');
    expect(formatPercent(5.2, { perYear: false })).toBe('5,2%');
    expect(formatPercent(0)).toBe('0%/năm');
  });

  test('formatCurrency: chuẩn Việt Nam (1.000.000 đồng), null/undefined trả về "Đang cập nhật"', () => {
    expect(formatCurrency(null)).toBe('Đang cập nhật');
    expect(formatCurrency(undefined)).toBe('Đang cập nhật');
    expect(formatCurrency(1000000)).toBe('1.000.000 đồng');
    expect(formatCurrency(50000000)).toBe('50.000.000 đồng');
    expect(formatCurrency(0)).toBe('0 đồng');
  });
});

test.describe('Unit tests — Hàm nghiệp vụ tin tức và văn bản', () => {
  test('src/lib/news.ts: filterPublishedNews lọc bỏ bài viết draft: true, giữ draft: false hoặc undefined', () => {
    const mockNews = [
      {
        id: 'news-1',
        data: {
          title: 'Bài viết công khai 1',
          draft: false,
          pubDate: new Date('2026-01-01'),
        },
      },
      {
        id: 'news-2',
        data: {
          title: 'Bản nháp nội bộ',
          draft: true,
          pubDate: new Date('2026-01-02'),
        },
      },
      {
        id: 'news-3',
        data: {
          title: 'Bài viết mặc định (không có cờ draft)',
          draft: undefined,
          pubDate: new Date('2026-01-03'),
        },
      },
      {
        id: 'news-4',
        data: {
          title: 'Bản nháp 2',
          draft: true,
          pubDate: new Date('2026-01-04'),
        },
      },
    ];

    const published = filterPublishedNews(mockNews);
    expect(published).toHaveLength(2);
    expect(published.map((n) => n.id)).toEqual(['news-1', 'news-3']);
  });

  test('src/lib/documents.ts: groupDocuments nhóm theo danh mục cố định, lọc bỏ nhóm rỗng, sắp xếp ngày mới trước và null cuối cùng', () => {
    const mockItems: DocumentItem[] = [
      {
        id: 'doc-quyche-cu',
        title: 'Quy chế 2025',
        date: new Date('2025-01-01'),
        file: 'qc-cu.pdf',
        href: '/docs/qc-cu.pdf',
        sizeBytes: 100000,
        category: 'quy-che',
      },
      {
        id: 'doc-quyche-moi',
        title: 'Quy chế 2026',
        date: new Date('2026-06-01'),
        file: 'qc-moi.pdf',
        href: '/docs/qc-moi.pdf',
        sizeBytes: 120000,
        category: 'quy-che',
      },
      {
        id: 'doc-quyche-khong-ngay-b',
        title: 'Quy chế B không có ngày',
        date: null,
        file: 'qc-null-b.pdf',
        href: '/docs/qc-null-b.pdf',
        sizeBytes: 90000,
        category: 'quy-che',
      },
      {
        id: 'doc-quyche-khong-ngay-a',
        title: 'Quy chế A không có ngày',
        date: null,
        file: 'qc-null-a.pdf',
        href: '/docs/qc-null-a.pdf',
        sizeBytes: 80000,
        category: 'quy-che',
      },
      {
        id: 'doc-dieule',
        title: 'Điều lệ tổ chức',
        date: new Date('2026-01-10'),
        file: 'dieu-le.pdf',
        href: '/docs/dieu-le.pdf',
        sizeBytes: 250000,
        category: 'dieu-le',
      },
    ];

    const groups = groupDocuments(mockItems);

    // Thứ tự nhóm cố định theo DOCUMENT_CATEGORIES: 'dieu-le' trước, 'quy-che' sau; các nhóm không có dữ liệu ('bieu-mau', 'bao-cao', 'khac') bị lọc bỏ
    expect(groups).toHaveLength(2);
    expect(groups[0].category).toBe('dieu-le');
    expect(groups[0].label).toBe('Điều lệ');
    expect(groups[0].items).toHaveLength(1);

    expect(groups[1].category).toBe('quy-che');
    expect(groups[1].label).toBe('Quy chế');
    expect(groups[1].items).toHaveLength(4);

    // Kiểm tra thứ tự trong nhóm quy-che:
    // 1. Ngày mới nhất (2026-06-01)
    // 2. Ngày cũ hơn (2025-01-01)
    // 3. Null ngày xếp cuối, sắp xếp theo tên tiếng Việt (A trước B)
    expect(groups[1].items.map((i) => i.id)).toEqual([
      'doc-quyche-moi',
      'doc-quyche-cu',
      'doc-quyche-khong-ngay-a',
      'doc-quyche-khong-ngay-b',
    ]);
  });
});
