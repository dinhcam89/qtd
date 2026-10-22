import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { setupPageGuards } from './helpers';

const DISCLAIMER =
  'Lãi suất mang tính tham khảo, vui lòng liên hệ quỹ để biết chi tiết.';

test.describe('Trang Quy mô, Sản phẩm, Lãi suất', () => {
  test('/lai-suat: có RATE_DISCLAIMER ngay cạnh bảng, thời điểm áp dụng không ghép "tính đến"', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/lai-suat');

    await expect(page.locator('h1')).toHaveText('Lãi suất');

    // Hai bảng (tiền gửi, cho vay), mỗi bảng một thẻ <table> duy nhất
    await expect(page.locator('table[data-responsive-table]')).toHaveCount(2);

    // Disclaimer nằm cùng khối với các bảng
    const block = page.locator('[data-rates-tables]');
    await expect(block.locator('table')).toHaveCount(2);
    await expect(block).toContainText(DISCLAIMER);

    // Thời điểm áp dụng: effective_from null → "Đang cập nhật", không có "tính đến"
    const effective = page.locator('[data-rates-effective]');
    await expect(effective).toContainText('Thời điểm áp dụng:');
    await expect(effective).toContainText('Đang cập nhật');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/tính đến\s+đang cập nhật/i);
    expect(bodyText).not.toMatch(/áp dụng từ.*đang cập nhật/i);

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/quy-mo: dùng StatItem, null hiển thị "Đang cập nhật", không có dòng "Tính đến" khi as_of null', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/quy-mo');

    await expect(page.locator('h1')).toHaveText('Quy mô hoạt động');
    const cards = page.locator('[data-stat-card]');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(page.locator('[data-stat-fallback]')).toHaveCount(
      await cards.count()
    );
    await expect(page.locator('[data-stat-asof]')).toHaveCount(0);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Số liệu: Đang cập nhật');
    expect(bodyText).not.toMatch(/tính đến\s+đang cập nhật/i);

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/san-pham: có nhóm cho vay và tiền gửi, trường chưa có hiển thị "Đang cập nhật"', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/san-pham');

    await expect(page.locator('h1')).toHaveText('Sản phẩm');
    await expect(page.locator('#cho-vay h2')).toHaveText('Sản phẩm cho vay');
    await expect(page.locator('#tien-gui h2')).toHaveText('Sản phẩm tiền gửi');

    const cards = page.locator('[data-product-card]');
    expect(await cards.count()).toBeGreaterThan(0);
    // Trường null phải hiện "Đang cập nhật", không có giá trị bịa
    const first = cards.first();
    await expect(first.locator('dd').first()).toHaveText('Đang cập nhật');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('trang Giới thiệu có thẻ liên kết tới các trang con (Lịch sử, Ban lãnh đạo, Quy mô, Quy chế)', async ({
    page,
  }) => {
    await page.goto('/gioi-thieu');
    for (const href of ['/lich-su', '/ban-lanh-dao', '/quy-mo', '/quy-che']) {
      await expect(
        page.locator(`main a[href="${href}"]`).first()
      ).toBeVisible();
    }
  });

  test('/quy-che: có đúng 1 h1, trạng thái rỗng hiển thị "Đang cập nhật", không có liên kết tới file không tồn tại', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/quy-che');

    // 1. Có đúng 1 h1 với tiêu đề chuẩn
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Quy chế và văn bản');

    // 2. Trạng thái rỗng hiển thị "Đang cập nhật"
    const emptyBox = page.locator('[data-documents-empty]');
    await expect(emptyBox).toBeVisible();
    await expect(emptyBox).toHaveText('Đang cập nhật');

    // 3. Không có liên kết nào tới file không tồn tại hoặc file giả
    const docLinks = page.locator('main a[href^="/docs/"]');
    await expect(docLinks).toHaveCount(0);

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/tin-tuc: trạng thái rỗng hiển thị "Đang cập nhật", không xuất hiện bài draft mẫu', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/tin-tuc/');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Tin tức');

    const emptyBox = page.locator('[data-news-empty]');
    await expect(emptyBox).toBeVisible();
    await expect(emptyBox).toHaveText('Đang cập nhật');

    await expect(page.locator('[data-news-item]')).toHaveCount(0);
    await expect(
      page.locator('nav[aria-label="Phân trang tin tức"]')
    ).toHaveCount(0);

    const content = await page.content();
    expect(content).not.toContain('thong-bao-mau');
    expect(content).not.toContain('Tiêu đề thông báo mẫu');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('/thong-bao: hiển thị lịch làm việc, khối thông báo rỗng hiển thị "Đang cập nhật", không có draft', async ({
    page,
  }) => {
    const { consoleErrors, cspViolations } = await setupPageGuards(page);
    await page.goto('/thong-bao');

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Thông báo và lịch làm việc');

    await expect(page.locator('[data-regular-schedule]')).toBeVisible();

    const emptyNotices = page.locator('[data-notices-empty]');
    await expect(emptyNotices).toBeVisible();
    await expect(emptyNotices).toHaveText('Đang cập nhật');
    await expect(page.locator('[data-notice-item]')).toHaveCount(0);

    const content = await page.content();
    expect(content).not.toContain('thong-bao-mau');
    expect(content).not.toContain('Tiêu đề thông báo mẫu');

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
  });

  test('bài mẫu draft: true trong src/content/news tuyệt đối không xuất hiện trong dist', () => {
    const distPath = path.resolve('dist');
    if (!fs.existsSync(distPath)) return;

    function checkDir(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        expect(entry.name).not.toContain('thong-bao-mau');
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (
          ['.html', '.js', '.css', '.json', '.txt', '.xml'].includes(
            path.extname(entry.name).toLowerCase()
          )
        ) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content).not.toContain('Tiêu đề thông báo mẫu');
          expect(content).not.toContain('Nội dung chi tiết thông báo mẫu');
        }
      }
    }
    checkDir(distPath);
  });
});
