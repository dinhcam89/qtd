import { test, expect } from '@playwright/test';
import {
  formatDate,
  formatDateIso,
  formatFileSize,
  formatNumber,
  formatPercent,
  formatCurrency,
} from '../src/lib/format';
import {
  filterPublishedNews,
  compareNewsDesc,
  getNewsSlug,
  assertUniqueNewsSlugs,
  getNewsListHref,
  getNewsDetailHref,
} from '../src/lib/news';
import { sortHolidays } from '../src/lib/schedule';
import { groupDocuments, type DocumentItem } from '../src/lib/documents';
import { paginate } from '../src/lib/pagination';
import { PAGE_SIZE } from '../src/lib/constants';
import {
  toTelHref,
  toMailtoHref,
  buildMapUrl,
  buildOfficialDomainUrl,
  formatContactText,
} from '../src/lib/contact';
import {
  buildRobotsTxt,
  buildCanonicalUrl,
  getOgDefaultImagePath,
  buildFinancialServiceJsonLd,
} from '../src/lib/seo';
import { decideBuildMode } from '../scripts/lib/build-mode.mjs';

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

test.describe('Unit tests — Phân trang (src/lib/pagination.ts)', () => {
  const make = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

  test('PAGE_SIZE mặc định là 10', () => {
    expect(PAGE_SIZE).toBe(10);
  });

  test('0 bài: 1 trang, rỗng, không có Trước/Sau', () => {
    const r = paginate(make(0), 1, 10);
    expect(r).toEqual({
      items: [],
      page: 1,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    });
  });

  test('1 bài và đúng 10 bài: 1 trang', () => {
    const one = paginate(make(1), 1, 10);
    expect(one.totalPages).toBe(1);
    expect(one.items).toEqual([1]);
    expect(one.hasNext).toBe(false);

    const ten = paginate(make(10), 1, 10);
    expect(ten.totalPages).toBe(1);
    expect(ten.items).toHaveLength(10);
    expect(ten.hasPrev).toBe(false);
    expect(ten.hasNext).toBe(false);
  });

  test('11 bài: 2 trang, trang 2 có đúng 1 bài', () => {
    const p1 = paginate(make(11), 1, 10);
    expect(p1.totalPages).toBe(2);
    expect(p1.items).toHaveLength(10);
    expect(p1.hasPrev).toBe(false);
    expect(p1.hasNext).toBe(true);

    const p2 = paginate(make(11), 2, 10);
    expect(p2.items).toEqual([11]);
    expect(p2.hasPrev).toBe(true);
    expect(p2.hasNext).toBe(false);
  });

  test('20 bài: 2 trang đầy; 21 bài: 3 trang, trang giữa có cả Trước và Sau', () => {
    const p20 = paginate(make(20), 2, 10);
    expect(p20.totalPages).toBe(2);
    expect(p20.items).toEqual(make(20).slice(10));
    expect(p20.hasNext).toBe(false);

    const mid = paginate(make(21), 2, 10);
    expect(mid.totalPages).toBe(3);
    expect(mid.items).toEqual(make(21).slice(10, 20));
    expect(mid.hasPrev).toBe(true);
    expect(mid.hasNext).toBe(true);

    const last = paginate(make(21), 3, 10);
    expect(last.items).toEqual([21]);
    expect(last.hasNext).toBe(false);
  });

  test('page < 1 hoặc không hợp lệ dùng trang 1; page > totalPages dùng trang cuối', () => {
    expect(paginate(make(21), 0, 10).page).toBe(1);
    expect(paginate(make(21), -5, 10).page).toBe(1);
    expect(paginate(make(21), Number.NaN, 10).page).toBe(1);
    expect(paginate(make(21), 1.5, 10).page).toBe(1);
    const over = paginate(make(21), 99, 10);
    expect(over.page).toBe(3);
    expect(over.items).toEqual([21]);
    expect(paginate(make(0), 7, 10).page).toBe(1);
  });

  test('mặc định dùng PAGE_SIZE; pageSize không hợp lệ ném RangeError', () => {
    expect(paginate(make(25), 1).items).toHaveLength(PAGE_SIZE);
    expect(() => paginate(make(5), 1, 0)).toThrow(RangeError);
    expect(() => paginate(make(5), 1, 2.5)).toThrow(RangeError);
  });
});

