import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { setupPageGuards } from '../helpers';
import { formatFileSize } from '../../src/lib/format';

const VIEWPORTS = [
  { name: '360px', width: 360, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
];

const DIST_FIXTURES_DIR = path.resolve('dist-fixtures');
const DOCS_DIR = path.join(DIST_FIXTURES_DIR, 'docs');

test.describe('Fixture tests — Trang /quy-che ở trạng thái có dữ liệu', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('nhóm theo category, đề mục theo thứ tự cố định và không có liên kết hỏng', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        const response = await page.goto('/quy-che');
        expect(response?.status()).toBe(200);

        // Khối trống không được xuất hiện
        await expect(page.locator('[data-documents-empty]')).toHaveCount(0);

        // Thứ tự nhóm cố định: Điều lệ, Quy chế, Biểu mẫu, Báo cáo
        const headings = page.locator('[data-page-content] h2');
        await expect(headings).toHaveCount(4);
        const headingTexts = await headings.allTextContents();
        expect(headingTexts.map((t) => t.trim())).toEqual([
          'Điều lệ',
          'Quy chế',
          'Biểu mẫu',
          'Báo cáo',
        ]);

        // Kiểm tra không có lỗi console hay CSP
        expect(consoleErrors).toHaveLength(0);
        expect(cspViolations).toHaveLength(0);
      });

      test('mỗi mục hiển thị đúng tên, ngày (hoặc Đang cập nhật), dung lượng file thật chuẩn vi-VN', async ({
        page,
      }) => {
        await setupPageGuards(page);
        await page.goto('/quy-che');

        // Tài liệu 1: Điều lệ
        const doc1Title = page.locator('h3', {
          hasText:
            '[FIXTURE] Điều lệ tổ chức và hoạt động của Quỹ tín dụng nhân dân',
        });
        await expect(doc1Title).toBeVisible();
        const doc1Li = page.locator('li', { has: doc1Title });
        await expect(doc1Li).toContainText('Ngày văn bản: 15/01/2026');
        const doc1RealSize = fs.statSync(
          path.join(DOCS_DIR, 'fixture-dieu-le.pdf')
        ).size;
        const doc1ExpectedSizeText = formatFileSize(doc1RealSize);
        await expect(doc1Li).toContainText(
          `Định dạng: PDF (${doc1ExpectedSizeText})`
        );

        // Tài liệu 2: Quy chế có tiêu đề rất dài (>= 120 ký tự)
        const doc2Title = page.locator('h3', {
          hasText: 'Quy chế quản lý tài chính, phân phối thu nhập',
        });
        await expect(doc2Title).toBeVisible();
        const doc2TitleText = (await doc2Title.textContent()) || '';
        expect(doc2TitleText.length).toBeGreaterThanOrEqual(120);
        const doc2Li = page.locator('li', { has: doc2Title });
        await expect(doc2Li).toContainText('Ngày văn bản: 20/02/2026');
        const doc2RealSize = fs.statSync(
          path.join(DOCS_DIR, 'fixture-quy-che.pdf')
        ).size;
        await expect(doc2Li).toContainText(
          `Định dạng: PDF (${formatFileSize(doc2RealSize)})`
        );

        // Tài liệu 3: Quy chế có date = null -> hiển thị "Đang cập nhật"
        const doc3Title = page.locator('h3', {
          hasText: '[FIXTURE] Quy chế an toàn thông tin và bảo mật',
        });
        await expect(doc3Title).toBeVisible();
        const doc3Li = page.locator('li', { has: doc3Title });
        await expect(doc3Li).toContainText('Ngày văn bản: Đang cập nhật');
        const doc3RealSize = fs.statSync(
          path.join(DOCS_DIR, 'fixture-an-toan.pdf')
        ).size;
        await expect(doc3Li).toContainText(
          `Định dạng: PDF (${formatFileSize(doc3RealSize)})`
        );

        // Tài liệu 4: Biểu mẫu
        const doc4Title = page.locator('h3', {
          hasText: '[FIXTURE] Giấy đề nghị vay vốn kiêm phương án sử dụng vốn',
        });
        await expect(doc4Title).toBeVisible();
        const doc4Li = page.locator('li', { has: doc4Title });
        await expect(doc4Li).toContainText('Ngày văn bản: 10/03/2026');
        const doc4RealSize = fs.statSync(
          path.join(DOCS_DIR, 'fixture-bieu-mau.pdf')
        ).size;
        await expect(doc4Li).toContainText(
          `Định dạng: PDF (${formatFileSize(doc4RealSize)})`
        );

        // Tài liệu 5: Báo cáo có PDF > 1 MB -> hiển thị MB với dấu phẩy vi-VN
        const doc5Title = page.locator('h3', {
          hasText:
            '[FIXTURE] Báo cáo thường niên và công khai báo cáo tài chính',
        });
        await expect(doc5Title).toBeVisible();
        const doc5Li = page.locator('li', { has: doc5Title });
        await expect(doc5Li).toContainText('Ngày văn bản: 05/04/2026');
        const doc5RealSize = fs.statSync(
          path.join(DOCS_DIR, 'fixture-large.pdf')
        ).size;
        expect(doc5RealSize).toBeGreaterThan(1048576);
        const doc5ExpectedSizeText = formatFileSize(doc5RealSize);
        expect(doc5ExpectedSizeText).toContain('MB');
        await expect(doc5Li).toContainText(
          `Định dạng: PDF (${doc5ExpectedSizeText})`
        );
      });

      test('link tải: file tồn tại trong dist-fixtures, aria-label đúng cấu trúc, rel hợp lệ, vùng bấm >= 44px', async ({
        page,
      }) => {
        await setupPageGuards(page);
        await page.goto('/quy-che');

        const downloadLinks = page.locator(
          '[data-page-content] a[href$=".pdf"]'
        );
        const count = await downloadLinks.count();
        expect(count).toBe(5);

        for (let i = 0; i < count; i++) {
          const link = downloadLinks.nth(i);
          const href = await link.getAttribute('href');
          expect(href).toBeTruthy();
          expect(href).toMatch(/^\/docs\/[A-Za-z0-9._-]+\.pdf$/);

          // File tương ứng phải tồn tại trong dist-fixtures
          const relativeFilePath = href!.replace(/^\//, '');
          const localPath = path.join(DIST_FIXTURES_DIR, relativeFilePath);
          expect(fs.existsSync(localPath)).toBe(true);

          // aria-label dạng "Tải xuống: <tên> (PDF, <dung lượng>)"
          const ariaLabel = await link.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel).toMatch(/^Tải xuống: \[FIXTURE\].+ \(PDF, .+\)$/);

          // rel="noopener noreferrer" khi target="_blank"
          const target = await link.getAttribute('target');
          if (target === '_blank') {
            const rel = await link.getAttribute('rel');
            expect(rel).toContain('noopener');
            expect(rel).toContain('noreferrer');
          }

          // Vùng bấm >= 44px ở mọi viewport (đặc biệt 360px)
          const box = await link.boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      });

      test('tiêu đề dài không làm tràn ngang, không bị cắt và danh sách khớp khung Container', async ({
        page,
      }) => {
        await setupPageGuards(page);
        await page.goto('/quy-che');

        // Không có cuộn ngang ở cấp trang
        const isOverflowing = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });
        expect(isOverflowing).toBe(false);

        // Tiêu đề dài nằm gọn trong khung nhìn, không bị cắt
        const longTitle = page.locator('h3', {
          hasText: 'Quy chế quản lý tài chính, phân phối thu nhập',
        });
        const titleBox = await longTitle.boundingBox();
        expect(titleBox).not.toBeNull();
        if (titleBox) {
          expect(titleBox.x).toBeGreaterThanOrEqual(0);
          expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(vp.width);
        }

        // Hình học: danh sách nằm khớp khung Container
        const container = page.locator('[data-page-content]');
        const containerBox = await container.boundingBox();
        expect(containerBox).not.toBeNull();

        const lists = page.locator('[data-page-content] ul');
        const listCount = await lists.count();
        expect(listCount).toBeGreaterThan(0);

        for (let i = 0; i < listCount; i++) {
          const listBox = await lists.nth(i).boundingBox();
          expect(listBox).not.toBeNull();
          if (listBox && containerBox) {
            expect(Math.abs(listBox.x - containerBox.x)).toBeLessThanOrEqual(2);
            expect(
              Math.abs(
                listBox.x +
                  listBox.width -
                  (containerBox.x + containerBox.width)
              )
            ).toBeLessThanOrEqual(2);
          }
        }
      });
    });
  }

  test('chuỗi "[FIXTURE]" tuyệt đối không xuất hiện ngoài dist-fixtures', () => {
    const distPath = path.resolve('dist');
    if (!fs.existsSync(distPath)) return;

    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        expect(entry.name).not.toContain('[FIXTURE]');
        expect(entry.name).not.toBe('dist-fixtures');

        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (entry.isFile()) {
          // Bỏ qua file binary lớn nếu có, chỉ kiểm tra text / html / js / css / yaml
          const ext = path.extname(entry.name).toLowerCase();
          if (['.html', '.js', '.css', '.json', '.txt', '.xml'].includes(ext)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            expect(content).not.toContain('[FIXTURE]');
          }
        }
      }
    }

    checkDir(distPath);
  });
});
