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
});
