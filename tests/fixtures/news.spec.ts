import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupPageGuards } from '../helpers';

const VIEWPORTS = [
  { name: '360px', width: 360, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
];

const PAGE_SIZE = 10;
const NEWS_DIR = path.resolve('src/fixtures/news');

interface FixtureNews {
  id: string;
  title: string;
  pubDate: string;
  category: string;
  draft: boolean;
}

function parseFixture(file: string): FixtureNews {
  const raw = fs.readFileSync(path.join(NEWS_DIR, file), 'utf-8');
  const frontmatter = raw.split('---')[1];
  const get = (key: string): string => {
    const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim().replace(/^'(.*)'$/, '$1') : '';
  };
  return {
    id: file.replace(/\.md$/, ''),
    title: get('title'),
    pubDate: get('pubDate'),
    category: get('category'),
    draft: get('draft') === 'true',
  };
}

const ALL = fs
  .readdirSync(NEWS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map(parseFixture);
const DRAFTS = ALL.filter((n) => n.draft);
const PUBLISHED = ALL.filter((n) => !n.draft).sort((a, b) =>
  a.pubDate !== b.pubDate
    ? a.pubDate < b.pubDate
      ? 1
      : -1
    : a.id < b.id
      ? -1
      : 1
);
const TOTAL_PAGES = Math.ceil(PUBLISHED.length / PAGE_SIZE);
const LAST_PAGE_COUNT = PUBLISHED.length - (TOTAL_PAGES - 1) * PAGE_SIZE;

const listUrl = (p: number) => (p === 1 ? '/tin-tuc/' : `/tin-tuc/trang/${p}/`);
const toDisplayDate = (iso: string) => iso.split('-').reverse().join('/');

async function itemTitles(page: Page): Promise<string[]> {
  const titles = await page.locator('[data-news-item] h3').allTextContents();
  return titles.map((t) => t.trim());
}

async function frameGeometry(page: Page) {
  return page.evaluate(() => {
    const rect = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right };
    };
    const content = document.querySelector('[data-page-content]');
    return {
      vpWidth: window.innerWidth,
      content: rect(content),
      brand: rect(document.querySelector('[data-site-brand]')),
      headerInner: rect(document.querySelector('#site-header > div > div')),
      items: Array.from(
        document.querySelectorAll('[data-news-item], .content-body')
      ).map((el) => rect(el)),
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    };
  });
}

async function expectFrameMatches(
  page: Page,
  vp: { width: number },
  label: string
) {
  const g = await frameGeometry(page);
  expect(g.overflow, `${label}: trang cuộn ngang`).toBe(false);
  expect(g.content, label).not.toBeNull();
  const content = g.content!;
  if (vp.width >= 768) {
    expect(
      Math.abs(content.left - g.brand!.left),
      `${label}: left nội dung khớp brand Header`
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(content.right - g.headerInner!.right),
      `${label}: right nội dung khớp khung Header`
    ).toBeLessThanOrEqual(1);
  } else {
    expect(content.left, `${label}: left >= 16px`).toBeGreaterThanOrEqual(15);
    expect(content.right, `${label}: right <= 344px`).toBeLessThanOrEqual(345);
  }
  for (const item of g.items) {
    expect(item).not.toBeNull();
    expect(item!.left).toBeGreaterThanOrEqual(content.left - 1);
    expect(item!.right).toBeLessThanOrEqual(content.right + 1);
  }
}

