import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { setupPageGuards } from '../helpers';

const VIEWPORTS = [
  { name: '360px', width: 360, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
];

test.describe('Fixture tests — Trang /kenh-chinh-thuc ở trạng thái có dữ liệu', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('hiển thị đúng tên miền chính thức và link https:// mở tab mới an toàn', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        await page.goto('/kenh-chinh-thuc');

        // Tên miền website chính thức
        const domainLink = page.locator('[data-official-domain] a');
        await expect(domainLink).toHaveAttribute(
          'href',
          'https://fixture.example.invalid'
        );
        await expect(domainLink).toHaveText('https://fixture.example.invalid');
        await expect(domainLink).toHaveAttribute('target', '_blank');
        const rel = await domainLink.getAttribute('rel');
        expect(rel).toContain('noopener');
        expect(rel).toContain('noreferrer');

        expect(consoleErrors).toHaveLength(0);
        expect(cspViolations).toHaveLength(0);
      });

      test('hiển thị đúng hotline, số điện thoại, email và địa chỉ từ fixture', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        await page.goto('/kenh-chinh-thuc');

        // Hotline
        const hotlineLink = page.locator('[data-official-hotline] a');
        await expect(hotlineLink).toHaveAttribute('href', 'tel:0123456789');
        await expect(hotlineLink).toHaveText('0123.456.789');

        // Phone
        const phoneLink = page.locator('[data-official-phone] a');
        await expect(phoneLink).toHaveAttribute('href', 'tel:0123456789');
        await expect(phoneLink).toHaveText('0123 456 789');

        // Email
        const emailLink = page.locator('[data-official-email] a');
        await expect(emailLink).toHaveAttribute(
          'href',
          'mailto:fixture@example.invalid'
        );
        await expect(emailLink).toHaveText('fixture@example.invalid');

        // Địa chỉ
        const addressEl = page.locator('[data-official-address] dd');
        await expect(addressEl).toContainText('Số 123 Đường Tín Dụng');

        expect(consoleErrors).toHaveLength(0);
        expect(cspViolations).toHaveLength(0);
      });

      test('nội dung có đủ hai đề mục nhận biết và phòng ngừa giả mạo, không có iframe', async ({
        page,
      }) => {
        await page.goto('/kenh-chinh-thuc');

        // Không có iframe
        const iframes = page.locator('iframe');
        await expect(iframes).toHaveCount(0);

        // Hai đề mục
        const h2Texts = await page
          .locator('.content-body h2')
          .allTextContents();
        expect(
          h2Texts.some((t) => t.includes('Cách nhận biết kênh chính thức'))
        ).toBe(true);
        expect(
          h2Texts.some((t) => t.includes('Nếu bạn nghi ngờ bị giả mạo'))
        ).toBe(true);
      });

      test('không cuộn ngang và hình học khớp khung Container', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        await page.goto('/kenh-chinh-thuc');

        const noScroll = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth
          );
        });
        expect(noScroll).toBe(true);

        // Khớp khung Container
        const g = await page.evaluate(() => {
          const rect = (el: Element | null) => {
            if (!el) return { left: 0, right: 0 };
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right };
          };
          return {
            content: rect(document.querySelector('[data-page-content]')),
            brand: rect(document.querySelector('[data-site-brand]')),
            inner: rect(document.querySelector('#site-header > div > div')),
          };
        });
        if (vp.width >= 768) {
          expect(Math.abs(g.content.left - g.brand.left)).toBeLessThanOrEqual(
            1
          );
          expect(Math.abs(g.content.right - g.inner.right)).toBeLessThanOrEqual(
            1
          );
        } else {
          expect(g.content.left).toBeGreaterThanOrEqual(15);
          expect(g.content.right).toBeLessThanOrEqual(345);
        }

        expect(consoleErrors).toHaveLength(0);
        expect(cspViolations).toHaveLength(0);
      });
    });
  }

  test('chuỗi "[FIXTURE]" tuyệt đối không xuất hiện ngoài dist-fixtures', () => {
    const distPath = path.resolve('dist');
    if (!fs.existsSync(distPath)) return;

    function walk(dir: string) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) {
          walk(full);
        } else if (f.isFile()) {
          const content = fs.readFileSync(full, 'utf-8');
          expect(content).not.toContain('[FIXTURE]');
        }
      }
    }

    walk(distPath);
  });
});
