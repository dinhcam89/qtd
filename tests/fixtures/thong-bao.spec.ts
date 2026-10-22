import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { setupPageGuards } from '../helpers';

const VIEWPORTS = [
  { name: '360px', width: 360, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
];

const NEWS_DIR = path.resolve('src/fixtures/news');
const scheduleRaw = fs.readFileSync(
  path.resolve('src/fixtures/schedule/schedule.yaml'),
  'utf-8'
);

function scheduleField(key: string): string {
  const m = scheduleRaw.match(new RegExp(`^${key}:\\s*'(.*)'$`, 'm'));
  return m ? m[1] : '';
}

function fm(file: string, key: string): string {
  const raw = fs.readFileSync(path.join(NEWS_DIR, file), 'utf-8');
  const m = raw.split('---')[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^'(.*)'$/, '$1') : '';
}

const NOTICES = fs
  .readdirSync(NEWS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({
    id: f.replace(/\.md$/, ''),
    title: fm(f, 'title'),
    pubDate: fm(f, 'pubDate'),
    category: fm(f, 'category'),
    draft: fm(f, 'draft') === 'true',
  }))
  .filter((n) => n.category === 'thong-bao' && !n.draft)
  .sort((a, b) =>
    a.pubDate !== b.pubDate
      ? a.pubDate < b.pubDate
        ? 1
        : -1
      : a.id < b.id
        ? -1
        : 1
  )
  .slice(0, 5);

const DRAFT_TITLES = fs
  .readdirSync(NEWS_DIR)
  .filter((f) => f.endsWith('.md') && fm(f, 'draft') === 'true')
  .map((f) => fm(f, 'title'));

// Thứ tự mong đợi theo ngày bắt đầu (dữ liệu trong file được cố ý xếp lộn xộn)
const EXPECTED_HOLIDAYS = [
  {
    title: '[FIXTURE] Kỳ nghỉ thứ nhất',
    start: '01/01/2026',
    end: '01/01/2026',
    ret: '02/01/2026',
  },
  {
    title: '[FIXTURE] Kỳ nghỉ thứ hai',
    start: '25/04/2026',
    end: '27/04/2026',
    ret: '28/04/2026',
  },
  {
    title: '[FIXTURE] Kỳ nghỉ thứ ba (sắp xếp giữa danh sách)',
    start: '02/09/2026',
    end: '03/09/2026',
    ret: '04/09/2026',
  },
  {
    title: '[FIXTURE] Kỳ nghỉ chưa đủ thông tin (có trường null)',
    start: '30/12/2026',
    end: 'Đang cập nhật',
    ret: 'Đang cập nhật',
  },
];

test.describe('Fixture tests — /thong-bao ở trạng thái có dữ liệu', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('lịch làm việc thường xuyên lấy từ schedule', async ({ page }) => {
        const { consoleErrors, cspViolations } = await setupPageGuards(page);
        const res = await page.goto('/thong-bao');
        expect(res?.status()).toBe(200);
        const regular = page.locator('[data-regular-schedule]');
        await expect(regular.locator('[data-field="working-days"]')).toHaveText(
          scheduleField('working_days')
        );
        await expect(regular.locator('[data-field="morning"]')).toHaveText(
          scheduleField('morning_hours')
        );
        await expect(regular.locator('[data-field="afternoon"]')).toHaveText(
          scheduleField('afternoon_hours')
        );
        expect(consoleErrors).toEqual([]);
        expect(cspViolations).toEqual([]);
      });

      test('kỳ nghỉ đúng thứ tự theo ngày bắt đầu, trường null hiển thị "Đang cập nhật"', async ({
        page,
      }) => {
        await page.goto('/thong-bao');
        const items = page.locator('[data-holiday-item]');
        await expect(items).toHaveCount(EXPECTED_HOLIDAYS.length);
        for (let i = 0; i < EXPECTED_HOLIDAYS.length; i++) {
          const e = EXPECTED_HOLIDAYS[i];
          const item = items.nth(i);
          await expect(item.locator('[data-holiday-title]')).toHaveText(
            e.title
          );
          await expect(item.locator('[data-field="start"]')).toHaveText(
            e.start
          );
          await expect(item.locator('[data-field="end"]')).toHaveText(e.end);
          await expect(item.locator('[data-field="return"]')).toHaveText(e.ret);
        }
      });

      test('không gắn nhãn sắp tới/đã qua theo ngày build', async ({
        page,
      }) => {
        await page.goto('/thong-bao');
        const text = (await page.locator('main').innerText()).toLowerCase();
        expect(text).not.toContain('sắp tới');
        expect(text).not.toContain('đã qua');
        expect(text).not.toContain('đã kết thúc');
      });

      test('5 thông báo mới nhất đúng thứ tự, không có bản nháp, có Xem tất cả về /tin-tuc', async ({
        page,
      }) => {
        await page.goto('/thong-bao');
        const items = page.locator('[data-notice-item]');
        await expect(items).toHaveCount(5);
        const titles = (await items.locator('a').allTextContents()).map((t) =>
          t.trim()
        );
        expect(titles).toEqual(NOTICES.map((n) => n.title));
        const hrefs = await items
          .locator('a')
          .evaluateAll((els) => els.map((a) => a.getAttribute('href')));
        expect(hrefs).toEqual(NOTICES.map((n) => `/tin-tuc/${n.id}/`));

        const html = await page.content();
        for (const t of DRAFT_TITLES) {
          expect(html).not.toContain(t);
        }
        await expect(page.locator('[data-view-all]')).toHaveAttribute(
          'href',
          '/tin-tuc/'
        );
        for (const h of hrefs) {
          const r = await page.request.get(h!);
          expect(r.status(), h!).toBe(200);
        }
      });

      test('hình học: nội dung khớp khung Container, không tràn ngang', async ({
        page,
      }) => {
        await page.goto('/thong-bao');
        const g = await page.evaluate(() => {
          const rect = (el: Element | null) => {
            const r = el!.getBoundingClientRect();
            return { left: r.left, right: r.right };
          };
          return {
            content: rect(document.querySelector('[data-page-content]')),
            brand: rect(document.querySelector('[data-site-brand]')),
            inner: rect(document.querySelector('#site-header > div > div')),
            blocks: Array.from(
              document.querySelectorAll(
                '[data-holiday-item], [data-notice-item], [data-regular-schedule]'
              )
            ).map(rect),
            overflow:
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth,
          };
        });
        expect(g.overflow).toBe(false);
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
        for (const b of g.blocks) {
          expect(b.left).toBeGreaterThanOrEqual(g.content.left - 1);
          expect(b.right).toBeLessThanOrEqual(g.content.right + 1);
        }
      });
    });
  }
});
