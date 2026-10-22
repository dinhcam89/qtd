import { test, expect } from '@playwright/test';
import { setupPageGuards } from './helpers';
import {
  NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  FOOTER_NAV_ITEMS,
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

    const footerExpected = FOOTER_NAV_ITEMS.map((item) => ({
      label: item.label,
      href: item.href,
    }));
    const footer = await page
      .locator('[data-footer-nav] a')
      .evaluateAll((els) =>
        els.map((a) => ({
          label: a.textContent?.trim() ?? '',
          href: a.getAttribute('href'),
        }))
      );
    expect(footer, 'footer phải chứa các mục FOOTER_NAV_ITEMS').toEqual(
      footerExpected
    );
    const footerLabels = footer.map((f) => f.label);
    expect(footerLabels).not.toContain('Quy mô');
    expect(footerLabels).not.toContain('Ban lãnh đạo');
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
  }) => {
    for (const item of FOOTER_NAV_ITEMS) {
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