test.describe('Unit tests — Helper tin tức, lịch nghỉ, ngày ISO', () => {
  test('compareNewsDesc: ngày mới trước, trùng ngày thì theo id (ổn định)', () => {
    const d = (s: string) => new Date(s);
    const list = [
      { id: 'b', data: { pubDate: d('2026-05-01') } },
      { id: 'z', data: { pubDate: d('2026-06-01') } },
      { id: 'a', data: { pubDate: d('2026-05-01') } },
    ];
    const once = [...list].sort(compareNewsDesc).map((i) => i.id);
    const reversed = [...list]
      .reverse()
      .sort(compareNewsDesc)
      .map((i) => i.id);
    expect(once).toEqual(['z', 'a', 'b']);
    expect(reversed).toEqual(once);
  });

  test('getNewsSlug và href: slug lấy từ tên file, trang 1 là /tin-tuc/', () => {
    expect(getNewsSlug('2026-01-01-bai-viet')).toBe('2026-01-01-bai-viet');
    expect(getNewsSlug('thu-muc/bai-viet')).toBe('bai-viet');
    expect(getNewsListHref(1)).toBe('/tin-tuc/');
    expect(getNewsListHref(2)).toBe('/tin-tuc/trang/2/');
    expect(getNewsDetailHref('a/bai-viet')).toBe('/tin-tuc/bai-viet/');
  });

  test('assertUniqueNewsSlugs: ném lỗi khi trùng slug hoặc dùng slug "trang"', () => {
    expect(() => assertUniqueNewsSlugs(['a', 'b', 'c'])).not.toThrow();
    expect(() => assertUniqueNewsSlugs(['a', 'x/a'])).toThrow(/trùng slug "a"/);
    expect(() => assertUniqueNewsSlugs(['trang'])).toThrow(/bị cấm/);
  });

  test('sortHolidays: theo ngày bắt đầu, null cuối, trùng giữ thứ tự dữ liệu', () => {
    const items = [
      { title: 'C', start_date: '2026-09-02' },
      { title: 'N', start_date: null },
      { title: 'A', start_date: '2026-01-01' },
      { title: 'B1', start_date: '2026-04-25' },
      { title: 'B2', start_date: '2026-04-25' },
    ];
    expect(sortHolidays(items).map((i) => i.title)).toEqual([
      'A',
      'B1',
      'B2',
      'C',
      'N',
    ]);
  });

  test('formatDateIso: yyyy-mm-dd theo múi giờ Việt Nam, rỗng khi không hợp lệ', () => {
    expect(formatDateIso('2026-03-05')).toBe('2026-03-05');
    expect(formatDateIso(new Date('2026-03-05T20:00:00Z'))).toBe('2026-03-06');
    expect(formatDateIso(null)).toBe('');
    expect(formatDateIso('khong-phai-ngay')).toBe('');
  });
});

