import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { setupPageGuards } from '../helpers';

const VIEWPORTS = [
  { name: '360px', width: 360, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
];

test.describe('Fixture tests — Trang /lien-he ở trạng thái có dữ liệu', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('href tel: và mailto: chính xác (bỏ khoảng trắng, dấu chấm, dấu gạch)', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        await page.goto('/lien-he');

        // Trụ sở chính: phone 0123 456 789 -> tel:0123456789
        const phoneLink = page.locator('[data-contact-phone] a');
        await expect(phoneLink).toHaveAttribute('href', 'tel:0123456789');
        await expect(phoneLink).toHaveText('0123 456 789');

        // Trụ sở chính: hotline 0123.456.789 -> tel:0123456789
        const hotlineLink = page.locator('[data-contact-hotline] a');
        await expect(hotlineLink).toHaveAttribute('href', 'tel:0123456789');
        await expect(hotlineLink).toHaveText('0123.456.789');

        // Trụ sở chính: email fixture@example.invalid -> mailto:fixture@example.invalid
        const emailLink = page.locator('[data-contact-email] a');
        await expect(emailLink).toHaveAttribute(
          'href',
          'mailto:fixture@example.invalid'
        );
        await expect(emailLink).toHaveText('fixture@example.invalid');

        // Điểm giao dịch 1: phone 0123 456 780 -> tel:0123456780
        const branchPhone1 = page.locator('[data-branch-phone] a').first();
        await expect(branchPhone1).toHaveAttribute('href', 'tel:0123456780');

        // Điểm giao dịch 2: phone 0123-456-781 -> tel:0123456781
        const branchPhone2 = page.locator('[data-branch-phone] a').nth(1);
        await expect(branchPhone2).toHaveAttribute('href', 'tel:0123456781');

        expect(consoleErrors).toHaveLength(0);
        expect(cspViolations).toHaveLength(0);
      });

      test('link Xem bản đồ có href mã hóa đúng, target="_blank", rel="noopener noreferrer"', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        await page.goto('/lien-he');

        const mapLinks = page.locator('a[data-map-link]');
        const count = await mapLinks.count();
        expect(count).toBeGreaterThanOrEqual(2);

        for (let i = 0; i < count; i++) {
          const link = mapLinks.nth(i);
          const href = await link.getAttribute('href');
          expect(href).not.toBeNull();
          expect(href).toMatch(
            /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/
          );
          expect(await link.getAttribute('target')).toBe('_blank');
          const rel = await link.getAttribute('rel');
          expect(rel).toContain('noopener');
          expect(rel).toContain('noreferrer');
        }

        expect(consoleErrors).toHaveLength(0);
        expect(cspViolations).toHaveLength(0);
      });

      test('tuyệt đối không có thẻ <iframe> nào trên trang', async ({
        page,
      }) => {
        await page.goto('/lien-he');
        const iframes = page.locator('iframe');
        await expect(iframes).toHaveCount(0);
      });

      test('điểm giao dịch có trường null hiển thị "Đang cập nhật", không gắn link', async ({
        page,
      }) => {
        await page.goto('/lien-he');
        const branchCards = page.locator('[data-branch-item]');
        await expect(branchCards).toHaveCount(4);

        // Branch 4: có trường null
        const branch4 = branchCards.nth(3);
        await expect(
          branch4.locator('[data-branch-address] dd').first()
        ).toHaveText('Đang cập nhật');
        await expect(branch4.locator('[data-branch-phone] dd')).toHaveText(
          'Đang cập nhật'
        );
        await expect(branch4.locator('[data-branch-hours] dd')).toHaveText(
          'Đang cập nhật'
        );
        // Không có link tel hoặc link bản đồ trong branch 4
        await expect(branch4.locator('a[data-map-link]')).toHaveCount(0);
        await expect(branch4.locator('a[href^="tel:"]')).toHaveCount(0);
      });

      test('địa chỉ rất dài không gây tràn ngang, không bị cắt và khớp khung Container', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        await page.goto('/lien-he');

        // Không cuộn ngang toàn trang
        const noScroll = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth
          );
        });
        expect(noScroll).toBe(true);

        // Kiểm tra branch có địa chỉ rất dài (branch 2)
        const branch2 = page.locator('[data-branch-item]').nth(1);
        const addressEl = branch2.locator('[data-branch-address] dd').first();
        const addressBox = await addressEl.boundingBox();
        const branchBox = await branch2.boundingBox();

        expect(addressBox).not.toBeNull();
        expect(branchBox).not.toBeNull();
        if (addressBox && branchBox) {
          // Địa chỉ nằm trọn vẹn trong thẻ card
          expect(addressBox.x).toBeGreaterThanOrEqual(branchBox.x - 1);
          expect(addressBox.x + addressBox.width).toBeLessThanOrEqual(
            branchBox.x + branchBox.width + 1
          );
        }

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
