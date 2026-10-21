import { test, expect } from '@playwright/test';
import { setupPageGuards } from './helpers';
import { getNavRoutes, PRIMARY_NAV_ITEMS } from '../src/lib/nav';

const VIEWPORTS = [
  { name: '360px', width: 360, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1920px', width: 1920, height: 1080 },
];

const testPages = getNavRoutes();

test.describe('Kiểm tra hình học và căn chỉnh layout', () => {
  for (const pageInfo of testPages) {
    for (const vp of VIEWPORTS) {
      test(`kiểm tra layout trang ${pageInfo.name} (${pageInfo.path}) ở viewport ${vp.name}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pageInfo.path, { waitUntil: 'networkidle' });

        const measurements = await page.evaluate(() => {
          const vpWidth = window.innerWidth;
          const headerBrand = document.querySelector('[data-site-brand]');
          const footerBrand = document.querySelector(
            '[data-site-footer-brand]'
          );
          const h1 = document.querySelector('h1');
          const pageContent = document.querySelector('[data-page-content]');

          // Khung header/footer inner content right
          const headerInner = document.querySelector(
            '#site-header > div > div'
          );
          const footerInner = document.querySelector('footer > div > div');

          const getRect = (el: Element | null) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              left: r.left,
              right: r.right,
              width: r.width,
              top: r.top,
              bottom: r.bottom,
            };
          };

          // Tìm các phần tử hiển thị trong main và footer
          const allMainAndFooterElements = Array.from(
            document.querySelectorAll('main *, footer *')
          );
          const overflows: Array<{
            tag: string;
            cls: string;
            left: number;
            right: number;
          }> = [];

          for (const el of allMainAndFooterElements) {
            const htmlEl = el as HTMLElement;
            // Bỏ qua phần tử ẩn, sr-only, script, style, svg children
            if (
              htmlEl.offsetParent === null &&
              getComputedStyle(htmlEl).position !== 'fixed'
            ) {
              continue;
            }
            if (htmlEl.classList.contains('sr-only')) continue;
            if (
              ['SCRIPT', 'STYLE', 'path', 'defs', 'clippath'].includes(
                htmlEl.tagName.toLowerCase()
              )
            ) {
              continue;
            }

            const r = htmlEl.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;

            // Cho phép dung sai 1px cho sub-pixel rendering
            if (r.left < -1 || r.right > vpWidth + 1) {
              overflows.push({
                tag: htmlEl.tagName,
                cls: htmlEl.className,
                left: Math.round(r.left),
                right: Math.round(r.right),
              });
            }
          }

          // Đo chiều rộng thẻ p trong khối nội dung markdown (.content-body hoặc prose)
          const markdownParagraphs = Array.from(
            document.querySelectorAll('.content-body p, .prose p')
          ).map((p) => {
            const r = p.getBoundingClientRect();
            return { width: r.width, text: (p.textContent || '').slice(0, 30) };
          });

          return {
            vpWidth,
            headerBrand: getRect(headerBrand),
            footerBrand: getRect(footerBrand),
            h1: getRect(h1),
            pageContent: getRect(pageContent),
            headerInnerRight: headerInner
              ? headerInner.getBoundingClientRect().right
              : null,
            footerInnerRight: footerInner
              ? footerInner.getBoundingClientRect().right
              : null,
            overflows,
            markdownParagraphs,
          };
        });

        // 2a) Mọi phần tử hiển thị trong <main> và Footer có rect.left >= 0 và rect.right <= viewport width
        expect(
          measurements.overflows,
          `Phát hiện phần tử bị cắt hoặc tràn mép viewport ${vp.name}`
        ).toEqual([]);

        // 2b) Từ md trở lên (>= 768px):
        // left của h1 = left của khối nội dung chính = left của brand ở Header = left của brand ở Footer (sai số <= 1px).
        // Right của khối nội dung (kể cả sidebar nếu có) = right của khung Header/Footer (sai số <= 1px).
        if (vp.width >= 768 && measurements.pageContent && measurements.h1) {
          expect(measurements.headerBrand).not.toBeNull();
          expect(measurements.footerBrand).not.toBeNull();

          const contentLeft = measurements.pageContent.left;
          const h1Left = measurements.h1.left;
          const headerLeft = measurements.headerBrand!.left;
          const footerLeft = measurements.footerBrand!.left;

          expect(
            Math.abs(contentLeft - h1Left),
            `Left của nội dung (${contentLeft}) phải khớp left của h1 (${h1Left}) tại ${vp.name}`
          ).toBeLessThanOrEqual(1.0);

          expect(
            Math.abs(contentLeft - headerLeft),
            `Left của nội dung (${contentLeft}) phải khớp left của Header brand (${headerLeft}) tại ${vp.name}`
          ).toBeLessThanOrEqual(1.0);

          expect(
            Math.abs(contentLeft - footerLeft),
            `Left của nội dung (${contentLeft}) phải khớp left của Footer brand (${footerLeft}) tại ${vp.name}`
          ).toBeLessThanOrEqual(1.0);

          const expectedRight =
            measurements.headerInnerRight || measurements.footerInnerRight;
          if (expectedRight) {
            expect(
              Math.abs(measurements.pageContent.right - expectedRight),
              `Right của nội dung (${measurements.pageContent.right}) phải khớp right của khung Header/Footer (${expectedRight}) tại ${vp.name}`
            ).toBeLessThanOrEqual(1.0);
          }
        }

        // 2c) Ở 360px: mọi khối nội dung có left >= 16px và right <= viewport - 16px
        if (vp.width === 360 && measurements.pageContent) {
          expect(
            measurements.pageContent.left,
            `Left của khối nội dung tại 360px phải >= 16px`
          ).toBeGreaterThanOrEqual(15.0);

          expect(
            measurements.pageContent.right,
            `Right của khối nội dung tại 360px phải <= 344px (viewport - 16px)`
          ).toBeLessThanOrEqual(345.0);
        }

        // 2d) Chiều rộng dòng chữ của nội dung markdown: width của p không vượt 820px ở mọi viewport
        for (const p of measurements.markdownParagraphs) {
          expect(
            p.width,
            `Chiều rộng đoạn văn markdown ("${p.text}...") vượt quá 820px tại ${vp.name}`
          ).toBeLessThanOrEqual(820);
        }
      });
    }
  }

  test('mọi h2 trong .content-body có font-weight >= 600 và font-size lớn hơn font-size của p ít nhất 20%', async ({
    page,
  }) => {
    await page.goto('/gioi-thieu');
    const h2Count = await page.locator('.content-body h2').count();
    expect(h2Count).toBeGreaterThan(0);

    const typographyData = await page.evaluate(() => {
      const pEl = document.querySelector('.content-body p');
      const pFontSize = pEl ? parseFloat(getComputedStyle(pEl).fontSize) : 16;

      const h2Elements = Array.from(
        document.querySelectorAll('.content-body h2')
      );
      return h2Elements.map((h2) => {
        const style = getComputedStyle(h2);
        return {
          text: h2.textContent || '',
          fontSize: parseFloat(style.fontSize),
          fontWeight:
            parseInt(style.fontWeight, 10) ||
            (style.fontWeight === 'bold' ? 700 : 400),
          pFontSize,
        };
      });
    });

    for (const item of typographyData) {
      expect(
        item.fontWeight,
        `Đề mục h2 "${item.text}" phải có font-weight >= 600`
      ).toBeGreaterThanOrEqual(600);

      expect(
        item.fontSize,
        `Font-size của h2 (${item.fontSize}px) phải lớn hơn ít nhất 20% so với p (${item.pFontSize}px)`
      ).toBeGreaterThanOrEqual(item.pFontSize * 1.2);
    }
  });

  test('ở 1024px menu ngang không xuống dòng, không đè lên brand, không tràn khung', async ({
    page,
  }) => {
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
            brandLineCount:
              document
                .querySelector('[data-header-brand]')
                ?.getClientRects().length ?? 0,
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

        // Brand không bị ép xuống dòng vì menu quá tải
        expect(
          m.brandLineCount,
          `brand bị ngắt dòng do menu quá tải ${ctx}`
        ).toBe(1);

        // Không đè lên brand
        expect(m.brand).not.toBeNull();
        expect(
          m.nav!.left - m.brand!.right,
          `khoảng cách brand-menu quá hẹp ${ctx}`
        ).toBeGreaterThanOrEqual(16);
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
});