test.describe('Unit tests — Hàm xử lý liên hệ và bản đồ (src/lib/contact.ts)', () => {
  test('toTelHref: chuẩn hóa các định dạng hợp lệ, bỏ khoảng trắng/chấm/gạch', () => {
    expect(toTelHref('0123 456 789')).toBe('tel:0123456789');
    expect(toTelHref('0123.456.789')).toBe('tel:0123456789');
    expect(toTelHref('0123-456-789')).toBe('tel:0123456789');
    expect(toTelHref('+84 123 456 789')).toBe('tel:+84123456789');
    expect(toTelHref('+84.123.456.789')).toBe('tel:+84123456789');
    expect(toTelHref('024 3123 4567')).toBe('tel:02431234567');
  });

  test('toTelHref: trả về null cho số quá ngắn, quá dài, có chữ, placeholder, null, undefined', () => {
    expect(toTelHref('012345')).toBeNull(); // Quá ngắn (< 9 số)
    expect(toTelHref('01234567890123')).toBeNull(); // Quá dài (> 11 số)
    expect(toTelHref('+84 12')).toBeNull(); // Quá ngắn
    expect(toTelHref('+84 123456789012')).toBeNull(); // Quá dài
    expect(toTelHref('0123abc789')).toBeNull(); // Có chữ cái
    expect(toTelHref('+84 abc 123')).toBeNull();
    expect(toTelHref('[CẦN BỔ SUNG: số điện thoại]')).toBeNull();
    expect(toTelHref('[TÊN QUỸ]')).toBeNull();
    expect(toTelHref('')).toBeNull();
    expect(toTelHref('   ')).toBeNull();
    expect(toTelHref(null)).toBeNull();
    expect(toTelHref(undefined)).toBeNull();
  });

  test('toMailtoHref: chuẩn hóa email hợp lệ, trả về null cho email sai hoặc placeholder', () => {
    expect(toMailtoHref('fixture@example.invalid')).toBe(
      'mailto:fixture@example.invalid'
    );
    expect(toMailtoHref('contact@qtd.vn')).toBe('mailto:contact@qtd.vn');
    expect(toMailtoHref('  info@domain.com.vn  ')).toBe(
      'mailto:info@domain.com.vn'
    );

    // Các trường hợp injection / ký tự đặc biệt theo yêu cầu kiểm tra
    expect(toMailtoHref('a%40b@x.vn')).toBeNull();
    expect(toMailtoHref('a b@x.vn')).toBeNull();
    expect(toMailtoHref('a@x.vn?subject=1')).toBeNull();
    expect(toMailtoHref('a@x.vn,b@y.vn')).toBeNull();
    expect(toMailtoHref('<a@x.vn>')).toBeNull();
    expect(toMailtoHref('ten.ho+tag@x.vn')).toBe('mailto:ten.ho+tag@x.vn');

    // Không hợp lệ & từ chối ký tự đặc biệt / injection
    expect(toMailtoHref('invalid-email')).toBeNull();
    expect(toMailtoHref('@example.com')).toBeNull();
    expect(toMailtoHref('user@')).toBeNull();
    expect(toMailtoHref('user@domain')).toBeNull();
    expect(toMailtoHref('user @domain.com')).toBeNull();
    expect(toMailtoHref('user?param=1@domain.com')).toBeNull();
    expect(toMailtoHref('user&arg=2@domain.com')).toBeNull();
    expect(toMailtoHref('user,name@domain.com')).toBeNull();
    expect(toMailtoHref('user;semi@domain.com')).toBeNull();
    expect(toMailtoHref('user%20@domain.com')).toBeNull();
    expect(toMailtoHref('<user>@domain.com')).toBeNull();
    expect(toMailtoHref('user<@domain.com')).toBeNull();
    expect(toMailtoHref('user>@domain.com')).toBeNull();
    expect(toMailtoHref('[CẦN BỔ SUNG: email]')).toBeNull();
    expect(toMailtoHref('')).toBeNull();
    expect(toMailtoHref('   ')).toBeNull();
    expect(toMailtoHref(null)).toBeNull();
    expect(toMailtoHref(undefined)).toBeNull();
  });

  test('buildMapUrl: tạo link tìm kiếm Google Maps an toàn, null khi địa chỉ thiếu hoặc là placeholder', () => {
    expect(buildMapUrl('Số 123 Đường Tín Dụng, Hà Nội')).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Số 123 Đường Tín Dụng, Hà Nội')}`
    );
    expect(buildMapUrl('[CẦN BỔ SUNG: địa chỉ đầy đủ]')).toBeNull();
    expect(buildMapUrl('[TÊN QUỸ]')).toBeNull();
    expect(buildMapUrl('')).toBeNull();
    expect(buildMapUrl('   ')).toBeNull();
    expect(buildMapUrl(null)).toBeNull();
    expect(buildMapUrl(undefined)).toBeNull();
  });

  test('buildOfficialDomainUrl: tạo URL https:// khi hostname hợp lệ, null khi có protocol/path/sai format/từ chối /, :, @, khoảng trắng, chữ http', () => {
    expect(buildOfficialDomainUrl('fixture.example.invalid')).toBe(
      'https://fixture.example.invalid'
    );
    expect(buildOfficialDomainUrl('qtd.example.vn')).toBe(
      'https://qtd.example.vn'
    );
    expect(buildOfficialDomainUrl('https://example.com')).toBeNull();
    expect(buildOfficialDomainUrl('http://example.com')).toBeNull();
    expect(buildOfficialDomainUrl('http.example.vn')).toBeNull();
    expect(buildOfficialDomainUrl('example.vn:8080')).toBeNull();
    expect(buildOfficialDomainUrl('user@example.vn')).toBeNull();
    expect(buildOfficialDomainUrl('example.com/path')).toBeNull();
    expect(buildOfficialDomainUrl('not a domain')).toBeNull();
    expect(buildOfficialDomainUrl(null)).toBeNull();
    expect(buildOfficialDomainUrl(undefined)).toBeNull();
  });

  test('formatContactText: trả về Đang cập nhật cho null/undefined/placeholder, giữ nguyên chuỗi hợp lệ', () => {
    expect(formatContactText('0123 456 789')).toBe('0123 456 789');
    expect(formatContactText('[CẦN BỔ SUNG: số điện thoại]')).toBe(
      'Đang cập nhật'
    );
    expect(formatContactText('[TÊN QUỸ]')).toBe('Đang cập nhật');
    expect(formatContactText(null)).toBe('Đang cập nhật');
    expect(formatContactText(undefined)).toBe('Đang cập nhật');
    expect(formatContactText('')).toBe('Đang cập nhật');
    expect(formatContactText('  Số 123 Đường Tín Dụng  ')).toBe(
      'Số 123 Đường Tín Dụng'
    );
  });
});

