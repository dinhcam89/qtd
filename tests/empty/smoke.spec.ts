import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { setupPageGuards } from '../helpers';
import { getNavRoutes } from '../../src/lib/nav';

const testPages = getNavRoutes();

test.describe('Empty Fixture tests — Smoke tests ở trạng thái rỗng (dist-empty)', () => {
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

  test('kiểm tra chuẩn thiết kế và không tràn ngang trên trang chủ (yêu cầu 7a, 7b, 7c) khi rỗng', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/');

    // 7a) Với mỗi giá trị thẻ quy mô đang là "Đang cập nhật":
    // chiều cao hộp chữ <= 1,3 lần line-height (tức một dòng) và font-size <= 28px
    const fallbacks = page.locator('[data-scale-section] [data-stat-fallback]');
    const fallbackCount = await fallbacks.count();
    expect(fallbackCount).toBeGreaterThan(0);

    for (let i = 0; i < fallbackCount; i++) {
      const fb = fallbacks.nth(i);
      await expect(fb).toHaveText('Đang cập nhật');
      const metrics = await fb.evaluate((node) => {
        const style = window.getComputedStyle(node);
        const fontSize = parseFloat(style.fontSize);
        let lineHeight = parseFloat(style.lineHeight);
        if (isNaN(lineHeight)) lineHeight = fontSize * 1.5;
        const height = node.getBoundingClientRect().height;
        return { fontSize, lineHeight, height };
      });
      expect(metrics.fontSize).toBeLessThanOrEqual(28);
      expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight * 1.3);
    }

    // 7b) Toàn trang không có đoạn khớp /tính đến\s+đang cập nhật/i và không có "Đang cập nhật" đứng liền trước đơn vị như "thành viên"
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/tính đến\s+đang cập nhật/i);
    expect(bodyText).not.toMatch(/đang cập nhật\s+thành viên/i);

    // 7c) Ở viewport mobile (360px): không có phần tử nào trong khối quy mô và khối lãi suất có scrollWidth > clientWidth
    const vp = page.viewportSize();
    if (vp && vp.width <= 360) {
      const overflowingElements = await page.evaluate(() => {
        const sections = document.querySelectorAll(
          '[data-scale-section], [data-rates-section]'
        );
        const overflows: string[] = [];
        sections.forEach((section) => {
          if (section.scrollWidth > section.clientWidth) {
            overflows.push(
              `${section.tagName}#${section.id || ''}: scrollWidth=${section.scrollWidth} > clientWidth=${section.clientWidth}`
            );
          }
        });
        return overflows;
      });
      expect(overflowingElements).toEqual([]);
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('sitemap-index.xml và sitemap-0.xml trong dist-empty chứa đúng tập trang trong getNavRoutes() trừ /404', () => {
    const distPath = path.resolve('dist-empty');
    const sitemapIndexPath = path.join(distPath, 'sitemap-index.xml');
    const sitemap0Path = path.join(distPath, 'sitemap-0.xml');

    expect(fs.existsSync(sitemapIndexPath)).toBe(true);
    expect(fs.existsSync(sitemap0Path)).toBe(true);

    const sitemap0Content = fs.readFileSync(sitemap0Path, 'utf-8');
    const urlsInSitemap = new Set<string>();
    const locMatches = sitemap0Content.matchAll(/<loc>([^<]+)<\/loc>/g);
    for (const m of locMatches) {
      const u = new URL(m[1]);
      urlsInSitemap.add(u.pathname);
    }

    const expectedPaths = new Set(
      testPages
        .filter((p) => p.path !== '/404' && p.path !== '/404/')
        .map((p) => (p.path.endsWith('/') ? p.path : `${p.path}/`))
    );

    const missingInSitemap = [...expectedPaths].filter(
      (p) => !urlsInSitemap.has(p)
    );
    const extraInSitemap = [...urlsInSitemap].filter(
      (p) => !expectedPaths.has(p)
    );

    expect(
      missingInSitemap,
      `Thiếu trang trong sitemap-0.xml: ${missingInSitemap.join(', ')}`
    ).toEqual([]);
    expect(
      extraInSitemap,
      `Trang thừa trong sitemap-0.xml: ${extraInSitemap.join(', ')}`
    ).toEqual([]);
    expect(urlsInSitemap.has('/404')).toBe(false);
    expect(urlsInSitemap.has('/404/')).toBe(false);
  });
});
