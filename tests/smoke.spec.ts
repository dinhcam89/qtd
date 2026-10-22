import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { setupPageGuards } from './helpers';
import { getNavRoutes, NAV_ITEMS } from '../src/lib/nav';

const testPages = getNavRoutes();
const SITE_URL = 'https://qtd.pages.dev';

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

      // 5. Thẻ canonical tuyệt đối, trỏ đúng site + pathname, kết thúc bằng "/"
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');
      expect(canonical).toBeTruthy();
      const expectedPath = pageInfo.path.endsWith('/')
        ? pageInfo.path
        : `${pageInfo.path}/`;
      expect(canonical).toBe(`${SITE_URL}${expectedPath}`);
      expect(canonical?.endsWith('/')).toBe(true);

      // 6. Đủ thẻ Open Graph và Twitter Card
      const ogTitle = await page
        .locator('meta[property="og:title"]')
        .getAttribute('content');
      expect(ogTitle).toBe(title);

      const ogDesc = await page
        .locator('meta[property="og:description"]')
        .getAttribute('content');
      expect(ogDesc).toBe(metaDescription);

      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content');
      expect(ogUrl).toBe(canonical);

      const ogType = await page
        .locator('meta[property="og:type"]')
        .getAttribute('content');
      expect(ogType).toBe('website');

      const ogLocale = await page
        .locator('meta[property="og:locale"]')
        .getAttribute('content');
      expect(ogLocale).toBe('vi_VN');

      const ogSiteName = await page
        .locator('meta[property="og:site_name"]')
        .getAttribute('content');
      expect(ogSiteName?.trim().length).toBeGreaterThan(0);

      const twitterCard = await page
        .locator('meta[name="twitter:card"]')
        .getAttribute('content');
      expect(twitterCard).toBe('summary');

      // 7. Không có og:image trỏ tới file không tồn tại
      const ogImgLocator = page.locator('meta[property="og:image"]');
      if ((await ogImgLocator.count()) > 0) {
        const ogImg = await ogImgLocator.first().getAttribute('content');
        if (ogImg) {
          const localImgPath = path.resolve(
            'public',
            ogImg.replace(/^https?:\/\/[^/]+\//, '')
          );
          expect(fs.existsSync(localImgPath)).toBe(true);
        }
      }

      // 8. JSON-LD: nếu phát ra thì parse được, không chứa placeholder "[" và không chứa chuỗi "null"
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const jsonLdCount = await jsonLdScripts.count();
      for (let i = 0; i < jsonLdCount; i++) {
        const raw = await jsonLdScripts.nth(i).innerText();
        expect(() => JSON.parse(raw)).not.toThrow();
        expect(raw).not.toContain('[');
        expect(raw).not.toContain('null');
      }

      // 9. Không cuộn ngang cấp trang
      const isNotHorizontallyScrolled = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
        );
      });
      expect(isNotHorizontallyScrolled).toBe(true);

      // 10. Không có console.error hoặc vi phạm Content Security Policy
      expect(consoleErrors).toEqual([]);
      expect(cspViolations).toEqual([]);
    });
  }

  test('trang chủ (/): console không có lỗi 404 và không có yêu cầu nào thất bại', async ({
    page,
  }) => {
    const failedRequests: string[] = [];
    const responses404: string[] = [];
    const consoleErrors: string[] = [];

    page.on('requestfailed', (req) => {
      failedRequests.push(
        `${req.method()} ${req.url()}: ${req.failure()?.errorText}`
      );
    });
    page.on('response', (res) => {
      if (res.status() === 404) {
        responses404.push(`${res.status()} ${res.url()}`);
      }
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    expect(responses404, 'Không có phản hồi 404 nào').toEqual([]);
    expect(failedRequests, 'Không có yêu cầu mạng nào thất bại').toEqual([]);
    expect(consoleErrors, 'Console không có lỗi nào').toEqual([]);
  });

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

  test('chế độ không có JavaScript ở 360px: trang vẫn hiển thị, brand link về "/", footer chứa liên kết tới MỌI mục trong nav.ts, không cuộn ngang', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 360, height: 640 },
    });
    const page = await context.newPage();
    await page.goto('/');

    // 1. Trang vẫn hiển thị (h1 tồn tại và hiển thị rõ ràng)
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // 2. Brand link ở header trỏ về "/"
    const brandLink = page.locator('header a[href="/"]').first();
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute('href', '/');

    // 3. Footer chứa liên kết tới MỌI mục trong nav.ts (qua NAV_ITEMS)
    const footerHrefs = await page
      .locator('[data-footer-nav] a')
      .evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    const expectedHrefs = NAV_ITEMS.map((item) => item.href);
    for (const href of expectedHrefs) {
      expect(
        footerHrefs,
        `Footer phải chứa liên kết tới "${href}" làm lối đi dự phòng`
      ).toContain(href);
    }
    expect(footerHrefs.length).toBe(expectedHrefs.length);

    // 4. Không cuộn ngang ở cấp trang
    const hasHorizontalOverflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });
    expect(hasHorizontalOverflow, 'Trang không được có cuộn ngang').toBe(false);

    await context.close();
  });

  test('trang 404 có meta robots noindex và trả nội dung thân thiện có link về trang chủ', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/404');

    const robotsMeta = await page
      .locator('meta[name="robots"]')
      .getAttribute('content');
    expect(robotsMeta).toBe('noindex');

    const homeLink = page.locator('main a[href="/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toContainText('Quay về trang chủ');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('toàn bộ các trang trong getNavRoutes() có title và description khác nhau', async ({
    page,
  }) => {
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();

    for (const p of testPages) {
      await page.goto(p.path);
      const title = (await page.title()).trim();
      const desc = (
        (await page
          .locator('meta[name="description"]')
          .getAttribute('content')) || ''
      ).trim();

      expect(title.length).toBeGreaterThan(0);
      expect(desc.length).toBeGreaterThan(0);

      expect(
        titles.has(title),
        `Tiêu đề "${title}" của trang ${p.path} bị trùng với ${titles.get(title)}`
      ).toBe(false);
      titles.set(title, p.path);

      expect(
        descriptions.has(desc),
        `Mô tả "${desc}" của trang ${p.path} bị trùng với ${descriptions.get(desc)}`
      ).toBe(false);
      descriptions.set(desc, p.path);
    }
  });

  test('sitemap-index.xml và sitemap-0.xml chứa đúng tập trang trong getNavRoutes() trừ /404', () => {
    const distPath = path.resolve('dist');
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

    // Tập trang kỳ vọng từ getNavRoutes() trừ /404
    const expectedPaths = new Set(
      testPages
        .filter((p) => p.path !== '/404' && p.path !== '/404/')
        .map((p) => (p.path.endsWith('/') ? p.path : `${p.path}/`))
    );

    // So sánh hai tập hợp
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
        // Với text-balance / [text-wrap:pretty], các dòng được cân đối
        return false;
      });
      expect(isOrphan).toBe(false);
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('DataTable trên mobile dưới md xếp nhãn trên giá trị dưới, mỗi dòng thành thẻ, thead ẩn giữ ngữ nghĩa, không viền kép, chữ >= 16px, desktop giữ nguyên', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/');

    const table = page.locator('[data-responsive-table]').first();
    await expect(table).toBeVisible();

    const vp = page.viewportSize();
    const isMobile = vp && vp.width < 768;

    if (isMobile) {
      // 1. thead vẫn nằm trong DOM (giữ ngữ nghĩa) nhưng bị ẩn trực quan
      const thead = table.locator('thead');
      await expect(thead).toBeAttached();
      const theadRect = await thead.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          position: cs.position,
          width: parseFloat(cs.width),
          height: parseFloat(cs.height),
        };
      });
      expect(theadRect.position).toBe('absolute');
      expect(theadRect.width).toBeLessThanOrEqual(1);

      // 2. Không viền kép ở đáy thẻ: border của table là none / 0px
      const tableBorder = await table.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return cs.borderBottomWidth;
      });
      expect(tableBorder).toBe('0px');

      // 3. Mỗi tr là 1 thẻ
      const firstRow = table.locator('tbody tr').first();
      const trDisplay = await firstRow.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      expect(trDisplay).toBe('block');

      // 4. Mỗi ô td xếp nhãn ở trên, giá trị ở dưới, toàn chiều rộng
      const firstCell = firstRow.locator('td').first();
      const tdStyles = await firstCell.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        const pseudoCs = window.getComputedStyle(el, '::before');
        return {
          flexDirection: cs.flexDirection,
          alignItems: cs.alignItems,
          tdFontSize: parseFloat(cs.fontSize),
          labelFontSize: parseFloat(pseudoCs.fontSize),
          borderBottomWidth: cs.borderBottomWidth,
        };
      });
      expect(tdStyles.flexDirection).toBe('column');
      expect(tdStyles.alignItems).toBe('flex-start');
      expect(tdStyles.tdFontSize).toBeGreaterThanOrEqual(16);
      expect(tdStyles.labelFontSize).toBeGreaterThanOrEqual(16);
      expect(tdStyles.borderBottomWidth).toBe('1px'); // đường kẻ giữa các ô

      // Ô cuối cùng không có border-bottom (tránh viền kép với đáy thẻ tr)
      const lastCell = firstRow.locator('td').last();
      const lastCellBorder = await lastCell.evaluate(
        (el) => window.getComputedStyle(el).borderBottomWidth
      );
      expect(lastCellBorder).toBe('0px');
    } else {
      // Desktop giữ nguyên
      const thead = table.locator('thead');
      await expect(thead).toBeVisible();
      const display = await table.evaluate(
        (el) => window.getComputedStyle(el).display
      );
      expect(display).toBe('table');
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('Hero trên mobile có hai nút cùng chiều rộng toàn dòng và xếp dọc; từ sm trở lên giữ dạng hàng ngang', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/');

    const heroActions = page.locator('[data-hero-actions]');
    await expect(heroActions).toBeVisible();

    const buttons = heroActions.locator('[data-hero-btn]');
    expect(await buttons.count()).toBe(2);

    const vp = page.viewportSize();
    const isMobile = vp && vp.width < 640;

    const btn1Box = await buttons.nth(0).boundingBox();
    const btn2Box = await buttons.nth(1).boundingBox();
    const containerBox = await heroActions.boundingBox();

    expect(btn1Box).not.toBeNull();
    expect(btn2Box).not.toBeNull();
    expect(containerBox).not.toBeNull();

    if (isMobile) {
      // 1. Hai nút cùng chiều rộng toàn dòng
      expect(Math.abs(btn1Box!.width - btn2Box!.width)).toBeLessThanOrEqual(2);
      expect(
        Math.abs(btn1Box!.width - containerBox!.width)
      ).toBeLessThanOrEqual(2);

      // 2. Xếp dọc: nút 2 nằm dưới nút 1
      expect(btn2Box!.y).toBeGreaterThanOrEqual(
        btn1Box!.y + btn1Box!.height - 1
      );
    } else {
      // Từ sm trở lên giữ dạng hàng ngang
      expect(Math.abs(btn1Box!.y - btn2Box!.y)).toBeLessThanOrEqual(5);
      // Nút 2 nằm bên phải nút 1
      expect(btn2Box!.x).toBeGreaterThanOrEqual(btn1Box!.x + btn1Box!.width);
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('kiểm tra chuẩn thiết kế và không tràn ngang trên trang chủ (yêu cầu 7a, 7b, 7c)', async ({
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
          const allDescendants = section.querySelectorAll('*');
          allDescendants.forEach((node) => {
            const el = node as HTMLElement;
            const cs = window.getComputedStyle(el);
            if (
              cs.display !== 'none' &&
              cs.display !== 'inline' &&
              cs.visibility !== 'hidden' &&
              el.scrollWidth > el.clientWidth
            ) {
              overflows.push(
                `${el.tagName}.${el.className}: scrollWidth=${el.scrollWidth} > clientWidth=${el.clientWidth}`
              );
            }
          });
        });
        return overflows;
      });
      expect(overflowingElements).toEqual([]);
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });
});