test.describe('Fixture tests — /tin-tuc và trang chi tiết ở trạng thái có dữ liệu', () => {
  test('dữ liệu fixture thỏa yêu cầu số lượng', () => {
    expect(PUBLISHED.length).toBeGreaterThanOrEqual(23);
    expect(DRAFTS.length).toBeGreaterThanOrEqual(2);
    expect(
      PUBLISHED.filter((n) => n.category === 'thong-bao').length
    ).toBeGreaterThanOrEqual(5);
    expect(
      PUBLISHED.some((n) => n.title.length >= 120),
      'có bài tiêu đề >= 120 ký tự'
    ).toBe(true);
    const dates = PUBLISHED.map((n) => n.pubDate);
    expect(new Set(dates).size).toBeLessThan(dates.length);
    expect(ALL.every((n) => n.title.startsWith('[FIXTURE]'))).toBe(true);
  });

  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('số trang, số mục mỗi trang và trang ngoài phạm vi', async ({
        page,
      }) => {
        expect(TOTAL_PAGES).toBe(3);
        for (let p = 1; p <= TOTAL_PAGES; p++) {
          const res = await page.goto(listUrl(p));
          expect(res?.status(), `trang ${p}`).toBe(200);
          const expected = p < TOTAL_PAGES ? PAGE_SIZE : LAST_PAGE_COUNT;
          await expect(page.locator('[data-news-item]')).toHaveCount(expected);
          await expect(page.locator('[data-news-empty]')).toHaveCount(0);
        }
        const beyond = await page.goto(listUrl(TOTAL_PAGES + 1));
        expect(beyond?.status()).toBe(404);
      });

      test('liên kết Trước/Sau và aria-current đúng ở trang đầu, giữa, cuối', async ({
        page,
      }) => {
        for (let p = 1; p <= TOTAL_PAGES; p++) {
          await page.goto(listUrl(p));
          const nav = page.locator('nav[aria-label="Phân trang tin tức"]');
          await expect(nav).toHaveCount(1);
          const prev = nav.locator('[data-pagination-prev]');
          const next = nav.locator('[data-pagination-next]');
          if (p === 1) {
            await expect(prev).toHaveCount(0);
          } else {
            await expect(prev).toHaveAttribute('href', listUrl(p - 1));
          }
          if (p === TOTAL_PAGES) {
            await expect(next).toHaveCount(0);
          } else {
            await expect(next).toHaveAttribute('href', listUrl(p + 1));
          }
          const current = nav.locator('[aria-current="page"]');
          await expect(current).toHaveCount(1);
          await expect(current).toHaveText(String(p));
          await expect(nav.locator('a[aria-label^="Trang "]')).toHaveCount(
            TOTAL_PAGES - 1
          );
          const box = await nav
            .locator('a, [aria-current]')
            .first()
            .boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      });

      test('không có bản nháp ở bất kỳ trang nào, thứ tự giảm dần và ổn định', async ({
        page,
      }) => {
        const seen: string[] = [];
        const dates: string[] = [];
        for (let p = 1; p <= TOTAL_PAGES; p++) {
          await page.goto(listUrl(p));
          const html = await page.content();
          for (const d of DRAFTS) {
            expect(
              html,
              `bản nháp ${d.id} xuất hiện ở trang ${p}`
            ).not.toContain(d.title);
          }
          seen.push(...(await itemTitles(page)));
          dates.push(
            ...(
              await page.locator('[data-news-item] time').allTextContents()
            ).map((t) => t.trim())
          );
        }
        expect(seen).toEqual(PUBLISHED.map((n) => n.title));
        expect(dates).toEqual(PUBLISHED.map((n) => toDisplayDate(n.pubDate)));
        for (const d of DRAFTS) {
          const res = await page.goto(`/tin-tuc/${d.id}/`);
          expect(res?.status(), `chi tiết nháp ${d.id}`).toBe(404);
        }
        // hai bài trùng ngày: A đứng trước B
        expect(seen.indexOf('[FIXTURE] Bài trùng ngày đăng A')).toBeLessThan(
          seen.indexOf('[FIXTURE] Bài trùng ngày đăng B')
        );
      });

      test('mỗi mục mở được chi tiết (200, h1 = tiêu đề), có breadcrumb và Bài trước/Bài sau đúng', async ({
        page,
      }) => {
        for (let i = 0; i < PUBLISHED.length; i++) {
          const n = PUBLISHED[i];
          const res = await page.goto(`/tin-tuc/${n.id}/`);
          expect(res?.status(), n.id).toBe(200);
          await expect(page.locator('h1')).toHaveCount(1);
          await expect(page.locator('h1')).toHaveText(n.title);

          const crumbs = page.locator(
            'nav[aria-label="Đường dẫn điều hướng"] li'
          );
          await expect(crumbs.filter({ hasText: 'Trang chủ' })).toHaveCount(1);
          await expect(
            page.locator(
              'nav[aria-label="Đường dẫn điều hướng"] a[href="/tin-tuc/"]'
            )
          ).toHaveCount(1);

          const older = PUBLISHED[i + 1];
          const newer = PUBLISHED[i - 1];
          const adj = page.locator('[data-news-adjacent]');
          const prev = adj.locator('a[rel="prev"]');
          const next = adj.locator('a[rel="next"]');
          if (older) {
            await expect(prev).toHaveAttribute('href', `/tin-tuc/${older.id}/`);
            await expect(prev).toContainText('Bài trước');
          } else {
            await expect(prev).toHaveCount(0);
          }
          if (newer) {
            await expect(next).toHaveAttribute('href', `/tin-tuc/${newer.id}/`);
            await expect(next).toContainText('Bài sau');
          } else {
            await expect(next).toHaveCount(0);
          }
          await expect(
            page.locator('main a[href="/tin-tuc/"]', {
              hasText: 'Quay lại danh sách',
            })
          ).toHaveCount(1);
        }
      });

      test('bài markdown phong phú: h2 đậm và lớn hơn p, bảng không tràn ngang', async ({
        page,
      }) => {
        await page.goto('/tin-tuc/bai-viet-markdown/');
        const data = await page.evaluate(() => {
          const p = document.querySelector('.content-body p');
          const h2 = document.querySelector('.content-body h2');
          const table = document.querySelector('.content-body table');
          const tr = table!.getBoundingClientRect();
          return {
            pSize: parseFloat(getComputedStyle(p!).fontSize),
            h2Size: parseFloat(getComputedStyle(h2!).fontSize),
            h2Weight: parseInt(getComputedStyle(h2!).fontWeight, 10),
            h3: !!document.querySelector('.content-body h3'),
            ul: !!document.querySelector('.content-body ul'),
            blockquote: !!document.querySelector('.content-body blockquote'),
            link: !!document.querySelector(
              '.content-body a[href="/thong-bao/"]'
            ),
            tableRight: tr.right,
            tableLeft: tr.left,
            vp: window.innerWidth,
            overflow:
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth,
          };
        });
        expect(data.h2Weight).toBeGreaterThanOrEqual(600);
        expect(data.h2Size).toBeGreaterThanOrEqual(data.pSize * 1.2);
        expect(data.h3 && data.ul && data.blockquote && data.link).toBe(true);
        expect(data.tableLeft).toBeGreaterThanOrEqual(0);
        expect(data.tableRight).toBeLessThanOrEqual(data.vp);
        expect(data.overflow).toBe(false);
      });

      test('bài có ảnh: alt có nội dung ở danh sách và chi tiết, ảnh tải được', async ({
        page,
      }) => {
        await page.goto('/tin-tuc/bai-viet-co-anh/');
        const img = page.locator('main img');
        await expect(img).toHaveCount(1);
        const alt = await img.getAttribute('alt');
        expect(alt && alt.length).toBeGreaterThan(5);
        expect(await img.getAttribute('width')).toBeTruthy();
        expect(await img.getAttribute('height')).toBeTruthy();
        const loaded = await img.evaluate(
          (el) =>
            (el as HTMLImageElement).complete &&
            (el as HTMLImageElement).naturalWidth > 0
        );
        expect(loaded).toBe(true);
        const box = await img.boundingBox();
        expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width);

        await page.goto('/tin-tuc/');
        const listImg = page.locator('[data-news-item] img');
        await expect(listImg).toHaveCount(1);
        expect((await listImg.getAttribute('alt'))!.length).toBeGreaterThan(5);
      });

      test('tiêu đề dài không tràn ngang và không bị cắt', async ({ page }) => {
        const long = PUBLISHED.find((n) => n.title.length >= 120)!;
        for (const url of [listUrl(1), `/tin-tuc/${long.id}/`]) {
          await page.goto(url);
          const overflow = await page.evaluate(
            () =>
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth
          );
          expect(overflow, url).toBe(false);
          const title = page
            .locator('h1, [data-news-item] h3', {
              hasText: long.title,
            })
            .first();
          const box = await title.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width);
        }
      });

      test('hình học: nội dung khớp khung Container ở trang đầu, giữa, cuối và 3 chi tiết', async ({
        page,
      }) => {
        const urls = [
          listUrl(1),
          listUrl(2),
          listUrl(TOTAL_PAGES),
          `/tin-tuc/${PUBLISHED[0].id}/`,
          '/tin-tuc/bai-viet-markdown/',
          '/tin-tuc/bai-viet-co-anh/',
        ];
        for (const url of urls) {
          await page.goto(url);
          await expectFrameMatches(page, vp, url);
        }
      });

      test('/tin-tuc có thẻ liên kết tới /thong-bao', async ({ page }) => {
        await page.goto('/tin-tuc/');
        await expect(
          page.locator('[data-page-content] a[href="/thong-bao"]')
        ).toHaveCount(1);
      });

      test('axe: không có lỗi serious/critical ở danh sách và chi tiết', async ({
        page,
      }) => {
        for (const url of [
          listUrl(2),
          '/tin-tuc/bai-viet-markdown/',
          '/tin-tuc/bai-viet-co-anh/',
        ]) {
          const { consoleErrors, cspViolations } = await setupPageGuards(page);
          await page.goto(url);
          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
          const bad = results.violations.filter(
            (v) => v.impact === 'serious' || v.impact === 'critical'
          );
          expect(bad, url).toEqual([]);
          expect(consoleErrors).toEqual([]);
          expect(cspViolations).toEqual([]);
        }
      });
    });
  }

  test('chuỗi "[FIXTURE]" tuyệt đối không xuất hiện ngoài dist-fixtures', () => {
    const distPath = path.resolve('dist');
    if (!fs.existsSync(distPath)) return;

    function checkDir(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        expect(entry.name).not.toContain('[FIXTURE]');
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (
          ['.html', '.js', '.css', '.json', '.txt', '.xml', '.svg'].includes(
            path.extname(entry.name).toLowerCase()
          )
        ) {
          expect(fs.readFileSync(fullPath, 'utf-8')).not.toContain('[FIXTURE]');
        }
      }
    }
    checkDir(distPath);
  });

  test('25 bài tin fixture có title hoàn toàn khác nhau', () => {
    expect(PUBLISHED).toHaveLength(25);
    const titles = new Set<string>();
    for (const item of PUBLISHED) {
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(
        titles.has(item.title),
        `Tiêu đề bài tin bị trùng: "${item.title}" (file ${item.id})`
      ).toBe(false);
      titles.add(item.title);
    }
    expect(titles.size).toBe(25);
  });

  test('canonical URL trên các trang phân trang trỏ chính xác về chính nó', async ({
    page,
  }) => {
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      const url = listUrl(p);
      await page.goto(url);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');
      expect(canonical).toBe(`https://qtd.pages.dev${url}`);
    }
  });

  test('sitemap trong dist-fixtures có mọi bài tin công khai và KHÔNG có bài draft', () => {
    const sitemap0Path = path.resolve('dist-fixtures/sitemap-0.xml');
    if (!fs.existsSync(sitemap0Path)) {
      return;
    }
    const sitemapContent = fs.readFileSync(sitemap0Path, 'utf-8');

    // 1. Mọi bài viết công khai phải xuất hiện trong sitemap
    for (const pub of PUBLISHED) {
      const expectedUrl = `https://qtd.pages.dev/tin-tuc/${pub.id}/`;
      expect(
        sitemapContent.includes(`<loc>${expectedUrl}</loc>`),
        `Bài tin công khai ${pub.id} thiếu trong sitemap`
      ).toBe(true);
    }

    // 2. Tuyệt đối không có bài draft nào trong sitemap
    for (const draft of DRAFTS) {
      const draftUrl = `https://qtd.pages.dev/tin-tuc/${draft.id}/`;
      expect(
        sitemapContent.includes(draftUrl),
        `Bài tin draft ${draft.id} xuất hiện trong sitemap!`
      ).toBe(false);
    }
  });

  test('JSON-LD trong dist-fixtures parse được, không chứa "[" của placeholder và chuỗi "null", và không gây vi phạm CSP', async ({
    page,
  }) => {
    const distFixturesDir = path.resolve('dist-fixtures');
    if (!fs.existsSync(distFixturesDir)) {
      return;
    }

    const htmlFiles: string[] = [];
    function collectHtml(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectHtml(full);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          htmlFiles.push(full);
        }
      }
    }
    collectHtml(distFixturesDir);

    expect(htmlFiles.length).toBeGreaterThan(0);

    let foundLdJson = false;
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const ldRegex =
        /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      while ((match = ldRegex.exec(content)) !== null) {
        foundLdJson = true;
        const body = match[1].trim();
        expect(() => {
          JSON.parse(body);
        }).not.toThrow();

        expect(body).not.toContain('[');
        expect(body).not.toContain('null');
      }
    }
    expect(foundLdJson).toBe(true);

    const { cspViolations, consoleErrors } = await setupPageGuards(page);
    await page.goto('/');
    expect(cspViolations).toEqual([]);
    expect(consoleErrors).toEqual([]);

    const scriptHandle = await page.$('script[type="application/ld+json"]');
    expect(scriptHandle).not.toBeNull();
    const jsonContent = await scriptHandle!.textContent();
    expect(jsonContent).toBeTruthy();
    expect(jsonContent).not.toContain('[');
    expect(jsonContent).not.toContain('null');
  });
});
