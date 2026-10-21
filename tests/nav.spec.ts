import { test, expect } from '@playwright/test';
import { setupPageGuards } from './helpers';
import {
  NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  MAX_PRIMARY_NAV_ITEMS,
} from '../src/lib/nav';

/** Lấy "pathname + hash" của URL hiện tại để so khớp với href khai báo trong nav.ts. */
function pathAndHash(url: string): string {
  const u = new URL(url);
  return u.pathname + u.hash;
}

test.describe('Menu điều hướng', () => {
  test('nav.ts: có tối đa 6 mục primary và các mục chính đã khai báo', () => {
    expect(PRIMARY_NAV_ITEMS.length).toBeGreaterThan(0);
    expect(PRIMARY_NAV_ITEMS.length).toBeLessThanOrEqual(MAX_PRIMARY_NAV_ITEMS);
    const labels = PRIMARY_NAV_ITEMS.map((i) => i.label);
    for (const required of [
      'Trang chủ',
      'Giới thiệu',
      'Sản phẩm',
      'Lãi suất',
      'Liên hệ',
    ]) {
      expect(labels, `thiếu mục primary "${required}"`).toContain(required);
    }
  });

  test('ở 1024px menu ngang không xuống dòng, không đè lên brand, không tràn khung', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Chỉ chạy một lần, tự đặt viewport 1024px'
    );
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.setViewportSize({ width: 1024, height: 768 });

    // Kiểm tra trên trang con (nội dung dài nhất) và với tên quỹ dài giả lập
    for (const path of ['/gioi-thieu', '/']) {
      for (const longBrand of [false, true]) {
        await page.goto(path, { waitUntil: 'networkidle' });
        if (longBrand) {
          await page.evaluate(() => {
            const brand = document.querySelector('[data-header-brand]');
            if (brand) brand.textContent = 'Quỹ tín dụng nhân dân Phường Ví Dụ';
          });
        }

        const m = await page.evaluate(() => {
          const rect = (el: Element | null) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
            };
          };
          const nav = document.querySelector('[data-desktop-nav]');
          const links = Array.from(nav?.querySelectorAll('a') ?? []);
          return {
            brand: rect(document.querySelector('[data-header-brand]')),
            nav: rect(nav),
            navDisplay: nav ? getComputedStyle(nav).display : null,
            navScrollOverflow: nav ? nav.scrollWidth > nav.clientWidth : null,
            inner: rect(document.querySelector('#site-header > div > div')),
            links: links.map((a) => ({
              text: a.textContent?.trim() ?? '',
              ...rect(a)!,
              lineCount: a.getClientRects().length,
            })),
            pageOverflow:
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth,
          };
        });
        const ctx = `${path}${longBrand ? ' (tên quỹ dài)' : ''}`;

        expect(
          m.navDisplay,
          `menu ngang phải hiển thị ở 1024px ${ctx}`
        ).not.toBe('none');
        expect(m.links.length, ctx).toBe(PRIMARY_NAV_ITEMS.length);

        // Không xuống dòng: mọi mục cùng một hàng và mỗi mục một dòng chữ
        const tops = m.links.map((l) => Math.round(l.top));
        expect(
          Math.max(...tops) - Math.min(...tops),
          `các mục menu nằm khác hàng ${ctx}: ${JSON.stringify(tops)}`
        ).toBeLessThanOrEqual(2);
        for (const l of m.links) {
          expect(l.lineCount, `mục "${l.text}" bị ngắt dòng ${ctx}`).toBe(1);
        }

        // Không đè lên brand
        expect(m.brand).not.toBeNull();
        expect(
          m.brand!.right,
          `brand (${m.brand!.right}) chạm/đè menu (${m.nav!.left}) ${ctx}`
        ).toBeLessThanOrEqual(m.nav!.left + 0.5);

        // Không tràn khung header và không tràn trang
        expect(
          m.nav!.right,
          `menu tràn khung header ${ctx}`
        ).toBeLessThanOrEqual(m.inner!.right + 1);
        expect(m.navScrollOverflow, ctx).toBe(false);
        expect(m.pageOverflow, `trang cuộn ngang ${ctx}`).toBe(false);
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('menu ngang desktop chỉ chứa mục primary, panel mobile và footer chứa đủ mọi mục', async ({
    page,
  }) => {
    await page.goto('/gioi-thieu');

    const desktopHrefs = await page
      .locator('[data-desktop-nav] a')
      .evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    expect(desktopHrefs).toEqual(PRIMARY_NAV_ITEMS.map((i) => i.href));

    const expected = NAV_ITEMS.map((i) => ({ label: i.label, href: i.href }));

    const mobile = await page
      .locator('#mobile-nav-panel a')
      .evaluateAll((els) =>
        els.map((a) => ({
          label: a.textContent?.trim() ?? '',
          href: a.getAttribute('href'),
        }))
      );
    expect(
      mobile,
      'panel menu mobile phải chứa đủ mọi mục trong nav.ts'
    ).toEqual(expected);

    const footer = await page
      .locator('[data-footer-nav] a')
      .evaluateAll((els) =>
        els.map((a) => ({
          label: a.textContent?.trim() ?? '',
          href: a.getAttribute('href'),
        }))
      );
    expect(footer, 'footer phải chứa đủ mọi mục trong nav.ts').toEqual(
      expected
    );
  });

  test('menu mobile mở ra thấy đủ mọi mục trong nav.ts', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'desktop',
      'Hamburger chỉ hiển thị dưới 1024px'
    );
    await page.goto('/gioi-thieu');
    await page.locator('#menu-toggle-btn').click();
    const links = page.locator('#mobile-nav-panel a');
    await expect(links).toHaveCount(NAV_ITEMS.length);
    for (let i = 0; i < NAV_ITEMS.length; i++) {
      await expect(links.nth(i)).toBeVisible();
      await expect(links.nth(i)).toHaveText(NAV_ITEMS[i].label);
    }
  });

  test('từ /gioi-thieu bấm từng mục menu thì URL cuối đúng và không chứa "/gioi-thieu#"', async ({
    page,
  }, testInfo) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    const isDesktop = testInfo.project.name === 'desktop';
    // Desktop chỉ bấm được mục primary trên menu ngang; mobile/tablet bấm mọi mục trong panel
    const items = isDesktop ? PRIMARY_NAV_ITEMS : NAV_ITEMS;

    for (const item of items) {
      await page.goto('/gioi-thieu');
      if (isDesktop) {
        await page
          .locator('[data-desktop-nav]')
          .getByRole('link', { name: item.label, exact: true })
          .click();
      } else {
        await page.locator('#menu-toggle-btn').click();
        await page
          .locator('#mobile-nav-panel')
          .getByRole('link', { name: item.label, exact: true })
          .click();
      }

      await expect
        .poll(() => pathAndHash(page.url()), {
          message: `bấm "${item.label}" phải tới ${item.href}`,
        })
        .toBe(item.href);
      expect(page.url()).not.toContain('/gioi-thieu#');
    }

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('từ /gioi-thieu bấm từng mục ở footer thì URL cuối đúng', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Chạy một lần ở desktop');
    for (const item of NAV_ITEMS) {
      await page.goto('/gioi-thieu');
      await page
        .locator('[data-footer-nav]')
        .getByRole('link', { name: item.label, exact: true })
        .click();
      await expect
        .poll(() => pathAndHash(page.url()), {
          message: `footer "${item.label}" phải tới ${item.href}`,
        })
        .toBe(item.href);
      expect(page.url()).not.toContain('/gioi-thieu#');
    }
  });
});
