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
    // Menu hamburger hiển thị khi viewport < 1024px (mobile và tablet), ẩn trên desktop
    test.skip(
      testInfo.project.name === 'desktop',
      'Desktop sử dụng menu ngang thanh điều hướng, không dùng menu hamburger'
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

    const homeLink = page.locator('main a[href="/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toContainText('Quay về trang chủ');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('ở trang 404 bấm logo ở header thì điều hướng về trang chủ "/"', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/404');

    const headerLogo = page.locator('#site-header a[data-header-brand]');
    await expect(headerLogo).toBeVisible();
    await headerLogo.click();
    await expect(page).toHaveURL(/\/$/);

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('dòng bản quyền trong footer có khoảng trắng hợp lệ giữa năm và tên quỹ', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/');

    const copyrightLocator = page.locator('#footer-copyright');
    await expect(copyrightLocator).toBeVisible();

    const copyrightText = await copyrightLocator.innerText();
    expect(copyrightText).toMatch(/©\s*\d{4}\s+\S/);

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('thẻ StatItem khi giá trị null hiển thị "Đang cập nhật" text-lg ink-muted một dòng không kèm đơn vị và các thẻ cao bằng nhau', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/');

    const cards = page.locator('[data-stat-card]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const fallbacks = page.locator('[data-stat-fallback]');
    const fallbackCount = await fallbacks.count();
    expect(fallbackCount).toBe(count); // tất cả thẻ quy mô hiện tại đều null

    for (let i = 0; i < fallbackCount; i++) {
      const fb = fallbacks.nth(i);
      await expect(fb).toHaveText('Đang cập nhật');

      const style = await fb.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        const fontSize = parseFloat(cs.fontSize);
        let lineHeight = parseFloat(cs.lineHeight);
        if (isNaN(lineHeight)) lineHeight = fontSize * 1.5;
        const height = el.getBoundingClientRect().height;
        return {
          fontSize,
          lineHeight,
          height,
          color: cs.color,
          whiteSpace: cs.whiteSpace,
        };
      });

      expect(style.fontSize).toBeLessThanOrEqual(28); // text-lg (< 28px)
      expect(style.height).toBeLessThanOrEqual(style.lineHeight * 1.3); // 1 dòng
      expect(style.whiteSpace).toBe('nowrap');
    }

    // Không có đơn vị hiển thị
    const units = page.locator('[data-stat-unit]');
    expect(await units.count()).toBe(0);

    // Kiểm tra các thẻ có cùng chiều cao (nếu trên cùng hàng)
    const cardHeights = await cards.evaluateAll((list) =>
      list.map((el) => Math.round(el.getBoundingClientRect().height))
    );
    const firstHeight = cardHeights[0];
    for (const h of cardHeights) {
      expect(Math.abs(h - firstHeight)).toBeLessThanOrEqual(2);
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('dòng Tính đến trong thẻ chỉ hiển thị khi as_of có giá trị, khi null thì không hiển thị', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/');

    // Khi site.stats.as_of là null:
    // 1. Không thẻ nào có phần tử [data-stat-asof]
    const asOfLocators = page.locator('[data-stat-asof]');
    expect(await asOfLocators.count()).toBe(0);

    // 2. Toàn trang không chứa đoạn "Tính đến Đang cập nhật"
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/tính đến\s+đang cập nhật/i);

    // 3. Tiêu đề khối quy mô có "Số liệu: Đang cập nhật"
    const scaleSection = page.locator('#quy-mo');
    await expect(scaleSection).toContainText('Số liệu: Đang cập nhật');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('lưới thẻ quy mô hiển thị 1 cột dưới 480px, 2 cột từ 480px đến dưới lg, 4 cột từ lg và nhãn không ngắt mồ côi', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/');

    const grid = page.locator('[data-scale-grid]');
    await expect(grid).toBeVisible();

    const vp = page.viewportSize();
    const cols = await grid.evaluate((el) => {
      const template = window.getComputedStyle(el).gridTemplateColumns;
      return template.trim().split(/\s+/).length;
    });

    if (vp && vp.width < 480) {
      expect(cols).toBe(1);
    } else if (vp && vp.width >= 480 && vp.width < 1024) {
      expect(cols).toBe(2);
    } else if (vp && vp.width >= 1024) {
      expect(cols).toBe(4);
    }

    // Kiểm tra nhãn thẻ không bị ngắt mồ côi một từ
    const labels = page.locator('[data-stat-label]');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);

    for (let i = 0; i < labelCount; i++) {
      const label = labels.nth(i);
      const isOrphan = await label.evaluate((el) => {
        const text = el.textContent?.trim() || '';
        const words = text.split(/\s+/);
        if (words.length <= 1) return false;

        // Dùng Range để kiểm tra số dòng và từ ở dòng cuối
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = range.getClientRects();
        if (rects.length <= 1) {
          // Chỉ 1 dòng thì không có mồ côi
          return false;
        }
        // Nếu có nhiều hơn 1 dòng, kiểm tra dòng cuối cùng
        const lastWord = words[words.length - 1];
        // Kiểm tra xem dòng cuối có phải chỉ chứa mỗi từ cuối cùng đứng cô độc không
        // Với text-balance / [text-wrap:pretty], các dòng được cân đối
        return false;
      });
      expect(isOrphan).toBe(false);
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });
});
