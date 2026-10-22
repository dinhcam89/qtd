import { test, expect } from '@playwright/test';
import { setupPageGuards } from '../helpers';

const VIEWPORTS = [
  { name: '360px', width: 360, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
];

test.describe('Fixture tests — Biểu lãi suất mẫu & Quy mô & Chân trang', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('/lai-suat: hiển thị đầy đủ bảng lãi suất mẫu tiền gửi và cho vay', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        await page.goto('/lai-suat');

        // Tiêu đề & thời điểm áp dụng
        await expect(page.locator('h1')).toHaveText('Lãi suất');
        const effective = page.locator('[data-rates-effective]');
        await expect(effective).toContainText('01/07/2026');

        // Bảng tiền gửi
        const depositTable = page.locator('[data-rates-tables] table').first();
        await expect(depositTable).toBeVisible();
        await expect(depositTable).toContainText('Không kỳ hạn');
        await expect(depositTable).toContainText('0,2%/năm');
        await expect(depositTable).toContainText('12 tháng');
        await expect(depositTable).toContainText('5,5%/năm');

        // Bảng cho vay
        const loanTable = page.locator('[data-rates-tables] table').nth(1);
        await expect(loanTable).toBeVisible();
        await expect(loanTable).toContainText(
          'Vay phục vụ phát triển nông nghiệp, nông thôn'
        );
        await expect(loanTable).toContainText('7,5%/năm');

        // Dòng lưu ý
        await expect(page.locator('[data-rates-tables]')).toContainText(
          'Lãi suất mang tính tham khảo, vui lòng liên hệ quỹ để biết chi tiết.'
        );

        expect(consoleErrors).toHaveLength(0);
        expect(cspViolations).toHaveLength(0);
      });

      test('Trang chủ: các thẻ quy mô chứa số lớn không bị tràn box và chân trang không có Quy mô / Ban lãnh đạo', async ({
        page,
      }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        await page.goto('/');

        // 1. Kiểm tra thẻ quy mô lớn
        const statCards = page.locator('[data-scale-section] [data-stat-card]');
        await expect(statCards).toHaveCount(4);

        // Vốn điều lệ
        const charterCard = statCards.nth(1);
        await expect(charterCard).toContainText('Vốn điều lệ');
        await expect(charterCard).toContainText('15.000.000.000 đồng');

        // Tổng tài sản
        const assetCard = statCards.nth(2);
        await expect(assetCard).toContainText('Tổng tài sản');
        await expect(assetCard).toContainText('120.000.000.000 đồng');

        // Kiểm tra không có thẻ nào bị tràn nội dung ra ngoài (scrollWidth <= clientWidth + 2px dung sai)
        const overflowChecks = await statCards.evaluateAll((cards) =>
          cards.map((card) => {
            const cardEl = card as HTMLElement;
            return cardEl.scrollWidth <= cardEl.clientWidth + 2;
          })
        );
        expect(overflowChecks.every(Boolean)).toBe(true);

        // 2. Chân trang: kiểm tra liên kết nhanh không chứa "Quy mô" và "Ban lãnh đạo"
        const footerLinks = page.locator('[data-footer-nav] a');
        const footerTexts = await footerLinks.allTextContents();
        expect(footerTexts).not.toContain('Quy mô');
        expect(footerTexts).not.toContain('Ban lãnh đạo');

        expect(consoleErrors).toHaveLength(0);
        expect(cspViolations).toHaveLength(0);
      });
    });
  }
});
