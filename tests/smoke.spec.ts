import { test, expect } from '@playwright/test';
import { setupPageGuards } from './helpers';

const testPages = [
  { path: '/', name: 'Trang chủ' },
  { path: '/404', name: 'Trang 404' },
];

test.describe('Smoke tests', () => {
  for (const pageInfo of testPages) {
    test(`kiểm tra cấu trúc và tính toàn vẹn của ${pageInfo.name} (${pageInfo.path})`, async ({
      page,
    }) => {
      const { consoleErrors, cspViolations } = await setupPageGuards(page);

      await page.goto(pageInfo.path);

      // 1. Tiêu đề <title> không rỗng
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);

      // 2. Đúng một thẻ <h1>
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      const h1Text = await page.locator('h1').innerText();
      expect(h1Text.trim().length).toBeGreaterThan(0);

      // 3. Thuộc tính lang="vi" trên <html>
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('vi');

      // 4. Meta description không rỗng
      const metaDescription = await page
        .locator('meta[name="description"]')
        .getAttribute('content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription?.trim().length).toBeGreaterThan(0);

      // 5. Không cuộn ngang cấp trang
      const isNotHorizontallyScrolled = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
        );
      });
      expect(isNotHorizontallyScrolled).toBe(true);

      // 6. Không có console.error hoặc vi phạm Content Security Policy
      expect(consoleErrors).toEqual([]);
      expect(cspViolations).toEqual([]);
    });
  }

  test('tương tác menu trên mobile: hamburger đổi aria-expanded và tự đóng khi bấm link', async ({
    page,
  }, testInfo) => {
    // Chỉ kiểm tra tương tác mobile navigation trên project mobile
    test.skip(
      testInfo.project.name !== 'mobile',
      'Chỉ áp dụng cho project mobile'
    );

    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/');

    const toggleBtn = page.locator('#menu-toggle-btn');
    const navPanel = page.locator('#mobile-nav-panel');

    // Nút hamburger phải hiển thị khi JS hoạt động
    await expect(toggleBtn).toBeVisible();

    // Ban đầu panel đóng, aria-expanded là false
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(navPanel).toBeHidden();

    // Bấm nút hamburger: mở menu
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(navPanel).toBeVisible();

    // Bấm một link trong panel: panel tự động đóng
    const firstLink = navPanel.locator('a').first();
    await firstLink.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(navPanel).toBeHidden();

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('trang 404 trả nội dung thân thiện có link về trang chủ', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/404');

    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toContainText('Quay về trang chủ');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });
});