test.describe('Unit tests — Hàm SEO và metadata (src/lib/seo.ts)', () => {
  test('buildRobotsTxt: Allow all; chỉ chèn Sitemap khi không phải workers.dev hoặc pages.dev', () => {
    // 1. Host pages.dev -> không có Sitemap
    const robotsPagesDev = buildRobotsTxt('https://qtd.pages.dev');
    expect(robotsPagesDev).toBe('User-agent: *\nAllow: /\n');
    expect(robotsPagesDev).not.toContain('Sitemap:');

    // 2. Host workers.dev -> không có Sitemap
    const robotsWorkersDev = buildRobotsTxt('https://qtd.workers.dev');
    expect(robotsWorkersDev).toBe('User-agent: *\nAllow: /\n');
    expect(robotsWorkersDev).not.toContain('Sitemap:');

    // 3. Subdomain bất kỳ của pages.dev
    const robotsSubPagesDev = buildRobotsTxt('https://branch-1.qtd.pages.dev');
    expect(robotsSubPagesDev).toBe('User-agent: *\nAllow: /\n');
    expect(robotsSubPagesDev).not.toContain('Sitemap:');

    // 4. Domain chính thức hoặc custom domain -> có Sitemap tuyệt đối
    const robotsCustom = buildRobotsTxt('https://qtd.example.vn');
    expect(robotsCustom).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://qtd.example.vn/sitemap-index.xml\n'
    );
    expect(robotsCustom).toContain(
      'Sitemap: https://qtd.example.vn/sitemap-index.xml'
    );

    // 5. Chuỗi site rỗng hoặc sai -> fallback không có Sitemap
    const robotsEmpty = buildRobotsTxt('');
    expect(robotsEmpty).toBe('User-agent: *\nAllow: /\n');
  });

  test('buildCanonicalUrl: URL tuyệt đối chuẩn, luôn có dấu / cuối nhất quán', () => {
    expect(buildCanonicalUrl('https://qtd.pages.dev', '/')).toBe(
      'https://qtd.pages.dev/'
    );
    expect(buildCanonicalUrl('https://qtd.pages.dev', '/gioi-thieu')).toBe(
      'https://qtd.pages.dev/gioi-thieu/'
    );
    expect(buildCanonicalUrl('https://qtd.pages.dev', '/gioi-thieu/')).toBe(
      'https://qtd.pages.dev/gioi-thieu/'
    );
    expect(
      buildCanonicalUrl('https://qtd.pages.dev/', '/tin-tuc/trang/2')
    ).toBe('https://qtd.pages.dev/tin-tuc/trang/2/');
    expect(
      buildCanonicalUrl('https://qtd.example.vn', '/tin-tuc/bai-viet-1/')
    ).toBe('https://qtd.example.vn/tin-tuc/bai-viet-1/');
  });

  test('getOgDefaultImagePath: trả về null khi không có file og-default.*', () => {
    // Trong repo hiện tại không có ảnh og-default.* trong public/images/
    const ogImg = getOgDefaultImagePath();
    expect(ogImg).toBeNull();
  });

  test('buildFinancialServiceJsonLd: bỏ qua hoặc trả null khi tên quỹ là placeholder hoặc thiếu', () => {
    // 1. Tên chứa [TÊN QUỸ] hoặc [CẦN
    expect(
      buildFinancialServiceJsonLd({
        site: {
          name: '[TÊN QUỸ]',
          official_domain: 'qtd.example.vn',
        },
        contact: {
          phone: '024 1234 5678',
        },
      })
    ).toBeNull();

    expect(
      buildFinancialServiceJsonLd({
        site: {
          name: '[CẦN BỔ SUNG: tên quỹ]',
          official_domain: 'qtd.example.vn',
        },
        contact: {
          phone: '024 1234 5678',
        },
      })
    ).toBeNull();

    expect(
      buildFinancialServiceJsonLd({
        site: {
          name: '',
          official_domain: 'qtd.example.vn',
        },
      })
    ).toBeNull();
  });

  test('buildFinancialServiceJsonLd: tạo schema FinancialService chuẩn khi có dữ liệu thật, không chứa placeholder hay "null"', () => {
    const jsonLd = buildFinancialServiceJsonLd({
      site: {
        name: 'Quỹ tín dụng nhân dân Tân Bình',
        official_domain: 'qtdtanbinh.vn',
      },
      contact: {
        phone: '028 3811 1234',
        address: {
          street: '123 Đường Cộng Hòa, Phường 12',
          city: 'TP. Hồ Chí Minh',
          full: '123 Đường Cộng Hòa, Phường 12, TP. Hồ Chí Minh',
        },
      },
    });

    expect(jsonLd).not.toBeNull();
    expect(jsonLd?.['@context']).toBe('https://schema.org');
    expect(jsonLd?.['@type']).toBe('FinancialService');
    expect(jsonLd?.name).toBe('Quỹ tín dụng nhân dân Tân Bình');
    expect(jsonLd?.url).toBe('https://qtdtanbinh.vn');
    expect(jsonLd?.telephone).toBe('02838111234');
    expect(jsonLd?.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: '123 Đường Cộng Hòa, Phường 12',
      addressLocality: 'TP. Hồ Chí Minh',
      addressCountry: 'VN',
    });

    const serialized = JSON.stringify(jsonLd);
    expect(serialized).not.toContain('[');
    expect(serialized).not.toContain('null');
  });

  test('buildFinancialServiceJsonLd: tự động loại bỏ các trường placeholder hoặc null trong địa chỉ và liên hệ', () => {
    const jsonLd = buildFinancialServiceJsonLd({
      site: {
        name: 'Quỹ tín dụng nhân dân Mẫu',
        official_domain: null,
      },
      contact: {
        phone: '[CẦN BỔ SUNG: số điện thoại]',
        address: {
          street: '[CẦN BỔ SUNG: địa chỉ]',
          city: null,
          full: '[CẦN BỔ SUNG: địa chỉ đầy đủ]',
        },
      },
    });

    expect(jsonLd).not.toBeNull();
    expect(jsonLd?.name).toBe('Quỹ tín dụng nhân dân Mẫu');
    // url bị bỏ qua vì officialDomain null
    expect(jsonLd?.url).toBeUndefined();
    // telephone bị bỏ qua vì là placeholder
    expect(jsonLd?.telephone).toBeUndefined();
    // address bị bỏ qua hoàn toàn vì không có thông tin địa chỉ cụ thể
    expect(jsonLd?.address).toBeUndefined();

    const serialized = JSON.stringify(jsonLd);
    expect(serialized).not.toContain('[');
    expect(serialized).not.toContain('null');
  });

  test.describe('decideBuildMode: quyết định chế độ build Cloudflare Workers Builds', () => {
    const validSiteUrl = 'https://qtd.dinhcam1512.workers.dev';

    test('từ chối build khi QTD_FIXTURES được bật (khác rỗng và khác 0)', () => {
      const res1 = decideBuildMode({
        QTD_FIXTURES: '1',
        SITE_URL: validSiteUrl,
      });
      expect(res1.isValid).toBe(false);
      expect(res1.errors.some((e) => e.includes('QTD_FIXTURES'))).toBe(true);

      const resTrue = decideBuildMode({
        QTD_FIXTURES: 'true',
        SITE_URL: validSiteUrl,
      });
      expect(resTrue.isValid).toBe(false);

      // Cho phép khi là "0", rỗng hoặc undefined
      const res0 = decideBuildMode({
        QTD_FIXTURES: '0',
        SITE_URL: validSiteUrl,
      });
      expect(res0.errors.some((e) => e.includes('QTD_FIXTURES'))).toBe(false);

      const resEmpty = decideBuildMode({
        QTD_FIXTURES: '',
        SITE_URL: validSiteUrl,
      });
      expect(resEmpty.errors.some((e) => e.includes('QTD_FIXTURES'))).toBe(
        false
      );
    });

    test('bắt buộc SITE_URL đúng định dạng https://<hostname> (không path, port, query, //)', () => {
      // Thiếu SITE_URL
      expect(decideBuildMode({}).isValid).toBe(false);
      expect(decideBuildMode({ SITE_URL: '' }).isValid).toBe(false);

      // Giao thức sai
      expect(
        decideBuildMode({ SITE_URL: 'http://qtd.dinhcam1512.workers.dev' })
          .isValid
      ).toBe(false);

      // Có path
      expect(
        decideBuildMode({
          SITE_URL: 'https://qtd.dinhcam1512.workers.dev/tin-tuc',
        }).isValid
      ).toBe(false);

      // Có cổng
      expect(
        decideBuildMode({
          SITE_URL: 'https://qtd.dinhcam1512.workers.dev:4321',
        }).isValid
      ).toBe(false);

      // Có query
      expect(
        decideBuildMode({
          SITE_URL: 'https://qtd.dinhcam1512.workers.dev?ref=1',
        }).isValid
      ).toBe(false);

      // Quá một dấu / ở cuối
      expect(
        decideBuildMode({ SITE_URL: 'https://qtd.dinhcam1512.workers.dev//' })
          .isValid
      ).toBe(false);

      // Hợp lệ: không có dấu / hoặc có đúng một dấu /
      const valid1 = decideBuildMode({
        SITE_URL: 'https://qtd.dinhcam1512.workers.dev',
      });
      expect(valid1.errors.some((e) => e.includes('SITE_URL'))).toBe(false);
      expect(valid1.host).toBe('qtd.dinhcam1512.workers.dev');

      const valid2 = decideBuildMode({
        SITE_URL: 'https://qtd.dinhcam1512.workers.dev/',
      });
      expect(valid2.errors.some((e) => e.includes('SITE_URL'))).toBe(false);
      expect(valid2.host).toBe('qtd.dinhcam1512.workers.dev');
    });

    test('đọc nhánh từ WORKERS_CI_BRANCH hoặc CF_PAGES_BRANCH; cảnh báo khi không có', () => {
      // Nhánh main: preview
      const mainRes = decideBuildMode({
        SITE_URL: validSiteUrl,
        WORKERS_CI_BRANCH: 'main',
      });
      expect(mainRes.mode).toBe('preview');
      expect(mainRes.branch).toBe('main');
      expect(mainRes.warnings).toHaveLength(0);

      // CF_PAGES_BRANCH fallback
      const pagesBranchRes = decideBuildMode({
        SITE_URL: validSiteUrl,
        CF_PAGES_BRANCH: 'feature-xyz',
      });
      expect(pagesBranchRes.mode).toBe('preview');
      expect(pagesBranchRes.branch).toBe('feature-xyz');

      // Thiếu biến nhánh: cảnh báo rõ và coi là preview
      const noBranchRes = decideBuildMode({ SITE_URL: validSiteUrl });
      expect(noBranchRes.mode).toBe('preview');
      expect(noBranchRes.warnings.length).toBeGreaterThan(0);
      expect(noBranchRes.warnings[0]).toContain('WORKERS_CI_BRANCH');
    });

    test('ghi đè chế độ bằng BUILD_MODE=production hoặc preview', () => {
      const overrideProd = decideBuildMode({
        SITE_URL: 'https://example.vn',
        WORKERS_CI_BRANCH: 'main',
        BUILD_MODE: 'production',
      });
      expect(overrideProd.mode).toBe('production');

      const overridePreview = decideBuildMode({
        SITE_URL: validSiteUrl,
        WORKERS_CI_BRANCH: 'production',
        BUILD_MODE: 'preview',
      });
      expect(overridePreview.mode).toBe('preview');

      // Giá trị không hợp lệ
      const invalidBm = decideBuildMode({
        SITE_URL: validSiteUrl,
        BUILD_MODE: 'staging',
      });
      expect(invalidBm.isValid).toBe(false);
      expect(invalidBm.errors.some((e) => e.includes('BUILD_MODE'))).toBe(true);
    });

    test('quy tắc production: cấm workers.dev/pages.dev và khớp official_domain nếu khác null', () => {
      // Nhánh production với workers.dev -> TỪ CHỐI
      const prodWorkers = decideBuildMode({
        SITE_URL: 'https://qtd.dinhcam1512.workers.dev',
        WORKERS_CI_BRANCH: 'production',
      });
      expect(prodWorkers.isValid).toBe(false);
      expect(prodWorkers.errors.some((e) => e.includes('workers.dev'))).toBe(
        true
      );

      // Nhánh production với pages.dev -> TỪ CHỐI
      const prodPages = decideBuildMode({
        SITE_URL: 'https://qtd.pages.dev',
        WORKERS_CI_BRANCH: 'production',
      });
      expect(prodPages.isValid).toBe(false);
      expect(prodPages.errors.some((e) => e.includes('pages.dev'))).toBe(true);

      // Nhánh production với domain riêng, official_domain là null -> HỢP LỆ
      const prodCustomOk = decideBuildMode(
        {
          SITE_URL: 'https://example.vn',
          WORKERS_CI_BRANCH: 'production',
        },
        { official_domain: null }
      );
      expect(prodCustomOk.isValid).toBe(true);
      expect(prodCustomOk.mode).toBe('production');

      // Nhánh production với domain riêng, official_domain khác null và KHÔNG khớp -> TỪ CHỐI
      const prodMismatch = decideBuildMode(
        {
          SITE_URL: 'https://example.vn',
          WORKERS_CI_BRANCH: 'production',
        },
        { official_domain: 'qtd-tanbinh.vn' }
      );
      expect(prodMismatch.isValid).toBe(false);
      expect(
        prodMismatch.errors.some((e) => e.includes('official_domain'))
      ).toBe(true);

      // Nhánh production khớp official_domain -> HỢP LỆ
      const prodMatch = decideBuildMode(
        {
          SITE_URL: 'https://qtd-tanbinh.vn',
          WORKERS_CI_BRANCH: 'production',
        },
        { official_domain: 'qtd-tanbinh.vn' }
      );
      expect(prodMatch.isValid).toBe(true);
      expect(prodMatch.mode).toBe('production');
    });
  });
});
